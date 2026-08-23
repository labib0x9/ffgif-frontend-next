import Card from "../common/Card";
import Button from "../common/Button";
import { formatBytes } from "../../utils/formatters";
import { Icon } from "../../utils/icons";

export function LastUploadBanner({ upload, loading, onUse }) {
  return (
    <Card
      style={{
        padding: "16px 18px",
        marginBottom: 16,
        display: "flex",
        alignItems: "center",
        gap: 14,
        background: "rgba(22, 25, 33, 0.8)",
        border: "1px solid rgba(255, 61, 94, 0.25)",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.35), 0 0 16px rgba(255, 61, 94, 0.08)",
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 10,
          background: "linear-gradient(135deg, rgba(255,61,94,0.18) 0%, rgba(255,61,94,0.05) 100%)",
          border: "1px solid rgba(255, 61, 94, 0.35)",
          color: "#FF3D5E",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          boxShadow: "0 0 12px rgba(255, 61, 94, 0.2)",
        }}
      >
        <Icon.Film size={19} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#F4F3EE", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 3 }}>
          Continue with your last upload
        </div>
        <div style={{ fontSize: 12, color: "#9597A3", fontFamily: "JetBrains Mono, monospace", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {upload.filename || upload.key}
          {upload.size_bytes ? ` · ${formatBytes(upload.size_bytes)}` : ""}
        </div>
      </div>
      <Button size="sm" variant="secondary" onClick={onUse} loading={loading} style={{ flexShrink: 0 }}>
        Use this
      </Button>
    </Card>
  );
}

export default LastUploadBanner;
