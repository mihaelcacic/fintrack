package com.havana.backend.service;

import com.havana.backend.model.Transaction;
import com.havana.backend.model.User;
import com.havana.backend.repository.TransactionRepository;
import com.havana.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AnalysisService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    /**
     * Returns month -> total spending for the last `months` months (inclusive of current month).
     * If categoryId is provided, filters to that category (works for global categories as well).
     */
    public Map<String, Double> monthlySpending(Integer userId, int months, Integer categoryId) {
        if (months <= 0) return Collections.emptyMap();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        YearMonth end = YearMonth.now();
        YearMonth start = end.minusMonths(Math.max(0, months - 1));

        LocalDate startDate = start.atDay(1);
        LocalDate endDate = end.atEndOfMonth();

        List<Transaction> list = transactionRepository.findByUserAndTransactionDateBetween(user, startDate, endDate);
        // Aggregate per YearMonth
        Map<YearMonth, Double> agg = new HashMap<>();
        for (Transaction t : list) {
            if (t.getTransactionDate() == null || t.getAmount() == null) continue;
            if (categoryId != null) {
                if (t.getCategory() == null || t.getCategory().getId() == null) continue;
                if (!categoryId.equals(t.getCategory().getId())) continue;
            }
            YearMonth ym = YearMonth.from(t.getTransactionDate());
            agg.merge(ym, t.getAmount().doubleValue(), Double::sum);
        }

        // Build ordered map from start..end
        Map<String, Double> result = new LinkedHashMap<>();
        YearMonth cur = start;
        while (!cur.isAfter(end)) {
            result.put(cur.toString(), agg.getOrDefault(cur, 0.0));
            cur = cur.plusMonths(1);
        }

        return result;
    }

    /**
     * Returns a map with keys: "series" -> Map<date, amount> for each of the last `days` days (inclusive)
     * and "total" -> total sum across the window. Optional category filter.
     */
    public Map<String, Object> dailySpending(Integer userId, int days, Integer categoryId) {
        if (days <= 0) return Collections.emptyMap();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(Math.max(0, days - 1));

        List<Transaction> list = transactionRepository.findByUserAndTransactionDateBetween(user, start, end);

        Map<LocalDate, Double> agg = new HashMap<>();
        for (Transaction t : list) {
            if (t.getTransactionDate() == null || t.getAmount() == null) continue;
            if (categoryId != null) {
                if (t.getCategory() == null || t.getCategory().getId() == null) continue;
                if (!categoryId.equals(t.getCategory().getId())) continue;
            }
            agg.merge(t.getTransactionDate(), t.getAmount().doubleValue(), Double::sum);
        }

        Map<String, Double> series = new LinkedHashMap<>();
        double total = 0.0;
        LocalDate cur = start;
        while (!cur.isAfter(end)) {
            double v = agg.getOrDefault(cur, 0.0);
            series.put(cur.toString(), v);
            total += v;
            cur = cur.plusDays(1);
        }

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("series", series);
        resp.put("total", total);
        resp.put("days", days);
        resp.put("start", start.toString());
        resp.put("end", end.toString());
        return resp;
    }
}
