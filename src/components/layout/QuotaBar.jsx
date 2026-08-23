import Card from "../common/Card";
import { formatBytes } from "../../utils/formatters";

function MiniMeter({ label, pct, valueText }) {
  const isHigh = pct > 85;
  return (
    <div style={{ flex: 1, minWidth: 140 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
        <span style={{ fontSize: 11, color: "#9597A3", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
          {label}
        </span>
        <span style={{ fontSize: 11.5, color: "#5E616E", fontFamily: "JetBrains Mono, monospace" }}>
          {valueText}
        </span>
      </div>
      <div
        style={{
          height: 6,
          background: "rgba(255, 255, 255, 0.06)",
          borderRadius: 6,
          overflow: "hidden",
          border: "1px solid rgba(255, 255, 255, 0.04)",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: isHigh
              ? "linear-gradient(90deg, #FF5C5C 0%, #FF8A8A 100%)"
              : "linear-gradient(90deg, #FF3D5E 0%, #FF6584 100%)",
            boxShadow: isHigh
              ? "0 0 10px rgba(255, 92, 92, 0.6)"
              : "0 0 10px rgba(255, 61, 94, 0.5)",
            borderRadius: 6,
            transition: "width .5s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
      </div>
    </div>
  );
}

export function QuotaBar({ quota }) {
  if (!quota) return null;
  const pct = Math.min(100, (quota.used_bytes / quota.total_bytes) * 100);
  const gifPct = Math.min(100, (quota.gif_count / quota.gif_limit) * 100);
  return (
    <Card style={{ padding: "16px 20px", display: "flex", gap: 32, alignItems: "center" }}>
      <MiniMeter label="Storage" pct={pct} valueText={`${formatBytes(quota.used_bytes)} / ${formatBytes(quota.total_bytes)}`} />
      <div style={{ width: 1, height: 32, background: "rgba(255, 255, 255, 0.08)" }} />
      <MiniMeter label="GIFs" pct={gifPct} valueText={`${quota.gif_count} / ${quota.gif_limit}`} />
    </Card>
  );
}

export default QuotaBar;
