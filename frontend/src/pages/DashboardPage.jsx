import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function DashboardPage() {
  const { user } = useAuth();
  const [spending, setSpending] = useState([]);
  const [weeklyData, setWeeklyData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const spendingRes = await fetch("/api/dashboard/spending-by-category", {
          credentials: "include",
        });
        const weeklyRes = await fetch("/api/dashboard/weekly-goal", {
          credentials: "include",
        });

        if (spendingRes.ok) {
          setSpending(await spendingRes.json());
        }
        if (weeklyRes.ok) {
          setWeeklyData(await weeklyRes.json());
        }
      } catch (err) {
        console.error("Greška pri učitavanju podataka", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div style={{ padding: 24 }}>Učitavanje...</div>;

  // Boje teme
  const COLORS = ["#7c3aed", "#22c55e", "#06b6d4", "#f59e0b", "#ec4899"];

  // Dodaj boje svakom elementu u spending nizu
  const spendingWithColors = spending.map((item, index) => ({
    ...item,
    fill: COLORS[index % COLORS.length],
  }));

  return (
    <div style={{ maxWidth: 1200, margin: "24px auto", padding: "0 12px" }}>
      <h2>Nadzorna ploča</h2>
      <p>
        Ulogiran kao: <b>{user.username}</b> ({user.email}) — uloga:{" "}
        <b>{user.role}</b>
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
          }}
        >
          <h3>Potrošnja po kategorijama</h3>
          {spending.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={spendingWithColors}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value.toFixed(2)}`}
                  outerRadius={80}
                  dataKey="value"
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(11, 18, 32, 0.9)",
                    border: "1px solid rgba(255, 255, 255, 0.14)",
                    borderRadius: 8,
                    color: "rgba(255, 255, 255, 0.92)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: "var(--muted)" }}>Nema podataka za prikaz</p>
          )}
        </div>

        {/* Tjedni cilj */}
        <div
          style={{
            background: "var(--panel)",
            padding: 16,
            borderRadius: 14,
            border: "1px solid var(--border)",
            backdropFilter: "blur(10px)",
          }}
        >
          <h3>Tjedni cilj potrošnje</h3>
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
