package com.havana.backend.controller;

import com.havana.backend.data.AddSavingAmountRequest;
import com.havana.backend.data.CreateSavingGoalRequest;
import com.havana.backend.service.SavingGoalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/savings-goals")
@RequiredArgsConstructor
public class SavingGoalController {

    private final SavingGoalService savingGoalService;

    @GetMapping
    public ResponseEntity<?> getSavingGoals(Authentication authentication) {
        Integer userId = (Integer) authentication.getPrincipal();
        return ResponseEntity.ok(
                savingGoalService.getSavingGoals(userId)
        );
    }

    @PostMapping
    public ResponseEntity<?> createSavingGoal(
            Authentication authentication,
            @RequestBody CreateSavingGoalRequest request
    ) {
        Integer userId = (Integer) authentication.getPrincipal();
        return ResponseEntity.ok(
                savingGoalService.createSavingGoal(userId, request)
        );
    }

    @PostMapping("/{id}/add")
    public ResponseEntity<?> addSavingAmount(
            @PathVariable Integer id,
            Authentication authentication,
            @RequestBody AddSavingAmountRequest request
    ) {
        Integer userId = (Integer) authentication.getPrincipal();

        return ResponseEntity.ok(
                savingGoalService.addSavingAmount(
                        id,
                        userId,
                        request.amount()
                )
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSavingGoal(
            @PathVariable Integer id,
            Authentication authentication
    ) {
        Integer userId = (Integer) authentication.getPrincipal();
        savingGoalService.deleteSavingGoal(id, userId);
        return ResponseEntity.noContent().build();
    }
}
