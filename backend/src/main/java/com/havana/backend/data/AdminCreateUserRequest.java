package com.havana.backend.data;

public record AdminCreateUserRequest(
        String email,
        String username,
        String password
) {}

