import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import * as api from "../services/api";

export default function SavingsPage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    targetAmount: "",
    deadline: "",
  });
  const [formError, setFormError] = useState("");

  // Učitaj ciljeve
  useEffect(() => {
    const fetchGoals = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      try {
        const data = await api.savings.getAll();
        setGoals(data);
      } catch (err) {
        setError(err.message || "Greška pri učitavanju ciljeva štednje");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchGoals();
  }, [user?.id]);

  // Izračun postotka dovršenosti
  const calculateProgress = (goal) => {
    if (!goal.targetAmount) return 0;
    return Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
  };

  // Dodaj novi cilj
  const handleAddGoal = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.name.trim()) {
      setFormError("Unesite naziv cilja");
      return;
    }

    const amount = parseFloat(formData.targetAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError("Iznos mora biti broj veći od 0");
      return;
    }

    if (!formData.deadline) {
      setFormError("Odaberite rok za štednju");
      return;
    }

    try {
      const newGoal = await api.savings.create(
        formData.name.trim(),
        amount,
        formData.deadline,
      );
      setGoals([...goals, newGoal]);
      setFormData({ name: "", targetAmount: "", deadline: "" });
      setShowForm(false);
    } catch (err) {
      setFormError(err.message || "Greška pri kreiranju cilja");
    }
  };

  // Dodaj štednju
  const handleAddSavings = async (goalId) => {
    const amount = prompt("Koliko novca ste uštedjeli?");
    if (!amount) return;

    const numAmount = parseFloat(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      alert("Unesite validan iznos");
      return;
    }

    try {
      const updated = await api.savings.addSavings(goalId, numAmount);
      setGoals(goals.map((g) => (g.id === goalId ? updated : g)));
    } catch (err) {
      alert(err.message || "Greška pri dodavanju štednje");
    }
  };

  // Obriši cilj
  const handleDeleteGoal = async (goalId) => {
    if (!window.confirm("Jeste li sigurni da želite obrisati ovaj cilj?")) {
      return;
    }

    try {
      await api.savings.delete(goalId);
      setGoals(goals.filter((g) => g.id !== goalId));
    } catch (err) {
      alert(err.message || "Greška pri brisanju cilja");
    }
  };

  if (loading) return <div className="container">Učitavanje...</div>;

  return (
    <div className="container">
      <div style={{ marginBottom: 24 }}>
        <h2>Ciljevi štednje</h2>
        <p className="muted">
          Postavi ciljeve štednje i prati svoj napredak prema željenom iznosu.
        </p>
      </div>

      {error && (
        <div
          style={{
            padding: 12,
            background: "#ff4444",
            borderRadius: 4,
            marginBottom: 16,
          }}
        >
          <p style={{ color: "white", margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Gumb za dodavanje novog cilja */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary"
          style={{ marginBottom: 16, width: "100%" }}
        >
          + Dodaj novi cilj štednje
        </button>
      )}

      {/* Forma za novi cilj */}
      {showForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ marginTop: 0 }}>Novi cilj štednje</h3>
          {formError && <p style={{ color: "crimson" }}>{formError}</p>}

          <form onSubmit={handleAddGoal} style={{ display: "grid", gap: 12 }}>
            <label>
              Naziv cilja
              <input
                type="text"
                placeholder="npr. Godišnji odmor"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </label>

            <label>
              Ciljna količina (€)
              <input
                type="number"
                placeholder="npr. 2500"
                value={formData.targetAmount}
                onChange={(e) =>
                  setFormData({ ...formData, targetAmount: e.target.value })
                }
                step="0.01"
                min="0"
                required
              />
            </label>

            <label>
              Rok za štednju
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) =>
                  setFormData({ ...formData, deadline: e.target.value })
                }
                required
              />
            </label>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-secondary"
                style={{ flex: 1 }}
              >
                Otkaži
              </button>
              <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                Dodaj cilj
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Popis ciljeva */}
      <div style={{ display: "grid", gap: 16 }}>
        {goals.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: 32 }}>
            <p className="muted">Nema aktivnih ciljeva štednje</p>
            <p className="muted" style={{ fontSize: 12 }}>
              Dodaj svoj prvi cilj da počneš štediti!
            </p>
          </div>
        ) : (
          goals.map((goal) => {
            const progress = calculateProgress(goal);
            const isGoalMet = goal.currentAmount >= goal.targetAmount;
            const deadline = new Date(goal.deadline);
            const today = new Date();
            const daysLeft = Math.ceil(
              (deadline - today) / (1000 * 60 * 60 * 24),
            );

            return (
              <div key={goal.id} className="card">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "start",
                    marginBottom: 12,
                  }}
                >
                  <div>
                    <h3 style={{ marginTop: 0, marginBottom: 4 }}>
                      {goal.name}
                    </h3>
                    <p className="muted" style={{ marginTop: 0, fontSize: 12 }}>
                      Rok: {deadline.toLocaleDateString("hr-HR")} ({daysLeft}{" "}
                      dana)
                    </p>
                  </div>
                  <button
                    className="btn-danger"
                    onClick={() => handleDeleteGoal(goal.id)}
                    style={{ padding: "6px 12px", fontSize: 12 }}
                  >
                    Obriši
                  </button>
                </div>

                {/* Status obavijest */}
                {daysLeft < 0 && !isGoalMet && (
                  <div
                    style={{
                      padding: 12,
                      background: "rgba(239, 68, 68, 0.12)",
                      border: "1px solid rgba(239, 68, 68, 0.35)",
                      borderRadius: 8,
                      marginBottom: 12,
                    }}
                  >
                    <p style={{ margin: 0, fontSize: 12, color: "#ff6b6b" }}>
                      ⚠️ Rok je prošao! Mesečna štednja je preračunata na{" "}
                      <b>{goal.monthlySavingsRequired} €</b> do kraja dostupnog
                      vremena.
                    </p>
                  </div>
                )}

                {/* Napredak */}
                <div style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <span className="muted" style={{ fontSize: 12 }}>
                      Uštedljeno: <b>{goal.currentAmount.toFixed(2)} €</b> od{" "}
                      <b>{goal.targetAmount.toFixed(2)} €</b>
                    </span>
                    <span className="muted" style={{ fontSize: 12 }}>
                      {progress.toFixed(0)}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div
                    style={{
                      width: "100%",
                      height: 8,
                      background: "rgba(255, 255, 255, 0.06)",
                      borderRadius: 999,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${progress}%`,
                        background: isGoalMet
                          ? "linear-gradient(90deg, #22c55e, #16a34a)"
                          : "linear-gradient(90deg, #7c3aed, #6d28d9)",
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                </div>

                {/* Mjesečna štednja */}
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.04)",
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 12,
                  }}
                >
                  <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
                    Месячна штедња:{" "}
                    <b style={{ fontSize: 14 }}>
                      {goal.monthlySavingsRequired} €
                    </b>
                  </p>
                  <p
                    style={{
                      margin: "6px 0 0 0",
                      fontSize: 11,
                      color: "var(--muted)",
                    }}
                  >
                    (Još trebate:{" "}
                    {Math.max(
                      0,
                      goal.targetAmount - goal.currentAmount,
                    ).toFixed(2)}{" "}
                    €)
                  </p>
                </div>

                {/* Gumbi */}
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => handleAddSavings(goal.id)}
                    className="btn-primary"
                    style={{ flex: 1 }}
                  >
                    + Dodaj štednju
                  </button>
                  {isGoalMet && (
                    <span
                      style={{
                        padding: "10px 12px",
                        background: "rgba(34, 197, 94, 0.18)",
                        border: "1px solid rgba(34, 197, 94, 0.35)",
                        borderRadius: 10,
                        color: "#4ade80",
                        fontWeight: 600,
                        fontSize: 12,
                      }}
                    >
                      ✓ Cilj dostignut!
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
