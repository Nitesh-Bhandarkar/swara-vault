package com.swara.vault.service;

import com.swara.vault.dto.RagaDto;
import com.swara.vault.dto.RagaRequest;
import com.swara.vault.entity.Raga;
import com.swara.vault.exception.ResourceNotFoundException;
import com.swara.vault.repository.RagaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RagaService {

    private final RagaRepository ragaRepository;

    public Page<RagaDto> search(String query, Boolean janya, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("name"));
        boolean hasQuery = query != null && !query.isBlank();
        boolean hasJanya = janya != null;
        Page<Raga> page1;
        if (hasQuery && hasJanya) {
            page1 = ragaRepository.findByNameContainingIgnoreCaseAndJanya(query, janya, pageable);
        } else if (hasQuery) {
            page1 = ragaRepository.findByNameContainingIgnoreCase(query, pageable);
        } else if (hasJanya) {
            page1 = ragaRepository.findByJanya(janya, pageable);
        } else {
            page1 = ragaRepository.findAll(pageable);
        }
        return page1.map(RagaDto::summary);
    }

    public RagaDto getById(UUID id) {
        return ragaRepository.findById(id)
            .map(RagaDto::from)
            .orElseThrow(() -> new ResourceNotFoundException("Raga not found: " + id));
    }

    public List<RagaDto> getMelakarataRagas() {
        return ragaRepository.findByJanyaFalseOrderByMelakarataNumber()
            .stream().map(RagaDto::summary).toList();
    }

    @Transactional
    public RagaDto create(RagaRequest req) {
        validate(req, null);
        Raga raga = buildRaga(new Raga(), req);
        return RagaDto.from(ragaRepository.save(raga));
    }

    @Transactional
    public RagaDto update(UUID id, RagaRequest req) {
        Raga raga = ragaRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Raga not found: " + id));
        validate(req, id);
        return RagaDto.from(ragaRepository.save(buildRaga(raga, req)));
    }

    @Transactional
    public void delete(UUID id) {
        Raga raga = ragaRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Raga not found: " + id));
        ragaRepository.delete(raga);
    }

    private void validate(RagaRequest req, UUID currentId) {
        ragaRepository.findByNameIgnoreCase(req.name()).ifPresent(existing -> {
            if (currentId == null || !existing.getId().equals(currentId)) {
                throw new IllegalArgumentException("Raga name already exists: " + req.name());
            }
        });
        if (req.janya()) {
            if (req.janakaRagaId() == null) throw new IllegalArgumentException("Janaka Raga is required for Janya Ragas");
        } else {
            if (req.melakarataNumber() == null || req.melakarataNumber() < 1 || req.melakarataNumber() > 72) {
                throw new IllegalArgumentException("Melakarta number must be between 1 and 72");
            }
        }
    }

    private Raga buildRaga(Raga raga, RagaRequest req) {
        raga.setName(req.name());
        raga.setJanya(req.janya());
        raga.setArohana(req.arohana());
        raga.setArohanaAudioUrl(req.arohanaAudioUrl());
        raga.setAvarohana(req.avarohana());
        raga.setAvarohanaAudioUrl(req.avarohanaAudioUrl());
        if (req.janya()) {
            Raga janaka = ragaRepository.findById(req.janakaRagaId())
                .orElseThrow(() -> new ResourceNotFoundException("Janaka Raga not found"));
            raga.setJanakaRaga(janaka);
            raga.setMelakarataNumber(null);
        } else {
            raga.setJanakaRaga(null);
            raga.setMelakarataNumber(req.melakarataNumber());
        }
        return raga;
    }
}
