package com.swara.vault.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.opencsv.CSVReader;
import com.swara.vault.dto.RagaRequest;
import com.swara.vault.dto.RagaDto;
import com.swara.vault.repository.RagaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStreamReader;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ImportService {

    private final RagaService ragaService;
    private final RagaRepository ragaRepository;
    private final ObjectMapper objectMapper;

    public List<RagaDto> importFile(MultipartFile file) throws Exception {
        String filename = Objects.requireNonNull(file.getOriginalFilename()).toLowerCase();
        if (filename.endsWith(".csv")) return importCsv(file);
        if (filename.endsWith(".json")) return importJson(file);
        throw new IllegalArgumentException("Only CSV and JSON files are supported");
    }

    private List<RagaDto> importCsv(MultipartFile file) throws Exception {
        List<RagaDto> results = new ArrayList<>();
        try (CSVReader reader = new CSVReader(new InputStreamReader(file.getInputStream()))) {
            String[] header = reader.readNext(); // skip header row
            if (header == null) return results;
            String[] row;
            while ((row = reader.readNext()) != null) {
                if (row.length < 2) continue;
                RagaRequest req = parseCsvRow(row);
                results.add(ragaService.create(req));
            }
        }
        return results;
    }

    private List<RagaDto> importJson(MultipartFile file) throws Exception {
        List<Map<String, Object>> rows = objectMapper.readValue(
            file.getInputStream(), new TypeReference<>() {});
        List<RagaDto> results = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            RagaRequest req = parseJsonRow(row);
            results.add(ragaService.create(req));
        }
        return results;
    }

    private RagaRequest parseCsvRow(String[] row) {
        // CSV columns: name, janya, janaka_name, melakarta_number, arohana, avarohana
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
