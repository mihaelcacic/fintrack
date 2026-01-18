package com.havana.backend.repository;

import com.havana.backend.model.Transaction;
import com.havana.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Integer> {

    List<Transaction> findByUser(User user);

    List<Transaction> findByUserAndTransactionDateBetween(
            User user,
            LocalDate start,
            LocalDate end
    );

    List<Transaction> findByUserAndCategoryId(User user, Integer categoryId);
}
