package com.example.demo.security.blacklist;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

/**
 * Redis-based token blacklist for immediate token revocation.
 * 
 * Used to blacklist JTIs (JWT IDs) of access tokens that need to be
 * invalidated before their natural expiration.
 * 
 * This is optional but recommended for high-security scenarios where
 * you need immediate logout capability.
 */
@Service
public class TokenBlacklistService {

    private static final Logger log = LoggerFactory.getLogger(TokenBlacklistService.class);
    private static final String BLACKLIST_PREFIX = "token:blacklist:";

    private final StringRedisTemplate redisTemplate;

    @Value("${security.jwt.access-token-expiration-minutes:3}")
    private int accessTokenExpirationMinutes;

    @Value("${security.blacklist.enabled:true}")
    private boolean blacklistEnabled;

    @Value("${security.fail-closed:false}")
    private boolean failClosed;

    public TokenBlacklistService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    /**
     * Add a token's JTI to the blacklist.
     * The entry will automatically expire when the token would have expired.
     * 
     * @param jti The JWT ID to blacklist
     * @param remainingTtlSeconds Remaining time until token expiration
     */
    public void blacklistToken(String jti, long remainingTtlSeconds) {
        if (!blacklistEnabled || jti == null) {
            return;
        }

        try {
            String key = BLACKLIST_PREFIX + jti;
            // Store with TTL slightly longer than token expiration to handle clock skew
            Duration ttl = Duration.ofSeconds(Math.max(remainingTtlSeconds + 60, 60));
            redisTemplate.opsForValue().set(key, "1", ttl);
            log.debug("Blacklisted token JTI: {}", jti);
        } catch (Exception e) {
            log.error("Failed to blacklist token: {}", e.getMessage());
            // Don't throw - blacklist is optional enhancement
        }
    }

    /**
     * Check if a token's JTI is blacklisted.
     * 
     * @param jti The JWT ID to check
     * @return true if blacklisted
     */
    public boolean isBlacklisted(String jti) {
        if (!blacklistEnabled || jti == null) {
            return false;
        }

        try {
            String key = BLACKLIST_PREFIX + jti;
            return Boolean.TRUE.equals(redisTemplate.hasKey(key));
        } catch (Exception e) {
            log.error("Failed to check blacklist: {}", e.getMessage());
            // Configurable: fail closed for high-security deployments
            return failClosed;
        }
    }

    /**
     * Blacklist all tokens for a user by storing their token version.
     * Any token with a version less than this is considered invalid.
     * 
     * @param userId User ID
     * @param tokenVersion New token version
     */
    public void blacklistUserTokens(Long userId, Long tokenVersion) {
        if (!blacklistEnabled) {
            return;
        }

        try {
            String key = "user:token-version:" + userId;
            // Store indefinitely - this is the authoritative version
            redisTemplate.opsForValue().set(key, tokenVersion.toString());
            log.info("Updated token version for user {} to {}", userId, tokenVersion);
        } catch (Exception e) {
            log.error("Failed to update user token version: {}", e.getMessage());
        }
    }

    /**
     * Get the minimum valid token version for a user.
     * 
     * @param userId User ID
     * @return Minimum valid token version, or 0 if not set
     */
    public Long getMinValidTokenVersion(Long userId) {
        if (!blacklistEnabled) {
            return 0L;
        }

        try {
            String key = "user:token-version:" + userId;
            String value = redisTemplate.opsForValue().get(key);
            return value != null ? Long.parseLong(value) : 0L;
        } catch (Exception e) {
            log.error("Failed to get user token version: {}", e.getMessage());
            return 0L;
        }
    }

    public boolean isEnabled() {
        return blacklistEnabled;
    }
}
