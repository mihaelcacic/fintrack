package com.havana.backend.data;

import java.math.BigDecimal;
import java.time.LocalDate;

public record SavingGoalResponse(Integer id,
                                 String name,
                                 BigDecimal targetAmount,
                                 BigDecimal currentAmount,
                                 LocalDate deadline) {
}
