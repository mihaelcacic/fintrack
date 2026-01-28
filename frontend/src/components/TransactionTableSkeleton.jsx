import Skeleton from "./Skeleton";

export default function TransactionTableSkeleton() {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 100px",
            gap: 12,
            padding: 12,
            background: "var(--panel)",
            borderRadius: 4,
            border: "1px solid var(--border)",
          }}
        >
          <Skeleton />
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </div>
      ))}
    </div>
  );
}
