package com.swara.vault.dto;

import com.swara.vault.entity.CompositionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CompositionRequest(
    @NotNull CompositionType type,
    @NotBlank String name,
    @NotBlank String tala,
    String description,
    String audioUrl
) {}
