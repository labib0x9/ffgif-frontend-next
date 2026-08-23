import Card from "../common/Card";
import { Icon } from "../../utils/icons";

export function ConvertingStage({ job }) {
  const progress = job?.progress || 0;
  return (
    <Card style={{ padding: "64px 24px", textAlign: "center" }}>
      <div
        style={{
          width: 72,
          height: 72,
          margin: "0 auto 24px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, rgba(255, 61, 94, 0.22) 0%, rgba(139, 92, 246, 0.1) 100%)",
          border: "1.5px solid rgba(255, 61, 94, 0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#FF3D5E",
          boxShadow: "0 0 28px rgba(255, 61, 94, 0.35)",
        }}
      >
        <div style={{ animation: "ffgif-loop-spin 1.2s linear infinite" }}>
          <Icon.Loop size={32} />
        </div>
      </div>
      <div
        style={{
          fontFamily: "Space Grotesk, sans-serif",
          fontSize: 20,
          fontWeight: 700,
          color: "#F4F3EE",
          marginBottom: 8,
          letterSpacing: -0.3,
        }}
      >
        Rendering your loop
      </div>
      <div style={{ fontSize: 13, color: "#9597A3", marginBottom: 28, fontFamily: "JetBrains Mono, monospace" }}>
        job <span style={{ color: "#FF5A78" }}>{job?.job_id}</span> · {job?.status}
      </div>
      <div style={{ maxWidth: 320, margin: "0 auto" }}>
        <div
          style={{
            height: 7,
            background: "rgba(255, 255, 255, 0.08)",
            borderRadius: 6,
            overflow: "hidden",
            border: "1px solid rgba(255, 255, 255, 0.05)",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: "linear-gradient(90deg, #FF3D5E 0%, #FF6584 100%)",
              boxShadow: "0 0 12px rgba(255, 61, 94, 0.8)",
              borderRadius: 6,
              transition: "width .4s ease",
            }}
          />
        </div>
        <div style={{ fontSize: 12.5, color: "#9597A3", marginTop: 10, fontFamily: "JetBrains Mono, monospace", fontWeight: 600 }}>
          {progress}%
        </div>
      </div>
    </Card>
  );
}

export default ConvertingStage;
