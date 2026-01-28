import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import * as api from "../services/api";

export default function SavingsPage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [monthlyBalance, setMonthlyBalance] = useState(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    targetAmount: "",
    deadline: "",
  });
  const [formError, setFormError] = useState("");

  // Modal state za dodavanje štednje
  const [savingsModal, setSavingsModal] = useState({
    show: false,
    goalId: null,
    amount: "",
    error: "",
  });

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

  // Učitaj mjesečnu uštjedu
  const loadMonthlyBalance = async () => {
    if (!user?.id) return;
    try {
      const data = await api.transactions.getMonthlyBalance();
      setMonthlyBalance(data);
    } catch (err) {
      console.error("Greška pri učitavanju mjesečne uštede", err);
    }
  };

  useEffect(() => {
    loadMonthlyBalance();
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
  const handleOpenSavingsModal = (goalId) => {
    setSavingsModal({
      show: true,
      goalId,
      amount: "",
      error: "",
    });
  };

  const handleCloseSavingsModal = () => {
    setSavingsModal({
      show: false,
      goalId: null,
      amount: "",
      error: "",
    });
  };

  const handleSubmitSavings = async () => {
    if (!savingsModal.amount) {
      setSavingsModal({ ...savingsModal, error: "Unesite iznos" });
      return;
    }

    const numAmount = parseFloat(savingsModal.amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      setSavingsModal({
        ...savingsModal,
        error: "Iznos mora biti broj veći od 0",
      });
      return;
    }

    try {
      const updated = await api.savings.addSavings(
        savingsModal.goalId,
        numAmount,
      );
      setGoals(goals.map((g) => (g.id === savingsModal.goalId ? updated : g)));
      handleCloseSavingsModal();
      // Osvježi mjesečnu uštjedu
      await loadMonthlyBalance();
    } catch (err) {
      setSavingsModal({
        ...savingsModal,
        error: err.message || "Greška pri dodavanju štednje",
      });
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
        }}
      >
        <div>
          <h2>Ciljevi štednje</h2>
          <p className="muted">
            Postavi ciljeve štednje i prati svoj napredak prema željenom iznosu.
          </p>
        </div>

        <div className="card" style={{ padding: 12, minWidth: 260 }}>
          <div className="muted" style={{ fontSize: 13, marginBottom: 6 }}>
            Mjesečna ušteda
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {monthlyBalance !== null ? (
              <div>
                Ušteda ovog mjeseca:{" "}
                <b>{(monthlyBalance.balance || 0).toFixed(2)} €</b>
              </div>
            ) : (
              <div className="muted">Učitavanje...</div>
            )}
          </div>
        </div>
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
                      ⚠️ Rok je prošao! Mjesečna štednja je preračunata na{" "}
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
                      Ušteđeno: <b>{goal.currentAmount.toFixed(2)} €</b> od{" "}
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
                    Mjesečna štednja:{" "}
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
                  {isGoalMet ? (
                    <span
                      style={{
                        flex: 1,
                        padding: "10px 12px",
                        background: "rgba(34, 197, 94, 0.18)",
                        border: "1px solid rgba(34, 197, 94, 0.35)",
                        borderRadius: 10,
                        color: "#4ade80",
                        fontWeight: 600,
                        fontSize: 12,
                        textAlign: "center",
                      }}
                    >
                      ✓ Cilj dostignut
                    </span>
                  ) : daysLeft < 0 ? (
                    <span
                      style={{
                        flex: 1,
                        padding: "10px 12px",
                        background: "rgba(239, 68, 68, 0.18)",
                        border: "1px solid rgba(239, 68, 68, 0.35)",
                        borderRadius: 10,
                        color: "#ff6b6b",
                        fontWeight: 600,
                        fontSize: 12,
                        textAlign: "center",
                      }}
                    >
                      ✗ Cilj nije dostignut
                    </span>
                  ) : (
                    <button
                      onClick={() => handleOpenSavingsModal(goal.id)}
                      className="btn-primary"
                      style={{ flex: 1 }}
                    >
                      + Dodaj u štednju
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal za dodavanje štednje */}
      {savingsModal.show && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={handleCloseSavingsModal}
        >
          <div
            className="card"
            style={{
              width: "90%",
              maxWidth: 400,
              padding: 24,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>Dodaj u štednju</h3>

            {savingsModal.error && (
              <div
                style={{
                  padding: 12,
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.35)",
                  borderRadius: 8,
                  marginBottom: 12,
                }}
              >
                <p style={{ margin: 0, fontSize: 12, color: "#ff6b6b" }}>
                  {savingsModal.error}
                </p>
              </div>
            )}

            <label style={{ display: "block", marginBottom: 16 }}>
              Koliko novca ste uštedjeli? (€)
              <input
                type="number"
                placeholder="npr. 150.50"
                value={savingsModal.amount}
                onChange={(e) =>
                  setSavingsModal({ ...savingsModal, amount: e.target.value })
                }
                step="0.01"
                min="0"
                autoFocus
                style={{
                  marginTop: 8,
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: 8,
                  background: "rgba(255, 255, 255, 0.04)",
                  color: "inherit",
                  fontSize: 14,
                  boxSizing: "border-box",
                }}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleSubmitSavings();
                  }
                }}
              />
            </label>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleCloseSavingsModal}
                className="btn-secondary"
                style={{ flex: 1 }}
              >
                Otkaži
              </button>
              <button
                onClick={handleSubmitSavings}
                className="btn-primary"
                style={{ flex: 1 }}
              >
                Dodaj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
