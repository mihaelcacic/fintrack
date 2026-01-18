package com.havana.backend.repository;

import com.havana.backend.model.Category;
import com.havana.backend.model.CategoryType;
import com.havana.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Integer> {

    List<Category> findByUser(User user);

    List<Category> findByUserAndType(User user, CategoryType type);

    Optional<Category> findByUserAndName(User user, String name);
}
