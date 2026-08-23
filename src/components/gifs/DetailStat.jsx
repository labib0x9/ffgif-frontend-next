export function DetailStat({ label, value }) {
  return (
    <div
      style={{
        flex: 1,
        background: "rgba(12, 14, 18, 0.6)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: 11,
        padding: "12px 14px",
      }}
    >
      <div style={{ fontSize: 10.5, color: "#9597A3", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4, fontWeight: 700 }}>
        {label}
      </div>
      <div style={{ fontSize: 15, color: "#F4F3EE", fontFamily: "JetBrains Mono, monospace", fontWeight: 600 }}>
        {value}
      </div>
    </div>
  );
}

export default DetailStat;
