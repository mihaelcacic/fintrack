import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getTransactions, saveTransactions } from "../data/storage";
import TransactionForm from "../features/transactions/TransactionForm";
import TransactionTable from "../features/transactions/TransactionTable";
import TransactionFilters, {
  ALL,
} from "../features/transactions/TransactionFilters";

export default function TransactionsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    setTransactions(getTransactions(user.id));
  }, [user.id]);

  const [filters, setFilters] = useState({
    search: "",
    category: ALL,
    type: ALL,
    from: "",
    to: "",
    minAmount: "",
    maxAmount: "",
    sort: "date_desc", // default: najnovije
  });

  const addTransaction = (tx) => {
    const updated = [tx, ...transactions];
    setTransactions(updated);
    saveTransactions(user.id, updated);
  };

  const deleteTransaction = (id) => {
    const updated = transactions.filter((t) => t.id !== id);
    setTransactions(updated);
    saveTransactions(user.id, updated);
  };

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of transactions) {
      if (t.type === "income") income += t.amount;
      else expense += t.amount;
    }
    return { income, expense, saved: income - expense };
  }, [transactions]);

  const categories = useMemo(() => {
    const set = new Set();
    for (const t of transactions) set.add(t.category);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    const s = filters.search.trim().toLowerCase();

    const filtered = transactions.filter((t) => {
      // search
      if (s) {
        const desc = (t.description || "").toLowerCase();
        if (!desc.includes(s)) return false;
      }

      // category
      if (filters.category !== ALL && t.category !== filters.category)
        return false;

      // type
      if (filters.type !== ALL && t.type !== filters.type) return false;

      // date range
      if (filters.from && t.date < filters.from) return false;
      if (filters.to && t.date > filters.to) return false;

      // amount range
      const min = filters.minAmount === "" ? null : Number(filters.minAmount);
      const max = filters.maxAmount === "" ? null : Number(filters.maxAmount);

      if (min !== null && Number.isFinite(min) && t.amount < min) return false;
      if (max !== null && Number.isFinite(max) && t.amount > max) return false;

      return true;
    });

    // ===== SORTIRANJE =====
    return filtered.slice().sort((a, b) => {
      switch (filters.sort) {
        case "date_asc":
          return a.date.localeCompare(b.date);
        case "date_desc":
          return b.date.localeCompare(a.date);
        case "amount_asc":
          return a.amount - b.amount;
        case "amount_desc":
          return b.amount - a.amount;
        default:
          return 0;
      }
    });
  }, [transactions, filters]);

  return (
    <div className="container">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <h2>Transakcije</h2>
          <p className="muted" style={{ marginTop: 6 }}>
            Korisnik: <b>{user.name}</b> ({user.email})
          </p>
          <p style={{ marginTop: 10 }}>
            <Link to="/dashboard">← Natrag na nadzornu ploču</Link>
          </p>
        </div>

        <div className="card" style={{ padding: 12, minWidth: 260 }}>
          <div className="muted" style={{ fontSize: 13, marginBottom: 6 }}>
            Sažetak
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            <div>
              Prihodi: <b>{totals.income.toFixed(2)} €</b>
            </div>
            <div>
              Troškovi: <b>{totals.expense.toFixed(2)} €</b>
            </div>
            <div>
              Ušteda: <b>{totals.saved.toFixed(2)} €</b>
            </div>
          </div>
        </div>
      </div>

      <div style={{ height: 16 }} />

      <div className="card">
        <h3>Unos transakcije</h3>
        <p className="muted" style={{ marginTop: 0 }}>
          Dodaj prihod ili trošak i odmah će se spremiti.
        </p>
        <TransactionForm onAdd={addTransaction} />
      </div>

      <div style={{ height: 16 }} />

      <div className="card">
        <h3>Popis transakcija</h3>

        <TransactionFilters
          filters={filters}
          onChange={setFilters}
          categories={categories}
        />

        <div className="muted" style={{ marginTop: 10, fontSize: 13 }}>
          Prikazano: <b>{filteredTransactions.length}</b> /{" "}
          {transactions.length}
        </div>

        <TransactionTable
          transactions={filteredTransactions}
          onDelete={deleteTransaction}
        />
      </div>
    </div>
  );
}
