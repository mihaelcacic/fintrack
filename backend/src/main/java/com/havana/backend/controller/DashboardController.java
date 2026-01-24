package com.havana.backend.controller;

import com.havana.backend.model.User;
import com.havana.backend.service.UserService;
import com.havana.backend.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final TransactionService transactionService;
    private final UserService userService;

    @GetMapping("/spending-by-category")
    public ResponseEntity<?> getSpendingByCategory(HttpSession session) {
        Object userId = session.getAttribute("user");
        if (userId == null) return ResponseEntity.status(401).build();
        
        User user = userService.findById((Integer) userId);
        return ResponseEntity.ok(transactionService.getSpendingByCategory(user));
    }

    @GetMapping("/weekly-goal")
    public ResponseEntity<?> getWeeklyGoal(HttpSession session) {
        Object userId = session.getAttribute("user");
        if (userId == null) return ResponseEntity.status(401).build();
        
        User user = userService.findById((Integer) userId);
        return ResponseEntity.ok(transactionService.getWeeklyGoal(user));
    }
}