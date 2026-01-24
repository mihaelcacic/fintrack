import { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import TransactionForm from "../features/transactions/TransactionForm";
import TransactionTable from "../features/transactions/TransactionTable";
import TransactionFilters, {
  ALL,
} from "../features/transactions/TransactionFilters";

export default function TransactionsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    category: ALL,
    type: ALL,
    from: "",
    to: "",
    minAmount: "",
    maxAmount: "",
    sort: "date_desc",
  });

  const fetchTransactions = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/transactions", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        const formatted = data.map((t) => ({
          id: t.id,
          type: t.category?.type === "INCOME" ? "income" : "expense",
          amount: +t.amount,
          category: t.category?.name || "Ostalo",
          date: t.transactionDate,
          description: t.description || "",
        }));
        setTransactions(formatted);
      }
    } catch (err) {
      console.error("Greška pri učitavanju transakcija", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchTransactions();
  }, [user?.id, fetchTransactions]);

  const addTransaction = useCallback(
    async (tx) => {
      try {
        const res = await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            categoryId: null,
            amount: tx.amount,
            transactionDate: tx.date,
            description: tx.description,
          }),
        });

        if (res.ok) {
          fetchTransactions();
        }
      } catch (err) {
        console.error("Greška pri dodavanju transakcije", err);
      }
    },
    [fetchTransactions],
  );

  const deleteTransaction = useCallback(
    async (id) => {
      try {
        const res = await fetch(`/api/transactions/${id}`, {
          method: "DELETE",
          credentials: "include",
        });

        if (res.ok) {
          fetchTransactions();
        }
      } catch (err) {
        console.error("Greška pri brisanju transakcije", err);
      }
    },
    [fetchTransactions],
  );

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    transactions.forEach((t) => {
      if (t.type === "income") income += t.amount;
      else expense += t.amount;
    });
    return { income, expense, saved: income - expense };
  }, [transactions]);

  const categories = useMemo(() => {
    const set = new Set(transactions.map((t) => t.category));
    return Array.from(set).sort();
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    const s = filters.search.trim().toLowerCase();

    let filtered = transactions.filter((t) => {
      if (s && !(t.description || "").toLowerCase().includes(s)) return false;
      if (filters.category !== ALL && t.category !== filters.category)
        return false;
      if (filters.type !== ALL && t.type !== filters.type) return false;
      if (filters.from && t.date < filters.from) return false;
      if (filters.to && t.date > filters.to) return false;

      const min = filters.minAmount ? Number(filters.minAmount) : null;
      const max = filters.maxAmount ? Number(filters.maxAmount) : null;
      if (min !== null && t.amount < min) return false;
      if (max !== null && t.amount > max) return false;

      return true;
    });

    return filtered.sort((a, b) => {
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

  if (loading) return <div className="container">Učitavanje...</div>;

  return (
    <div className="container">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <h2>Transakcije</h2>
          <p className="muted" style={{ marginTop: 6 }}>
            Korisnik: <b>{user?.username ?? user?.email ?? "—"}</b> (
            {user?.email ?? "—"})
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
