import { useState, useRef, useEffect } from "react";
import { useToastsCtx } from "../../context/useToasts";
import { api } from "../../api/client";
import { errMsg } from "../../utils/formatters";
import { Icon } from "../../utils/icons";
import PageHeader from "../common/PageHeader";
import LastUploadBanner from "./LastUploadBanner";
import UploadDropzone from "./UploadDropzone";
import ConvertingPreviewStage from "./ConvertingPreviewStage";
import TrimStage from "./TrimStage";
import ConvertingStage from "./ConvertingStage";
import DoneStage from "./DoneStage";

export function ConverterPanel({ refreshQuota }) {
  const { push } = useToastsCtx();
  const [stage, setStage] = useState("upload"); // upload | converting_preview | trim | converting | done
  const [originalFile, setOriginalFile] = useState(null); // raw file as picked, any format
  const [previewUrl, setPreviewUrl] = useState(null); // presigned stream URL — null until the user asks to play
  const [streamLoading, setStreamLoading] = useState(false);
  const [streamError, setStreamError] = useState(null);
  const [meta, setMeta] = useState(null);
  const [uploadKey, setUploadKey] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [trim, setTrim] = useState({ start: 0, end: 5 });
  const [config, setConfig] = useState({ width: 480, fps: 10, loop: true });
  const [job, setJob] = useState(null);
  const [resultKey, setResultKey] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  const [error, setError] = useState(null);
  const [lastUpload, setLastUpload] = useState(null); // { key, filename, ... } or null if none/unavailable
  const [lastUploadChecked, setLastUploadChecked] = useState(false);
  const [loadingLastUpload, setLoadingLastUpload] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const videoRef = useRef(null);
  const previewUrlRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const last = await api.getLastUpload();
        if (last && last.key) setLastUpload(last);
      } catch {
        /* silent */
      } finally {
        setLastUploadChecked(true);
      }
    })();
  }, []);

  const useLastUpload = async () => {
    if (!lastUpload) return;
    setError(null);
    setLoadingLastUpload(true);
    setUploadKey(lastUpload.key);
    try {
      const s = await api.uploadStatus(lastUpload.key);
      setUploadStatus(s.status);
      if (s.status === "failed") {
        throw { code: 409, error: "that upload failed converting — try uploading again" };
      }
      if (s.status !== "ok") {
        throw { code: 409, error: "that upload isn't ready yet — try uploading again" };
      }
      setStage("converting_preview");
      await setupTrimStage(lastUpload.key, lastUpload.filename);
    } catch (e) {
      setError(errMsg(e, "could not resume from last upload"));
      setStage("upload");
    } finally {
      setLoadingLastUpload(false);
      setUploadStatus(null);
    }
  };

  const onPickFile = async (f) => {
    if (!f) return;
    setError(null);
    setOriginalFile(f);
    setUploading(true);

    try {
      const created = await api.createUpload(f);
      setUploadKey(created.key);

      await api.putToPresignedUrl(created.upload_url, f);

      setUploading(false);
      setStage("converting_preview");
      setUploadStatus("uploading");
      await pollUntilReady(created.key, setUploadStatus);

      await setupTrimStage(created.key, f.name);
    } catch (e) {
      setError(errMsg(e, "upload failed"));
      setStage("upload");
    } finally {
      setUploading(false);
      setUploadStatus(null);
    }
  };

  const pollUntilReady = async (key, onStatus) => {
    const deadline = Date.now() + 60000;
    while (Date.now() < deadline) {
      const s = await api.uploadStatus(key);
      onStatus?.(s.status);
      if (s.status === "ok") return;
      if (s.status === "failed") {
        throw { code: 500, error: "video conversion failed" };
      }
      await new Promise((r) => setTimeout(r, 800));
    }
    throw { code: 504, error: "video took too long to convert" };
  };

  const setupTrimStage = async (key, _filename) => {
    const last = await api.getLastUpload().catch(() => null);
    const m = {
      filename: last?.filename || _filename || originalFile?.name || key,
      size_bytes: last?.size_bytes || originalFile?.size || 0,
      duration_sec: 0,
      safe_duration_sec: undefined,
    };
    setMeta(m);

    const dur = m?.duration_sec || 5;
    const maxEnd = m?.safe_duration_sec ? Math.min(dur, m.safe_duration_sec) : dur;
    setTrim({ start: 0, end: Math.min(5, maxEnd) });

    setPreviewUrl(null);
    setStreamLoading(false);
    setStreamError(null);

    setStage("trim");
  };

  const requestStreamUrl = async () => {
    if (previewUrl) return previewUrl;
    if (!uploadKey) return null;
    setStreamLoading(true);
    setStreamError(null);
    try {
      const { url } = await api.getStreamUrl(uploadKey);
      setPreviewUrl(url);
      previewUrlRef.current = url;
      return url;
    } catch (e) {
      const msg = errMsg(e, "could not load video preview");
      setStreamError(msg);
      throw e;
    } finally {
      setStreamLoading(false);
    }
  };

  const onDurationDiscovered = (dur) => {
    if (dur && (!meta?.duration_sec || dur > meta.duration_sec)) {
      setMeta((m) => (m ? { ...m, duration_sec: dur } : { duration_sec: dur, safe_duration_sec: dur }));
    }
  };

  const startConvert = async () => {
    setError(null);
    if (trim.end <= trim.start) {
      setError("end time must be after start time");
      return;
    }
    const safeEnd = meta?.safe_duration_sec ? Math.min(trim.end, meta.safe_duration_sec) : trim.end;
    try {
      const res = await api.convert({
        upload_key: uploadKey,
        start_time: trim.start,
        end_time: safeEnd,
        width: config.width,
        fps: config.fps,
        loop: config.loop,
      });
      setJob(res);
      setStage("converting");
    } catch (e) {
      setError(errMsg(e, "could not start conversion"));
    }
  };

  const jobId = job?.job_id;
  useEffect(() => {
    if (stage !== "converting" || !jobId) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await api.convertStatus(jobId);
        if (cancelled) return;
        setJob((j) => ({ ...j, ...res }));
        if (res.status === "completed") {
          const key = res.gif_id || res.gif_key || res.key || res.id || res.gif?.key || res.gif?.gif_key || jobId;
          const directUrl = res.url || res.download_url || res.gif_url || res.thumbnail_url || res.presigned_url || res.data?.url;
          setResultKey(key);
          if (directUrl) setResultUrl(directUrl);
          setStage("done");
          refreshQuota?.();
          push("Your GIF is ready.");
        } else if (res.status === "failed" || res.status === "error") {
          setError("conversion failed — try again with a different range or settings");
          setStage("trim");
        } else {
          setTimeout(poll, 700);
        }
      } catch (e) {
        if (!cancelled) push(errMsg(e, "conversion status check failed"), "error");
      }
    };
    poll();
    return () => {
      cancelled = true;
    };
  }, [stage, jobId, refreshQuota, push]);

  const reset = () => {
    setStage("upload");
    setOriginalFile(null);
    setPreviewUrl(null);
    setMeta(null);
    setUploadKey(null);
    setJob(null);
    setResultKey(null);
    setResultUrl(null);
    setError(null);
    setTrim({ start: 0, end: 5 });
    setStreamLoading(false);
    setStreamError(null);
  };

  return (
    <div>
      <PageHeader title="Convert" subtitle="Trim a video and export it as a looping GIF." />
      {error && (
        <div style={{ background: "#1F1416", border: "1px solid #3A2226", borderRadius: 10, padding: "11px 14px", marginBottom: 18, color: "#FF8A8A", fontSize: 13.5, display: "flex", gap: 8, alignItems: "center" }}>
          <Icon.Alert size={15} /> {error}
        </div>
      )}

      {stage === "upload" && (
        <>
          {lastUploadChecked && lastUpload && (
            <LastUploadBanner upload={lastUpload} loading={loadingLastUpload} onUse={useLastUpload} />
          )}
          <UploadDropzone uploading={uploading} onPick={onPickFile} />
        </>
      )}

      {stage === "converting_preview" && (
        <ConvertingPreviewStage filename={originalFile?.name || lastUpload?.filename} status={uploadStatus} />
      )}

      {stage === "trim" && meta && (
        <TrimStage
          previewUrl={previewUrl}
          streamLoading={streamLoading}
          streamError={streamError}
          onRequestStream={requestStreamUrl}
          onDurationDiscovered={onDurationDiscovered}
          meta={meta}
          trim={trim}
          setTrim={setTrim}
          config={config}
          setConfig={setConfig}
          onConvert={startConvert}
          onCancel={reset}
          videoRef={videoRef}
        />
      )}

      {stage === "converting" && <ConvertingStage job={job} />}

      {stage === "done" && <DoneStage resultKey={resultKey} initialUrl={resultUrl} onAnother={reset} />}
    </div>
  );
}

export default ConverterPanel;
