package com.swara.vault.controller;

import com.swara.vault.service.ImportService;
import com.swara.vault.service.ImportService.ImportResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/import")
@RequiredArgsConstructor
public class ImportController {

    private final ImportService importService;

    @PostMapping("/ragas")
    public ResponseEntity<?> importRagas(@RequestParam("file") MultipartFile file) {
        try {
            ImportResult result = importService.importFile(file);
            return ResponseEntity.ok(Map.of(
                "imported", result.imported().size(),
                "ragas", result.imported(),
                "errors", result.errors()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Import failed: " + e.getMessage()));
        }
    }
}
