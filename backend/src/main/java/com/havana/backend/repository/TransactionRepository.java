package com.havana.backend.repository;

import com.havana.backend.model.Category;
import com.havana.backend.model.Transaction;
import com.havana.backend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
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

    boolean existsByCategory(Category category);

    @Query("""
        SELECT t
        FROM Transaction t
        WHERE t.user.id = :userId
          AND t.transactionDate BETWEEN :start AND :end
    """)
    List<Transaction> findForUserAndMonth(
            @Param("userId") Integer userId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end
    );

    List<Transaction> findByUserAndTransactionDateAfter(User user, LocalDate fromDate);

    @Query("""
        SELECT COALESCE(SUM(t.amount), 0)
        FROM Transaction t
        JOIN t.category c
        WHERE t.user.id = :userId
          AND c.type = 'INCOME'
    """)
    BigDecimal sumIncome(Integer userId);

    @Query("""
        SELECT COALESCE(SUM(t.amount), 0)
        FROM Transaction t
        JOIN t.category c
        WHERE t.user.id = :userId
          AND c.type = 'EXPENSE'
    """)
    BigDecimal sumExpense(Integer userId);
}
