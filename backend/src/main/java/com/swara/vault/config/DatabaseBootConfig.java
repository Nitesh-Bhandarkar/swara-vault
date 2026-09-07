package com.swara.vault.config;

import com.swara.vault.service.S3SnapshotService;
import org.flywaydb.core.Flyway;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Replaces Flyway's default unconditional migrate() call. On boot, tries to restore the
 * H2 database from the latest S3 snapshot (docs/adr/0001-postgres-to-h2-migration.md);
 * only runs the V1-V5 migrations from scratch when no snapshot is available (first-ever
 * boot). A restored snapshot already contains the full schema+data at the current
 * migration end-state, so there is nothing left for Flyway to do in that case.
 */
@Configuration
public class DatabaseBootConfig {

    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy(S3SnapshotService snapshotService) {
        return (Flyway flyway) -> {
            if (!snapshotService.restoreFromSnapshotIfPresent()) {
                flyway.migrate();
            }
        };
    }
}
