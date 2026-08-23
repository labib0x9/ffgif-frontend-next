import { useState } from "react";
import IconButton from "../common/IconButton";
import { formatExpiry } from "../../utils/formatters";
import { Icon } from "../../utils/icons";

export function SharedGifCard({ gif, onOpen, onCopyLink, onDownload }) {
  const [hover, setHover] = useState(false);
  const [imgError, setImgError] = useState(false);
  const isExpired =
    gif.expires_at || gif.expire_at
      ? new Date(gif.expires_at || gif.expire_at).getTime() < Date.now()
      : false;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onOpen}
      style={{
        borderRadius: 14,
        background: "rgba(20, 22, 28, 0.7)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: `1px solid ${hover ? "rgba(255, 61, 94, 0.35)" : "rgba(255, 255, 255, 0.08)"}`,
        boxShadow: hover
          ? "0 12px 30px rgba(0, 0, 0, 0.45), 0 0 20px rgba(255, 61, 94, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
          : "0 4px 18px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
        overflow: "hidden",
        cursor: "pointer",
        transition: "all .2s cubic-bezier(0.16, 1, 0.3, 1)",
        transform: hover ? "translateY(-3px)" : "translateY(0)",
        opacity: isExpired ? 0.72 : 1,
      }}
    >
      <div
        style={{
          height: 136,
          background: "linear-gradient(135deg, rgba(26, 28, 36, 0.9), rgba(16, 18, 24, 0.9))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#282B36",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {gif.thumbnail_url && !imgError ? (
          <img
            src={gif.thumbnail_url}
            alt={gif.name || "Shared GIF thumbnail"}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              transform: hover ? "scale(1.05)" : "scale(1)",
              transition: "transform .3s ease",
            }}
            onError={() => setImgError(true)}
          />
        ) : (
          <div style={{ color: "#5E616E", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <Icon.Film size={26} />
          </div>
        )}

        <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 6, zIndex: 2 }}>
          {isExpired ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 10.5,
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: 6,
                textTransform: "uppercase",
                letterSpacing: 0.4,
                background: "rgba(255, 92, 92, 0.15)",
                color: "#FF5C5C",
                border: "1px solid rgba(255, 92, 92, 0.3)",
                backdropFilter: "blur(6px)",
              }}
            >
              <Icon.Alert size={10} /> Expired
            </span>
          ) : !gif.expires_at ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 10.5,
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: 6,
                textTransform: "uppercase",
                letterSpacing: 0.4,
                background: "rgba(61, 220, 151, 0.14)",
                color: "#3DDC97",
                border: "1px solid rgba(61, 220, 151, 0.3)",
                backdropFilter: "blur(6px)",
              }}
            >
              <Icon.Check size={10} /> Never expires
            </span>
          ) : (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 10.5,
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: 6,
                letterSpacing: 0.4,
                background: "rgba(255, 183, 77, 0.15)",
                color: "#FFB74D",
                border: "1px solid rgba(255, 183, 77, 0.3)",
                backdropFilter: "blur(6px)",
              }}
            >
              <Icon.Clock size={10} /> {formatExpiry(gif.expires_at)}
            </span>
          )}
        </div>

        {hover && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(9, 10, 14, 0.65)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              zIndex: 3,
              animation: "gifapp-slidein .15s ease",
            }}
          >
            {gif.url && (
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  onCopyLink();
                }}
                icon={<Icon.Copy size={15} />}
                title="Copy GIF URL"
              />
            )}
            {gif.url && (
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload();
                }}
                icon={<Icon.Download size={15} />}
                title="Download"
              />
            )}
          </div>
        )}
      </div>

      <div style={{ padding: "12px 14px" }}>
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            color: "#F4F3EE",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            marginBottom: 5,
          }}
        >
          {gif.name || "Untitled loop"}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11.5, color: "#9597A3", marginBottom: 4 }}>
          <span style={{ fontFamily: "JetBrains Mono, monospace", color: "#5E616E" }}>{gif.gif_key || gif.key}</span>
          {gif.shared_with && (
            <span
              style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 110, color: "#FF5A78" }}
              title={`Shared with ${gif.shared_with}`}
            >
              @{gif.shared_with.split("@")[0]}
            </span>
          )}
        </div>
        {gif.owner_id && (
          <div style={{ fontSize: 11, color: "#5E616E", fontFamily: "JetBrains Mono, monospace" }}>
            Owner: {gif.owner_id}
          </div>
        )}
      </div>
    </div>
  );
}

export default SharedGifCard;
