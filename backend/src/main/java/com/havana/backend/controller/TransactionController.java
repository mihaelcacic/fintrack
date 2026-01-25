package com.havana.backend.controller;

import com.havana.backend.data.AddTransactionRequest;
import com.havana.backend.data.ImportResultResponse;
import com.havana.backend.data.TransactionFilterRequest;
import com.havana.backend.data.TransactionResponse;
import com.havana.backend.model.Transaction;
import com.havana.backend.model.User;
import com.havana.backend.model.Category;
import com.havana.backend.repository.UserRepository;
import com.havana.backend.service.TransactionService;
import com.havana.backend.service.TransactionTemplateXlsxService;
import com.havana.backend.service.UserService;
import com.havana.backend.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
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
    private final TransactionTemplateXlsxService transactionTemplateXlsxService;

    // prikazujemo 10 transakcija po stranici koje pripadaju nekom korisniku
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

    // skidanje templatea xlsx datoteke lokalno
    @GetMapping("/template")
    public ResponseEntity<InputStreamResource> downloadTemplate() {

        ByteArrayInputStream stream =
                transactionTemplateXlsxService.generateExcelTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.add(
                "Content-Disposition",
                "attachment; filename=transaction-template.xlsx"
        );

        return ResponseEntity.ok()
                .headers(headers)
                .contentType(
                        MediaType.parseMediaType(
                                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        )
                )
                .body(new InputStreamResource(stream));
    }

    @PostMapping("/import")
    public ResponseEntity<ImportResultResponse> importTransactions(
            @RequestParam("file") MultipartFile file
    ) {
        ImportResultResponse result =
                transactionService.importCsv(file);

        return ResponseEntity.ok(result);
    }
}