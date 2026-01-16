function formatDateHR(isoDate) {
  const d = new Date(isoDate);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}.`;
}

function formatAmount(amount) {
  return amount.toFixed(2);
}

function typeLabel(type) {
  return type === "income" ? "Prihod" : "Trošak";
}

export default function TransactionTable({ transactions, onDelete }) {
  if (transactions.length === 0) {
    return <p>Nema unesenih transakcija.</p>;
  }

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
      <thead>
        <tr>
          <th style={th}>Datum</th>
          <th style={th}>Tip</th>
          <th style={th}>Kategorija</th>
          <th style={th}>Opis</th>
          <th style={{ ...th, textAlign: "right" }}>Iznos (€)</th>
          <th style={th}>Akcije</th>
        </tr>
      </thead>
      <tbody>
        {transactions.map((t) => (
          <tr key={t.id}>
            <td style={td}>{formatDateHR(t.date)}</td>
            <td style={td}>
              <span
                className={`badge ${
                  t.type === "income" ? "badge-income" : "badge-expense"
                }`}
              >
                {t.type === "income" ? "Prihod" : "Trošak"}
              </span>
            </td>
            <td style={td}>{t.category}</td>
            <td style={td}>{t.description || "-"}</td>
            <td
              style={{
                ...td,
                textAlign: "right",
                color:
                  t.type === "income"
                    ? "rgba(34,197,94,0.95)"
                    : "rgba(239,68,68,0.95)",
                fontWeight: 700,
              }}
            >
              {formatAmount(t.amount)}
            </td>
            <td style={td}>
              <button className="btn-danger" onClick={() => onDelete(t.id)}>
                Obriši
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const th = {
  borderBottom: "1px solid #444",
  padding: "8px",
  textAlign: "left",
};

const td = {
  borderBottom: "1px solid #333",
  padding: "8px",
};
