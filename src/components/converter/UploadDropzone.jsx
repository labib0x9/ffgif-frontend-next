import { useState, useRef } from "react";
import Card from "../common/Card";
import FrameScanLoader from "./FrameScanLoader";
import { Icon } from "../../utils/icons";

export function UploadDropzone({ uploading, onPick }) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);

  const handleFile = (f) => {
    if (!f) return;
    if (!f.type.startsWith("video/")) {
      onPick(null, "that doesn't look like a video file");
      return;
    }
    onPick(f);
  };

  return (
    <Card
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        handleFile(e.dataTransfer.files[0]);
      }}
      onClick={() => !uploading && inputRef.current?.click()}
      style={{
        padding: "72px 24px",
        textAlign: "center",
        cursor: uploading ? "default" : "pointer",
        border: `1.5px dashed ${drag ? "#FF3D5E" : "rgba(255, 255, 255, 0.15)"}`,
        background: drag
          ? "radial-gradient(circle at 50% 50%, rgba(255, 61, 94, 0.14) 0%, rgba(18, 20, 26, 0.8) 100%)"
          : "rgba(16, 18, 23, 0.65)",
        boxShadow: drag ? "0 0 30px rgba(255, 61, 94, 0.25)" : "0 8px 30px rgba(0, 0, 0, 0.3)",
        transition: "all .2s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files[0])}
      />
      {uploading ? (
        <FrameScanLoader label="Uploading…" sublabel="Sending your video over — hang tight." />
      ) : (
        <>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: drag
                ? "rgba(255, 61, 94, 0.2)"
                : "linear-gradient(135deg, rgba(255, 61, 94, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%)",
              border: `1px solid ${drag ? "rgba(255, 61, 94, 0.5)" : "rgba(255, 255, 255, 0.1)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              color: drag ? "#FF3D5E" : "#FF5A78",
              boxShadow: drag ? "0 0 20px rgba(255, 61, 94, 0.4)" : "0 4px 16px rgba(0, 0, 0, 0.3)",
              transition: "all .2s ease",
            }}
          >
            <Icon.Film size={32} />
          </div>
          <div
            style={{
              color: "#F4F3EE",
              fontWeight: 700,
              fontSize: 18,
              marginBottom: 8,
              fontFamily: "Space Grotesk, sans-serif",
              letterSpacing: -0.2,
            }}
          >
            Drop any video here
          </div>
          <div style={{ color: "#9597A3", fontSize: 14 }}>
            or <span style={{ color: "#FF3D5E", fontWeight: 600 }}>browse files</span> · MP4, MOV, WebM, AVI
          </div>
        </>
      )}
    </Card>
  );
}

export default UploadDropzone;
