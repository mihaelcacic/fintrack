package com.havana.backend.data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record RegularUserResponse(
        Integer id,
        String email,
        String username,
        BigDecimal totalIncome,
        BigDecimal totalExpense,
        BigDecimal balance,
        LocalDateTime createdAt
) {}

