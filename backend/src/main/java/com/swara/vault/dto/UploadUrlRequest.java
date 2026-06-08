package com.swara.vault.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record UploadUrlRequest(
    @NotNull UUID ragaId,
    UUID compositionId,
    @NotBlank String filename,
    @NotBlank String contentType
) {}
