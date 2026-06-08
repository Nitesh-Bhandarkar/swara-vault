package com.swara.vault.service;

import com.swara.vault.dto.CompositionDto;
import com.swara.vault.dto.CompositionRequest;
import com.swara.vault.entity.Composition;
import com.swara.vault.entity.Raga;
import com.swara.vault.repository.CompositionRepository;
import com.swara.vault.repository.RagaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class CompositionService {

    private final CompositionRepository compositionRepository;
    private final RagaRepository ragaRepository;

    public CompositionDto add(UUID ragaId, CompositionRequest req) {
        Raga raga = ragaRepository.findById(ragaId)
            .orElseThrow(() -> new IllegalArgumentException("Raga not found: " + ragaId));
        Composition composition = Composition.builder()
            .raga(raga)
            .type(req.type())
            .name(req.name())
            .tala(req.tala())
            .description(req.description())
            .audioUrl(req.audioUrl())
            .build();
        return CompositionDto.from(compositionRepository.save(composition));
    }

    public CompositionDto update(UUID ragaId, UUID compositionId, CompositionRequest req) {
        Composition composition = compositionRepository.findById(compositionId)
            .filter(c -> c.getRaga().getId().equals(ragaId))
            .orElseThrow(() -> new IllegalArgumentException("Composition not found"));
        composition.setType(req.type());
        composition.setName(req.name());
        composition.setTala(req.tala());
        composition.setDescription(req.description());
        composition.setAudioUrl(req.audioUrl());
        return CompositionDto.from(compositionRepository.save(composition));
    }

    public void delete(UUID ragaId, UUID compositionId) {
        Composition composition = compositionRepository.findById(compositionId)
            .filter(c -> c.getRaga().getId().equals(ragaId))
            .orElseThrow(() -> new IllegalArgumentException("Composition not found"));
        compositionRepository.delete(composition);
    }
}
