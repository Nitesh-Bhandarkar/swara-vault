package com.swara.vault.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * Schedules an S3 snapshot backup after a raga/composition mutation commits. Dedupes
 * within a single transaction so a batch import (many ragaService.create() calls inside
 * one outer @Transactional) triggers exactly one backup, not one per row.
 */
@Component
@RequiredArgsConstructor
public class SnapshotTrigger {

    private static final String SCHEDULED_RESOURCE_KEY = SnapshotTrigger.class.getName() + ".SCHEDULED";
    private static final Object SCHEDULED_MARKER = new Object();

    private final S3SnapshotService s3SnapshotService;

    public void scheduleBackup() {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            s3SnapshotService.backupAsync();
            return;
        }
        if (TransactionSynchronizationManager.hasResource(SCHEDULED_RESOURCE_KEY)) {
            return;
        }
        TransactionSynchronizationManager.bindResource(SCHEDULED_RESOURCE_KEY, SCHEDULED_MARKER);
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                s3SnapshotService.backupAsync();
            }
        });
    }
}
