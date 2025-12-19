package com.example.demo.security.scheduled;

import com.example.demo.security.token.RefreshTokenService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduled task for cleaning up expired refresh tokens.
 * Runs every hour to remove expired tokens from the database.
 */
@Component
public class TokenCleanupTask {

    private static final Logger log = LoggerFactory.getLogger(TokenCleanupTask.class);

    private final RefreshTokenService refreshTokenService;

    public TokenCleanupTask(RefreshTokenService refreshTokenService) {
        this.refreshTokenService = refreshTokenService;
    }

    /**
     * Clean up expired refresh tokens every hour.
     */
    @Scheduled(fixedRate = 3600000) // Every hour
    public void cleanupExpiredTokens() {
        log.debug("Running scheduled token cleanup");
        int deleted = refreshTokenService.cleanupExpiredTokens();
        if (deleted > 0) {
            log.info("Scheduled cleanup removed {} expired tokens", deleted);
        }
    }
}
