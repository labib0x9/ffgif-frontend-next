import { useState, useCallback, useEffect } from "react";
import Button from "../common/Button";
import Spinner from "../common/Spinner";
import Input from "../common/Input";
import Toggle from "../common/Toggle";
import DetailStat from "./DetailStat";
import { api } from "../../api/client";
import { timeAgo, errMsg } from "../../utils/formatters";
import { Icon } from "../../utils/icons";

export function GifDetailDrawer({
  gif,
  cachedUrl,
  onResolvedUrl,
  onClose,
  onRename,
  onToggleVisibility,
  onDelete,
  onDownload,
  onShare,
}) {
  const key = gif.key || gif.gif_key || gif.id;
  const [name, setName] = useState(gif.name || "");
  const [editing, setEditing] = useState(false);
  const initialUrl = cachedUrl || gif.url || gif.thumbnail_url || null;
  const [url, setUrl] = useState(initialUrl);
  const [previewError, setPreviewError] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(!initialUrl);

  const loadPreview = useCallback(async () => {
    if (!key) {
      if (!url) setPreviewError("no gif key found");
      setLoadingPreview(false);
      return;
    }
    setLoadingPreview(true);
    setPreviewError(null);
    try {
      let res = await api.downloadGif(key).catch(() => null);
      let resUrl = typeof res === "string" ? res : (res?.url || res?.download_url || res?.presigned_url || res?.data?.url);
      if (!resUrl) {
        res = await api.getGif(key).catch(() => null);
        resUrl = typeof res === "string" ? res : (res?.url || res?.download_url || res?.thumbnail_url || res?.data?.url);
      }
      if (resUrl) {
        setUrl(resUrl);
        onResolvedUrl?.(resUrl);
      } else if (!url) {
        setPreviewError("couldn't load the preview");
      }
    } catch (e) {
      if (!url) setPreviewError(errMsg(e, "couldn't load the preview"));
    } finally {
      setLoadingPreview(false);
    }
  }, [key, onResolvedUrl, url]);

  useEffect(() => {
    if (cachedUrl) {
      setUrl(cachedUrl);
      setLoadingPreview(false);
      return;
    }
    if (gif.url) {
      setUrl(gif.url);
      setLoadingPreview(false);
      return;
    }
    loadPreview();
  }, [key, cachedUrl, gif.url, loadPreview]);

  const saveName = () => {
    onRename(key, name);
    setEditing(false);
  };

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
          width: 400,
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
          <span style={{ fontSize: 12, color: "#5E616E", fontFamily: "JetBrains Mono, monospace" }}>{key}</span>
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
            height: 220,
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
          {loadingPreview ? (
            <Spinner size={30} color="#FF3D5E" />
          ) : previewError ? (
            <div style={{ padding: "20px", textAlign: "center" }}>
              <div style={{ color: "#FF5C5C", marginBottom: 8, display: "flex", justifyContent: "center" }}>
                <Icon.Alert size={22} />
              </div>
              <div style={{ fontSize: 13, color: "#9597A3", marginBottom: 12 }}>{previewError}</div>
              <Button size="sm" variant="secondary" onClick={loadPreview}>
                Try again
              </Button>
            </div>
          ) : (
            <img
              src={url}
              alt={gif.name || "GIF preview"}
              style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
              onError={() => setPreviewError("the gif loaded but couldn't be displayed")}
            />
          )}
        </div>

        {editing ? (
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Untitled loop" />
            <Button size="sm" onClick={saveName}>
              Save
            </Button>
          </div>
        ) : (
          <div
            onClick={() => setEditing(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 20,
              cursor: "pointer",
              padding: "4px 0",
            }}
          >
            <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 19, fontWeight: 700, color: "#F4F3EE", margin: 0 }}>
              {gif.name || "Untitled loop"}
            </h2>
            <Icon.Edit size={14} color="#5E616E" />
          </div>
        )}

        <div style={{ display: "flex", gap: 14, marginBottom: 22 }}>
          <DetailStat label="Created" value={timeAgo(gif.created_at)} />
          <DetailStat label="Downloads" value={gif.download ?? 0} />
        </div>

        <div
          onClick={() => onToggleVisibility(key, gif.status === "public" ? "private" : "public")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            background: "rgba(12, 14, 18, 0.6)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 12,
            cursor: "pointer",
            marginBottom: 26,
            transition: "border-color .15s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            {gif.status === "public" ? <Icon.Globe size={18} color="#3DDC97" /> : <Icon.Lock size={18} color="#9597A3" />}
            <div>
              <div style={{ fontSize: 13.5, color: "#F4F3EE", fontWeight: 600 }}>
                {gif.status === "public" ? "Public" : "Private"}
              </div>
              <div style={{ fontSize: 11.5, color: "#5E616E" }}>
                {gif.status === "public" ? "Anyone with link can view" : "Only you can see this"}
              </div>
            </div>
          </div>
          <Toggle checked={gif.status === "public"} />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="secondary" icon={<Icon.Share size={14} />} onClick={onShare} style={{ flex: 1 }}>
            Share
          </Button>
          <Button variant="secondary" icon={<Icon.Download size={14} />} onClick={onDownload} style={{ flex: 1 }}>
            Download
          </Button>
          <Button variant="danger" icon={<Icon.Trash size={14} />} onClick={onDelete} style={{ flex: 1 }}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

export default GifDetailDrawer;
