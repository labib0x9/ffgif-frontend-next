import { useState, useEffect } from "react";
import Badge from "../common/Badge";
import IconButton from "../common/IconButton";
import { api } from "../../api/client";
import { timeAgo } from "../../utils/formatters";
import { Icon } from "../../utils/icons";

export function GifCard({ gif, onOpen, onShare, onDelete, onDownload }) {
  const [hover, setHover] = useState(false);
  const [thumbUrl, setThumbUrl] = useState(gif.thumbnail_url || null);
  const [thumbError, setThumbError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const key = gif.key || gif.gif_key || gif.id;

    if (gif.thumbnail_url) {
      setThumbUrl(gif.thumbnail_url);
      setThumbError(false);
      return;
    }

    if (!key) return;

    (async () => {
      try {
        const res = await api.getGif(key).catch(() => null);
        if (cancelled) return;
        if (res && res.thumbnail_url) {
          setThumbUrl(res.thumbnail_url);
        } else {
          setThumbError(true);
        }
      } catch {
        if (!cancelled) setThumbError(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [gif.key, gif.gif_key, gif.id, gif.thumbnail_url]);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
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
      }}
      onClick={onOpen}
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
        {thumbUrl && !thumbError ? (
          <img
            src={thumbUrl}
            alt={gif.name || "Thumbnail preview"}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              transform: hover ? "scale(1.05)" : "scale(1)",
              transition: "transform .3s ease",
            }}
            onError={() => setThumbError(true)}
          />
        ) : (
          <div style={{ color: "#5E616E", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <Icon.Film size={26} />
          </div>
        )}
        <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 6, zIndex: 2 }}>
          <Badge type={gif.status || "private"} />
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
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                onShare();
              }}
              icon={<Icon.Share size={15} />}
              title="Share loop"
            />
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                onDownload();
              }}
              icon={<Icon.Download size={15} />}
              title="Download"
            />
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              icon={<Icon.Trash size={15} />}
              danger
              title="Delete"
            />
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
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "#5E616E", fontFamily: "JetBrains Mono, monospace" }}>
          <span>{timeAgo(gif.created_at)}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Icon.Download size={11} />
            {gif.download ?? 0}
          </span>
        </div>
      </div>
    </div>
  );
}

export default GifCard;
