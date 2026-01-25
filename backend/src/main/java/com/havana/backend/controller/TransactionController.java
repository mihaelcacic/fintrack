package com.havana.backend.controller;

import com.havana.backend.data.AddTransactionRequest;
import com.havana.backend.data.TransactionFilterRequest;
import com.havana.backend.data.TransactionResponse;
import com.havana.backend.model.Transaction;
import com.havana.backend.service.TransactionService;
import com.havana.backend.service.UserService;
import com.havana.backend.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;
    private final UserService userService;
    private final CategoryRepository categoryRepository;

    @GetMapping
    public ResponseEntity<Page<TransactionResponse>> getMyTransactions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication
    ) {

        Page<Transaction> transactions = transactionService
                .getTransactionsForCurrentUser(page, size, (Integer) authentication.getPrincipal());

        Page<TransactionResponse> response =
                transactions.map(t -> new TransactionResponse(
                        t.getId(),
                        t.getAmount(),
                        t.getTransactionDate(),
                        t.getDescription()
                ));

        return ResponseEntity.ok(response);
    }

    // za dodavanje transakcija
    @PostMapping
    public ResponseEntity<?> addTransaction(@RequestBody AddTransactionRequest request, Authentication authentication) {
        Integer userId = (Integer) authentication.getPrincipal();
        if (userId == null) return ResponseEntity.status(401).body("You are not logged in");

        // spremanje transakcije
        Transaction saved = transactionService.saveTransaction(request, userId);
        return ResponseEntity.ok(saved);
    }

    // brisanje preko ida transakcije
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTransaction(@PathVariable Integer id, Authentication authentication) {
        Integer userId = (Integer) authentication.getPrincipal();
        if (userId == null) return ResponseEntity.status(401).body("You are not logged in");
        
        transactionService.deleteTransaction(id);
        return ResponseEntity.ok().build();
    }

    // pretrazivanje na osnovi zeljenih filtera
    @PostMapping("/search")
    public ResponseEntity<Page<TransactionResponse>> search(
            @RequestBody TransactionFilterRequest filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication
    ) {
        Page<Transaction> result =
                transactionService.searchTransactions(filter, page, size, (Integer) authentication.getPrincipal());

        Page<TransactionResponse> response =
                result.map(t -> new TransactionResponse(
                        t.getCategory() != null ? t.getCategory().getId() : null,
                        t.getAmount(),
                        t.getTransactionDate(),
                        t.getDescription()
                ));


        return ResponseEntity.ok(response);
    }

}