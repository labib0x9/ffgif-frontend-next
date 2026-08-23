export function PageHeader({ title, subtitle, right }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22, gap: 16, flexWrap: "wrap" }}>
      <div>
        <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 24, fontWeight: 700, color: "#F3F1EC", margin: "0 0 5px" }}>
          {title}
        </h1>
        {subtitle && <p style={{ fontSize: 13.5, color: "#8A8C96", margin: 0 }}>{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export default PageHeader;
