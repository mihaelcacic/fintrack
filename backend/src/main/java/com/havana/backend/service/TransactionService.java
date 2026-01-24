package com.havana.backend.service;

import com.havana.backend.data.TransactionCreateRequest;
import com.havana.backend.model.Category;
import com.havana.backend.model.Transaction;
import com.havana.backend.model.User;
import com.havana.backend.repository.CategoryRepository;
import com.havana.backend.repository.TransactionRepository;
import com.havana.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

    // kreiranje transakcije za korisnika
    public boolean createTransactionForCurrentUser(TransactionCreateRequest request) {
        try {
            User currentUser = getCurrentUser();

            if (request.amount() == null || request.amount().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Iznos mora biti veći od 0");
            }

            Transaction transaction = new Transaction();
            transaction.setUser(currentUser);
            transaction.setAmount(request.amount());
            transaction.setTransactionDate(request.transactionDate());
            transaction.setDescription(request.description());
            transaction.setCreatedAt(LocalDateTime.now());

            if (request.categoryId() != null) {
                Category category = categoryRepository.findById(request.categoryId())
                        .orElseThrow(() -> new IllegalArgumentException("Kategorija ne postoji"));
                transaction.setCategory(category);
            }

            transactionRepository.save(transaction);
            return true;

        } catch (Exception e) {
            e.printStackTrace(); // samo za dev
            return false;
        }
    }

    private User getCurrentUser() {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("Korisnik nije prijavljen");
        }

        Object principal = authentication.getPrincipal();

        if (principal instanceof User user) {
            return user;
        }

        if (principal instanceof String username) {
            return userRepository.findByEmail(username)
                    .orElseThrow(() -> new IllegalStateException("Korisnik ne postoji"));
        }

        throw new IllegalStateException("Nepoznat tip principala");
    }
}

