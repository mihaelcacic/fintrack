package com.havana.backend.service;

import com.havana.backend.model.Transaction;
import com.havana.backend.model.User;
import com.havana.backend.repository.TransactionRepository;
import com.havana.backend.repository.SavingGoalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final SavingGoalRepository savingGoalRepository;

    public List<Map<String, Object>> getSpendingByCategory(User user) {
        List<Transaction> transactions = transactionRepository.findByUser(user);
        
        Map<String, BigDecimal> categorySpending = new HashMap<>();
        for (Transaction t : transactions) {
            String categoryName = t.getCategory() != null ? t.getCategory().getName() : "Ostalo";
            categorySpending.put(categoryName, categorySpending.getOrDefault(categoryName, BigDecimal.ZERO).add(t.getAmount()));
        }
        
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map.Entry<String, BigDecimal> entry : categorySpending.entrySet()) {
            Map<String, Object> item = new HashMap<>();
            item.put("name", entry.getKey());
            item.put("value", entry.getValue());
            result.add(item);
        }
        return result;
    }

    public Map<String, Object> getWeeklyGoal(User user) {
        LocalDate now = LocalDate.now();
        LocalDate weekStart = now.minus(now.getDayOfWeek().getValue() - 1, ChronoUnit.DAYS);
        LocalDate weekEnd = weekStart.plus(6, ChronoUnit.DAYS);
        
        List<Transaction> weeklyTransactions = transactionRepository.findByUserAndTransactionDateBetween(user, weekStart, weekEnd);
        
        BigDecimal weeklySpent = weeklyTransactions.stream()
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Trebam dohvatiti tjedni cilj iz SavingGoal ili koristiti default
        BigDecimal weeklyGoal = BigDecimal.valueOf(500); // Default
        
        Map<String, Object> result = new HashMap<>();
        result.put("spent", weeklySpent);
        result.put("goal", weeklyGoal);
        result.put("remaining", weeklyGoal.subtract(weeklySpent));
        result.put("percentage", weeklySpent.doubleValue() / weeklyGoal.doubleValue() * 100);
        return result;
    }

    public List<Transaction> getTransactionsByUser(User user) {
    return transactionRepository.findByUser(user);
    }

    public Transaction saveTransaction(Transaction transaction) {
    return transactionRepository.save(transaction);
    }

    public void deleteTransaction(Integer id) {
    transactionRepository.deleteById(id);
    }
}