package com.swara.vault.controller;

import com.swara.vault.dto.RagaDto;
import com.swara.vault.service.ImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/import")
@RequiredArgsConstructor
public class ImportController {

    private final ImportService importService;

    @PostMapping("/ragas")
    public ResponseEntity<?> importRagas(@RequestParam("file") MultipartFile file) {
        try {
            List<RagaDto> imported = importService.importFile(file);
            return ResponseEntity.ok(Map.of("imported", imported.size(), "ragas", imported));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Import failed: " + e.getMessage()));
        }
    }
}
