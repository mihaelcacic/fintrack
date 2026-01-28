package com.havana.backend.service;

import com.havana.backend.data.AddTransactionRequest;
import com.havana.backend.data.ImportResultResponse;
import com.havana.backend.data.MonthlyBalanceRecord;
import com.havana.backend.data.TransactionFilterRequest;
import com.havana.backend.model.Category;
import com.havana.backend.model.CategoryType;
import com.havana.backend.model.Transaction;
import com.havana.backend.model.User;
import com.havana.backend.repository.CategoryRepository;
import com.havana.backend.repository.TransactionRepository;
import com.havana.backend.repository.SavingGoalRepository;
import com.havana.backend.repository.UserRepository;
import com.havana.backend.specification.TransactionSpecification;
import lombok.RequiredArgsConstructor;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.math.BigDecimal;

import static com.havana.backend.model.CategoryType.EXPENSE;
import static com.havana.backend.model.CategoryType.INCOME;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final SavingGoalRepository savingGoalRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

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

    public Page<Transaction> getTransactionsForCurrentUser(int page, int size, Integer userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Pageable pageable = PageRequest.of(
                page,          // 0-based
                size,          // npr. 10
                Sort.by("transactionDate").descending()
        );

        return transactionRepository.findByUser(user, pageable);
    }

    public Page<Transaction> searchTransactions(TransactionFilterRequest filter, int page, int size, Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Specification<Transaction> spec =
                Specification.where(TransactionSpecification.forUser(user));

        if (filter.description() != null && !filter.description().isBlank()) {
            spec = spec.and(
                    TransactionSpecification.descriptionLike(filter.description())
            );
        }

        // Promijenjeno iz categoryId u categoryName
        if (filter.categoryName() != null && !filter.categoryName().isBlank()) {
            spec = spec.and(
                    TransactionSpecification.categoryNameEquals(filter.categoryName())
            );
        }

        if (filter.categoryType() != null) {
            spec = spec.and(
                    TransactionSpecification.categoryTypeEquals(filter.categoryType())
            );
        }

        if (filter.minAmount() != null && filter.maxAmount() != null) {
            // Ispravljen redoslijed parametara
            spec = spec.and(
                    TransactionSpecification.amountBetween(
                            filter.minAmount(), filter.maxAmount()
                    )
            );
        }

        if (filter.fromDate() != null && filter.toDate() != null) {
            spec = spec.and(
                    TransactionSpecification.dateBetween(
                            filter.fromDate(), filter.toDate()
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

    // sortiranje
    private Sort resolveSort(TransactionFilterRequest filter) {
        if (filter.sortBy() == null || filter.sortBy().isBlank()) {
            // Default sort: najnovije transakcije prvo
            return Sort.by("transactionDate").descending();
        }

        switch (filter.sortBy().toLowerCase()) {
            case "amount_asc":
                return Sort.by("amount").ascending();
            case "amount_desc":
                return Sort.by("amount").descending();
            case "date_asc":
                return Sort.by("transactionDate").ascending();
            case "date_desc":
                return Sort.by("transactionDate").descending();
            default:
                // Default fallback
                return Sort.by("transactionDate").descending();
        }
    }

    // metoda za importanje csva koji je nekoc bio excell tablica, tako se unose transakcije
    public ImportResultResponse importCsv(MultipartFile file, Integer userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        int success = 0;
        int failed = 0;

        try (
                Reader reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8);
                CSVParser parser = CSVFormat.DEFAULT
                        .withFirstRecordAsHeader()
                        .withIgnoreHeaderCase()
                        .withTrim()
                        .parse(reader)
        ) {

            for (CSVRecord record : parser) {
                try {
                    Transaction transaction =
                            mapCsvRecordToTransaction(record, user);

                    transactionRepository.save(transaction);
                    success++;
                } catch (Exception e) {
                    failed++;
                }
            }

        } catch (IOException e) {
            throw new RuntimeException("CSV parsing failed", e);
        }

        return new ImportResultResponse(success, failed);
    }

    private Transaction mapCsvRecordToTransaction(
            CSVRecord record,
            User user
    ) {

        LocalDate date =
                LocalDate.parse(record.get("transaction_date"));

        BigDecimal amount =
                new BigDecimal(record.get("amount"));

        String description =
                record.get("description");

        String categoryName =
                record.get("category_name");

        CategoryType categoryType =
                CategoryType.valueOf(record.get("category_type").trim().toUpperCase());

        Category category =
                categoryRepository
                        .findByNameAndUserAndType(
                                categoryName, user, categoryType
                        )
                        .orElseGet(() -> {
                            Category c = new Category();
                            c.setName(categoryName);
                            c.setType(categoryType);
                            c.setUser(user);
                            return categoryRepository.save(c);
                        });

        Transaction transaction = new Transaction();
        transaction.setUser(user);
        transaction.setCategory(category);
        transaction.setAmount(amount);
        transaction.setTransactionDate(date);
        transaction.setDescription(description);

        return transaction;
    }


    public Transaction saveTransaction(AddTransactionRequest request, Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Category category = categoryRepository.findById(request.categoryId())
                .filter(c -> c.getUser() == null || c.getUser().getId().equals(userId))
                .orElseThrow(() -> new RuntimeException("Category not allowed"));

        Transaction transaction = new Transaction();
        transaction.setUser(user);
        transaction.setCategory(category);
        transaction.setAmount(request.amount());
        transaction.setTransactionDate(request.transactionDate());
        transaction.setDescription(request.description());
        return transactionRepository.save(transaction);
    }

    public void deleteTransaction(Integer id, Integer userId) {
        Transaction t = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        if (!t.getUser().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
        }

        transactionRepository.delete(t);
    }

    // racunanje novaca na racunu za taj mjesec
    public MonthlyBalanceRecord getCurrentMonthBalance(Integer userId) {

        LocalDate now = LocalDate.now();
        LocalDate startOfMonth = now.withDayOfMonth(1);
        LocalDate endOfMonth = now.withDayOfMonth(now.lengthOfMonth());

        List<Transaction> transactions =
                transactionRepository.findForUserAndMonth(
                        userId, startOfMonth, endOfMonth
                );

        BigDecimal income = BigDecimal.ZERO;
        BigDecimal expense = BigDecimal.ZERO;

        for (Transaction t : transactions) {
            if (INCOME.equals(t.getCategory().getType())) {
                income = income.add(t.getAmount());
            } else if (EXPENSE.equals(t.getCategory().getType())) {
                expense = expense.add(t.getAmount());
            }
        }

        return new MonthlyBalanceRecord(
                income,
                expense,
                income.subtract(expense)
        );
    }
}