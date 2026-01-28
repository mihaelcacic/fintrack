export default function Skeleton({
  width = "100%",
  height = "20px",
  className = "",
}) {
  return (
    <div
      style={{
        width,
        height,
        background:
          "linear-gradient(90deg, var(--panel) 0%, var(--border) 50%, var(--panel) 100%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 2s infinite",
        borderRadius: "4px",
      }}
      className={className}
    />
  );
}
