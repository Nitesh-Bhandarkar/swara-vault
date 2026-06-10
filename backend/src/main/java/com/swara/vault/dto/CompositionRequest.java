package com.swara.vault.dto;

import com.swara.vault.entity.CompositionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CompositionRequest(
    @NotNull CompositionType type,
    @NotBlank @Size(max = 255) String name,
    @NotBlank @Size(max = 100) String tala,
    String description,
    String audioUrl
) {}
