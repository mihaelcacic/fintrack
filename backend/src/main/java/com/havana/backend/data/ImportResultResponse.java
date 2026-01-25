package com.havana.backend.data;

public record ImportResultResponse(
        int imported,
        int failed
) {}
