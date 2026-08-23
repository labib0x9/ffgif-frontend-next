import Card from "../common/Card";
import FrameScanLoader from "./FrameScanLoader";

export function ConvertingPreviewStage({ filename, status }) {
  const label =
    status === "processing"
      ? "Converting to MP4"
      : status === "failed"
      ? "Upload failed"
      : "Uploading";
  return (
    <Card style={{ padding: "48px 24px", textAlign: "center" }}>
      <FrameScanLoader
        label={label}
        sublabel={
          <>
            <span style={{ fontFamily: "JetBrains Mono, monospace", color: "#9A9CA5" }}>
              {filename || "your video"}
            </span>
            <br />
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#FF3D5E",
                  flexShrink: 0,
                  animation: "ffgif-pulse-dot 1s ease-in-out infinite",
                }}
              />
              This can take a moment for larger files or uncommon formats.
            </span>
          </>
        }
      />
    </Card>
  );
}

export default ConvertingPreviewStage;
