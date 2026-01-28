package com.havana.backend.data;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AddTransactionRequest(
        Integer categoryId,
        BigDecimal amount,
        LocalDate transactionDate,
        String description
) {}
