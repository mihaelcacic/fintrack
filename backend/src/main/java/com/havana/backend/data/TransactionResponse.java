package com.havana.backend.data;

import com.havana.backend.model.CategoryType;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TransactionResponse(
        Integer id,
        BigDecimal amount,
        LocalDate transactionDate,
        String description,
        Integer categoryId,
        String categoryName,
        CategoryType categoryType
) {}
