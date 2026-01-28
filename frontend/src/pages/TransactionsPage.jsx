import { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import TransactionForm from "../features/transactions/TransactionForm";
import TransactionTable from "../features/transactions/TransactionTable";
import TransactionFilters, {
  ALL,
} from "../features/transactions/TransactionFilters";
import TransactionTableSkeleton from "../components/TransactionTableSkeleton";
import Skeleton from "../components/Skeleton";
import * as api from "../services/api";

export default function TransactionsPage() {
  const { user } = useAuth();
  const [paginatedTransactions, setPaginatedTransactions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [displayPage, setDisplayPage] = useState(0);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [monthlyBalance, setMonthlyBalance] = useState(null);
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
      if (initialLoading) setInitialLoading(false);
      return;
    }
    try {
      // Gradi filter objekat za backend
      const searchFilter = {
        description: filters.search || null,
        categoryName: filters.category !== ALL ? filters.category : null,
        categoryType: filters.type !== ALL ? filters.type.toUpperCase() : null,
        fromDate: filters.from || null,
        toDate: filters.to || null,
        minAmount: filters.minAmount ? Number(filters.minAmount) : null,
        maxAmount: filters.maxAmount ? Number(filters.maxAmount) : null,
        sortBy: filters.sort,
      };

      // Pozovi server-side search endpoint
      const data = await api.transactions.search(
        searchFilter,
        displayPage,
        pageSize,
      );

      const formatted = data.content.map((t) => ({
        id: t.id,
        type: t.categoryType === "INCOME" ? "income" : "expense",
        amount: +t.amount,
        category: t.categoryName || "Ostalo",
        categoryId: t.categoryId,
        date: t.transactionDate,
        description: t.description || "",
      }));

      setPaginatedTransactions(formatted);
      setTotalCount(data.totalElements || 0);
    } catch (err) {
      console.error("Greška pri učitavanju transakcija", err);
    } finally {
      setLoading(false);
      if (initialLoading) setInitialLoading(false);
    }
  }, [user?.id, displayPage, pageSize, filters]);

  useEffect(() => {
    // Debounce za search - bez postavljanja loading na true
    const timer = setTimeout(() => {
      fetchTransactions();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchTransactions]);

  useEffect(() => {
    const loadMonthlyBalance = async () => {
      if (!user?.id) return;
      try {
        const data = await api.transactions.getMonthlyBalance();
        setMonthlyBalance(data);
      } catch (err) {
        console.error("Greška pri učitavanju mjesečne uštede", err);
      }
    };
    loadMonthlyBalance();
  }, [user?.id]);

  const addTransaction = useCallback(
    async (tx) => {
      try {
        await api.transactions.create(
          tx.categoryId,
          tx.amount,
          tx.transactionDate,
          tx.description,
        );
        setDisplayPage(0);
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
        setDisplayPage(0);
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
    paginatedTransactions.forEach((t) => {
      if (t.type === "income") income += t.amount;
      else expense += t.amount;
    });
    return { income, expense, saved: income - expense };
  }, [paginatedTransactions]);

  const categories = useMemo(() => {
    const set = new Set(paginatedTransactions.map((t) => t.category));
    return Array.from(set).sort();
  }, [paginatedTransactions]);

  const totalPages = Math.ceil(totalCount / pageSize);

  if (initialLoading) {
    return (
      <div className="container">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <h2>Transakcije</h2>
          </div>
          <div className="card" style={{ padding: 12, minWidth: 260 }}>
            <div className="muted" style={{ fontSize: 13, marginBottom: 6 }}>
              Mjesečna ušteda
            </div>
            <Skeleton width="100%" height="24px" />
          </div>
        </div>

        <div style={{ height: 16 }} />

        <div className="card">
          <h3>Unos transakcije</h3>
          <Skeleton width="100%" height="200px" />
        </div>

        <div style={{ height: 16 }} />

        <div className="card">
          <h3>Popis transakcija</h3>
          <div style={{ marginTop: 16 }}>
            <TransactionTableSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <h2>Transakcije</h2>
        </div>

        <div className="card" style={{ padding: 12, minWidth: 260 }}>
          <div className="muted" style={{ fontSize: 13, marginBottom: 6 }}>
            Mjesečna ušteda
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {monthlyBalance !== null ? (
              <div>
                Ušteda ovog mjeseca:{" "}
                <b>
                  {(typeof monthlyBalance === "object"
                    ? monthlyBalance.balance || monthlyBalance.saved || 0
                    : monthlyBalance
                  ).toFixed(2)}{" "}
                  €
                </b>
              </div>
            ) : (
              <div className="muted">Učitavanje...</div>
            )}
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
            <b>{Math.max(1, totalPages)}</b> | Ukupno: <b>{totalCount}</b>
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
