package com.havana.backend.controller;

import com.havana.backend.model.User;
import com.havana.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request, HttpSession session) {
        User user = userService.register(request.username(), request.email(), request.password());
        session.setAttribute("user", user.getId());
        return ResponseEntity.ok(user);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request, HttpSession session) {
        User user = userService.login(request.email(), request.password());
        session.setAttribute("user", user.getId());
        return ResponseEntity.ok(user);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.ok().build();
    }

    public static record RegisterRequest(
            String username,
            String email,
            String password
    ) {}

    public static record LoginRequest(
            String email,
            String password
    ) {}
}