package com.havana.backend.specification;

import com.havana.backend.model.Transaction;
import com.havana.backend.model.User;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDate;

// klasa koja olaksava pisanje i snalazenje po bazi podataka, ustvari ko jako puno selectova
public class TransactionSpecification {

    public static Specification<Transaction> forUser(User user) {
        return (root, query, cb) ->
                cb.equal(root.get("user"), user);
    }

    public static Specification<Transaction> descriptionLike(String description) {
        return (root, query, cb) ->
                cb.like(
                        cb.lower(root.get("description")),
                        "%" + description.toLowerCase() + "%"
                );
    }

    public static Specification<Transaction> categoryEquals(Integer categoryId) {
        return (root, query, cb) ->
                cb.equal(root.get("category").get("id"), categoryId);
    }

    public static Specification<Transaction> categoryTypeEquals(String type) {
        return (root, query, cb) ->
                cb.equal(root.get("category").get("type"), type);
    }

    public static Specification<Transaction> amountBetween(
            BigDecimal from, BigDecimal to) {

        return (root, query, cb) ->
                cb.between(root.get("amount"), from, to);
    }

    public static Specification<Transaction> dateBetween(
            LocalDate from, LocalDate to) {

        return (root, query, cb) ->
                cb.between(root.get("transactionDate"), from, to);
    }
}

