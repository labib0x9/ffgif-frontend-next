import { Icon } from "../../utils/icons";

export function Toast({ toasts, dismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 999,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        alignItems: "flex-end",
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => {
        const isError = t.type === "error";
        return (
          <div
            key={t.id}
            style={{
              pointerEvents: "auto",
              background: "rgba(18, 20, 26, 0.88)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              border: `1px solid ${isError ? "rgba(255, 92, 92, 0.35)" : "rgba(61, 220, 151, 0.3)"}`,
              borderRadius: 12,
              padding: "12px 18px",
              color: "#F4F3EE",
              fontSize: 13.5,
              display: "flex",
              alignItems: "center",
              gap: 12,
              minWidth: 260,
              maxWidth: 380,
              boxShadow: isError
                ? "0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 92, 92, 0.18)"
                : "0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(61, 220, 151, 0.15)",
              animation: "gifapp-slidein .25s cubic-bezier(0.16, 1, 0.3, 1)",
              fontFamily: "Inter, sans-serif",
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: isError ? "rgba(255, 92, 92, 0.12)" : "rgba(61, 220, 151, 0.12)",
                color: isError ? "#FF5C5C" : "#3DDC97",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {isError ? <Icon.Alert size={15} /> : <Icon.Check size={15} />}
            </div>
            <span style={{ flex: 1, lineHeight: 1.4 }}>{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              style={{
                background: "none",
                border: "none",
                color: "#5E616E",
                cursor: "pointer",
                fontSize: 18,
                lineHeight: 1,
                padding: "2px 4px",
                transition: "color .12s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#F4F3EE")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#5E616E")}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default Toast;
