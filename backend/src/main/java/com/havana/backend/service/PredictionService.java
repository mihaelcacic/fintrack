// java
package com.havana.backend.service;

import com.havana.backend.model.Transaction;
import com.havana.backend.model.User;
import com.havana.backend.repository.TransactionRepository;
import com.havana.backend.repository.UserRepository;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.apache.commons.math3.stat.regression.OLSMultipleLinearRegression;
import org.apache.commons.math3.linear.SingularMatrixException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PredictionService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    private static final int DAY_DUMMY_COUNT = 6; // days 1..6 as dummies, day 7 reference
    private static final int MONTH_DUMMY_COUNT = 11; // months 1..11 as dummies, month 12 reference

    public double predict(Integer userId, LocalDate futureDate, Integer futureCategoryId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Transaction> rawTransactions = transactionRepository.findByUser(user);
        if (rawTransactions == null || rawTransactions.isEmpty()) return 0.0;

        // filter out rows missing required fields
        List<Transaction> transactions = rawTransactions.stream()
                .filter(t -> t.getTransactionDate() != null && t.getAmount() != null)
                .collect(Collectors.toList());
        if (transactions.isEmpty()) return 0.0;

        // build category -> column index map (one-hot)
        // Choose a reference category (most frequent) and exclude it from dummies
        LinkedHashMap<Integer, Integer> catIndex = new LinkedHashMap<>();
        Integer referenceCategory = null;
        // count category frequencies (including global categories where user is null)
        Map<Integer, Long> freq = transactions.stream()
                .map(t -> (t.getCategory() != null) ? t.getCategory().getId() : null)
                .filter(Objects::nonNull)
                .collect(Collectors.groupingBy(id -> id, Collectors.counting()));
        if (!freq.isEmpty()) {
            referenceCategory = Collections.max(freq.entrySet(), Map.Entry.comparingByValue()).getKey();
        }

        // now assign indices to all categories except the reference
        for (Transaction t : transactions) {
            if (t.getCategory() != null && t.getCategory().getId() != null) {
                Integer cid = t.getCategory().getId();
                if (referenceCategory != null && referenceCategory.equals(cid)) continue; // drop reference
                catIndex.putIfAbsent(cid, catIndex.size());
            }
        }
        int numCategoryFeatures = catIndex.size();

        final int NUM_FEATURES = DAY_DUMMY_COUNT + MONTH_DUMMY_COUNT + numCategoryFeatures;

        // Need more rows than features to estimate without immediate singularities
        if (transactions.size() <= NUM_FEATURES) {
            return fallbackAverage(transactions, futureCategoryId);
        }

        double[][] X = new double[transactions.size()][NUM_FEATURES];
        double[] Y = new double[transactions.size()];

        for (int i = 0; i < transactions.size(); i++) {
            Transaction t = transactions.get(i);

            int dow = t.getTransactionDate().getDayOfWeek().getValue(); // 1..7
            for (int d = 1; d <= DAY_DUMMY_COUNT; d++) {
                X[i][d - 1] = (dow == d) ? 1.0 : 0.0;
            }

            int month = t.getTransactionDate().getMonthValue(); // 1..12
            for (int m = 1; m <= MONTH_DUMMY_COUNT; m++) {
                X[i][DAY_DUMMY_COUNT + (m - 1)] = (month == m) ? 1.0 : 0.0;
            }

            int base = DAY_DUMMY_COUNT + MONTH_DUMMY_COUNT;
            if (t.getCategory() != null && t.getCategory().getId() != null) {
                Integer cid = t.getCategory().getId();
                // skip reference category (it is represented by all-zero category vector)
                Integer idx = catIndex.get(cid);
                if (idx != null) X[i][base + idx] = 1.0;
            }

            Y[i] = t.getAmount().doubleValue();
        }

        OLSMultipleLinearRegression regression = new OLSMultipleLinearRegression();
        try {
            regression.newSampleData(Y, X);
            double[] beta = regression.estimateRegressionParameters(); // beta[0]=intercept, beta[1..] for columns

            double[] newFeatures = new double[NUM_FEATURES];
            int futureDow = futureDate.getDayOfWeek().getValue();
            for (int d = 1; d <= DAY_DUMMY_COUNT; d++) newFeatures[d - 1] = (futureDow == d) ? 1.0 : 0.0;

            int futureMonth = futureDate.getMonthValue();
            for (int m = 1; m <= MONTH_DUMMY_COUNT; m++) {
                newFeatures[DAY_DUMMY_COUNT + (m - 1)] = (futureMonth == m) ? 1.0 : 0.0;
            }

            int base = DAY_DUMMY_COUNT + MONTH_DUMMY_COUNT;
            // If future category is the reference or unseen, leave category features all zero (reference)
            if (futureCategoryId != null && !Objects.equals(futureCategoryId, referenceCategory) && catIndex.containsKey(futureCategoryId)) {
                int idx = catIndex.get(futureCategoryId);
                newFeatures[base + idx] = 1.0;
            }

            double predicted = (beta.length > 0) ? beta[0] : 0.0;
            int maxCoeffs = Math.max(0, Math.min(beta.length - 1, newFeatures.length));
            for (int i = 0; i < maxCoeffs; i++) {
                predicted += beta[i + 1] * newFeatures[i];
            }

            return Math.max(predicted, 0.0);

        } catch (SingularMatrixException sme) {
            System.out.println("Singular matrix while fitting regression, falling back to averages: " + sme.getMessage());
            return fallbackAverage(transactions, futureCategoryId);
        } catch (RuntimeException ex) {
            System.out.println("Error in prediction service: " + ex.getMessage());
            return fallbackAverage(transactions, futureCategoryId);
        }
    }

    private double fallbackAverage(List<Transaction> transactions, Integer categoryId) {
        double sum = 0;
        int count = 0;
        if (categoryId != null) {
            for (Transaction t : transactions) {
                if (t.getCategory() != null && t.getCategory().getId() != null
                        && t.getCategory().getId().equals(categoryId)) {
                    sum += t.getAmount().doubleValue();
                    count++;
                }
            }
        }
        if (count == 0) {
            for (Transaction t : transactions) {
                if (t.getAmount() != null) {
                    sum += t.getAmount().doubleValue();
                    count++;
                }
            }
        }
        if (count == 0) return 0.0;
        return Math.max(sum / count, 0.0);
    }

    /**
     * Predict daily spending using linear regression on day-of-week dummies.
     * Uses one-hot encoding with Sunday (7) as reference. Falls back to averages on error or too few rows.
     */
    public double predictDailySpending(Integer userId, LocalDate futureDate) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Preporuka: Ovdje bi idealno trebalo filtrirati npr. zadnjih godinu dana
        List<Transaction> transactions = transactionRepository.findByUser(user);
        if (transactions.isEmpty()) return 0.0;

        // 1. Grupiranje po točnom datumu (npr. 2023-10-01 -> 50.0 EUR)
        Map<LocalDate, Double> dailySums = transactions.stream()
                .filter(t -> t.getTransactionDate() != null && t.getAmount() != null)
                .collect(Collectors.groupingBy(
                        Transaction::getTransactionDate,
                        Collectors.summingDouble(t -> t.getAmount().doubleValue())
                ));

        List<LocalDate> dates = new ArrayList<>(dailySums.keySet());

        // Ako imamo premalo dana s podacima, vraćamo običan prosjek
        if (dates.size() <= DAY_DUMMY_COUNT + 1) {
            return dailySums.values().stream().mapToDouble(d->d).average().orElse(0.0);
        }

        double[][] X = new double[dates.size()][DAY_DUMMY_COUNT];
        double[] Y = new double[dates.size()];

        for (int i = 0; i < dates.size(); i++) {
            LocalDate date = dates.get(i);
            int dow = date.getDayOfWeek().getValue(); // 1 (Mon) .. 7 (Sun)

            // One-hot encoding (bez nedjelje kao reference)
            for (int d = 1; d <= DAY_DUMMY_COUNT; d++) {
                X[i][d - 1] = (dow == d) ? 1.0 : 0.0;
            }
            Y[i] = dailySums.get(date);
        }

        OLSMultipleLinearRegression regression = new OLSMultipleLinearRegression();
        try {
            regression.newSampleData(Y, X);
            double[] beta = regression.estimateRegressionParameters();

            double predicted = beta[0]; // intercept
            int futureDow = futureDate.getDayOfWeek().getValue();

            // Dodaj koeficijent za odgovarajući dan
            if (futureDow <= DAY_DUMMY_COUNT) {
                predicted += beta[futureDow];
            }

            return Math.max(predicted, 0.0);
        } catch (Exception ex) {
            // Fallback na prosjek
            return dailySums.values().stream().mapToDouble(d->d).average().orElse(0.0);
        }
    }

    private double predictDailyFromTransactions(List<Transaction> transactions, LocalDate futureDate) {
        if (transactions == null || transactions.isEmpty()) return 0.0;

        int targetDow = futureDate.getDayOfWeek().getValue();
        double sum = 0.0;
        int count = 0;
        for (Transaction t : transactions) {
            if (t.getTransactionDate() != null &&
                    t.getTransactionDate().getDayOfWeek().getValue() == targetDow) {
                sum += t.getAmount().doubleValue();
                count++;
            }
        }

        if (count > 0) {
            return Math.max(sum / count, 0.0);
        }

        double total = 0.0;
        for (Transaction t : transactions) total += t.getAmount().doubleValue();
        return Math.max(total / transactions.size(), 0.0);
    }

    public double rollingMonthlyAverage(Integer userId, int months) {

        if (months <= 0) return 0.0;

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        LocalDate fromDate = LocalDate.now().minusMonths(months);

        List<Transaction> transactions =
                transactionRepository.findByUserAndTransactionDateAfter(user, fromDate);

        if (transactions.isEmpty()) return 0.0;

        double sum = 0.0;
        for (Transaction t : transactions) {
            if (t.getAmount() != null) sum += t.getAmount().doubleValue();
        }

        // monthly average over the requested window
        return Math.max(sum / months, 0.0);
    }


    public Map<String, Double> rollingMonthlySeries(Integer userId, int window) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Transaction> transactions = transactionRepository.findByUser(user);
        if (transactions.isEmpty()) return new HashMap<>();

        // 1. Agregacija po mjesecima
        Map<YearMonth, Double> actualData = new TreeMap<>();
        YearMonth minDate = YearMonth.now();
        YearMonth maxDate = YearMonth.now();

        for (Transaction t : transactions) {
            if (t.getTransactionDate() != null && t.getAmount() != null) {
                YearMonth ym = YearMonth.from(t.getTransactionDate());
                actualData.merge(ym, t.getAmount().doubleValue(), Double::sum);
                if (ym.isBefore(minDate)) minDate = ym;
            }
        }

        // 2. Popunjavanje rupa s 0.0
        List<Double> continuousValues = new ArrayList<>();
        List<String> labels = new ArrayList<>();

        YearMonth current = minDate;
        while (!current.isAfter(maxDate)) {
            continuousValues.add(actualData.getOrDefault(current, 0.0));
            labels.add(current.toString());
            current = current.plusMonths(1);
        }

        // 3. Računanje prosjeka
        Map<String, Double> rolling = new LinkedHashMap<>();
        for (int i = 0; i < continuousValues.size(); i++) {
            int start = Math.max(0, i - window + 1);
            double sum = 0;
            int count = 0;
            for (int j = start; j <= i; j++) {
                sum += continuousValues.get(j);
                count++;
            }
            rolling.put(labels.get(i), (count > 0) ? sum / count : 0.0);
        }

        return rolling;
    }

    public PredictionAnalysisDTO analyzeDailySpending(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Transaction> transactions = transactionRepository.findByUser(user);
        if (transactions.isEmpty()) return null;

        // 1. Agregacija po danima (kao što smo prije dogovorili)
        Map<LocalDate, Double> dailySums = transactions.stream()
                .filter(t -> t.getTransactionDate() != null && t.getAmount() != null)
                .collect(Collectors.groupingBy(
                        Transaction::getTransactionDate,
                        Collectors.summingDouble(t -> t.getAmount().doubleValue())
                ));

        List<LocalDate> dates = new ArrayList<>(dailySums.keySet());
        Collections.sort(dates); // Bitno da su kronološki poredani za graf

        if (dates.size() <= DAY_DUMMY_COUNT + 1) {
            // Premalo podataka za analizu
            return new PredictionAnalysisDTO(0, 0, 0, new HashMap<>(), new ArrayList<>());
        }

        // 2. Priprema podataka za regresiju
        double[][] X = new double[dates.size()][DAY_DUMMY_COUNT];
        double[] Y = new double[dates.size()];

        for (int i = 0; i < dates.size(); i++) {
            LocalDate date = dates.get(i);
            int dow = date.getDayOfWeek().getValue();
            for (int d = 1; d <= DAY_DUMMY_COUNT; d++) {
                X[i][d - 1] = (dow == d) ? 1.0 : 0.0;
            }
            Y[i] = dailySums.get(date);
        }

        // 3. Izračun modela
        OLSMultipleLinearRegression regression = new OLSMultipleLinearRegression();
        regression.newSampleData(Y, X);

        double[] beta;
        double rSquared = 0.0;

        try {
            beta = regression.estimateRegressionParameters();
            rSquared = regression.calculateRSquared();
        } catch (Exception e) {
            return null; // Ili handleati grešku
        }

        // 4. Rekonstrukcija i izračun greške (Backtesting)
        List<DailyAnalysisPoint> series = new ArrayList<>();
        double totalAbsoluteError = 0.0;

        for (int i = 0; i < dates.size(); i++) {
            LocalDate date = dates.get(i);
            double actual = Y[i];

            // Ručni izračun predviđanja pomoću dobivenih beta koeficijenata
            double predicted = beta[0]; // Intercept (baza)
            int dow = date.getDayOfWeek().getValue();
            if (dow <= DAY_DUMMY_COUNT) {
                predicted += beta[dow];
            }
            // Neka predviđanje ne bude negativno
            predicted = Math.max(0.0, predicted);

            double error = Math.abs(actual - predicted);
            totalAbsoluteError += error;

            series.add(new DailyAnalysisPoint(date, actual, predicted, actual - predicted));
        }

        double mae = totalAbsoluteError / dates.size();

        // 5. Mapiranje faktora za Frontend (Što utječe na potrošnju?)
        Map<String, Double> dailyFactors = new LinkedHashMap<>();
        // Beta[0] je konstanta, Beta[1] je Ponedjeljak (ako je nedjelja referenca), itd.
        // Pazi: Tvoja logika koristi 1..6 kao dummy, 7 kao referencu.
        // Dakle beta[1] = Pon, beta[2] = Uto...

        String[] days = {"Intercept", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"};

        // Spremi utjecaj svakog dana
        for (int d = 1; d <= DAY_DUMMY_COUNT; d++) {
            if (d < beta.length) {
                dailyFactors.put(days[d], beta[d]);
            }
        }
        // Nedjelja je referenca, njen utjecaj je "0" u odnosu na intercept, ali možeš to prikazati drugačije na UI

        return new PredictionAnalysisDTO(
                rSquared,
                mae,
                beta[0],
                dailyFactors,
                series
        );
    }

    // DTO koji vraćaš kontroleru
    public record PredictionAnalysisDTO( double rSquared,       // Npr. 0.75 (75% točnosti)
            double meanAbsoluteError, // Npr. 5.50 (greška u eurima)
            double baseSpending,    // Intercept (bazna potrošnja)
            Map<String, Double> dailyFactors, // Npr. "FRIDAY" -> 15.0
            List<DailyAnalysisPoint> series){}  // Podaci za graf

    public record DailyAnalysisPoint (LocalDate date,
            double actualAmount,
            double predictedAmount,
            double error){} // Razlika

}