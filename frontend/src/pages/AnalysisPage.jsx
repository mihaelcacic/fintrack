import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import * as api from "../services/api";

export default function AnalysisPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [rollingLoading, setRollingLoading] = useState(false);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [monthlyData, setMonthlyData] = useState({});
  const [dailyData, setDailyData] = useState({});
  const [rollingAverage, setRollingAverage] = useState(null);
  const [rollingSeries, setRollingSeries] = useState({});
  const [predictedDaily, setPredictedDaily] = useState(null);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);
  const [categoryNameToId, setCategoryNameToId] = useState({});

  // Filteri
  const [selectedMonths, setSelectedMonths] = useState(6);
  const [selectedDays, setSelectedDays] = useState(30);
  const [selectedWindow, setSelectedWindow] = useState(3);
  const [predictionDate, setPredictionDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [selectedPredictionCategory, setSelectedPredictionCategory] =
    useState(null);

  // Učitaj kategorije
  useEffect(() => {
    const loadCategories = async () => {
      if (!user?.id) return;
      try {
        const response = await api.transactions.getAll(0, 1000);
        const categoryMap = {};
        const uniqueCats = [];

        response.content.forEach((t) => {
          if (t.categoryName && !categoryMap[t.categoryName]) {
            categoryMap[t.categoryName] = t.categoryId;
            uniqueCats.push(t.categoryName);
          }
        });

        setCategories(uniqueCats.sort());
        setCategoryNameToId(categoryMap);
      } catch (err) {
        console.error("Greška pri učitavanju kategorija", err);
      }
    };
    loadCategories();
  }, [user?.id]);

  // Učitaj mjesečne podatke
  useEffect(() => {
    const loadMonthlyData = async () => {
      if (!user?.id) return;
      try {
        setMonthlyLoading(true);
        const monthly = await api.analysis.getMonthlySpending(selectedMonths);
        setMonthlyData(monthly || {});
      } catch (err) {
        console.error("Greška pri učitavanju mjesečnih podataka", err);
      } finally {
        setMonthlyLoading(false);
      }
    };
    loadMonthlyData();
  }, [user?.id, selectedMonths]);

  // Učitaj dnevne podatke
  useEffect(() => {
    const loadDailyData = async () => {
      if (!user?.id) return;
      try {
        setDailyLoading(true);
        const daily = await api.analysis.getDailySpending(selectedDays);
        setDailyData(daily || {});
      } catch (err) {
        console.error("Greška pri učitavanju dnevnih podataka", err);
      } finally {
        setDailyLoading(false);
      }
    };
    loadDailyData();
  }, [user?.id, selectedDays]);

  // Učitaj rolling podatke
  useEffect(() => {
    const loadRollingData = async () => {
      if (!user?.id) return;
      try {
        setRollingLoading(true);
        const [rolling, series] = await Promise.all([
          api.prediction.rollingAverage(selectedWindow),
          api.prediction.rollingSeries(selectedWindow),
        ]);
        setRollingAverage(rolling);
        setRollingSeries(series || {});
      } catch (err) {
        console.error("Greška pri učitavanju rolling podataka", err);
      } finally {
        setRollingLoading(false);
      }
    };
    loadRollingData();
  }, [user?.id, selectedWindow]);

  // Inicijalno učitavanje - postavi loading na false kada su svi podaci učitani
  useEffect(() => {
    if (!loading) return;

    const checkIfAllLoaded = () => {
      if (
        !monthlyLoading &&
        !dailyLoading &&
        !rollingLoading &&
        !predictionLoading
      ) {
        setLoading(false);
      }
    };

    const timer = setTimeout(checkIfAllLoaded, 100);
    return () => clearTimeout(timer);
  }, [
    monthlyLoading,
    dailyLoading,
    rollingLoading,
    predictionLoading,
    loading,
  ]);

  // Odvojeni useEffect za predviđanje
  useEffect(() => {
    const loadPrediction = async () => {
      if (
        !user?.id ||
        !categoryNameToId ||
        (Object.keys(categoryNameToId).length === 0 &&
          selectedPredictionCategory)
      ) {
        return;
      }

      try {
        setPredictionLoading(true);

        const predictRequest = selectedPredictionCategory
          ? api.prediction.predictByCategory(
              categoryNameToId[selectedPredictionCategory],
              predictionDate,
            )
          : api.prediction.predictDaily(predictionDate);

        const predictDaily = await predictRequest;
        setPredictedDaily(predictDaily);
      } catch (err) {
        console.error("Greška pri predviđanju", err);
      } finally {
        setPredictionLoading(false);
      }
    };

    loadPrediction();
  }, [user?.id, predictionDate, selectedPredictionCategory, categoryNameToId]);

  if (loading) return <div className="container">Učitavanje analize...</div>;

  // Helper funkcija za loading spinner
  const LoadingSpinner = () => (
    <div
      style={{
        padding: 12,
        textAlign: "center",
      }}
    >
      <p className="muted" style={{ marginBottom: 8, fontSize: 12 }}>
        Učitava...
      </p>
      <div
        style={{
          width: 20,
          height: 20,
          border: "2px solid rgba(124, 58, 237, 0.3)",
          borderTop: "2px solid #7c3aed",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          margin: "0 auto",
        }}
      />
    </div>
  );

  return (
    <div className="container">
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
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

      {/* Filtri - svaki sa svojim rezultatima */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* MJESEČNA ANALIZA */}
        <div className="card">
          <div
            style={{
              marginBottom: 16,
              paddingBottom: 16,
              borderBottom: "1px solid rgba(124, 58, 237, 0.2)",
            }}
          >
            <label
              style={{ display: "flex", flexDirection: "column", gap: 10 }}
            >
              <span style={{ fontWeight: 500 }}>📅 Mjesečna analiza</span>
              <select
                value={selectedMonths}
                onChange={(e) => setSelectedMonths(Number(e.target.value))}
                style={{
                  padding: 8,
                  borderRadius: 4,
                  border: "1px solid rgba(124, 58, 237, 0.3)",
                  background: "rgba(30, 30, 50, 0.6)",
                  color: "inherit",
                  cursor: "pointer",
                }}
              >
                <option value={3}>Zadnjih 3 mjeseca</option>
                <option value={6}>Zadnjih 6 mjeseci</option>
                <option value={12}>Zadnjih 12 mjeseci</option>
              </select>
            </label>
          </div>
          <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 14 }}>
            Rezultati
          </h3>
          {monthlyLoading ? (
            <LoadingSpinner />
          ) : Object.keys(monthlyData).length > 0 ? (
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
                  <span className="muted" style={{ fontSize: 13 }}>
                    {month}
                  </span>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>
                    {Number(amount).toFixed(2)} €
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">Nema dostupnih podataka</p>
          )}
        </div>

        {/* DNEVNA ANALIZA */}
        <div className="card">
          <div
            style={{
              marginBottom: 16,
              paddingBottom: 16,
              borderBottom: "1px solid rgba(124, 58, 237, 0.2)",
            }}
          >
            <label
              style={{ display: "flex", flexDirection: "column", gap: 10 }}
            >
              <span style={{ fontWeight: 500 }}>📆 Dnevna analiza</span>
              <select
                value={selectedDays}
                onChange={(e) => setSelectedDays(Number(e.target.value))}
                style={{
                  padding: 8,
                  borderRadius: 4,
                  border: "1px solid rgba(124, 58, 237, 0.3)",
                  background: "rgba(30, 30, 50, 0.6)",
                  color: "inherit",
                  cursor: "pointer",
                }}
              >
                <option value={7}>Zadnjih 7 dana</option>
                <option value={30}>Zadnjih 30 dana</option>
                <option value={90}>Zadnjih 90 dana</option>
              </select>
            </label>
          </div>
          <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 14 }}>
            Rezultati
          </h3>
          {dailyLoading ? (
            <LoadingSpinner />
          ) : dailyData && typeof dailyData === "object" ? (
            <div style={{ display: "grid", gap: 12 }}>
              {Object.entries(dailyData).map(([key, value]) => {
                const isBigNumber =
                  key === "average" ||
                  key === "total" ||
                  key === "maxDay" ||
                  key === "minDay";

                if (key === "series") return null;

                return (
                  <div key={key}>
                    <p
                      className="muted"
                      style={{ marginBottom: 4, fontSize: 12 }}
                    >
                      {key === "average"
                        ? "Prosječna dnevna"
                        : key === "total"
                          ? "Ukupna"
                          : key === "maxDay"
                            ? "Najveća potrošnja"
                            : key === "minDay"
                              ? "Najmanja potrošnja"
                              : key === "start"
                                ? "Od datuma"
                                : key === "end"
                                  ? "Do datuma"
                                  : key === "days"
                                    ? "Broj dana"
                                    : key}
                    </p>
                    {key === "days" ? (
                      <p style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
                        {Math.floor(Number(value))}
                      </p>
                    ) : isBigNumber ? (
                      <p style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
                        {Number(value).toFixed(2)} €
                      </p>
                    ) : (
                      <p style={{ fontSize: 13, color: "#a1a1aa", margin: 0 }}>
                        {String(value)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="muted">Nema dostupnih podataka</p>
          )}
        </div>

        {/* POKRETNI PROSJEK */}
        <div className="card">
          <div
            style={{
              marginBottom: 16,
              paddingBottom: 16,
              borderBottom: "1px solid rgba(124, 58, 237, 0.2)",
            }}
          >
            <label
              style={{ display: "flex", flexDirection: "column", gap: 10 }}
            >
              <span style={{ fontWeight: 500 }}>📊 Pokretni prosjek</span>
              <select
                value={selectedWindow}
                onChange={(e) => setSelectedWindow(Number(e.target.value))}
                style={{
                  padding: 8,
                  borderRadius: 4,
                  border: "1px solid rgba(124, 58, 237, 0.3)",
                  background: "rgba(30, 30, 50, 0.6)",
                  color: "inherit",
                  cursor: "pointer",
                }}
              >
                <option value={3}>3 mjeseca</option>
                <option value={6}>6 mjeseci</option>
                <option value={12}>12 mjeseci</option>
              </select>
            </label>
          </div>
          <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 14 }}>
            Rezultat
          </h3>
          {rollingLoading ? (
            <div
              style={{
                padding: 12,
                background: "rgba(124, 58, 237, 0.1)",
                borderRadius: 8,
                border: "1px solid rgba(124, 58, 237, 0.2)",
                textAlign: "center",
              }}
            >
              <LoadingSpinner />
            </div>
          ) : rollingAverage !== null ? (
            <div
              style={{
                padding: 12,
                background: "rgba(124, 58, 237, 0.1)",
                borderRadius: 8,
                border: "1px solid rgba(124, 58, 237, 0.2)",
                textAlign: "center",
              }}
            >
              <p className="muted" style={{ marginBottom: 8, fontSize: 12 }}>
                Prosječna mjesečna potrošnja
              </p>
              <p
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  color: "#a78bfa",
                  margin: 0,
                }}
              >
                {Number(rollingAverage).toFixed(2)} €
              </p>
            </div>
          ) : (
            <p className="muted">Nema dostupnih podataka</p>
          )}
        </div>

        {/* PREDVIĐANJE */}
        <div className="card">
          <div
            style={{
              marginBottom: 16,
              paddingBottom: 16,
              borderBottom: "1px solid rgba(124, 58, 237, 0.2)",
            }}
          >
            <label
              style={{ display: "flex", flexDirection: "column", gap: 10 }}
            >
              <span style={{ fontWeight: 500 }}>🔮 Datum za predviđanje</span>
              <input
                type="date"
                value={predictionDate}
                onChange={(e) => setPredictionDate(e.target.value)}
                style={{
                  padding: 8,
                  borderRadius: 4,
                  border: "1px solid rgba(124, 58, 237, 0.3)",
                  background: "rgba(30, 30, 50, 0.6)",
                  color: "inherit",
                  cursor: "pointer",
                }}
              />
            </label>

            <label
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginTop: 12,
              }}
            >
              <span style={{ fontWeight: 500 }}>
                📂 Kategorija (opcionalno)
              </span>
              <select
                value={selectedPredictionCategory || ""}
                onChange={(e) =>
                  setSelectedPredictionCategory(e.target.value || null)
                }
                style={{
                  padding: 8,
                  borderRadius: 4,
                  border: "1px solid rgba(124, 58, 237, 0.3)",
                  background: "rgba(30, 30, 50, 0.6)",
                  color: "inherit",
                  cursor: "pointer",
                }}
              >
                <option value="">Sve kategorije</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 14 }}>
            Rezultat
          </h3>
          {predictionLoading ? (
            <div
              style={{
                padding: 12,
                background: "rgba(124, 58, 237, 0.1)",
                borderRadius: 8,
                border: "1px solid rgba(124, 58, 237, 0.2)",
                textAlign: "center",
              }}
            >
              <p className="muted" style={{ marginBottom: 8, fontSize: 12 }}>
                Učitava predviđanje...
              </p>
              <div
                style={{
                  width: 20,
                  height: 20,
                  border: "2px solid rgba(124, 58, 237, 0.3)",
                  borderTop: "2px solid #7c3aed",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  margin: "0 auto",
                }}
              />
            </div>
          ) : predictedDaily !== null ? (
            <div
              style={{
                padding: 12,
                background: "rgba(124, 58, 237, 0.1)",
                borderRadius: 8,
                border: "1px solid rgba(124, 58, 237, 0.2)",
                textAlign: "center",
              }}
            >
              <p className="muted" style={{ marginBottom: 8, fontSize: 12 }}>
                Predviđena potrošnja
                {selectedPredictionCategory && (
                  <strong> - {selectedPredictionCategory}</strong>
                )}
              </p>
              <p
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  color: "#f59e0b",
                  margin: 0,
                }}
              >
                {Number(predictedDaily).toFixed(2)} €
              </p>
            </div>
          ) : (
            <p className="muted">Nema dostupnih podataka</p>
          )}
        </div>
      </div>

      {/* DNEVNI GRAF */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginTop: 0, marginBottom: 16 }}>
          📈 Dnevna potrošnja po danima
        </h3>
        {dailyLoading ? (
          <div
            style={{
              height: 300,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <LoadingSpinner />
          </div>
        ) : dailyData && typeof dailyData === "object" && dailyData.series ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={Object.entries(dailyData.series).map(([date, amount]) => ({
                date: new Date(date).toLocaleDateString("hr-HR", {
                  month: "short",
                  day: "numeric",
                }),
                amount: Number(amount),
              }))}
            >
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value) => `${Number(value).toFixed(2)} €`}
                contentStyle={{
                  background: "rgba(30, 30, 50, 0.98)",
                  border: "1px solid rgba(124, 58, 237, 0.6)",
                  borderRadius: 8,
                  padding: "8px 12px",
                }}
              />
              <Bar dataKey="amount" fill="#7c3aed" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="muted">Nema dostupnih podataka</p>
        )}
      </div>

      {/* POMIČNI MJESEČNI NIZ */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginTop: 0, marginBottom: 16 }}>
          📊 Pomični mjesečni niz
        </h3>
        {rollingLoading ? (
          <LoadingSpinner />
        ) : Object.keys(rollingSeries).length > 0 ? (
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
                  <div
                    style={{
                      width: 120,
                      height: 24,
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
                      minWidth: 70,
                      textAlign: "right",
                      fontSize: 13,
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
