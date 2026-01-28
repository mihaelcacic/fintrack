const ALL = "SVE";

export default function TransactionFilters({ filters, onChange, categories }) {
  return (
    <div className="filter-bar">
      <div className="row filters-row" style={{ alignItems: "end", gap: 12 }}>
        <div style={{ flex: "1 1 240px" }}>
          <label>
            Pretraži po opisu
            <input
              value={filters.search}
              onChange={(e) => onChange({ ...filters, search: e.target.value })}
              placeholder="npr. Konzum, gorivo..."
            />
          </label>
        </div>

        <div style={{ flex: "1 1 200px" }}>
          <label>
            Kategorija
            <select
              value={filters.category}
              onChange={(e) =>
                onChange({ ...filters, category: e.target.value })
              }
            >
              <option value={ALL}>Sve kategorije</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div style={{ flex: "1 1 170px" }}>
          <label>
            Tip
            <select
              value={filters.type}
              onChange={(e) => onChange({ ...filters, type: e.target.value })}
            >
              <option value={ALL}>Svi tipovi</option>
              <option value="income">Prihod</option>
              <option value="expense">Trošak</option>
            </select>
          </label>
        </div>
        <div style={{ flex: "1 1 160px" }}>
          <label>
            Iznos od (€)
            <input
              type="number"
              step="0.01"
              min="0"
              value={filters.minAmount}
              onChange={(e) =>
                onChange({ ...filters, minAmount: e.target.value })
              }
              placeholder="npr. 10"
            />
          </label>
        </div>

        <div style={{ flex: "1 1 160px" }}>
          <label>
            Iznos do (€)
            <input
              type="number"
              step="0.01"
              min="0"
              value={filters.maxAmount}
              onChange={(e) =>
                onChange({ ...filters, maxAmount: e.target.value })
              }
              placeholder="npr. 200"
            />
          </label>
        </div>

        <div className="date-range">
          <label>Raspon datuma</label>
          <div className="date-range-inner">
            <input
              type="date"
              value={filters.from}
              onChange={(e) => {
                const fromDate = e.target.value;
                // Ako je from datum後 nakon to datuma, pobrij to datum
                if (filters.to && fromDate > filters.to) {
                  onChange({ ...filters, from: fromDate, to: "" });
                } else {
                  onChange({ ...filters, from: fromDate });
                }
              }}
              aria-label="Datum od"
            />
            <div className="date-sep">—</div>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => {
                const toDate = e.target.value;
                // Ako je to datum prije od from datuma, zabrani promjenu
                if (filters.from && toDate < filters.from) {
                  return;
                }
                onChange({ ...filters, to: toDate });
              }}
              min={filters.from}
              aria-label="Datum do"
            />
          </div>
        </div>
        <div style={{ flex: "1 1 220px" }}>
          <label>
            Sortiraj po
            <select
              value={filters.sort}
              onChange={(e) => onChange({ ...filters, sort: e.target.value })}
            >
              <option value="date_desc">Datum (najnovije)</option>
              <option value="date_asc">Datum (najstarije)</option>
              <option value="amount_desc">Iznos (veći prvo)</option>
              <option value="amount_asc">Iznos (manji prvo)</option>
            </select>
          </label>
        </div>
        <div style={{ flex: "0 0 auto" }}>
          <button
            className="btn-secondary"
            onClick={() =>
              onChange({
                search: "",
                category: ALL,
                type: ALL,
                from: "",
                to: "",
                minAmount: "",
                maxAmount: "",
              })
            }
          >
            Očisti
          </button>
        </div>
      </div>
    </div>
  );
}

export { ALL };
