package com.havana.backend.controller;

import com.havana.backend.data.AdminCreateUserRequest;
import com.havana.backend.data.AdminUpdateUserRequest;
import com.havana.backend.data.CreateCategoryRequest;
import com.havana.backend.data.RegularUserResponse;
import com.havana.backend.model.Category;
import com.havana.backend.model.User;
import com.havana.backend.service.AdminService;
import com.havana.backend.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final CategoryService categoryService;

    // dodavanje
    @GetMapping("/users/admins")
    public ResponseEntity<?> getAdmins() {
        return ResponseEntity.ok(
                adminService.getAdmins()
        );
    }

    @GetMapping("/users/regular")
    public ResponseEntity<?> getRegularUsers() {
        return ResponseEntity.ok(
                adminService.getRegularUsers()
        );
    }

    // brisanje korisnika
    @DeleteMapping("/delete-users/{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable Integer userId) {
        adminService.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }

    // izrada korisnika
    @PostMapping("/create-user")
    public ResponseEntity<?> createUser(
            @RequestBody AdminCreateUserRequest request
    ) {
        User user = adminService.createUserByAdmin(request, false);
        return ResponseEntity.ok(user);
    }

    // izrada admina
    @PostMapping("/create-admin")
    public ResponseEntity<?> createAdmin(
            @RequestBody AdminCreateUserRequest request
    ) {
        User admin = adminService.createUserByAdmin(request, true);
        return ResponseEntity.ok(admin);
    }

    // azurianje korisnika
    @PutMapping("/users/{userId}")
    public ResponseEntity<?> updateUser(
            @PathVariable Integer userId,
            @RequestBody AdminUpdateUserRequest request
    ) {
        User updatedUser = adminService.updateUserByAdmin(userId, request);
        return ResponseEntity.ok(updatedUser);
    }

    @PostMapping("/categories")
    public ResponseEntity<Category> createGlobalCategory(
            @RequestBody CreateCategoryRequest request
    ) {
        return ResponseEntity.ok(
                categoryService.createGlobalCategory(request)
        );
    }

    @DeleteMapping("/categories/{categoryId}")
    public ResponseEntity<?> deleteCategory(
            @PathVariable Integer categoryId
    ) {
        categoryService.deleteCategory(categoryId);
        return ResponseEntity.noContent().build();
    }
}
