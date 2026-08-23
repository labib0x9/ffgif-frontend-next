export function Toggle({ checked }) {
  return (
    <div
      style={{
        width: 38,
        height: 22,
        borderRadius: 11,
        background: checked
          ? "linear-gradient(135deg, #FF3D5E 0%, #FF6584 100%)"
          : "rgba(255, 255, 255, 0.12)",
        position: "relative",
        transition: "all .2s cubic-bezier(0.16, 1, 0.3, 1)",
        boxShadow: checked ? "0 0 12px rgba(255, 61, 94, 0.45)" : "inset 0 1px 3px rgba(0,0,0,0.4)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 2,
          left: checked ? 18 : 2,
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "#FFFFFF",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.35)",
          transition: "left .2s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />
    </div>
  );
}

export default Toggle;
