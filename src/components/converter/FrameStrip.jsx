import { useState, useEffect, useRef, useCallback } from "react";
import { timecode } from "../../utils/formatters";
import { Icon } from "../../utils/icons";

function Handle({ pct, onDown, isStart }) {
  return (
    <div
      onMouseDown={(e) => {
        e.preventDefault();
        onDown();
      }}
      style={{
        position: "absolute",
        top: 0,
        height: "100%",
        left: `${pct}%`,
        width: 18,
        marginLeft: -9,
        cursor: "ew-resize",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 3,
      }}
    >
      <div
        style={{
          width: 6,
          height: "80%",
          background: "linear-gradient(180deg, #FF6584 0%, #FF3D5E 100%)",
          borderRadius: 4,
          boxShadow: "0 0 10px rgba(255, 61, 94, 0.8), 0 2px 6px rgba(0, 0, 0, 0.5)",
          border: "1px solid rgba(255, 255, 255, 0.4)",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: isStart ? -3 : 3,
            transform: "translateY(-50%)",
            width: 2,
            height: 8,
            background: "rgba(0,0,0,0.5)",
            borderRadius: 1,
          }}
        />
      </div>
    </div>
  );
}

export function FrameStrip({ duration, maxEnd, start, end, onChange, videoRef }) {
  const trackRef = useRef(null);
  const [drag, setDrag] = useState(null); // 'start' | 'end' | null
  const clampEnd = maxEnd ?? duration;

  const pctOf = (sec) => (duration ? (sec / duration) * 100 : 0);

  const handleMove = useCallback(
    (clientX) => {
      if (!trackRef.current || !drag) return;
      const rect = trackRef.current.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      const sec = ratio * duration;
      if (drag === "start") {
        const next = Math.min(sec, end - 0.2);
        onChange({ start: next, end });
        if (videoRef?.current) {
          videoRef.current.pause();
          videoRef.current.currentTime = next;
        }
      } else {
        const next = Math.min(Math.max(sec, start + 0.2), clampEnd);
        onChange({ start, end: next });
        if (videoRef?.current) {
          videoRef.current.pause();
          videoRef.current.currentTime = next;
        }
      }
    },
    [drag, duration, start, end, onChange, videoRef, clampEnd]
  );

  useEffect(() => {
    if (!drag) return;
    const onMouseMove = (e) => handleMove(e.clientX);
    const onMouseUp = () => setDrag(null);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [drag, handleMove]);

  const startDrag = (which) => {
    setDrag(which);
    if (videoRef?.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = which === "start" ? start : end;
    }
  };

  const FRAME_COUNT = 14;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#9597A3",
            textTransform: "uppercase",
            letterSpacing: 0.5,
            display: "flex",
            gap: 7,
            alignItems: "center",
          }}
        >
          <span style={{ color: "#FF3D5E" }}>
            <Icon.Scissors size={14} />
          </span>
          Trim Range
        </span>
        <div
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 12,
            padding: "3px 9px",
            background: "rgba(255, 61, 94, 0.12)",
            border: "1px solid rgba(255, 61, 94, 0.3)",
            borderRadius: 7,
            color: "#FF5A78",
            display: "flex",
            gap: 6,
            alignItems: "center",
          }}
        >
          <span>{timecode(start)}</span>
          <span style={{ color: "#5E616E" }}>→</span>
          <span>{timecode(end)}</span>
          <span style={{ color: "#F4F3EE", fontWeight: 600 }}>({(end - start).toFixed(1)}s)</span>
        </div>
      </div>

      <div
        ref={trackRef}
        style={{
          position: "relative",
          height: 68,
          borderRadius: 12,
          overflow: "hidden",
          background: "#0A0B0E",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow: "inset 0 2px 6px rgba(0, 0, 0, 0.5)",
          userSelect: "none",
        }}
      >
        {/* frame strip background with film sprocket look */}
        <div style={{ position: "absolute", inset: 0, display: "flex" }}>
          {Array.from({ length: FRAME_COUNT }).map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                borderRight: i < FRAME_COUNT - 1 ? "1px solid rgba(255, 255, 255, 0.04)" : "none",
                background: i % 2 === 0 ? "rgba(22, 24, 32, 0.6)" : "rgba(18, 20, 26, 0.6)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "3px 0",
                color: "#282B36",
              }}
            >
              <div style={{ width: 4, height: 3, background: "rgba(255,255,255,0.1)", borderRadius: 1 }} />
              <Icon.Film size={15} />
              <div style={{ width: 4, height: 3, background: "rgba(255,255,255,0.1)", borderRadius: 1 }} />
            </div>
          ))}
        </div>

        {/* dimmed regions outside selection */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            height: "100%",
            width: `${pctOf(start)}%`,
            background: "rgba(9, 10, 14, 0.85)",
            backdropFilter: "blur(2px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            height: "100%",
            width: `${100 - pctOf(end)}%`,
            background: "rgba(9, 10, 14, 0.85)",
            backdropFilter: "blur(2px)",
          }}
        />

        {/* glowing selection bounding box */}
        <div
          style={{
            position: "absolute",
            top: 0,
            height: "100%",
            left: `${pctOf(start)}%`,
            width: `${pctOf(end) - pctOf(start)}%`,
            border: "2px solid #FF3D5E",
            background: "rgba(255, 61, 94, 0.06)",
            boxShadow: "0 0 16px rgba(255, 61, 94, 0.25), inset 0 0 12px rgba(255, 61, 94, 0.1)",
            boxSizing: "border-box",
            pointerEvents: "none",
          }}
        />

        {/* precision handles */}
        <Handle pct={pctOf(start)} onDown={() => startDrag("start")} isStart />
        <Handle pct={pctOf(end)} onDown={() => startDrag("end")} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 7 }}>
        <span style={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace", color: "#5E616E" }}>00:00.0</span>
        <span style={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace", color: "#5E616E" }}>{timecode(duration)}</span>
      </div>
    </div>
  );
}

export default FrameStrip;
