package com.havana.backend.data;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TransactionFilterRequest(
        String description,
        String categoryName,
        String categoryType, // INCOME | EXPENSE
        BigDecimal maxAmount,
        BigDecimal minAmount,
        LocalDate fromDate,
        LocalDate toDate,
        String sortBy
) {}
