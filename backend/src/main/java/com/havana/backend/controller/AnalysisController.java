package com.havana.backend.controller;

import com.havana.backend.service.AnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.Map;

@RestController
@RequestMapping("/api/analysis")
@RequiredArgsConstructor
public class AnalysisController {

    private final AnalysisService analysisService;

    // GET /api/analisys/monthly?months=6[&categoryId=1]
    @GetMapping("/monthly")
    public ResponseEntity<Map<String, Double>> monthly(
            @RequestParam int months,
            @RequestParam(required = false) Integer categoryId,
            Authentication authentication,
            @RequestParam(required = false) Integer userId
    ) {
        Integer uid = (userId != null) ? userId : (Integer) authentication.getPrincipal();
        if (uid == null) return ResponseEntity.status(401).body(Collections.<String, Double>emptyMap());

        Map<String, Double> resp = analysisService.monthlySpending(uid, months, categoryId);
        return ResponseEntity.ok(resp);
    }

    // GET /api/analisys/daily?days=30[&categoryId=1]
    @GetMapping("/daily")
    public ResponseEntity<Map<String, Object>> daily(
            @RequestParam int days,
            @RequestParam(required = false) Integer categoryId,
            Authentication authentication,
            @RequestParam(required = false) Integer userId
    ) {
        Integer uid = (userId != null) ? userId : (Integer) authentication.getPrincipal();
        if (uid == null) return ResponseEntity.status(401).body(Collections.<String, Object>emptyMap());

        Map<String, Object> resp = analysisService.dailySpending(uid, days, categoryId);
        return ResponseEntity.ok(resp);
    }
}
