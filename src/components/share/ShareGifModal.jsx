import { useState, useCallback } from "react";
import { useToastsCtx } from "../../context/useToasts";
import { api } from "../../api/client";
import { errMsg, formatFullDateTime } from "../../utils/formatters";
import { Icon } from "../../utils/icons";
import Button from "../common/Button";
import Card from "../common/Card";
import Input, { Field } from "../common/Input";
import Toggle from "../common/Toggle";

export function ShareGifModal({ gif, onClose, onShared }) {
  const { push } = useToastsCtx();
  const [email, setEmail] = useState("");
  const [hasExpiry, setHasExpiry] = useState(false);
  const [preset, setPreset] = useState("24h");
  const [customDateTime, setCustomDateTime] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const calculateExpireIso = useCallback(() => {
    if (!hasExpiry) return null;
    const now = new Date();
    if (preset === "1h") {
      return new Date(now.getTime() + 60 * 60 * 1000).toISOString();
    }
    if (preset === "24h") {
      return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    }
    if (preset === "7d") {
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    }
    if (preset === "30d") {
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }
    if (preset === "custom" && customDateTime) {
      const parsed = new Date(customDateTime);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    }
    return null;
  }, [hasExpiry, preset, customDateTime]);

  const handleShare = async (e) => {
    e?.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError("Please enter a recipient email address.");
      return;
    }
    setError(null);
    setLoading(true);
    const expire_at = calculateExpireIso();
    const gifKey = gif.gif_key || gif.key;
    try {
      const res = await api.shareGif(gifKey, {
        shared_with: cleanEmail,
        expire_at,
      });
      const msg = typeof res === "object" && res?.message ? res.message : `Shared with ${cleanEmail}`;
      push(msg);
      onShared?.();
      onClose();
    } catch (err) {
      setError(errMsg(err, "Failed to share GIF"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(6, 7, 10, 0.75)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        zIndex: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <Card
        onClick={(e) => e.stopPropagation()}
        style={{
          padding: 28,
          maxWidth: 450,
          width: "100%",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(255, 61, 94, 0.12)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          background: "rgba(18, 20, 26, 0.94)",
          borderRadius: 18,
          animation: "gifapp-slidein .2s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "linear-gradient(135deg, rgba(255, 61, 94, 0.2) 0%, rgba(255, 61, 94, 0.05) 100%)",
                border: "1px solid rgba(255, 61, 94, 0.35)",
                color: "#FF3D5E",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 0 16px rgba(255, 61, 94, 0.2)",
              }}
            >
              <Icon.Share size={19} />
            </div>
            <div>
              <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 18, fontWeight: 700, color: "#F4F3EE" }}>
                Share loop
              </div>
              <div style={{ fontSize: 12, color: "#5E616E", fontFamily: "JetBrains Mono, monospace" }}>
                {gif.name || gif.key || gif.gif_key}
              </div>
            </div>
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

        {error && (
          <div
            style={{
              background: "rgba(255, 92, 92, 0.12)",
              border: "1px solid rgba(255, 92, 92, 0.3)",
              borderRadius: 10,
              padding: "11px 14px",
              marginBottom: 18,
              color: "#FF8A8A",
              fontSize: 13,
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <Icon.Alert size={15} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleShare}>
          <Field label="Share with (email)" hint="The recipient will see this in their Shared GIFs section.">
            <Input
              type="email"
              autoFocus
              required
              placeholder="recipient@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
            />
          </Field>

          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: "#9597A3", letterSpacing: 0.2 }}>
                Expiration Date
              </label>
              <div
                onClick={() => setHasExpiry(!hasExpiry)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  fontSize: 12,
                  color: hasExpiry ? "#FF5A78" : "#5E616E",
                  userSelect: "none",
                }}
              >
                <span>{hasExpiry ? "Set expiry" : "Never expires"}</span>
                <Toggle checked={hasExpiry} />
              </div>
            </div>

            {hasExpiry && (
              <div
                style={{
                  background: "rgba(12, 14, 18, 0.7)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: 12,
                  padding: 14,
                  animation: "gifapp-slidein .15s ease",
                }}
              >
                <div style={{ display: "flex", gap: 5, marginBottom: 10, flexWrap: "wrap" }}>
                  {[
                    { id: "1h", label: "1 Hour" },
                    { id: "24h", label: "24 Hours" },
                    { id: "7d", label: "7 Days" },
                    { id: "30d", label: "30 Days" },
                    { id: "custom", label: "Custom" },
                  ].map((p) => {
                    const isSelected = preset === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPreset(p.id)}
                        style={{
                          padding: "6px 11px",
                          borderRadius: 7,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          border: `1px solid ${isSelected ? "rgba(255, 61, 94, 0.35)" : "transparent"}`,
                          background: isSelected
                            ? "linear-gradient(135deg, rgba(255, 61, 94, 0.22) 0%, rgba(255, 61, 94, 0.08) 100%)"
                            : "rgba(255, 255, 255, 0.04)",
                          color: isSelected ? "#FF5A78" : "#9597A3",
                          boxShadow: isSelected ? "0 2px 8px rgba(255, 61, 94, 0.2)" : "none",
                          transition: "all .15s ease",
                        }}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>

                {preset === "custom" && (
                  <div style={{ marginTop: 8 }}>
                    <Input
                      type="datetime-local"
                      value={customDateTime}
                      min={new Date().toISOString().slice(0, 16)}
                      onChange={(e) => setCustomDateTime(e.target.value)}
                    />
                  </div>
                )}

                <div
                  style={{
                    fontSize: 11.5,
                    color: "#9597A3",
                    marginTop: 10,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontFamily: "JetBrains Mono, monospace",
                  }}
                >
                  <Icon.Clock size={13} color="#FF5A78" />
                  <span>Will expire: {formatFullDateTime(calculateExpireIso())}</span>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
            <Button type="button" variant="secondary" size="md" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" size="md" loading={loading} icon={<Icon.Share size={15} />}>
              Share Loop
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default ShareGifModal;
