package com.havana.backend.controller;

import com.havana.backend.data.ApiResponse;
import com.havana.backend.data.TransactionCreateRequest;
import com.havana.backend.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/client")
@RequiredArgsConstructor
public class ClientController {

    private final TransactionService transactionService;

    // za kreiranje nove transakcije i dodavanje u bazu
    @PostMapping("/transaction")
    public ResponseEntity<?> createTransaction(
            @RequestBody TransactionCreateRequest request
    ) {
        boolean success = transactionService.createTransactionForCurrentUser(request);

        if (success) {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new ApiResponse("Transakcija dodana."));
        }

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse("Greška pri dodavanju transakcije."));
    }
}

