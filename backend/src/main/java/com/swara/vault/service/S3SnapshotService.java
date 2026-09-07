package com.swara.vault.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import javax.sql.DataSource;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Loads and persists the H2 in-memory database as a plain-SQL snapshot in S3, per
 * docs/adr/0001-postgres-to-h2-migration.md. On boot, {@link #restoreFromSnapshotIfPresent()}
 * restores prior state; after every mutation, {@link #backupAsync()} re-uploads a full
 * snapshot in the background, retrying transient failures with exponential backoff.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class S3SnapshotService {

    private static final int MAX_RETRIES = 2;
    private static final long BASE_DELAY_MS = 2000;

    private final S3Client s3Client;
    private final DataSource dataSource;
    private final ScheduledExecutorService snapshotRetryScheduler;

    @Value("${storage.s3.bucket}")
    private String bucket;

    @Value("${storage.s3.snapshot-key}")
    private String snapshotKey;

    /**
     * Fetches the snapshot object from S3 and RUNSCRIPT-loads it into H2. Returns false
     * (never throws) if no snapshot exists yet or S3 is unreachable — both cases mean the
     * caller should fall back to a fresh Flyway migration.
     */
    public boolean restoreFromSnapshotIfPresent() {
        Path tempFile = null;
        try {
            tempFile = Files.createTempFile("h2-snapshot-restore-", ".sql");
            GetObjectRequest request = GetObjectRequest.builder().bucket(bucket).key(snapshotKey).build();
            try (ResponseInputStream<GetObjectResponse> in = s3Client.getObject(request)) {
                Files.copy(in, tempFile, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            }
            runScriptFrom(tempFile);
            log.info("Restored H2 snapshot from s3://{}/{}", bucket, snapshotKey);
            return true;
        } catch (Exception e) {
            log.warn("No usable snapshot at s3://{}/{} ({}) — falling back to Flyway migration",
                bucket, snapshotKey, e.getMessage());
            return false;
        } finally {
            deleteQuietly(tempFile);
        }
    }

    /** Fire-and-forget entry point called by mutation hooks after a committed write. */
    @Async("snapshotExecutor")
    public void backupAsync() {
        attemptBackup(0);
    }

    private void attemptBackup(int attempt) {
        try {
            uploadSnapshot();
            log.info("Snapshot backup uploaded to s3://{}/{} (attempt {})", bucket, snapshotKey, attempt);
        } catch (Exception e) {
            if (attempt >= MAX_RETRIES) {
                log.error("Snapshot backup failed after {} retries, giving up", MAX_RETRIES, e);
                return;
            }
            long delay = BASE_DELAY_MS * (1L << attempt); // 2s, then 4s
            log.warn("Snapshot backup attempt {} failed, retrying in {}ms", attempt, delay, e);
            snapshotRetryScheduler.schedule(() -> attemptBackup(attempt + 1), delay, TimeUnit.MILLISECONDS);
        }
    }

    private void uploadSnapshot() throws SQLException, IOException {
        Path tempFile = Files.createTempFile("h2-snapshot-backup-", ".sql");
        try {
            scriptTo(tempFile);
            PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucket)
                .key(snapshotKey)
                .contentType("application/sql")
                .build();
            s3Client.putObject(request, RequestBody.fromFile(tempFile));
        } finally {
            deleteQuietly(tempFile);
        }
    }

    private void scriptTo(Path path) throws SQLException {
        execute("SCRIPT TO '" + path.toAbsolutePath() + "'");
    }

    private void runScriptFrom(Path path) throws SQLException {
        execute("RUNSCRIPT FROM '" + path.toAbsolutePath() + "'");
    }

    private void execute(String sql) throws SQLException {
        try (Connection conn = dataSource.getConnection(); Statement stmt = conn.createStatement()) {
            stmt.execute(sql);
        }
    }

    private void deleteQuietly(Path path) {
        if (path == null) return;
        try {
            Files.deleteIfExists(path);
        } catch (IOException e) {
            log.warn("Could not delete temp snapshot file {}", path, e);
        }
    }
}
