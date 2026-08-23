import { useState, useCallback, useEffect } from "react";
import Card from "../common/Card";
import Button from "../common/Button";
import Spinner from "../common/Spinner";
import ShareGifModal from "../share/ShareGifModal";
import { api } from "../../api/client";
import { errMsg } from "../../utils/formatters";
import { Icon } from "../../utils/icons";

export function DoneStage({ resultKey, initialUrl, onAnother }) {
  const [gifUrl, setGifUrl] = useState(initialUrl || null);
  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(!initialUrl);
  const [sharing, setSharing] = useState(false);

  const loadPreview = useCallback(async () => {
    if (initialUrl) {
      setGifUrl(initialUrl);
      setLoading(false);
      return;
    }
    if (!resultKey) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      let res = await api.downloadGif(resultKey).catch(() => null);
      let url = typeof res === "string" ? res : (res?.url || res?.download_url || res?.presigned_url || res?.data?.url);
      if (!url) {
        res = await api.getGif(resultKey).catch(() => null);
        url = typeof res === "string" ? res : (res?.url || res?.download_url || res?.thumbnail_url || res?.data?.url);
      }
      if (url) {
        setGifUrl(url);
      } else {
        setLoadError("couldn't load the preview");
      }
    } catch (e) {
      setLoadError(errMsg(e, "couldn't load the preview"));
    } finally {
      setLoading(false);
    }
  }, [resultKey, initialUrl]);

  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  return (
    <Card style={{ padding: "40px 24px", textAlign: "center" }} glow>
      <div
        style={{
          width: 56,
          height: 56,
          margin: "0 auto 16px",
          borderRadius: "50%",
          background: "rgba(61, 220, 151, 0.12)",
          border: "1.5px solid rgba(61, 220, 151, 0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#3DDC97",
          boxShadow: "0 0 24px rgba(61, 220, 151, 0.25)",
        }}
      >
        <Icon.Check size={26} />
      </div>
      <div
        style={{
          fontFamily: "Space Grotesk, sans-serif",
          fontSize: 22,
          fontWeight: 700,
          color: "#F4F3EE",
          marginBottom: 6,
          letterSpacing: -0.3,
        }}
      >
        Your Loop is Ready!
      </div>
      <div style={{ fontSize: 13, color: "#9597A3", marginBottom: 24, fontFamily: "JetBrains Mono, monospace" }}>
        {resultKey}
      </div>

      <div
        style={{
          maxWidth: 420,
          margin: "0 auto 24px",
          borderRadius: 14,
          overflow: "hidden",
          background: "#08090C",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          minHeight: 200,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 61, 94, 0.1)",
        }}
      >
        {loading ? (
          <Spinner size={32} color="#FF3D5E" />
        ) : loadError ? (
          <div style={{ padding: "32px 20px", textAlign: "center" }}>
            <div style={{ color: "#FF5C5C", marginBottom: 10, display: "flex", justifyContent: "center" }}>
              <Icon.Alert size={24} />
            </div>
            <div style={{ fontSize: 13, color: "#9597A3", marginBottom: 14 }}>{loadError}</div>
            <Button size="sm" variant="secondary" onClick={loadPreview}>
              Try again
            </Button>
          </div>
        ) : (
          <img
            src={gifUrl}
            alt="Converted GIF preview"
            style={{ width: "100%", display: "block" }}
            onError={() => setLoadError("the gif loaded but couldn't be displayed")}
          />
        )}
      </div>

      <div style={{ fontSize: 13.5, color: "#9597A3", marginBottom: 26 }}>
        Saved to your library. You can share, rename, or download anytime.
      </div>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <Button variant="secondary" icon={<Icon.Share size={15} />} onClick={() => setSharing(true)}>
          Share Loop
        </Button>
        {gifUrl && !loadError && (
          <Button variant="secondary" icon={<Icon.Download size={15} />} onClick={() => window.open(gifUrl, "_blank")}>
            Download
          </Button>
        )}
        <Button onClick={onAnother} icon={<Icon.Loop size={15} />}>
          Convert Another
        </Button>
      </div>

      {sharing && (
        <ShareGifModal
          gif={{ key: resultKey, name: "New loop" }}
          onClose={() => setSharing(false)}
          onShared={() => {}}
        />
      )}
    </Card>
  );
}

export default DoneStage;
