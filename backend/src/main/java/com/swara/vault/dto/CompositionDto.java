package com.swara.vault.dto;

import com.swara.vault.entity.Composition;
import com.swara.vault.entity.CompositionType;
import java.util.UUID;

public record CompositionDto(
    UUID id,
    CompositionType type,
    String name,
    String tala,
    String description,
    String audioUrl
) {
    public static CompositionDto from(Composition c) {
        return new CompositionDto(c.getId(), c.getType(), c.getName(), c.getTala(), c.getDescription(), c.getAudioUrl());
    }
}
