package com.swara.vault.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.*;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.net.URI;

@Configuration
public class StorageConfig {

    @Value("${storage.s3.endpoint:}")
    private String endpoint;

    @Value("${storage.s3.access-key:}")
    private String accessKey;

    @Value("${storage.s3.secret-key:}")
    private String secretKey;

    @Value("${storage.s3.region:us-east-1}")
    private String region;

    @Bean
    public S3Client s3Client() {
        var builder = S3Client.builder().region(Region.of(region));
        if (!endpoint.isBlank()) builder.endpointOverride(URI.create(endpoint));
        if (!accessKey.isBlank())
            builder.credentialsProvider(StaticCredentialsProvider.create(
                AwsBasicCredentials.create(accessKey, secretKey)));
        return builder.build();
    }

    @Bean
    public S3Presigner s3Presigner() {
        var builder = S3Presigner.builder().region(Region.of(region));
        if (!endpoint.isBlank()) builder.endpointOverride(URI.create(endpoint));
        if (!accessKey.isBlank())
            builder.credentialsProvider(StaticCredentialsProvider.create(
                AwsBasicCredentials.create(accessKey, secretKey)));
        return builder.build();
    }
}
