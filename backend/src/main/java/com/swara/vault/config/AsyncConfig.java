package com.swara.vault.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;

@Configuration
@EnableAsync
public class AsyncConfig {

    /**
     * Single-writer app: one worker is enough, and serializing backups means two
     * overlapping mutations produce one redundant upload rather than a race.
     */
    @Bean("snapshotExecutor")
    public Executor snapshotExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(1);
        executor.setMaxPoolSize(1);
        executor.setQueueCapacity(Integer.MAX_VALUE);
        executor.setThreadNamePrefix("snapshot-backup-");
        executor.initialize();
        return executor;
    }

    @Bean
    public ScheduledExecutorService snapshotRetryScheduler() {
        return Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "snapshot-retry");
            t.setDaemon(true);
            return t;
        });
    }
}
