import Card from "./Card";
import Button from "./Button";
import { Icon } from "../../utils/icons";

export function ConfirmDialog({ title, body, confirmLabel = "Confirm", onConfirm, onCancel }) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(8,8,10,0.65)",
        zIndex: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <Card onClick={(e) => e.stopPropagation()} style={{ padding: 24, maxWidth: 380, width: "100%" }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
          <div style={{ color: "#FF5C5C", flexShrink: 0 }}>
            <Icon.Alert size={22} />
          </div>
          <div>
            <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 16, fontWeight: 700, color: "#F3F1EC", marginBottom: 6 }}>
              {title}
            </div>
            <div style={{ fontSize: 13.5, color: "#9A9CA5", lineHeight: 1.5 }}>
              {body}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 18 }}>
          <Button variant="secondary" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={onConfirm}
            style={{ background: "#FF5C5C", color: "#0E0F12", borderColor: "#FF5C5C" }}
          >
            {confirmLabel}
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default ConfirmDialog;
