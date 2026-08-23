import { Icon } from "../../utils/icons";

export function Badge({ type }) {
  const isPublic = type === "public";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 10.5,
        fontWeight: 700,
        padding: "3px 9px",
        borderRadius: 7,
        textTransform: "uppercase",
        letterSpacing: 0.4,
        background: isPublic ? "rgba(61, 220, 151, 0.12)" : "rgba(149, 151, 163, 0.12)",
        color: isPublic ? "#3DDC97" : "#9597A3",
        border: `1px solid ${isPublic ? "rgba(61, 220, 151, 0.3)" : "rgba(149, 151, 163, 0.2)"}`,
        backdropFilter: "blur(6px)",
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: isPublic ? "#3DDC97" : "#9597A3",
          boxShadow: isPublic ? "0 0 6px rgba(61, 220, 151, 0.8)" : "none",
        }}
      />
      {isPublic ? <Icon.Globe size={10} /> : <Icon.Lock size={10} />}
      {type}
    </span>
  );
}

export default Badge;
