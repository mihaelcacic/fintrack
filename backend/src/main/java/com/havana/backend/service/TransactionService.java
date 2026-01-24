package com.havana.backend.service;

import com.havana.backend.data.TransactionFilterRequest;
import com.havana.backend.model.Transaction;
import com.havana.backend.model.User;
import com.havana.backend.repository.TransactionRepository;
import com.havana.backend.repository.SavingGoalRepository;
import com.havana.backend.repository.UserRepository;
import com.havana.backend.specification.TransactionSpecification;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
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
    private final UserRepository userRepository;
    private final HttpSession session;

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

    public Page<Transaction> getTransactionsForCurrentUser(int page, int size) {

        User currentUser = getCurrentUserEntityFromSession();

        Pageable pageable = PageRequest.of(
                page,          // 0-based
                size,          // npr. 10
                Sort.by("transactionDate").descending()
        );

        return transactionRepository.findByUser(currentUser, pageable);
    }

    public Page<Transaction> searchTransactions(
            TransactionFilterRequest filter,
            int page,
            int size
    ) {
        User user = getCurrentUserEntityFromSession();

        Specification<Transaction> spec =
                Specification.where(TransactionSpecification.forUser(user));

        if (filter.description() != null && !filter.description().isBlank()) {
            spec = spec.and(
                    TransactionSpecification.descriptionLike(filter.description())
            );
        }

        if (filter.categoryId() != null) {
            spec = spec.and(
                    TransactionSpecification.categoryEquals(filter.categoryId())
            );
        }

        if (filter.categoryType() != null) {
            spec = spec.and(
                    TransactionSpecification.categoryTypeEquals(filter.categoryType())
            );
        }

        if (filter.amountFrom() != null && filter.amountTo() != null) {
            spec = spec.and(
                    TransactionSpecification.amountBetween(
                            filter.amountFrom(), filter.amountTo()
                    )
            );
        }

        if (filter.dateFrom() != null && filter.dateTo() != null) {
            spec = spec.and(
                    TransactionSpecification.dateBetween(
                            filter.dateFrom(), filter.dateTo()
                    )
            );
        }

        Pageable pageable = PageRequest.of(
                page,
                size,
                resolveSort(filter)
        );

        return transactionRepository.findAll(spec, pageable);
    }

    private Sort resolveSort(TransactionFilterRequest filter) {
        if ("amount".equalsIgnoreCase(filter.sortBy())) {
            return "asc".equalsIgnoreCase(filter.sortDir())
                    ? Sort.by("amount").ascending()
                    : Sort.by("amount").descending();
        }

        // default: datum
        return "asc".equalsIgnoreCase(filter.sortDir())
                ? Sort.by("transactionDate").ascending()
                : Sort.by("transactionDate").descending();
    }

    private User getCurrentUserEntityFromSession() {

        Integer userId = (Integer) session.getAttribute("user");

        if (userId == null) {
            throw new IllegalStateException("Korisnik nije prijavljen");
        }

        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("Korisnik ne postoji"));
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