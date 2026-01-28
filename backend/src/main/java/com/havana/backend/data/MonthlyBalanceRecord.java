package com.havana.backend.data;

import java.math.BigDecimal;

public record MonthlyBalanceRecord(
        BigDecimal totalIncome,
        BigDecimal totalExpense,
        BigDecimal balance
) {}
