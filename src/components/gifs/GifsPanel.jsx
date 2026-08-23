import { useState, useCallback, useEffect } from "react";
import { useToastsCtx } from "../../context/useToasts";
import { api } from "../../api/client";
import { errMsg } from "../../utils/formatters";
import { Icon } from "../../utils/icons";
import PageHeader from "../common/PageHeader";
import Button from "../common/Button";
import EmptyState from "../common/EmptyState";
import ConfirmDialog from "../common/ConfirmDialog";
import ShareGifModal from "../share/ShareGifModal";
import GifGridSkeleton from "./GifGridSkeleton";
import GifCard from "./GifCard";
import GifDetailDrawer from "./GifDetailDrawer";

export function GifsPanel({ onNavigateShared }) {
  const { push } = useToastsCtx();
  const [filter, setFilter] = useState("all");
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [sharingGif, setSharingGif] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [urlCache, setUrlCache] = useState({});

  const cacheUrl = useCallback((key, url) => {
    setUrlCache((prev) => (prev[key] === url ? prev : { ...prev, [key]: url }));
  }, []);

  const load = useCallback(
    async (status) => {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await api.listGifs(status);
        const items = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        setGifs(items);
      } catch (e) {
        setGifs([]);
        setLoadError(errMsg(e, "could not load your gifs"));
        push(errMsg(e, "could not load gifs"), "error");
      } finally {
        setLoading(false);
      }
    },
    [push]
  );

  useEffect(() => {
    load(filter);
  }, [filter, load]);

  const onRename = async (key, name) => {
    try {
      await api.updateGif(key, { name });
      setGifs((g) => g.map((x) => (x.key === key || x.gif_key === key || x.id === key ? { ...x, name } : x)));
      push("Renamed.");
    } catch (e) {
      push(errMsg(e, "rename failed"), "error");
    }
  };

  const onToggleVisibility = async (key, status) => {
    try {
      await api.updateGif(key, { status });
      setGifs((g) => g.map((x) => (x.key === key || x.gif_key === key || x.id === key ? { ...x, status } : x)));
      push(status === "public" ? "Made public." : "Made private.");
    } catch (e) {
      push(errMsg(e, "could not update"), "error");
    }
  };

  const onDelete = async (key) => {
    try {
      await api.deleteGif(key);
      setGifs((g) => g.filter((x) => x.key !== key && x.gif_key !== key && x.id !== key));
      setConfirmDelete(null);
      setSelected(null);
      push("Deleted.");
    } catch (e) {
      push(errMsg(e, "delete failed"), "error");
    }
  };

  const onDownload = async (key) => {
    try {
      let res = await api.downloadGif(key).catch(() => null);
      let url = typeof res === "string" ? res : (res?.url || res?.download_url || res?.presigned_url || res?.data?.url);
      if (!url) {
        res = await api.getGif(key).catch(() => null);
        url = typeof res === "string" ? res : (res?.url || res?.download_url || res?.thumbnail_url || res?.data?.url);
      }
      if (url) {
        window.open(url, "_blank");
      } else {
        push("Could not download GIF", "error");
      }
    } catch (e) {
      push(errMsg(e, "download failed"), "error");
    }
  };

  return (
    <div>
      <PageHeader
        title="My GIFs"
        subtitle={`${gifs.length} loop${gifs.length === 1 ? "" : "s"} created`}
        right={
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {onNavigateShared && (
              <Button variant="secondary" size="sm" icon={<Icon.Share size={13} />} onClick={onNavigateShared}>
                Shared GIFs
              </Button>
            )}
            <div
              style={{
                display: "flex",
                gap: 4,
                background: "rgba(14, 16, 22, 0.7)",
                padding: 3,
                borderRadius: 9,
                border: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              {["all", "private", "public"].map((f) => {
                const isSelected = filter === f;
                return (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    style={{
                      padding: "6px 13px",
                      borderRadius: 7,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      border: `1px solid ${isSelected ? "rgba(255, 61, 94, 0.35)" : "transparent"}`,
                      background: isSelected
                        ? "linear-gradient(135deg, rgba(255, 61, 94, 0.2) 0%, rgba(255, 61, 94, 0.06) 100%)"
                        : "transparent",
                      color: isSelected ? "#FF5A78" : "#9597A3",
                      textTransform: "capitalize",
                      boxShadow: isSelected ? "0 2px 8px rgba(255, 61, 94, 0.25)" : "none",
                      transition: "all .15s ease",
                    }}
                  >
                    {f}
                  </button>
                );
              })}
            </div>
          </div>
        }
      />

      {loading ? (
        <GifGridSkeleton />
      ) : loadError ? (
        <EmptyState
          icon={<Icon.Alert size={32} />}
          title="Couldn't load your gifs"
          subtitle={loadError}
          action={
            <Button variant="secondary" onClick={() => load(filter)} style={{ marginTop: 4 }}>
              Try again
            </Button>
          }
        />
      ) : gifs.length === 0 ? (
        <EmptyState
          icon={<Icon.Grid size={36} />}
          title="No loops yet"
          subtitle="Drop a video and trim it to export your first GIF."
        />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 18 }}>
          {gifs.map((g, idx) => {
            const key = g.key || g.gif_key || g.id || `gif-${idx}`;
            return (
              <GifCard
                key={key}
                gif={g}
                onOpen={() => setSelected(g)}
                onShare={() => setSharingGif(g)}
                onDelete={() => setConfirmDelete(g)}
                onDownload={() => onDownload(key)}
              />
            );
          })}
        </div>
      )}

      {selected && (
        <GifDetailDrawer
          gif={selected}
          cachedUrl={urlCache[selected.key || selected.gif_key || selected.id] || selected.url || selected.thumbnail_url}
          onResolvedUrl={(url) => {
            const k = selected.key || selected.gif_key || selected.id;
            if (k) cacheUrl(k, url);
          }}
          onClose={() => setSelected(null)}
          onRename={onRename}
          onToggleVisibility={onToggleVisibility}
          onShare={() => setSharingGif(selected)}
          onDelete={() => setConfirmDelete(selected)}
          onDownload={() => onDownload(selected.key || selected.gif_key || selected.id)}
        />
      )}

      {sharingGif && (
        <ShareGifModal
          gif={sharingGif}
          onClose={() => setSharingGif(null)}
          onShared={() => {}}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete this GIF?"
          body={`"${confirmDelete.name || confirmDelete.key || confirmDelete.gif_key || "this loop"}" will be permanently removed. This can't be undone.`}
          confirmLabel="Delete"
          onConfirm={() => onDelete(confirmDelete.key || confirmDelete.gif_key || confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

export default GifsPanel;
