package com.swara.vault.dto;

import com.swara.vault.entity.Composition;
import com.swara.vault.entity.CompositionType;
import java.util.List;
import java.util.UUID;

public record CompositionDto(
    UUID id,
    CompositionType type,
    String name,
    String tala,
    String description,
    List<String> audioUrls
) {
    public static CompositionDto from(Composition c) {
        return new CompositionDto(c.getId(), c.getType(), c.getName(), c.getTala(), c.getDescription(),
            c.getAudioUrls() != null ? List.copyOf(c.getAudioUrls()) : List.of());
    }
}
