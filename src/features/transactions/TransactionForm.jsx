import { useState } from "react";

const CATEGORIES = [
  "Hrana",
  "Prijevoz",
  "Računi",
  "Najam",
  "Kupovina",
  "Zdravlje",
  "Zabava",
  "Ostalo",
];

export default function TransactionForm({ onAdd }) {
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Hrana");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [err, setErr] = useState("");

  const submit = (e) => {
    e.preventDefault();
    setErr("");

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setErr("Iznos mora biti broj veći od 0.");
      return;
    }

    onAdd({
      id: crypto.randomUUID(),
      type, // "income" | "expense"
      amount: numericAmount,
      category,
      date, // YYYY-MM-DD
      description: description.trim(),
    });

    setAmount("");
    setDescription("");
  };

  return (
    <div style={{ padding: 16, border: "1px solid #333", borderRadius: 8 }}>
      <h3 style={{ marginTop: 0 }}>Unos transakcije</h3>

      {err && <p style={{ color: "crimson" }}>{err}</p>}

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

        <label>
          Kategorija
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label>
          Datum
          <input value={date} onChange={(e) => setDate(e.target.value)} type="date" required />
        </label>

        <label>
          Opis
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="npr. Konzum"
          />
        </label>

        <button type="submit">Dodaj</button>
      </form>
    </div>
  );
}
