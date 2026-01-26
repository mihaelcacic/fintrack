import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { PieChart, Pie, Tooltip, ResponsiveContainer } from "recharts";
import * as api from "../services/api";

export default function DashboardPage() {
  const { user } = useAuth();
  const [spending, setSpending] = useState([]);
  const [weeklyData, setWeeklyData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Dohvati sve transakcije
        const transactionsData = await api.transactions.getAll();
        const allTransactions = transactionsData.content || [];

        // Filtriraj samo EXPENSE transakcije za graf
        const expenseTransactions = allTransactions.filter(
          (t) => t.categoryType === "EXPENSE",
        );

        // Izračunaj potrošnju po kategorijama
        const categoryMap = new Map();
        expenseTransactions.forEach((t) => {
          const categoryName = t.categoryName || "Ostalo";
          const amount = parseFloat(t.amount);
          categoryMap.set(
            categoryName,
            (categoryMap.get(categoryName) || 0) + amount,
          );
        });

        // Pretvori u niz za graf
        const spendingData = Array.from(categoryMap.entries()).map(
          ([name, value]) => ({
            name,
            value: parseFloat(value.toFixed(2)),
          }),
        );
        setSpending(spendingData);

        // Izračunaj tjednu potrošnju (samo EXPENSE)
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(
          now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1),
        );
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        const weeklyExpenses = expenseTransactions.filter((t) => {
          const tDate = new Date(t.transactionDate);
          return tDate >= weekStart && tDate <= weekEnd;
        });

        const weeklySpent = weeklyExpenses.reduce(
          (sum, t) => sum + parseFloat(t.amount),
          0,
        );
        const weeklyGoal = 500; // Default cilj

        setWeeklyData({
          spent: weeklySpent,
          goal: weeklyGoal,
          remaining: weeklyGoal - weeklySpent,
          percentage: (weeklySpent / weeklyGoal) * 100,
        });
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
                  label={({ name, value }) => `${name}: ${value.toFixed(2)} €`}
                  outerRadius={80}
                  dataKey="value"
                />
                <Tooltip
                  formatter={(value) => [`${value.toFixed(2)} €`, "Iznos"]}
                  contentStyle={{
                    background: "rgba(30, 30, 50, 0.98)",
                    border: "2px solid rgba(124, 58, 237, 0.6)",
                    borderRadius: 8,
                    padding: "10px 12px",
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
                  }}
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
