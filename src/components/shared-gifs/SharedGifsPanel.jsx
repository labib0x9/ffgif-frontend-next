import { useState, useCallback, useEffect } from "react";
import { useToastsCtx } from "../../context/useToasts";
import { api } from "../../api/client";
import { errMsg } from "../../utils/formatters";
import { Icon } from "../../utils/icons";
import PageHeader from "../common/PageHeader";
import Button from "../common/Button";
import EmptyState from "../common/EmptyState";
import { inputStyle } from "../../utils/styles";
import GifGridSkeleton from "../gifs/GifGridSkeleton";
import SharedGifCard from "./SharedGifCard";
import SharedGifDetailDrawer from "./SharedGifDetailDrawer";

export function SharedGifsPanel({ onNavigateGifs }) {
  const { push } = useToastsCtx();
  const [sharedGifs, setSharedGifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await api.listSharedGifs();
      const items = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      setSharedGifs(items);
    } catch (e) {
      setSharedGifs([]);
      setLoadError(errMsg(e, "could not load shared gifs"));
      push(errMsg(e, "could not load shared gifs"), "error");
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredGifs = sharedGifs.filter((g) => {
    const isExpired = g.expires_at ? new Date(g.expires_at).getTime() < Date.now() : false;
    if (statusFilter === "active" && isExpired) return false;
    if (statusFilter === "expired" && !isExpired) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const name = (g.name || "").toLowerCase();
    const key = (g.gif_key || g.key || "").toLowerCase();
    const sharedWith = (g.shared_with || "").toLowerCase();
    const ownerId = (g.owner_id || "").toLowerCase();
    return name.includes(q) || key.includes(q) || sharedWith.includes(q) || ownerId.includes(q);
  });

  const onCopyLink = (url) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    push("GIF link copied to clipboard.");
  };

  const onDownload = (url, name) => {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = name || "shared.gif";
    a.target = "_blank";
    a.rel = "noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div>
      <PageHeader
        title="Shared GIFs"
        subtitle={`${sharedGifs.length} loop${sharedGifs.length === 1 ? "" : "s"} shared with you`}
        right={
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {onNavigateGifs && (
              <Button variant="secondary" size="sm" icon={<Icon.Grid size={13} />} onClick={onNavigateGifs}>
                My GIFs
              </Button>
            )}
            <Button variant="ghost" size="sm" icon={<Icon.Refresh size={14} />} onClick={load} loading={loading}>
              Refresh
            </Button>
          </div>
        }
      />

      <div style={{ display: "flex", gap: 12, marginBottom: 22, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 240 }}>
          <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#5E616E", display: "flex" }}>
            <Icon.Search size={15} />
          </div>
          <input
            type="text"
            placeholder="Search by name, key, owner, or recipient..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              ...inputStyle,
              paddingLeft: 38,
              paddingTop: 9,
              paddingBottom: 9,
              fontSize: 13.5,
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "#5E616E",
                cursor: "pointer",
                fontSize: 16,
              }}
            >
              ×
            </button>
          )}
        </div>

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
          {[
            { id: "all", label: "All" },
            { id: "active", label: "Active" },
            { id: "expired", label: "Expired" },
          ].map((f) => {
            const isSelected = statusFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
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
                  boxShadow: isSelected ? "0 2px 8px rgba(255, 61, 94, 0.25)" : "none",
                  transition: "all .15s ease",
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <GifGridSkeleton />
      ) : loadError ? (
        <EmptyState
          icon={<Icon.Alert size={32} />}
          title="Couldn't load shared GIFs"
          subtitle={loadError}
          action={
            <Button variant="secondary" onClick={load} style={{ marginTop: 4 }}>
              Try again
            </Button>
          }
        />
      ) : sharedGifs.length === 0 ? (
        <EmptyState
          icon={<Icon.Users size={36} />}
          title="No shared loops yet"
          subtitle="When someone shares a GIF with your email, it will appear here."
        />
      ) : filteredGifs.length === 0 ? (
        <EmptyState
          icon={<Icon.Search size={32} />}
          title="No matching loops"
          subtitle="Try adjusting your search query or filter."
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 18 }}>
          {filteredGifs.map((g, idx) => (
            <SharedGifCard
              key={`${g.gif_key || g.key || idx}-${g.shared_with}`}
              gif={g}
              onOpen={() => setSelected(g)}
              onCopyLink={() => onCopyLink(g.url)}
              onDownload={() => onDownload(g.url, g.name)}
            />
          ))}
        </div>
      )}

      {selected && (
        <SharedGifDetailDrawer
          gif={selected}
          onClose={() => setSelected(null)}
          onCopyLink={() => onCopyLink(selected.url)}
          onDownload={() => onDownload(selected.url, selected.name)}
        />
      )}
    </div>
  );
}

export default SharedGifsPanel;
