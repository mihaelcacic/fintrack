import { useState, useEffect } from "react";
import * as api from "../../services/api";

export default function TransactionForm({ onAdd, onCategoriesChange }) {
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal za novu kategoriju
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  // Učitaj kategorije
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await api.categories.getAll();
        setCategories(data);
        // Postavi prvu kategoriju od odabranog tipa kao default
        const defaultCat = data.find(
          (c) => c.type === (type === "income" ? "INCOME" : "EXPENSE"),
        );
        if (defaultCat) setCategoryId(defaultCat.id);
      } catch (error) {
        setErr("Greška pri učitavanju kategorija");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Filtriraj kategorije prema tipu
  const filteredCategories = categories.filter(
    (c) => c.type === (type === "income" ? "INCOME" : "EXPENSE"),
  );

  // Ažurira default kategoriju kada se promijeni tip
  useEffect(() => {
    const defaultCat = filteredCategories[0];
    setCategoryId(defaultCat?.id ?? null);
  }, [type]);

  const handleAddNewCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      setErr("Unesite naziv kategorije");
      return;
    }

    setCreatingCategory(true);
    try {
      const newCat = await api.categories.create(
        newCategoryName.trim(),
        type === "income" ? "INCOME" : "EXPENSE",
      );
      setCategories([...categories, newCat]);
      setCategoryId(newCat.id);
      setNewCategoryName("");
      setShowNewCategory(false);
      setErr("");

      // Obavijesti parent komponentu da su kategorije ažurirane
      if (onCategoriesChange) {
        onCategoriesChange([...categories, newCat]);
      }
    } catch (error) {
      setErr(error.message || "Greška pri kreiranju kategorije");
      console.error(error);
    } finally {
      setCreatingCategory(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");

    if (!categoryId) {
      setErr("Odaberite kategoriju");
      return;
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setErr("Iznos mora biti broj veći od 0.");
      return;
    }

    const category = categories.find((c) => c.id === categoryId);

    onAdd({
      categoryId,
      amount: numericAmount,
      transactionDate: date,
      description: description.trim(),
      type: type === "income" ? "INCOME" : "EXPENSE",
      categoryName: category?.name,
    });

    setAmount("");
    setDescription("");
  };

  return (
    <>
      {/* Modal za novu kategoriju */}
      {showNewCategory && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowNewCategory(false)}
        >
          <div
            style={{
              background: "var(--bg)",
              padding: 24,
              borderRadius: 8,
              border: "1px solid var(--border)",
              maxWidth: 400,
              width: "90%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>Dodaj novu kategoriju</h3>
            <form onSubmit={handleAddNewCategory}>
              <label style={{ display: "block", marginBottom: 12 }}>
                Naziv kategorije
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="npr. Namirnice"
                  disabled={creatingCategory}
                  required
                />
              </label>

              <label style={{ display: "block", marginBottom: 12 }}>
                Tip
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  disabled={creatingCategory}
                >
                  <option value="expense">Trošak</option>
                  <option value="income">Prihod</option>
                </select>
              </label>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowNewCategory(false)}
                  disabled={creatingCategory}
                  style={{ flex: 1 }}
                >
                  Otkaži
                </button>
                <button
                  type="submit"
                  disabled={creatingCategory}
                  style={{ flex: 1 }}
                >
                  {creatingCategory ? "Dodajem..." : "Dodaj"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ padding: 16, border: "1px solid #333", borderRadius: 8 }}>
        <h3 style={{ marginTop: 0 }}>Unos transakcije</h3>

        {err && <p style={{ color: "crimson" }}>{err}</p>}

        {loading ? (
          <p>Učitavanje kategorija...</p>
        ) : (
          <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
            <label>
              Tip
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="expense">Trošak</option>
                <option value="income">Prihod</option>
              </select>
            </label>

            <label>
              Iznos (€)
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                step="0.01"
                min="0"
                required
              />
            </label>

            <div>
              <label style={{ display: "block", marginBottom: 8 }}>
                Kategorija
                <select
                  value={categoryId ?? ""}
                  onChange={(e) => setCategoryId(Number(e.target.value))}
                  required
                >
                  <option value="">Odaberite kategoriju</option>
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() => setShowNewCategory(true)}
                className="btn-secondary"
              >
                + Dodaj novu kategoriju
              </button>
            </div>

            <label>
              Datum
              <input
                value={date}
                onChange={(e) => setDate(e.target.value)}
                type="date"
                required
              />
            </label>

            <label>
              Opis
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="npr. Konzum"
              />
            </label>

            <button type="submit">Dodaj transakciju</button>
          </form>
        )}
      </div>
    </>
  );
}
