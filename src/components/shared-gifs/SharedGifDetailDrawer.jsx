import Button from "../common/Button";
import DetailStat from "../gifs/DetailStat";
import { formatExpiry, formatFullDateTime } from "../../utils/formatters";
import { Icon } from "../../utils/icons";

export function SharedGifDetailDrawer({ gif, onClose, onCopyLink, onDownload }) {
  const isExpired = gif.expires_at ? new Date(gif.expires_at).getTime() < Date.now() : false;
  const displayUrl = gif.url || gif.thumbnail_url;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(6, 7, 10, 0.7)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 200,
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 420,
          maxWidth: "92vw",
          height: "100%",
          background: "rgba(16, 18, 24, 0.95)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderLeft: "1px solid rgba(255, 255, 255, 0.1)",
          padding: 26,
          boxSizing: "border-box",
          overflowY: "auto",
          animation: "gifapp-slideleft .22s cubic-bezier(0.16, 1, 0.3, 1)",
          boxShadow: "-12px 0 40px rgba(0, 0, 0, 0.6)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11,
                fontWeight: 700,
                padding: "3px 9px",
                borderRadius: 7,
                background: "rgba(255, 61, 94, 0.14)",
                color: "#FF5A78",
                border: "1px solid rgba(255, 61, 94, 0.3)",
              }}
            >
              <Icon.Share size={11} /> SHARED
            </span>
            <span style={{ fontSize: 12, color: "#5E616E", fontFamily: "JetBrains Mono, monospace" }}>
              {gif.gif_key || gif.key}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 8,
              color: "#9597A3",
              cursor: "pointer",
              fontSize: 18,
              lineHeight: 1,
              padding: "4px 8px",
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            height: 230,
            borderRadius: 14,
            background: "#08090C",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#282B36",
            marginBottom: 22,
            overflow: "hidden",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 6px 24px rgba(0, 0, 0, 0.4)",
          }}
        >
          {displayUrl ? (
            <img
              src={displayUrl}
              alt={gif.name || "Shared loop preview"}
              style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
            />
          ) : (
            <div style={{ color: "#5E616E", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <Icon.Film size={30} />
              <span style={{ fontSize: 12.5 }}>No preview available</span>
            </div>
          )}
        </div>

        <div style={{ marginBottom: 22 }}>
          <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 20, color: "#F4F3EE", margin: "0 0 6px", fontWeight: 700 }}>
            {gif.name || "Untitled loop"}
          </h2>
          <div style={{ fontSize: 13, color: "#9597A3" }}>Shared loop view</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
          <DetailStat label="Shared with" value={gif.shared_with || "—"} />
          <DetailStat label="Owner ID" value={gif.owner_id || "—"} />
        </div>

        <div
          style={{
            background: "rgba(12, 14, 18, 0.6)",
            borderRadius: 12,
            padding: "14px 16px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            marginBottom: 22,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
            <span style={{ fontSize: 11, color: "#9597A3", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>
              Expiration
            </span>
            {isExpired ? (
              <span style={{ fontSize: 11.5, color: "#FF5C5C", fontWeight: 700 }}>Expired</span>
            ) : !gif.expires_at ? (
              <span style={{ fontSize: 11.5, color: "#3DDC97", fontWeight: 700 }}>Never</span>
            ) : (
              <span style={{ fontSize: 11.5, color: "#FFB74D", fontWeight: 700 }}>{formatExpiry(gif.expires_at)}</span>
            )}
          </div>
          <div style={{ fontSize: 13, color: "#F4F3EE", fontFamily: "JetBrains Mono, monospace" }}>
            {formatFullDateTime(gif.expires_at)}
          </div>
        </div>

        {gif.url && (
          <div
            style={{
              background: "rgba(10, 11, 15, 0.8)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 11,
              padding: "10px 12px",
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <input
              readOnly
              value={gif.url}
              style={{
                background: "none",
                border: "none",
                color: "#9597A3",
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 12,
                width: "100%",
                outline: "none",
              }}
            />
            <Button size="sm" variant="ghost" icon={<Icon.Copy size={13} />} onClick={onCopyLink}>
              Copy
            </Button>
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          {gif.url && (
            <Button variant="secondary" icon={<Icon.Download size={14} />} onClick={onDownload} style={{ flex: 1 }}>
              Download
            </Button>
          )}
          {gif.url && (
            <Button variant="primary" icon={<Icon.ExternalLink size={14} />} onClick={() => window.open(gif.url, "_blank")} style={{ flex: 1 }}>
              Open URL
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default SharedGifDetailDrawer;
