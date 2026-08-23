import Card from "./Card";

export function EmptyState({ icon, title, subtitle, action }) {
  return (
    <Card style={{ padding: "60px 24px", textAlign: "center" }}>
      <div style={{ color: "#3A3C44", marginBottom: 16, display: "flex", justifyContent: "center" }}>
        {icon}
      </div>
      <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 16, fontWeight: 700, color: "#F3F1EC", marginBottom: 6 }}>
        {title}
      </div>
      <div style={{ fontSize: 13.5, color: "#8A8C96", marginBottom: action ? 20 : 0 }}>
        {subtitle}
      </div>
      {action}
    </Card>
  );
}

export default EmptyState;
