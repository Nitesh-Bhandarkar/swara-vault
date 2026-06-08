package com.swara.vault.dto;

import com.swara.vault.entity.Raga;
import java.util.List;
import java.util.UUID;

public record RagaDto(
    UUID id,
    String name,
    boolean janya,
    UUID janakaRagaId,
    String janakaRagaName,
    Integer melakarataNumber,
    String arohana,
    String arohanaAudioUrl,
    String avarohana,
    String avarohanaAudioUrl,
    boolean seeded,
    List<CompositionDto> compositions
) {
    public static RagaDto from(Raga raga) {
        return new RagaDto(
            raga.getId(),
            raga.getName(),
            raga.isJanya(),
            raga.getJanakaRaga() != null ? raga.getJanakaRaga().getId() : null,
            raga.getJanakaRaga() != null ? raga.getJanakaRaga().getName() : null,
            raga.getMelakarataNumber(),
            raga.getArohana(),
            raga.getArohanaAudioUrl(),
            raga.getAvarohana(),
            raga.getAvarohanaAudioUrl(),
            raga.isSeeded(),
            raga.getCompositions().stream().map(CompositionDto::from).toList()
        );
    }

    public static RagaDto summary(Raga raga) {
        return new RagaDto(
            raga.getId(), raga.getName(), raga.isJanya(),
            raga.getJanakaRaga() != null ? raga.getJanakaRaga().getId() : null,
            raga.getJanakaRaga() != null ? raga.getJanakaRaga().getName() : null,
            raga.getMelakarataNumber(),
            raga.getArohana(), raga.getArohanaAudioUrl(),
            raga.getAvarohana(), raga.getAvarohanaAudioUrl(),
            raga.isSeeded(), List.of()
        );
    }
}
