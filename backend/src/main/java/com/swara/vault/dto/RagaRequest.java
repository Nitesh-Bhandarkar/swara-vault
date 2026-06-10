package com.swara.vault.dto;

import jakarta.validation.constraints.*;
import java.util.UUID;

public record RagaRequest(
    @NotBlank @Size(max = 255) String name,
    @NotNull Boolean janya,
    UUID janakaRagaId,
    Integer melakarataNumber,
    String arohana,
    String arohanaAudioUrl,
    String avarohana,
    String avarohanaAudioUrl
) {}
