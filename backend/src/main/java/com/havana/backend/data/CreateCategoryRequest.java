package com.havana.backend.data;

import com.havana.backend.model.CategoryType;
import com.havana.backend.model.User;

public record CreateCategoryRequest(
        String name,
        CategoryType type
) {
}
