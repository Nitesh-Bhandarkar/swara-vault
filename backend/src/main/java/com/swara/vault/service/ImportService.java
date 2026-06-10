package com.swara.vault.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.opencsv.CSVReader;
import com.swara.vault.dto.RagaRequest;
import com.swara.vault.dto.RagaDto;
import com.swara.vault.repository.RagaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStreamReader;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ImportService {

    private final RagaService ragaService;
    private final RagaRepository ragaRepository;
    private final ObjectMapper objectMapper;

    public record ImportResult(List<RagaDto> imported, List<String> errors) {}

    @Transactional
    public ImportResult importFile(MultipartFile file) throws Exception {
        String filename = file.getOriginalFilename();
        if (filename == null || filename.isBlank()) {
            throw new IllegalArgumentException("File has no name");
        }
        String lower = filename.toLowerCase();
        if (lower.endsWith(".csv")) return importCsv(file);
        if (lower.endsWith(".json")) return importJson(file);
        throw new IllegalArgumentException("Only CSV and JSON files are supported");
    }

    private ImportResult importCsv(MultipartFile file) throws Exception {
        List<RagaDto> imported = new ArrayList<>();
        List<String> errors = new ArrayList<>();
        try (CSVReader reader = new CSVReader(new InputStreamReader(file.getInputStream()))) {
            String[] header = reader.readNext();
            if (header == null) return new ImportResult(imported, errors);
            String[] row;
            int rowNum = 1;
            while ((row = reader.readNext()) != null) {
                rowNum++;
                if (row.length < 2) continue;
                try {
                    RagaRequest req = parseCsvRow(row);
                    imported.add(ragaService.create(req));
                } catch (Exception e) {
                    errors.add("Row " + rowNum + ": " + e.getMessage());
                }
            }
        }
        return new ImportResult(imported, errors);
    }

    private ImportResult importJson(MultipartFile file) throws Exception {
        List<Map<String, Object>> rows = objectMapper.readValue(
            file.getInputStream(), new TypeReference<>() {});
        List<RagaDto> imported = new ArrayList<>();
        List<String> errors = new ArrayList<>();
        int rowNum = 0;
        for (Map<String, Object> row : rows) {
            rowNum++;
            try {
                RagaRequest req = parseJsonRow(row);
                imported.add(ragaService.create(req));
            } catch (Exception e) {
                errors.add("Entry " + rowNum + ": " + e.getMessage());
            }
        }
        return new ImportResult(imported, errors);
    }

    private RagaRequest parseCsvRow(String[] row) {
        String name = row[0].trim();
        boolean janya = "true".equalsIgnoreCase(row[1].trim());
        UUID janakaId = null;
        if (janya && row.length > 2 && !row[2].isBlank()) {
            janakaId = ragaRepository.findByNameIgnoreCase(row[2].trim())
                .orElseThrow(() -> new IllegalArgumentException("Janaka Raga not found: " + row[2]))
                .getId();
        }
        Integer melakarataNumber = (!janya && row.length > 3 && !row[3].isBlank())
            ? Integer.parseInt(row[3].trim()) : null;
        String arohana = row.length > 4 ? row[4].trim() : null;
        String avarohana = row.length > 5 ? row[5].trim() : null;
        return new RagaRequest(name, janya, janakaId, melakarataNumber, arohana, null, avarohana, null);
    }

    @SuppressWarnings("unchecked")
    private RagaRequest parseJsonRow(Map<String, Object> row) {
        String name = (String) row.get("name");
        boolean janya = Boolean.TRUE.equals(row.get("janya"));
        UUID janakaId = null;
        if (janya && row.containsKey("janakaName")) {
            String janakaName = (String) row.get("janakaName");
            janakaId = ragaRepository.findByNameIgnoreCase(janakaName)
                .orElseThrow(() -> new IllegalArgumentException("Janaka Raga not found: " + janakaName))
                .getId();
        }
        Integer melakarataNumber = row.containsKey("melakarataNumber")
            ? (Integer) row.get("melakarataNumber") : null;
        return new RagaRequest(name, janya, janakaId, melakarataNumber,
            (String) row.get("arohana"), null, (String) row.get("avarohana"), null);
    }
}
