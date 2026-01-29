package com.havana.backend.repository;

import com.havana.backend.model.Category;
import com.havana.backend.model.CategoryType;
import com.havana.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Integer> {

    List<Category> findByUserId(Integer userId );

    List<Category> findByUserAndType(User user, CategoryType type);

    Optional<Category> findByUserAndName(User user, String name);

    Optional<Category> findByNameAndUserAndType(String name, User user, CategoryType type);

    @Query("""
    SELECT c FROM Category c
    WHERE c.user IS NULL OR c.user.id = :userId
    """)
    List<Category> findForUser(@Param("userId") Integer userId);

    Optional<Category> findByIdAndUserId(Integer id, Integer userId);

    List<Category> findAll();
    // CSV import (već imaš nešto slično)
    Optional<Category> findByNameIgnoreCaseAndUserAndType(
            String name,
            User user,
            CategoryType type
    );

    // sve globalne
    List<Category> findByUserIsNull();

    // sve korisničke
    List<Category> findByUserIsNotNull();
}
