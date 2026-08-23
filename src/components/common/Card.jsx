export function Card({ children, style, glow, ...rest }) {
  return (
    <div
      style={{
        background: "rgba(18, 20, 26, 0.75)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: 16,
        boxShadow: glow
          ? "0 12px 36px rgba(0, 0, 0, 0.5), 0 0 24px rgba(255, 61, 94, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.12)"
          : "0 8px 30px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.07)",
        transition: "all .2s cubic-bezier(0.16, 1, 0.3, 1)",
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

export default Card;
