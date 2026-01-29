package com.havana.backend.data;

public record AdminCategoryResponse(
        Integer id,
        String name,
        String type,
        Integer userId   // null = globalna
) {}
