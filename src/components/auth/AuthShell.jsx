import Card from "../common/Card";
import { Icon } from "../../utils/icons";

export function Link({ children, onClick, small }) {
  return (
    <span
      onClick={onClick}
      style={{
        color: "#FF5A78",
        cursor: "pointer",
        fontWeight: 600,
        fontSize: small ? 12.5 : "inherit",
        transition: "color .15s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "#FF3D5E")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "#FF5A78")}
    >
      {children}
    </span>
  );
}

export function AuthShell({ children, footer, goTo }) {
  return (
    <div
      style={{
        minHeight: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient background glows */}
      <div
        style={{
          position: "absolute",
          top: "-20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 750,
          height: 750,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,61,94,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-15%",
          right: "20%",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1 }}>
        <div
          onClick={() => goTo && goTo("landing")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 11,
            justifyContent: "center",
            marginBottom: 32,
            cursor: goTo ? "pointer" : "default",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg, rgba(255,61,94,0.25) 0%, rgba(255,61,94,0.05) 100%)",
              border: "1px solid rgba(255, 61, 94, 0.45)",
              color: "#FF3D5E",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 20px rgba(255, 61, 94, 0.3)",
            }}
          >
            <Icon.Loop size={20} />
          </div>
          <span
            style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontWeight: 700,
              fontSize: 22,
              color: "#F4F3EE",
              letterSpacing: -0.4,
            }}
          >
            ffgif
          </span>
        </div>
        <Card
          style={{
            padding: 34,
            background: "rgba(18, 20, 26, 0.85)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6), 0 0 24px rgba(255, 61, 94, 0.08)",
          }}
        >
          {children}
        </Card>
        {footer && <div style={{ textAlign: "center", marginTop: 22, fontSize: 13.5, color: "#9597A3" }}>{footer}</div>}
      </div>
    </div>
  );
}

export default AuthShell;
