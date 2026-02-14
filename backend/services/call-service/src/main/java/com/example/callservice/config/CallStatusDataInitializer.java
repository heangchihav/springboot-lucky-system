package com.example.callservice.config;

import com.example.callservice.entity.callstatus.CallStatus;
import com.example.callservice.repository.callstatus.CallStatusRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
@Order(2) // Run after PermissionDataInitializer
public class CallStatusDataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(CallStatusDataInitializer.class);

    private final CallStatusRepository callStatusRepository;

    public CallStatusDataInitializer(CallStatusRepository callStatusRepository) {
        this.callStatusRepository = callStatusRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        initializeCallStatuses();
    }

    private void initializeCallStatuses() {
        logger.info("Initializing default call statuses...");

        List<CallStatus> defaultStatuses = Arrays.asList(
                new CallStatus("not-called-yet", "មិនទាន់តេ", "system"),
                new CallStatus("called", "តេរួច", "system"),
                new CallStatus("no-answer", "តេមិនលើក", "system"),
                new CallStatus("call-not-connected", "តេមិនចូល", "system"),
                new CallStatus("delivered-to-customer", "ដឹកដល់ផ្ទះ", "system")
        );

        logger.info("Processing {} default call statuses", defaultStatuses.size());

        // Check existing statuses
        long existingCount = callStatusRepository.count();
        logger.info("Found {} existing call statuses in database", existingCount);

        int createdCount = 0;
        int skippedCount = 0;

        for (CallStatus status : defaultStatuses) {
            try {
                logger.info("Checking call status: {}", status.getKey());

                // Check if status already exists
                if (callStatusRepository.existsByKey(status.getKey())) {
                    skippedCount++;
                    logger.info("Call status already exists, skipping: {}", status.getKey());
                    continue;
                }

                // Create new status
                logger.info("Creating new call status: {} - {}", status.getKey(), status.getLabel());
                callStatusRepository.save(status);
                createdCount++;
                logger.info("Created new call status: {}", status.getKey());
            } catch (Exception e) {
                logger.error("Failed to create call status {}: {}", status.getKey(), e.getMessage());
            }
        }

        logger.info("Call status initialization complete: {} created, {} skipped", createdCount, skippedCount);

        long totalStatuses = callStatusRepository.count();
        logger.info("Successfully initialized {} call statuses for call-service", totalStatuses);
    }
}
