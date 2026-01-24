package com.havana.backend.controller;

import com.havana.backend.model.Transaction;
import com.havana.backend.model.User;
import com.havana.backend.model.Category;
import com.havana.backend.service.TransactionService;
import com.havana.backend.service.UserService;
import com.havana.backend.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpSession;
import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;
    private final UserService userService;
    private final CategoryRepository categoryRepository;

    @GetMapping
    public ResponseEntity<?> getTransactions(HttpSession session) {
        Object userId = session.getAttribute("user");
        if (userId == null) return ResponseEntity.status(401).build();
        
        User user = userService.findById((Integer) userId);
        List<Transaction> transactions = transactionService.getTransactionsByUser(user);
        return ResponseEntity.ok(transactions);
    }

    @PostMapping
    public ResponseEntity<?> addTransaction(@RequestBody AddTransactionRequest request, HttpSession session) {
        Object userId = session.getAttribute("user");
        if (userId == null) return ResponseEntity.status(401).build();
        
        User user = userService.findById((Integer) userId);
        
        Category category = null;
        if (request.categoryId() != null) {
            category = categoryRepository.findById(request.categoryId()).orElse(null);
        }
        
        Transaction transaction = new Transaction();
        transaction.setUser(user);
        transaction.setCategory(category);
        transaction.setAmount(request.amount());
        transaction.setTransactionDate(request.transactionDate());
        transaction.setDescription(request.description());
        
        Transaction saved = transactionService.saveTransaction(transaction);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTransaction(@PathVariable Integer id, HttpSession session) {
        Object userId = session.getAttribute("user");
        if (userId == null) return ResponseEntity.status(401).build();
        
        transactionService.deleteTransaction(id);
        return ResponseEntity.ok().build();
    }

    public static record AddTransactionRequest(
            Integer categoryId,
            BigDecimal amount,
            LocalDate transactionDate,
            String description
    ) {}
}