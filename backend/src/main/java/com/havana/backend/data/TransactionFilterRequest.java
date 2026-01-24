package com.havana.backend.data;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TransactionFilterRequest(
        String description,
        Integer categoryId,
        String categoryType, // INCOME | EXPENSE
        BigDecimal amountFrom,
        BigDecimal amountTo,
        LocalDate dateFrom,
        LocalDate dateTo,
        String sortBy,       // date | amount
        String sortDir       // asc | desc
) {}
