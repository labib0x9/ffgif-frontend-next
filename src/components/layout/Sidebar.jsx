import { useAuth } from "../../context/useAuth";
import { Icon } from "../../utils/icons";

export function Sidebar({ active, setActive, onLogout }) {
  const { user } = useAuth();
  const items = [
    { id: "convert", label: "Convert", icon: Icon.Upload },
    { id: "gifs", label: "My GIFs", icon: Icon.Grid },
    { id: "shared", label: "Shared GIFs", icon: Icon.Share },
    { id: "account", label: "Account", icon: Icon.User },
  ];

  return (
    <div
      style={{
        width: 240,
        flexShrink: 0,
        background: "rgba(12, 14, 18, 0.85)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderRight: "1px solid rgba(255, 255, 255, 0.07)",
        display: "flex",
        flexDirection: "column",
        padding: "24px 16px",
        height: "100%",
        boxSizing: "border-box",
        zIndex: 10,
      }}
    >
      {/* Brand logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px 28px" }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            background: "linear-gradient(135deg, rgba(255,61,94,0.2) 0%, rgba(255,61,94,0.05) 100%)",
            border: "1px solid rgba(255, 61, 94, 0.4)",
            color: "#FF3D5E",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 16px rgba(255, 61, 94, 0.25)",
          }}
        >
          <Icon.Loop size={18} />
        </div>
        <span
          style={{
            fontFamily: "Space Grotesk, sans-serif",
            fontWeight: 700,
            fontSize: 18,
            color: "#F4F3EE",
            letterSpacing: -0.4,
          }}
        >
          ffgif
        </span>
      </div>

      {/* Nav items */}
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {items.map((it) => {
          const isActive = active === it.id;
          return (
            <div
              key={it.id}
              onClick={() => setActive(it.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                borderRadius: 11,
                cursor: "pointer",
                fontSize: 13.5,
                fontWeight: 600,
                color: isActive ? "#FFFFFF" : "#9597A3",
                background: isActive
                  ? "linear-gradient(90deg, rgba(255, 61, 94, 0.14) 0%, rgba(255, 61, 94, 0.04) 100%)"
                  : "transparent",
                border: `1px solid ${isActive ? "rgba(255, 61, 94, 0.3)" : "transparent"}`,
                boxShadow: isActive ? "0 4px 16px rgba(255, 61, 94, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.08)" : "none",
                transition: "all .16s cubic-bezier(0.16, 1, 0.3, 1)",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
                  e.currentTarget.style.color = "#F4F3EE";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#9597A3";
                }
              }}
            >
              {isActive && (
                <div
                  style={{
                    position: "absolute",
                    left: -2,
                    top: "22%",
                    bottom: "22%",
                    width: 3,
                    borderRadius: 2,
                    background: "#FF3D5E",
                    boxShadow: "0 0 10px #FF3D5E",
                  }}
                />
              )}
              <span
                style={{
                  color: isActive ? "#FF3D5E" : "#5E616E",
                  display: "flex",
                  alignItems: "center",
                  filter: isActive ? "drop-shadow(0 0 8px rgba(255,61,94,0.5))" : "none",
                  transition: "all .15s ease",
                }}
              >
                <it.icon size={17} />
              </span>
              {it.label}
            </div>
          );
        })}
      </div>

      <div style={{ flex: 1 }} />

      {/* User profile footer */}
      <div
        style={{
          borderTop: "1px solid rgba(255, 255, 255, 0.07)",
          paddingTop: 16,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #FF3D5E 0%, #8B5CF6 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13.5,
            fontWeight: 700,
            color: "#FFFFFF",
            fontFamily: "Space Grotesk, sans-serif",
            flexShrink: 0,
            boxShadow: "0 2px 10px rgba(255, 61, 94, 0.3)",
          }}
        >
          {(user?.fullname || "U").charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#F4F3EE",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {user?.fullname || "Creator"}
          </div>
          <div
            style={{
              fontSize: 11.5,
              color: "#5E616E",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            @{user?.username || "user"}
          </div>
        </div>
        <button
          onClick={onLogout}
          title="Log out"
          style={{
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 8,
            color: "#5E616E",
            cursor: "pointer",
            padding: 6,
            display: "flex",
            transition: "all .15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#FF5C5C";
            e.currentTarget.style.borderColor = "rgba(255, 92, 92, 0.3)";
            e.currentTarget.style.background = "rgba(255, 92, 92, 0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#5E616E";
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
          }}
        >
          <Icon.LogOut size={15} />
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
