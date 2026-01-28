package com.havana.backend.data;

public record AdminUpdateUserRequest(
        String email,
        String username,
        String password,
        Boolean isAdmin
) {}

