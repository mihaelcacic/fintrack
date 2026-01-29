package com.havana.backend.service;

import com.havana.backend.data.*;
import com.havana.backend.model.Category;
import com.havana.backend.model.User;
import com.havana.backend.repository.CategoryRepository;
import com.havana.backend.repository.TransactionRepository;
import com.havana.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final PasswordEncoder passwordEncoder;
    private final CategoryRepository categoryRepository;

    // dohvat svih korisnika
    public List<AdminUserResponse> getAdmins() {
        return userRepository.findAll()
                .stream()
                .filter(User::isAdmin)
                .map(u -> new AdminUserResponse(
                        u.getId(),
                        u.getEmail(),
                        u.getUsername(),
                        u.getCreatedAt()
                ))
                .toList();
    }

    public List<RegularUserResponse> getRegularUsers() {

        return userRepository.findAll()
                .stream()
                .filter(u -> !u.isAdmin())
                .map(user -> {

                    BigDecimal income =
                            transactionRepository.sumIncome(user.getId());

                    BigDecimal expense =
                            transactionRepository.sumExpense(user.getId());

                    income = income != null ? income : BigDecimal.ZERO;
                    expense = expense != null ? expense : BigDecimal.ZERO;

                    return new RegularUserResponse(
                            user.getId(),
                            user.getEmail(),
                            user.getUsername(),
                            income,
                            expense,
                            income.subtract(expense),
                            user.getCreatedAt()
                    );
                })
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

    public List<AdminCategoryResponse> getAllCategoriesForAdmin() {

        // 1. Globalne kategorije (bez duplikata)
        List<Category> globalCategories =
                categoryRepository.findByUserIsNull();

        Map<String, Category> uniqueGlobals = new HashMap<>();

        for (Category c : globalCategories) {
            String key = c.getName().toLowerCase() + "|" + c.getType();
            uniqueGlobals.putIfAbsent(key, c);
        }

        // 2. Sve korisničke kategorije (nema filtriranja)
        List<Category> userCategories =
                categoryRepository.findByUserIsNotNull();

        // 3. Spajanje
        List<AdminCategoryResponse> result = new ArrayList<>();

        uniqueGlobals.values().forEach(c ->
                result.add(toAdminResponse(c))
        );

        userCategories.forEach(c ->
                result.add(toAdminResponse(c))
        );

        return result;
    }

    private AdminCategoryResponse toAdminResponse(Category c) {
        return new AdminCategoryResponse(
                c.getId(),
                c.getName(),
                c.getType().name(),
                c.getUser() == null ? null : c.getUser().getId()
        );
    }

    private RegularUserResponse toResponse(User user) {
        BigDecimal income = transactionRepository.sumIncome(user.getId());
        BigDecimal expense = transactionRepository.sumExpense(user.getId());

        return new RegularUserResponse(
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

