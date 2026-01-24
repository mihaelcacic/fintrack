package com.havana.backend.repository;

import com.havana.backend.model.Transaction;
import com.havana.backend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDate;
import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Integer>, JpaSpecificationExecutor<Transaction> {

    List<Transaction> findByUser(User user);

    List<Transaction> findByUserAndTransactionDateBetween(
            User user,
            LocalDate start,
            LocalDate end
    );

    Page<Transaction> findByUser(User user, Pageable pageable);

    List<Transaction> findByUserAndCategoryId(User user, Integer categoryId);
}
