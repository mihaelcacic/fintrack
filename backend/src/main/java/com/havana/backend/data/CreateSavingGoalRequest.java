package com.havana.backend.data;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateSavingGoalRequest(String name,
                                      BigDecimal targetAmount,
                                      LocalDate deadline) {
}
