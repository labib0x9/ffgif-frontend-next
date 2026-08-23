import { useRef, useEffect } from "react";
import Card from "../common/Card";
import Button from "../common/Button";
import Spinner from "../common/Spinner";
import Toggle from "../common/Toggle";
import { Field } from "../common/Input";
import FrameStrip from "./FrameStrip";
import { formatBytes, timecode } from "../../utils/formatters";
import { Icon } from "../../utils/icons";

function SegmentedControl({ options, value, onChange }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        background: "rgba(12, 14, 18, 0.7)",
        padding: 4,
        borderRadius: 10,
        border: "1px solid rgba(255, 255, 255, 0.08)",
      }}
    >
      {options.map((o) => {
        const isSelected = value === o.v;
        return (
          <button
            key={o.v}
            onClick={() => onChange(o.v)}
            style={{
              flex: 1,
              padding: "7px 10px",
              borderRadius: 7,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "JetBrains Mono, monospace",
              border: `1px solid ${isSelected ? "rgba(255, 61, 94, 0.35)" : "transparent"}`,
              background: isSelected
                ? "linear-gradient(135deg, rgba(255, 61, 94, 0.22) 0%, rgba(255, 61, 94, 0.08) 100%)"
                : "transparent",
              color: isSelected ? "#FF5A78" : "#9597A3",
              boxShadow: isSelected ? "0 2px 8px rgba(255, 61, 94, 0.25)" : "none",
              transition: "all .15s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {o.l}
          </button>
        );
      })}
    </div>
  );
}

function VideoPosterPlayButton({ loading, error, onPlay }) {
  return (
    <div
      onClick={!loading ? onPlay : undefined}
      style={{
        aspectRatio: "16 / 9",
        borderRadius: 12,
        background: "#08090C",
        marginBottom: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: loading ? "default" : "pointer",
        position: "relative",
        overflow: "hidden",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at 50% 50%, rgba(255, 61, 94, 0.1) 0%, rgba(10, 11, 15, 0.95) 100%)",
        }}
      />
      <div style={{ position: "relative", textAlign: "center", padding: 20 }}>
        {loading ? (
          <>
            <Spinner size={34} color="#FF3D5E" />
            <div style={{ marginTop: 14, fontSize: 13.5, color: "#9597A3" }}>Loading studio player…</div>
          </>
        ) : error ? (
          <>
            <div style={{ color: "#FF5C5C", marginBottom: 10, display: "flex", justifyContent: "center" }}>
              <Icon.Alert size={24} />
            </div>
            <div style={{ fontSize: 13, color: "#9597A3", marginBottom: 14 }}>{error}</div>
            <Button size="sm" variant="secondary" onClick={onPlay}>
              Try again
            </Button>
          </>
        ) : (
          <>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(255, 61, 94, 0.25) 0%, rgba(255, 61, 94, 0.08) 100%)",
                border: "1.5px solid rgba(255, 61, 94, 0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 14px",
                color: "#FF3D5E",
                boxShadow: "0 0 20px rgba(255, 61, 94, 0.35)",
                transition: "transform .15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <svg viewBox="0 0 24 24" width={24} height={24} fill="currentColor" style={{ marginLeft: 3 }}>
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <div style={{ fontSize: 14, color: "#F4F3EE", fontWeight: 700 }}>Click to load preview</div>
          </>
        )}
      </div>
    </div>
  );
}

