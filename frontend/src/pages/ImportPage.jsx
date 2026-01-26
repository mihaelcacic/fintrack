import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";
import * as api from "../services/api";

export default function ImportPage() {
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handleDownloadTemplate = () => {
    try {
      // Naslovi kolona
      const headers = [
        "transaction_date",
        "amount",
        "description",
        "category_name",
        "category_type",
      ];

      // Primjer redaka
      const exampleRows = [
        ["2026-01-26", "50.00", "Konzum - namirnice", "Hrana", "EXPENSE"],
        ["2026-01-25", "100.00", "Plaća", "Plaća", "INCOME"],
        ["2026-01-24", "15.50", "Kino", "Zabava", "EXPENSE"],
      ];

      // Kreiraj worksheet sa naslovnim redom i primjerima
      const data = [headers, ...exampleRows];
      const ws = XLSX.utils.aoa_to_sheet(data);

      // Postavi širinu kolona
      ws["!cols"] = [
        { wch: 15 }, // transaction_date
        { wch: 12 }, // amount
        { wch: 25 }, // description
        { wch: 20 }, // category_name
        { wch: 12 }, // category_type
      ];

      // Kreiraj workbook i dodaj sheet
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Transactions");

      // Preuzmi XLSX datoteku
      XLSX.writeFile(wb, "transaction-template.xlsx");
    } catch (err) {
      setError("Greška pri kreiranju template-a");
      console.error(err);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      let fileToUpload = file;

      // Ako je XLSX datoteka, konvertuj je u CSV
      if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: "array" });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];

          // Konvertuj u CSV string
          const csvContent = XLSX.utils.sheet_to_csv(worksheet);

          // Kreiraj CSV datoteku
          fileToUpload = new File(
            [csvContent],
            file.name.replace(/\.(xlsx|xls)$/, ".csv"),
            { type: "text/csv" },
          );
        } catch (convertErr) {
          setError("Greška pri konverziji XLSX datoteke");
          console.error(convertErr);
          setLoading(false);
          return;
        }
      }

      const importResult = await api.transactions.import(fileToUpload);
      setResult(importResult);
    } catch (err) {
      setError(err.message || "Greška pri uvozu datoteke");
      console.error(err);
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="container">
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <div className="card">
          <h2>Uvoz transakcija (XLSX)</h2>
          <p className="muted">
            Preuzmi XLSX template, popuni ga s transakcijama i učitaj. Datoteka
            će se automatski konvertirati u CSV i učitati.
          </p>

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

          {result && (
            <div
              style={{
                padding: 12,
                background: "#44ff44",
                borderRadius: 4,
                marginBottom: 16,
              }}
            >
              <p style={{ color: "black", margin: 0, fontWeight: "bold" }}>
                ✓ Uvoz uspješan!
              </p>
              <p style={{ color: "black", margin: "8px 0 0 0", fontSize: 13 }}>
                Učitano: <b>{result.successCount}</b> transakcija
                {result.errorCount > 0 && ` | Greške: ${result.errorCount}`}
              </p>
              {result.errors && result.errors.length > 0 && (
                <div style={{ marginTop: 12, fontSize: 12, color: "#333" }}>
                  <b>Greške pri uvozu:</b>
                  <ul style={{ margin: "8px 0", paddingLeft: 20 }}>
                    {result.errors.slice(0, 5).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                    {result.errors.length > 5 && (
                      <li>... i {result.errors.length - 5} više grešaka</li>
                    )}
                  </ul>
                </div>
              )}
              <Link
                to="/transactions"
                style={{
                  display: "block",
                  marginTop: 12,
                  color: "black",
                  textDecoration: "underline",
                  fontWeight: "bold",
                }}
              >
                → Pogledaj transakcije
              </Link>
            </div>
          )}

          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <h3 style={{ marginTop: 0, marginBottom: 12 }}>
                Korak 1: Preuzmi template
              </h3>
              <button
                onClick={handleDownloadTemplate}
                className="btn-primary"
                style={{ width: "100%" }}
              >
                📥 Preuzmi XLSX template
              </button>
            </div>

            <div
              style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}
            >
              <h3 style={{ marginTop: 0, marginBottom: 12 }}>
                Korak 2: Učitaj datoteku
              </h3>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                disabled={loading}
                style={{ display: "none" }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="btn-primary"
                style={{ width: "100%" }}
              >
                {loading ? "Učitavam..." : "📤 Odaberi datoteku za uvoz"}
              </button>
              <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 12 }}>
                Podržani formati: XLSX, XLS, CSV
                <br />
                Maksimalna veličina: 10 MB
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
