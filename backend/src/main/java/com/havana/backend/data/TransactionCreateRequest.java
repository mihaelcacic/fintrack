package com.havana.backend.data;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TransactionCreateRequest(
        Integer categoryId,
        BigDecimal amount,
        LocalDate transactionDate,
        String description
) {}
