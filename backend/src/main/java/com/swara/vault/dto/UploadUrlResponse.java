package com.swara.vault.dto;

public record UploadUrlResponse(
    String uploadUrl,
    String publicUrl,
    String fileKey
) {}
