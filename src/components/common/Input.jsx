import { Icon } from "../../utils/icons";
import { inputStyle } from "../../utils/styles";

export function Field({ label, error, children, hint }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <label
          style={{
            display: "block",
            fontSize: 12.5,
            fontWeight: 600,
            color: "#9597A3",
            marginBottom: 7,
            letterSpacing: 0.2,
          }}
        >
          {label}
        </label>
      )}
      {children}
      {hint && !error && <div style={{ fontSize: 12, color: "#5E616E", marginTop: 6 }}>{hint}</div>}
      {error && (
        <div style={{ fontSize: 12.5, color: "#FF5C5C", marginTop: 7, display: "flex", alignItems: "center", gap: 5 }}>
          <Icon.Alert size={13} />
          {error}
        </div>
      )}
    </div>
  );
}

export function Input({ error, style, ...props }) {
  return (
    <input
      style={{
        ...inputStyle,
        borderColor: error ? "#FF5C5C" : "rgba(255, 255, 255, 0.1)",
        boxShadow: error ? "0 0 0 3px rgba(255, 92, 92, 0.2), inset 0 2px 4px rgba(0, 0, 0, 0.3)" : inputStyle.boxShadow,
        ...style,
      }}
      onFocus={(e) => {
        e.target.style.borderColor = error ? "#FF5C5C" : "#FF3D5E";
        e.target.style.boxShadow = error
          ? "0 0 0 3px rgba(255, 92, 92, 0.25), inset 0 2px 4px rgba(0, 0, 0, 0.3)"
          : "0 0 0 3px rgba(255, 61, 94, 0.2), inset 0 2px 4px rgba(0, 0, 0, 0.3)";
      }}
      onBlur={(e) => {
        e.target.style.borderColor = error ? "#FF5C5C" : "rgba(255, 255, 255, 0.1)";
        e.target.style.boxShadow = error
          ? "0 0 0 3px rgba(255, 92, 92, 0.2), inset 0 2px 4px rgba(0, 0, 0, 0.3)"
          : "inset 0 2px 4px rgba(0, 0, 0, 0.3)";
      }}
      {...props}
    />
  );
}

export default Input;
