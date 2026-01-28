import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { PieChart, Pie, Tooltip, Legend, ResponsiveContainer } from "recharts";
import * as api from "../services/api";

export default function DashboardPage() {
  const { user } = useAuth();
  const [spending, setSpending] = useState([]);
  const [weeklyData, setWeeklyData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Koristi dashboard endpoint koji radi sve na backend-u
        const spendingData = await api.dashboard.getSpendingByCategory();
        setSpending(spendingData);

        const weeklyData = await api.dashboard.getWeeklyGoal();
        setWeeklyData(weeklyData);
      } catch (err) {
        console.error("Greška pri učitavanju podataka", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div style={{ padding: 24 }}>Učitavanje...</div>;

  // Boje teme - proširena paleta
  const COLORS = [
    "#7c3aed", // Purple
    "#22c55e", // Green
    "#06b6d4", // Cyan
    "#f59e0b", // Amber
    "#ec4899", // Pink
    "#8b5cf6", // Violet
    "#10b981", // Emerald
    "#14b8a6", // Teal
    "#f97316", // Orange
    "#d946ef", // Fuchsia
    "#0ea5e9", // Sky
    "#eab308", // Lime
    "#ef4444", // Red
    "#06b6d4", // Cyan (alt)
    "#6366f1", // Indigo
  ];

  // Dodaj boje svakom elementu u spending nizu
  const spendingWithColors = spending.map((item, index) => ({
    ...item,
    fill: COLORS[index % COLORS.length],
  }));

  return (
    <div style={{ maxWidth: 1200, margin: "24px auto", padding: "0 12px" }}>
      <h2>Nadzorna ploča</h2>
      <p>
        Dobrodošli, <b>{user?.username ?? user?.email ?? "Korisniče"}</b>!
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
          marginTop: 24,
        }}
      >
        {/* Potrošnja po kategorijama */}
        <div
          style={{
            background: "var(--panel)",
            padding: 16,
            borderRadius: 14,
            border: "1px solid var(--border)",
            backdropFilter: "blur(10px)",
            overflow: "hidden",
          }}
        >
          <h3>Potrošnja po kategorijama</h3>
          {spending.length > 0 ? (
            <ResponsiveContainer width="100%" height={600}>
              <PieChart>
                <Pie
                  data={spendingWithColors}
                  cx="50%"
                  cy="45%"
                  labelLine={false}
                  outerRadius={100}
                  dataKey="value"
                />
                <Tooltip
                  labelFormatter={() => ""}
                  contentStyle={{
                    background: "rgba(30, 30, 50, 0.98)",
                    border: "2px solid rgba(124, 58, 237, 0.6)",
                    borderRadius: 8,
                    padding: "10px 12px",
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
                  }}
                  formatter={(value, name, props) => [
                    `${props.payload.name}: ${value.toFixed(2)} €`,
                    "",
                  ]}
                  labelStyle={{
                    color: "rgba(255, 255, 255, 0.95)",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                  itemStyle={{
                    color: "rgba(255, 255, 255, 0.85)",
                    fontSize: "13px",
                  }}
                />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  height={200}
                  width={600}
                  formatter={(value, entry) =>
                    `${entry.payload.name}: ${entry.payload.value.toFixed(2)} €`
                  }
                  wrapperStyle={{
                    paddingTop: 0,
                    maxHeight: "280px",
                    overflowY: "auto",
                    paddingRight: 8,
                    fontSize: "14px",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "16px",
                    width: "100%",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: "var(--muted)" }}>Nema podataka za prikaz</p>
          )}
        </div>

        {/* Tjedni budžet */}
        <div
          style={{
            background: "var(--panel)",
            padding: 16,
            borderRadius: 14,
            border: "1px solid var(--border)",
            backdropFilter: "blur(10px)",
          }}
        >
          <h3>Tjedni budžet</h3>
          {weeklyData ? (
            <div>
              <div style={{ marginBottom: 16 }}>
                <p style={{ color: "var(--muted)", marginBottom: 8 }}>
                  Cilj:{" "}
                  <b style={{ color: "var(--text)" }}>
                    {weeklyData.goal.toFixed(2)} €
                  </b>
                </p>
                <p style={{ color: "var(--muted)", marginBottom: 8 }}>
                  Potrošnja:{" "}
                  <b style={{ color: "var(--text)" }}>
                    {weeklyData.spent.toFixed(2)} €
                  </b>
                </p>
                <p style={{ color: "var(--muted)", marginBottom: 8 }}>
                  Preostalo:{" "}
                  <b
                    style={{
                      color: weeklyData.remaining >= 0 ? "#22c55e" : "#ef4444",
                    }}
                  >
                    {weeklyData.remaining.toFixed(2)} €
                  </b>
                </p>
              </div>
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.06)",
                  borderRadius: 4,
                  overflow: "hidden",
                  height: 24,
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    background:
                      weeklyData.percentage > 100 ? "#ef4444" : "#22c55e",
                    width: `${Math.min(weeklyData.percentage, 100)}%`,
                    height: "100%",
                    transition: "width 0.3s",
                  }}
                />
              </div>
              <p style={{ marginTop: 12, fontSize: 14, color: "var(--muted)" }}>
                {weeklyData.percentage.toFixed(1)}% od cilja
              </p>
            </div>
          ) : (
            <p style={{ color: "var(--muted)" }}>Nema podataka za prikaz</p>
          )}
        </div>
      </div>
    </div>
  );
}
