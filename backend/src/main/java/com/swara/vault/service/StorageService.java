package com.swara.vault.service;

import com.swara.vault.dto.UploadUrlRequest;
import com.swara.vault.dto.UploadUrlResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.time.Duration;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StorageService {

    private final S3Presigner presigner;

    @Value("${storage.s3.bucket}")
    private String bucket;

    @Value("${storage.s3.public-url}")
    private String publicUrl;

    private static final List<String> ALLOWED_AUDIO_TYPES = List.of(
        "audio/mpeg", "audio/mp4", "audio/wav", "audio/ogg",
        "audio/webm", "audio/flac", "audio/aac", "audio/x-m4a"
    );

    public UploadUrlResponse generateUploadUrl(UploadUrlRequest req) {
        if (ALLOWED_AUDIO_TYPES.stream().noneMatch(req.contentType()::equalsIgnoreCase)) {
            throw new IllegalArgumentException("Content type not permitted: " + req.contentType());
        }
        String fileKey = buildFileKey(req);

        PutObjectRequest putRequest = PutObjectRequest.builder()
            .bucket(bucket)
            .key(fileKey)
            .contentType(req.contentType())
            .build();

        PresignedPutObjectRequest presignedRequest = presigner.presignPutObject(b -> b
            .signatureDuration(Duration.ofMinutes(15))
            .putObjectRequest(putRequest));

        String base = publicUrl.endsWith("/") ? publicUrl.substring(0, publicUrl.length() - 1) : publicUrl;
        String filePublicUrl = base + "/" + fileKey;

        return new UploadUrlResponse(
            presignedRequest.url().toString(),
            filePublicUrl,
            fileKey
        );
    }

    private String buildFileKey(UploadUrlRequest req) {
        String ext = extractExtension(req.filename());
        if (req.compositionId() != null) {
            return "ragas/%s/compositions/%s%s".formatted(req.ragaId(), req.compositionId(), ext);
        }
        return "ragas/%s/%s".formatted(req.ragaId(), sanitize(req.filename()));
    }

    private String extractExtension(String filename) {
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot) : "";
    }

    private String sanitize(String filename) {
        return filename.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
