package com.havana.backend.service;

import com.havana.backend.data.AdminCreateUserRequest;
import com.havana.backend.data.AdminUpdateUserRequest;
import com.havana.backend.data.AdminUserResponse;
import com.havana.backend.model.User;
import com.havana.backend.repository.TransactionRepository;
import com.havana.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final PasswordEncoder passwordEncoder;

    // dohvat svih korisnika
    public List<AdminUserResponse> getAllUsers() {

        return userRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // brisanje korisnika
    public void deleteUser(Integer userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (user.isAdmin()) {
            throw new IllegalStateException("Admin cannot be deleted");
        }

        // ne brise se samo user nego i sve sto je vezano uz njega
        userRepository.delete(user);

    }

    // kreiranje korisnika, kakvog god bilo
    public User createUserByAdmin(AdminCreateUserRequest request, boolean isAdmin) {

        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email already exists");
        }

        User user = new User();
        user.setEmail(request.email());
        user.setUsername(request.username());
        user.setPasswordHash(
                passwordEncoder.encode(request.password())
        );
        user.setAdmin(isAdmin);

        return userRepository.save(user);
    }

    // azuriranje korisnika
    public User updateUserByAdmin(
            Integer userId,
            AdminUpdateUserRequest request
    ) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (request.email() != null
                && !request.email().equals(user.getEmail())) {

            if (userRepository.existsByEmail(request.email())) {
                throw new IllegalArgumentException("Email already exists");
            }

            user.setEmail(request.email());
        }

        if (request.username() != null) {
            user.setUsername(request.username());
        }

        if (request.password() != null && !request.password().isBlank()) {
            user.setPasswordHash(
                    passwordEncoder.encode(request.password())
            );
        }

        if (request.isAdmin() != null) {
            user.setAdmin(request.isAdmin());
        }

        return userRepository.save(user);
    }

    private AdminUserResponse toResponse(User user) {
        BigDecimal income = transactionRepository.sumIncome(user.getId());
        BigDecimal expense = transactionRepository.sumExpense(user.getId());

        return new AdminUserResponse(
                user.getId(),
                user.getEmail(),
                user.getUsername(),
                income,
                expense,
                income.subtract(expense),
                user.getCreatedAt()
        );
    }
}