export function TrimStage({
  previewUrl,
  streamLoading,
  streamError,
  onRequestStream,
  onDurationDiscovered,
  meta,
  trim,
  setTrim,
  config,
  setConfig,
  onConvert,
  onCancel,
  videoRef,
}) {
  const trimRef = useRef(trim);
  useEffect(() => {
    trimRef.current = trim;
  }, [trim]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !previewUrl) return;
    const onTimeUpdate = () => {
      const { start, end } = trimRef.current;
      if (v.currentTime < start || v.currentTime >= end) {
        v.currentTime = start;
        if (!v.paused) v.play().catch(() => {});
      }
    };
    const onPlay = () => {
      const { start, end } = trimRef.current;
      if (v.currentTime < start || v.currentTime >= end) v.currentTime = start;
    };
    v.addEventListener("timeupdate", onTimeUpdate);
    v.addEventListener("play", onPlay);
    return () => {
      v.removeEventListener("timeupdate", onTimeUpdate);
      v.removeEventListener("play", onPlay);
    };
  }, [videoRef, previewUrl]);

  const frameCount = Math.max(0, Math.round((trim.end - trim.start) * config.fps));
  const estKbPerFrame = 40 * Math.pow(config.width / 480, 2);
  const estimatedSizeMB = ((frameCount * estKbPerFrame) / 1024).toFixed(1);
  const estimatedLarge = frameCount * estKbPerFrame > 8000;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: 24 }}>
      <Card style={{ padding: 22 }}>
        {previewUrl ? (
          <video
            ref={videoRef}
            src={previewUrl}
            controls
            autoPlay
            className="ffgif-no-audio-video"
            onLoadedMetadata={(e) => onDurationDiscovered?.(e.currentTarget.duration)}
            style={{
              width: "100%",
              borderRadius: 12,
              background: "#000",
              display: "block",
              marginBottom: 20,
              border: "1px solid rgba(255, 255, 255, 0.1)",
              boxShadow: "0 6px 24px rgba(0, 0, 0, 0.4)",
            }}
          />
        ) : (
          <VideoPosterPlayButton loading={streamLoading} error={streamError} onPlay={onRequestStream} />
        )}
        <FrameStrip
          duration={meta.duration_sec}
          maxEnd={meta.safe_duration_sec}
          start={trim.start}
          end={trim.end}
          onChange={setTrim}
          videoRef={videoRef}
        />
        <div style={{ display: "flex", gap: 18, marginTop: 18, fontSize: 12, color: "#9597A3", fontFamily: "JetBrains Mono, monospace" }}>
          <span>{meta.filename}</span>
          <span>{formatBytes(meta.size_bytes)}</span>
          <span>{timecode(meta.duration_sec)} total</span>
        </div>
      </Card>

      <Card style={{ padding: 22 }}>
        <h3
          style={{
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: 16,
            fontWeight: 700,
            color: "#F4F3EE",
            margin: "0 0 20px",
            display: "flex",
            alignItems: "center",
            gap: 9,
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 7,
              background: "rgba(255, 61, 94, 0.15)",
              color: "#FF3D5E",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon.Loop size={14} />
          </div>
          Export settings
        </h3>

        <Field label="Width" hint="Aspect ratio is preserved automatically">
          <SegmentedControl
            options={[
              { v: 320, l: "320px" },
              { v: 480, l: "480px" },
              { v: 640, l: "640px" },
            ]}
            value={config.width}
            onChange={(width) => setConfig({ ...config, width })}
          />
        </Field>

        <Field label="Frame rate" hint="Higher fps = smoother animation, larger file">
          <SegmentedControl
            options={[
              { v: 8, l: "8 fps" },
              { v: 10, l: "10 fps" },
              { v: 15, l: "15 fps" },
              { v: 24, l: "24 fps" },
            ]}
            value={config.fps}
            onChange={(fps) => setConfig({ ...config, fps })}
          />
        </Field>

        <div
          onClick={() => setConfig({ ...config, loop: !config.loop })}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            background: "rgba(12, 14, 18, 0.6)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 11,
            cursor: "pointer",
            marginBottom: 22,
            transition: "border-color .15s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icon.Loop size={16} color={config.loop ? "#FF3D5E" : "#5E616E"} />
            <span style={{ fontSize: 13.5, color: "#F4F3EE", fontWeight: 600 }}>Loop forever</span>
          </div>
          <Toggle checked={config.loop} />
        </div>

        <div
          style={{
            background: "rgba(12, 14, 18, 0.6)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
          }}
        >
          <div style={{ fontSize: 11, color: "#9597A3", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, fontWeight: 700 }}>
            Estimated output
          </div>
          <div style={{ display: "flex", gap: 16, fontFamily: "JetBrains Mono, monospace", fontSize: 13, color: "#F4F3EE" }}>
            <span>{(trim.end - trim.start).toFixed(1)}s clip</span>
            <span style={{ color: "#5E616E" }}>·</span>
            <span>{frameCount} frames</span>
            <span style={{ color: "#5E616E" }}>·</span>
            <span>{config.width}px</span>
          </div>
          {estimatedLarge && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                marginTop: 10,
                fontSize: 12,
                color: "#FFB74D",
                background: "rgba(255, 183, 77, 0.1)",
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid rgba(255, 183, 77, 0.2)",
              }}
            >
              <Icon.Alert size={13} />
              <span>Large output (~{estimatedSizeMB}MB) — consider fewer fps or smaller width.</span>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <Button variant="secondary" onClick={onCancel} style={{ flex: 1 }}>
            Cancel
          </Button>
          <Button onClick={onConvert} icon={<Icon.Loop size={15} />} style={{ flex: 2 }}>
            Convert to GIF
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default TrimStage;
