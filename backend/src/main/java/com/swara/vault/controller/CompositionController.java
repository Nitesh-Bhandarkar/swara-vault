package com.swara.vault.controller;

import com.swara.vault.dto.CompositionDto;
import com.swara.vault.dto.CompositionRequest;
import com.swara.vault.service.CompositionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/ragas/{ragaId}/compositions")
@RequiredArgsConstructor
public class CompositionController {

    private final CompositionService compositionService;

    @PostMapping
    public ResponseEntity<CompositionDto> add(
        @PathVariable UUID ragaId,
        @Valid @RequestBody CompositionRequest req
    ) {
        return ResponseEntity.status(201).body(compositionService.add(ragaId, req));
    }

    @PutMapping("/{compositionId}")
    public CompositionDto update(
        @PathVariable UUID ragaId,
        @PathVariable UUID compositionId,
        @Valid @RequestBody CompositionRequest req
    ) {
        return compositionService.update(ragaId, compositionId, req);
    }

    @DeleteMapping("/{compositionId}")
    public ResponseEntity<Void> delete(
        @PathVariable UUID ragaId,
        @PathVariable UUID compositionId
    ) {
        compositionService.delete(ragaId, compositionId);
        return ResponseEntity.noContent().build();
    }
}
