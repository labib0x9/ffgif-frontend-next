import { Icon } from "../../utils/icons";

export function FrameScanLoader({ label, sublabel, frames = 10 }) {
  return (
    <div style={{ maxWidth: 380, margin: "0 auto" }}>
      <div
        style={{
          position: "relative",
          height: 76,
          borderRadius: 12,
          overflow: "hidden",
          background: "#0A0B0E",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          display: "flex",
          marginBottom: 20,
          boxShadow: "0 6px 24px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
        }}
      >
        {Array.from({ length: frames }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              borderRight: i < frames - 1 ? "1px solid rgba(255, 255, 255, 0.05)" : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#21232B",
            }}
          >
            <Icon.Film size={14} />
          </div>
        ))}
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: "30%",
            background: "linear-gradient(90deg, transparent, rgba(255, 61, 94, 0.45), rgba(255, 61, 94, 0.7), transparent)",
            boxShadow: "0 0 16px rgba(255, 61, 94, 0.6)",
            animation: "ffgif-scan 1.5s ease-in-out infinite",
          }}
        />
      </div>
      <div
        style={{
          fontFamily: "Space Grotesk, sans-serif",
          fontSize: 17,
          fontWeight: 700,
          color: "#F4F3EE",
          marginBottom: 6,
          letterSpacing: -0.2,
        }}
      >
        {label}
      </div>
      {sublabel && (
        <div style={{ fontSize: 13, color: "#9597A3", lineHeight: 1.5 }}>
          {sublabel}
        </div>
      )}
    </div>
  );
}

export default FrameScanLoader;
