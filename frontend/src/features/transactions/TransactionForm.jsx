import { useState, useEffect } from "react";
import * as api from "../../services/api";

export default function TransactionForm({ onAdd, onCategoriesChange }) {
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal za novu kategoriju
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  // Modal za brisanje kategorije
  const [showDeleteCategory, setShowDeleteCategory] = useState(false);
  const [searchDeleteCategory, setSearchDeleteCategory] = useState("");
  const [deletingCategoryId, setDeletingCategoryId] = useState(null);
  const [deleteFilterType, setDeleteFilterType] = useState(null); // null = svi, "INCOME" = prihodi, "EXPENSE" = troškovi
  const [deleteError, setDeleteError] = useState("");

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

  const handleDeleteCategory = async (catId) => {
    if (
      !window.confirm("Jeste li sigurni da želite obrisati ovu kategoriju?")
    ) {
      return;
    }

    setDeleteError("");

    try {
      // Pozovi backend za brisanje
      await api.categories.delete(catId);

      // Obriši iz frontend state-a
      setCategories(categories.filter((c) => c.id !== catId));
      setSearchDeleteCategory("");
      setErr("");
      setDeleteError("");

      // Ako je obrisana kategorija bila odabrana, postavi novu
      if (categoryId === catId) {
        const newDefault = categories.find(
          (c) =>
            c.id !== catId &&
            c.type === (type === "income" ? "INCOME" : "EXPENSE"),
        );
        setCategoryId(newDefault?.id ?? null);
      }
    } catch (error) {
      // Prikaži specifičnu poruku greške sa backenda
      const errorMessage = error.message || "Greška pri brisanju kategorije";
      setDeleteError(errorMessage);
      console.error(error);
    }
  };

  const handleShowDeleteModal = async () => {
    setShowDeleteCategory(true);
    try {
      const data = await api.categories.getMyCategories();
      setCustomCategories(data);
    } catch (error) {
      console.error("Greška pri učitavanju korisničkih kategorija", error);
      setDeleteError("Greška pri učitavanju kategorija");
    }
  };

  const submit = (e) => {
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

      {/* Modal za brisanje kategorije */}
      {showDeleteCategory && (
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
          onClick={() => setShowDeleteCategory(false)}
        >
          <div
            style={{
              background: "var(--bg)",
              padding: 24,
              borderRadius: 8,
              border: "1px solid var(--border)",
              maxWidth: 500,
              width: "90%",
              maxHeight: "70vh",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>Obriši kategoriju</h3>
            <p className="muted" style={{ fontSize: 12, marginTop: 0 }}>
              Mogu se brisati samo vaše vlastite kategorije
            </p>

            {deleteError && (
              <div
                style={{
                  padding: 12,
                  background: "#ff4444",
                  borderRadius: 4,
                  marginBottom: 16,
                }}
              >
                <p style={{ color: "white", margin: 0, fontSize: 13 }}>
                  {deleteError}
                </p>
              </div>
            )}

            {/* Gumbi za filtriranje po tipu */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <button
                onClick={() => setDeleteFilterType(null)}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  background:
                    deleteFilterType === null ? "#7c3aed" : "var(--panel)",
                  color: deleteFilterType === null ? "white" : "var(--text)",
                  border: `1px solid ${deleteFilterType === null ? "#7c3aed" : "var(--border)"}`,
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: deleteFilterType === null ? "600" : "normal",
                }}
              >
                Sve
              </button>
              <button
                onClick={() => setDeleteFilterType("INCOME")}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  background:
                    deleteFilterType === "INCOME" ? "#22c55e" : "var(--panel)",
                  color:
                    deleteFilterType === "INCOME" ? "white" : "var(--text)",
                  border: `1px solid ${deleteFilterType === "INCOME" ? "#22c55e" : "var(--border)"}`,
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: deleteFilterType === "INCOME" ? "600" : "normal",
                }}
              >
                Prihodi
              </button>
              <button
                onClick={() => setDeleteFilterType("EXPENSE")}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  background:
                    deleteFilterType === "EXPENSE" ? "#ef4444" : "var(--panel)",
                  color:
                    deleteFilterType === "EXPENSE" ? "white" : "var(--text)",
                  border: `1px solid ${deleteFilterType === "EXPENSE" ? "#ef4444" : "var(--border)"}`,
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: deleteFilterType === "EXPENSE" ? "600" : "normal",
                }}
              >
                Troškovi
              </button>
            </div>

            <input
              type="text"
              placeholder="Pretraži kategorije..."
              value={searchDeleteCategory}
              onChange={(e) => setSearchDeleteCategory(e.target.value)}
              style={{ marginBottom: 16, padding: 8 }}
            />

            <div style={{ flex: 1, overflowY: "auto", marginBottom: 16 }}>
              {customCategories
                .filter(
                  (cat) =>
                    deleteFilterType === null || cat.type === deleteFilterType,
                ) // Filter po tipu
                .filter((cat) =>
                  cat.name
                    .toLowerCase()
                    .includes(searchDeleteCategory.toLowerCase()),
                )
                .map((cat) => (
                  <div
                    key={cat.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: 12,
                      marginBottom: 8,
                      background: "var(--panel)",
                      borderRadius: 4,
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div>
                      <b>{cat.name}</b>
                      <span
                        style={{
                          marginLeft: 12,
                          fontSize: 12,
                          color: "var(--muted)",
                        }}
                      >
                        {cat.type === "INCOME" ? "Prihod" : "Trošak"}
                      </span>
                    </div>
                    <button
                      className="btn-danger"
                      onClick={() => handleDeleteCategory(cat.id)}
                      style={{ padding: "6px 12px", fontSize: 12 }}
                    >
                      Obriši
                    </button>
                  </div>
                ))}
              {customCategories
                .filter(
                  (cat) =>
                    deleteFilterType === null || cat.type === deleteFilterType,
                )
                .filter((cat) =>
                  cat.name
                    .toLowerCase()
                    .includes(searchDeleteCategory.toLowerCase()),
                ).length === 0 && (
                <p className="muted" style={{ textAlign: "center" }}>
                  Nema kategorija koje odgovaraju pretrazi
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setShowDeleteCategory(false);
                setDeleteFilterType(null);
                setSearchDeleteCategory("");
                setDeleteError("");
              }}
              className="btn-secondary"
              style={{ width: "100%" }}
            >
              Zatvori
            </button>
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
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowNewCategory(true)}
                  className="btn-secondary"
                  style={{ flex: 1 }}
                >
                  + Dodaj novu kategoriju
                </button>
                <button
                  type="button"
                  onClick={handleShowDeleteModal}
                  className="btn-secondary"
                  style={{ flex: 1 }}
                >
                  − Obriši kategoriju
                </button>
              </div>
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
