package com.havana.backend.controller;

import com.havana.backend.data.CreateCategoryRequest;
import com.havana.backend.model.Category;
import com.havana.backend.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {
    private final CategoryService categoryService;

    @PostMapping
    public ResponseEntity<?> createCategory(Authentication authentication, @RequestBody CreateCategoryRequest request) {
        Category category = categoryService.createCategory(request, (Integer) authentication.getPrincipal());
        return ResponseEntity.ok(category);
    }

    @GetMapping
    public ResponseEntity<?> getCategories(Authentication authentication) {
        return ResponseEntity.ok(categoryService.getCategoriesForUser((Integer) authentication.getPrincipal()));
    }

    @DeleteMapping("/{categoryId}")
    public ResponseEntity<?> deleteCategory(
            @PathVariable Integer categoryId,
            Authentication authentication
    ) {
        Integer userId = (Integer) authentication.getPrincipal();

        categoryService.deleteCategoryForUser(categoryId, userId);

        return ResponseEntity.noContent().build();
    }

}
