package com.swara.vault.controller;

import com.swara.vault.dto.UploadUrlRequest;
import com.swara.vault.dto.UploadUrlResponse;
import com.swara.vault.service.StorageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/storage")
@RequiredArgsConstructor
public class StorageController {

    private final StorageService storageService;

    @PostMapping("/upload-url")
    public UploadUrlResponse getUploadUrl(@Valid @RequestBody UploadUrlRequest req) {
        return storageService.generateUploadUrl(req);
    }
}
