package com.havana.backend.controller;

import com.havana.backend.service.PredictionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/predict")
@RequiredArgsConstructor
public class PredictionController {

    private final PredictionService predictionService;

    // Predikcija po kategoriji i datumu
    @GetMapping
    public ResponseEntity<Double> predict(
            @RequestParam Integer categoryId,
            @RequestParam String date, // format "2026-01-30"
            Authentication authentication
    ) {
        Integer userId = (Integer) authentication.getPrincipal();
        if (userId == null) return ResponseEntity.status(401).body(0.0);

        LocalDate futureDate = LocalDate.parse(date);
        double predicted = predictionService.predict(userId, futureDate, categoryId);
        return ResponseEntity.ok(predicted);
    }

    // Browser-friendly test endpoint: optional userId, optional categoryId, optional date
    @GetMapping("/test")
    public ResponseEntity<Map<String, Object>> testPrediction(
            @RequestParam(required = false) Integer userId,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false) String date,
            Authentication authentication
    ) {
        Integer uid = userId != null ? userId : (Integer) authentication.getPrincipal();
        if (uid == null) return ResponseEntity.status(401).body(Map.of("error", "unauthenticated"));

        LocalDate d = (date != null && !date.isBlank()) ? LocalDate.parse(date) : LocalDate.now();

        double predicted;
        if (categoryId != null) {
            predicted = predictionService.predict(uid, d, categoryId);
        } else {
            predicted = predictionService.predictDailySpending(uid, d);
        }

        Map<String, Object> resp = new HashMap<>();
        resp.put("userId", uid);
        resp.put("date", d.toString());
        resp.put("categoryId", categoryId);
        resp.put("predicted", predicted);

        return ResponseEntity.ok(resp);
    }

    // Predikcija dnevne potrošnje
    @GetMapping("/daily")
    public ResponseEntity<Double> predictDaily(
            @RequestParam String date,
            Authentication authentication
    ) {
        Integer userId = (Integer) authentication.getPrincipal();
        if (userId == null) return ResponseEntity.status(401).body(0.0);

        LocalDate futureDate = LocalDate.parse(date);
        double predicted = predictionService.predictDailySpending(userId, futureDate);
        return ResponseEntity.ok(predicted);
    }

    // Rolling monthly average (jedan broj za zadnjih n mjeseci)
    @GetMapping("/rolling-average")
    public ResponseEntity<Double> rollingAverage(
            @RequestParam int months,
            Authentication authentication
    ) {
        Integer userId = (Integer) authentication.getPrincipal();
        if (userId == null) return ResponseEntity.status(401).body(0.0);

        double avg = predictionService.rollingMonthlyAverage(userId, months);
        return ResponseEntity.ok(avg);
    }

    // Rolling monthly series (niz prosjeka za prikaz na grafu)
    @GetMapping("/rolling-series")
    public ResponseEntity<Map<String, Double>> rollingSeries(
            @RequestParam int window,
            Authentication authentication
    ) {
        Integer userId = (Integer) authentication.getPrincipal();
        if (userId == null) return ResponseEntity.status(401).body(Map.of());

        Map<String, Double> series = predictionService.rollingMonthlySeries(userId, window);
        return ResponseEntity.ok(series);
    }
}
