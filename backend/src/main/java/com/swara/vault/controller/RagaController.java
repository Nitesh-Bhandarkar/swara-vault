package com.swara.vault.controller;

import com.swara.vault.dto.RagaDto;
import com.swara.vault.dto.RagaRequest;
import com.swara.vault.service.RagaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/ragas")
@RequiredArgsConstructor
public class RagaController {

    private final RagaService ragaService;

    @GetMapping
    public Page<RagaDto> search(
        @RequestParam(required = false) String q,
        @RequestParam(required = false) Boolean janya,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ragaService.search(q, janya, page, size);
    }

    @GetMapping("/melakarta")
    public List<RagaDto> getMelakarataRagas() {
        return ragaService.getMelakarataRagas();
    }

    @GetMapping("/{id}")
    public RagaDto getById(@PathVariable UUID id) {
        return ragaService.getById(id);
    }

    @PostMapping
    public ResponseEntity<RagaDto> create(@Valid @RequestBody RagaRequest req) {
        return ResponseEntity.status(201).body(ragaService.create(req));
    }

    @PutMapping("/{id}")
    public RagaDto update(@PathVariable UUID id, @Valid @RequestBody RagaRequest req) {
        return ragaService.update(id, req);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        ragaService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
