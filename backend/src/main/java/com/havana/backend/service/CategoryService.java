package com.havana.backend.service;

import com.havana.backend.data.CategoryResponse;
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
    private final TransactionRepository transactionRepository;

    public Category createCategory(CreateCategoryRequest request, Integer userId) {
        Category category = new Category();
        category.setName(request.name());
        category.setType(request.type());
        category.setUser(userService.findById(userId));

        return categoryRepository.save(category);
    }

    public List<Category> getCategoriesForUser(Integer userId) {
        return categoryRepository.findForUser(userId);
    }

    public List<CategoryResponse> getMyCustomCategories(Integer userId) {
        return categoryRepository.findByUserId(userId)
                .stream()
                .map(c -> new CategoryResponse(
                        c.getId(),
                        c.getName(),
                        c.getType()
                ))
                .toList();
    }

    public void deleteCategoryForUser(Integer categoryId, Integer userId) {

        Category category = categoryRepository
                .findByIdAndUserId(categoryId, userId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Kategorija ne postoji ili ne pripada korisniku")
                );

        // zabrani brisanje kategorije ako ima transakcija
        if (transactionRepository.existsByCategory(category)) {
            throw new IllegalStateException(
                    "Kategorija se ne može obrisati jer sadrži transakcije"
            );
        }

        // nitko nemre obrisat glavne kategorije
        if (category.getUser() == null) {
            throw new IllegalStateException(
                    "Globalne kategorije se ne mogu brisati"
            );
        }

        // ne moze se obrisati kategorija drugog korisnika
        if (!category.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException(
                    "Kategorija ne pripada korisniku"
            );
        }

        categoryRepository.delete(category);
    }

    public Category createGlobalCategory(CreateCategoryRequest request) {

        Category category = new Category();
        category.setName(request.name());
        category.setType(request.type());
        category.setUser(null);

        return categoryRepository.save(category);
    }

    public void deleteCategory(Integer categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new IllegalArgumentException("Category not found"));

        categoryRepository.delete(category);
    }
}
