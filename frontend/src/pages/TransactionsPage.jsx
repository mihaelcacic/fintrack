import { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import TransactionForm from "../features/transactions/TransactionForm";
import TransactionTable from "../features/transactions/TransactionTable";
import TransactionFilters, {
  ALL,
} from "../features/transactions/TransactionFilters";
import * as api from "../services/api";

export default function TransactionsPage() {
  const { user } = useAuth();
  const [allTransactions, setAllTransactions] = useState([]);
  const [displayPage, setDisplayPage] = useState(0);
  const [pageSize] = useState(10);
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
      // Dohvati sve transakcije sa velikim page size
      const data = await api.transactions.getAll(0, 1000);
      const formatted = data.content.map((t) => ({
        id: t.id,
        type: t.categoryType === "INCOME" ? "income" : "expense",
        amount: +t.amount,
        category: t.categoryName || "Ostalo",
        categoryId: t.categoryId,
        date: t.transactionDate,
        description: t.description || "",
      }));
      setAllTransactions(formatted);
      setDisplayPage(0);
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
        await api.transactions.create(
          tx.categoryId,
          tx.amount,
          tx.transactionDate,
          tx.description,
        );
        fetchTransactions();
      } catch (err) {
        console.error("Greška pri dodavanju transakcije", err);
      }
    },
    [fetchTransactions],
  );

  const deleteTransaction = useCallback(
    async (id) => {
      try {
        await api.transactions.delete(id);
        fetchTransactions();
      } catch (err) {
        console.error("Greška pri brisanju transakcije", err);
      }
    },
    [fetchTransactions],
  );

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    allTransactions.forEach((t) => {
      if (t.type === "income") income += t.amount;
      else expense += t.amount;
    });
    return { income, expense, saved: income - expense };
  }, [allTransactions]);

  const categories = useMemo(() => {
    const set = new Set(allTransactions.map((t) => t.category));
    return Array.from(set).sort();
  }, [allTransactions]);

  const filteredTransactions = useMemo(() => {
    const s = filters.search.trim().toLowerCase();

    let filtered = allTransactions.filter((t) => {
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
  }, [allTransactions, filters]);

  // Paginacija - prikaži samo transakcije za trenutnu stranicu
  const paginatedTransactions = useMemo(() => {
    const start = displayPage * pageSize;
    const end = start + pageSize;
    return filteredTransactions.slice(start, end);
  }, [filteredTransactions, displayPage, pageSize]);

  const totalPages = Math.ceil(filteredTransactions.length / pageSize);

  if (loading) return <div className="container">Učitavanje...</div>;

  return (
    <div className="container">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <h2>Transakcije</h2>
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

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 16,
            marginBottom: 16,
          }}
        >
          <div className="muted" style={{ fontSize: 13 }}>
            Stranica: <b>{displayPage + 1}</b> od{" "}
            <b>{Math.max(1, totalPages)}</b> | Ukupno:{" "}
            <b>{filteredTransactions.length}</b>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn-secondary"
              onClick={() => setDisplayPage(Math.max(0, displayPage - 1))}
              disabled={displayPage === 0}
            >
              ← Prethodna
            </button>
            <button
              className="btn-secondary"
              onClick={() => setDisplayPage(displayPage + 1)}
              disabled={displayPage >= totalPages - 1}
            >
              Sljedeća →
            </button>
          </div>
        </div>

        <TransactionTable
          transactions={paginatedTransactions}
          onDelete={deleteTransaction}
        />
      </div>
    </div>
  );
}
