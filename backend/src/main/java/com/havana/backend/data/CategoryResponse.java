package com.havana.backend.data;

import com.havana.backend.model.CategoryType;

public record CategoryResponse(
        Integer id,
        String name,
        CategoryType type
) {}
