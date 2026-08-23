export function Spinner({ size = 16, color = "currentColor" }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={{ animation: "gifapp-spin 0.8s linear infinite" }}>
      <circle cx="12" cy="12" r="9" fill="none" stroke={color} strokeWidth="2.5" strokeDasharray="40" strokeLinecap="round" opacity="0.9" />
    </svg>
  );
}

export default Spinner;
