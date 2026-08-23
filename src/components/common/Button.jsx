import Spinner from "./Spinner";

export function Button({ variant = "primary", size = "md", children, icon, loading, ...rest }) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontFamily: "Inter, sans-serif",
    fontWeight: 600,
    borderRadius: 11,
    border: "1px solid transparent",
    cursor: rest.disabled ? "not-allowed" : "pointer",
    transition: "all .18s cubic-bezier(0.16, 1, 0.3, 1)",
    whiteSpace: "nowrap",
    opacity: rest.disabled ? 0.45 : 1,
    userSelect: "none",
    position: "relative",
    overflow: "hidden",
  };

  const sizes = {
    sm: { padding: "6px 13px", fontSize: 13 },
    md: { padding: "10px 18px", fontSize: 14 },
    lg: { padding: "13px 24px", fontSize: 15 },
  };

  const variants = {
    primary: {
      background: "linear-gradient(135deg, #FF3D5E 0%, #FF6584 100%)",
      color: "#0B0C10",
      border: "1px solid rgba(255, 255, 255, 0.2)",
      boxShadow: "0 4px 18px rgba(255, 61, 94, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.35)",
    },
    secondary: {
      background: "rgba(255, 255, 255, 0.04)",
      color: "#F4F3EE",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.06)",
      backdropFilter: "blur(8px)",
    },
    ghost: {
      background: "transparent",
      color: "#9597A3",
      border: "1px solid transparent",
    },
    danger: {
      background: "rgba(255, 92, 92, 0.08)",
      color: "#FF5C5C",
      border: "1px solid rgba(255, 92, 92, 0.22)",
    },
  };

  return (
    <button
      style={{ ...base, ...sizes[size], ...variants[variant], ...rest.style }}
      onMouseEnter={(e) => {
        if (rest.disabled) return;
        e.currentTarget.style.transform = "translateY(-1px)";
        if (variant === "primary") {
          e.currentTarget.style.boxShadow = "0 6px 24px rgba(255, 61, 94, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.4)";
          e.currentTarget.style.filter = "brightness(1.06)";
        }
        if (variant === "secondary") {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
          e.currentTarget.style.color = "#FFFFFF";
        }
        if (variant === "ghost") {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
          e.currentTarget.style.color = "#F4F3EE";
        }
        if (variant === "danger") {
          e.currentTarget.style.background = "rgba(255, 92, 92, 0.16)";
          e.currentTarget.style.borderColor = "#FF5C5C";
          e.currentTarget.style.boxShadow = "0 4px 14px rgba(255, 92, 92, 0.25)";
        }
      }}
      onMouseLeave={(e) => {
        if (rest.disabled) return;
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.filter = "none";
        if (variant === "primary") {
          e.currentTarget.style.boxShadow = variants.primary.boxShadow;
        }
        if (variant === "secondary") {
          e.currentTarget.style.background = variants.secondary.background;
          e.currentTarget.style.borderColor = variants.secondary.border;
          e.currentTarget.style.color = variants.secondary.color;
        }
        if (variant === "ghost") {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = variants.ghost.color;
        }
        if (variant === "danger") {
          e.currentTarget.style.background = variants.danger.background;
          e.currentTarget.style.borderColor = variants.danger.border;
          e.currentTarget.style.boxShadow = "none";
        }
      }}
      onMouseDown={(e) => {
        if (!rest.disabled) e.currentTarget.style.transform = "translateY(1px) scale(0.99)";
      }}
      onMouseUp={(e) => {
        if (!rest.disabled) e.currentTarget.style.transform = "translateY(-1px)";
      }}
      {...rest}
    >
      {loading ? <Spinner size={14} /> : icon}
      {children}
    </button>
  );
}

export default Button;
