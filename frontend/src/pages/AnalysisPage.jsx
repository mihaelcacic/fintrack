import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import * as api from "../services/api";

export default function AnalysisPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState({});
  const [dailyData, setDailyData] = useState({});
  const [rollingAverage, setRollingAverage] = useState(null);
  const [rollingSeries, setRollingSeries] = useState({});
  const [predictedDaily, setPredictedDaily] = useState(null);
  const [error, setError] = useState("");

  // Filteri
  const [selectedMonths, setSelectedMonths] = useState(6);
  const [selectedDays, setSelectedDays] = useState(30);
  const [selectedWindow, setSelectedWindow] = useState(3);
  const [predictionDate, setPredictionDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  // Učitaj sve podatke
  useEffect(() => {
    const loadAnalysisData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        // Dohvati sve podatke paralelno
        const [monthly, daily, rolling, series, predictDaily] =
          await Promise.all([
            api.analysis.getMonthlySpending(selectedMonths),
            api.analysis.getDailySpending(selectedDays),
            api.prediction.rollingAverage(selectedWindow),
            api.prediction.rollingSeries(selectedWindow),
            api.prediction.predictDaily(predictionDate),
          ]);

        setMonthlyData(monthly || {});
        setDailyData(daily || {});
        setRollingAverage(rolling);
        setRollingSeries(series || {});
        setPredictedDaily(predictDaily);
      } catch (err) {
        setError(err.message || "Greška pri učitavanju analize");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadAnalysisData();
  }, [user?.id, selectedMonths, selectedDays, selectedWindow, predictionDate]);

  if (loading) return <div className="container">Učitavanje analize...</div>;

  return (
    <div className="container">
      <h2>Analiza potrošnje</h2>
      <p className="muted">
        Vizualiziraj i analiziraj svoju potrošnju pomoću ML-a
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

      {/* Kontrole */}
      <div className="card" style={{ marginBottom: 24, padding: 16 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
          }}
        >
          <label>
            Mjesečna analiza (broj mjeseci)
            <select
              value={selectedMonths}
              onChange={(e) => setSelectedMonths(Number(e.target.value))}
              style={{ marginTop: 8 }}
            >
              <option value={3}>Zadnjih 3 mjeseca</option>
              <option value={6}>Zadnjih 6 mjeseci</option>
              <option value={12}>Zadnjih 12 mjeseci</option>
            </select>
          </label>

          <label>
            Dnevna analiza (broj dana)
            <select
              value={selectedDays}
              onChange={(e) => setSelectedDays(Number(e.target.value))}
              style={{ marginTop: 8 }}
            >
              <option value={7}>Zadnjih 7 dana</option>
              <option value={30}>Zadnjih 30 dana</option>
              <option value={90}>Zadnjih 90 dana</option>
            </select>
          </label>

          <label>
            Pokretni prosjek (prozor)
            <select
              value={selectedWindow}
              onChange={(e) => setSelectedWindow(Number(e.target.value))}
              style={{ marginTop: 8 }}
            >
              <option value={3}>3 mjeseca</option>
              <option value={6}>6 mjeseci</option>
              <option value={12}>12 mjeseci</option>
            </select>
          </label>

          <label>
            Datum za predviđanje
            <input
              type="date"
              value={predictionDate}
              onChange={(e) => setPredictionDate(e.target.value)}
              style={{ marginTop: 8 }}
            />
          </label>
        </div>
      </div>

      {/* Grid za podatke */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* Mjesečna potrošnja */}
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Mjesečna potrošnja</h3>
          {Object.keys(monthlyData).length > 0 ? (
            <div style={{ display: "grid", gap: 8 }}>
              {Object.entries(monthlyData).map(([month, amount]) => (
                <div
                  key={month}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: 8,
                    background: "rgba(255, 255, 255, 0.04)",
                    borderRadius: 4,
                  }}
                >
                  <span className="muted">{month}</span>
                  <span style={{ fontWeight: 600 }}>
                    {Number(amount).toFixed(2)} €
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">Nema dostupnih podataka</p>
          )}
        </div>

        {/* Dnevna potrošnja - aritmetička sredina */}
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Dnevna potrošnja</h3>
          {dailyData && typeof dailyData === "object" ? (
            <div style={{ display: "grid", gap: 12 }}>
              {Object.entries(dailyData).map(([key, value]) => (
                <div key={key}>
                  <p className="muted" style={{ marginBottom: 4 }}>
                    {key === "average"
                      ? "Prosječna dnevna potrošnja"
                      : key === "total"
                        ? "Ukupna potrošnja"
                        : key === "maxDay"
                          ? "Najveća potrošnja na dan"
                          : key === "minDay"
                            ? "Najmanja potrošnja na dan"
                            : key}
                  </p>
                  <p style={{ fontSize: 18, fontWeight: 600 }}>
                    {Number(value).toFixed(2)} €
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">Nema dostupnih podataka</p>
          )}
        </div>

        {/* Rolling Average */}
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Rolling Average</h3>
          {rollingAverage !== null ? (
            <div>
              <p className="muted">Prosječna mjesečna potrošnja:</p>
              <p style={{ fontSize: 20, fontWeight: 600, color: "#7c3aed" }}>
                {Number(rollingAverage).toFixed(2)} €
              </p>
            </div>
          ) : (
            <p className="muted">Nema dostupnih podataka</p>
          )}
        </div>
      </div>

      {/* Dnevna predikcija */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginTop: 0 }}>Predviđena potrošnja</h3>
        {predictedDaily !== null ? (
          <div>
            <p className="muted">
              Predviđena potrošnja za{" "}
              {new Date(predictionDate).toLocaleDateString("hr-HR")}:
            </p>
            <p style={{ fontSize: 20, fontWeight: 600, color: "#f59e0b" }}>
              {Number(predictedDaily).toFixed(2)} €
            </p>
          </div>
        ) : (
          <p className="muted">Nema dostupnih podataka</p>
        )}
      </div>

      {/* Rolling Series */}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Pomični mjesečni niz </h3>
        {Object.keys(rollingSeries).length > 0 ? (
          <div style={{ display: "grid", gap: 8 }}>
            {Object.entries(rollingSeries).map(([period, value]) => (
              <div
                key={period}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: 12,
                  background: "rgba(255, 255, 255, 0.04)",
                  borderRadius: 4,
                }}
              >
                <span className="muted">{period}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {/* Mini bar chart */}
                  <div
                    style={{
                      width: 150,
                      height: 30,
                      background: "rgba(124, 58, 237, 0.2)",
                      borderRadius: 4,
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.min(100, (Number(value) / 3000) * 100)}%`,
                        background: "linear-gradient(90deg, #7c3aed, #6d28d9)",
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontWeight: 600,
                      minWidth: 80,
                      textAlign: "right",
                    }}
                  >
                    {Number(value).toFixed(2)} €
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">Nema dostupnih podataka</p>
        )}
      </div>

      <div
        style={{
          marginTop: 32,
          padding: 16,
          background: "rgba(255, 255, 255, 0.04)",
          borderRadius: 8,
        }}
      >
        <p className="muted" style={{ fontSize: 12 }}>
          💡 Ova analiza koristi Machine Learning modele za predviđanje i
          analizu tvoje potrošnje. Što više podataka imamo, to su predviđanja
          preciznija.
        </p>
      </div>
    </div>
  );
}
