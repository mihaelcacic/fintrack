package com.havana.backend.service;

import com.havana.backend.data.CreateCategoryRequest;
import com.havana.backend.model.Category;
import com.havana.backend.repository.CategoryRepository;
import com.havana.backend.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.security.core.userdetails.User;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final UserService userService;

    public void createCatgeroy(CreateCategoryRequest request, Integer userId) {
        Category category = new Category();
        category.setName(request.name());
        category.setType(request.type());
        category.setUser(userService.findById(userId));

        categoryRepository.save(category);
    }

    public List<Category> getCategoriesForUser(Integer userId) {
        return categoryRepository.findForUser(userId);
    }
}
