export function IconButton({ icon, onClick, danger, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        border: `1px solid ${danger ? "rgba(255, 92, 92, 0.3)" : "rgba(255, 255, 255, 0.15)"}`,
        cursor: "pointer",
        background: danger ? "rgba(255, 92, 92, 0.15)" : "rgba(18, 20, 26, 0.65)",
        backdropFilter: "blur(8px)",
        color: danger ? "#FF5C5C" : "#F4F3EE",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all .15s cubic-bezier(0.16, 1, 0.3, 1)",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.08)";
        if (danger) {
          e.currentTarget.style.background = "rgba(255, 92, 92, 0.3)";
          e.currentTarget.style.boxShadow = "0 0 12px rgba(255, 92, 92, 0.4)";
        } else {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.35)";
          e.currentTarget.style.boxShadow = "0 0 12px rgba(255, 255, 255, 0.2)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.background = danger ? "rgba(255, 92, 92, 0.15)" : "rgba(18, 20, 26, 0.65)";
        e.currentTarget.style.borderColor = danger ? "rgba(255, 92, 92, 0.3)" : "rgba(255, 255, 255, 0.15)";
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.3)";
      }}
    >
      {icon}
    </button>
  );
}

export default IconButton;
