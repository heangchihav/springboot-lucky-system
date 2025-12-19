package com.example.demo.security.ratelimit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

/**
 * Rate Limiting Service using Redis sliding window algorithm.
 * 
 * Protects endpoints from abuse:
 * - /login: 5/min (brute force protection)
 * - /refresh: 10/min (token abuse)
 * - /logout: 5/min (DoS protection)
 * - /me: 60/min (API abuse)
 */
@Service
public class RateLimitService {

    private static final Logger log = LoggerFactory.getLogger(RateLimitService.class);
    private static final String RATE_LIMIT_PREFIX = "ratelimit:";

    private final StringRedisTemplate redisTemplate;

    public RateLimitService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    /**
     * Check if request is allowed under rate limit.
     * Uses sliding window counter algorithm.
     * 
     * @param key Unique identifier (e.g., IP, user ID, endpoint)
     * @param limit Maximum requests allowed
     * @param windowSeconds Time window in seconds
     * @return RateLimitResult with allowed status and remaining requests
     */
    public RateLimitResult checkRateLimit(String key, int limit, int windowSeconds) {
        try {
            String redisKey = RATE_LIMIT_PREFIX + key;
            long now = System.currentTimeMillis();
            long windowStart = now - (windowSeconds * 1000L);

            // Remove old entries outside the window
            redisTemplate.opsForZSet().removeRangeByScore(redisKey, 0, windowStart);

            // Count current requests in window
            Long count = redisTemplate.opsForZSet().zCard(redisKey);
            if (count == null) count = 0L;

            if (count >= limit) {
                // Rate limit exceeded
                log.warn("Rate limit exceeded for key: {} ({}/{})", key, count, limit);
                return new RateLimitResult(false, 0, calculateRetryAfter(redisKey, windowStart));
            }

            // Add current request
            redisTemplate.opsForZSet().add(redisKey, String.valueOf(now), now);
            redisTemplate.expire(redisKey, Duration.ofSeconds(windowSeconds + 10));

            int remaining = (int) (limit - count - 1);
            return new RateLimitResult(true, remaining, 0);

        } catch (Exception e) {
            log.error("Rate limit check failed: {}", e.getMessage());
            // Fail open - allow request if Redis is down
            return new RateLimitResult(true, limit, 0);
        }
    }

    /**
     * Check rate limit for login endpoint.
     * 5 requests per minute per IP.
     */
    public RateLimitResult checkLoginLimit(String ipAddress) {
        return checkRateLimit("login:" + ipAddress, 5, 60);
    }

    /**
     * Check rate limit for refresh endpoint.
     * 10 requests per minute per IP.
     */
    public RateLimitResult checkRefreshLimit(String ipAddress) {
        return checkRateLimit("refresh:" + ipAddress, 10, 60);
    }

    /**
     * Check rate limit for logout endpoint.
     * 5 requests per minute per IP.
     */
    public RateLimitResult checkLogoutLimit(String ipAddress) {
        return checkRateLimit("logout:" + ipAddress, 5, 60);
    }

    /**
     * Check rate limit for /me endpoint.
     * 60 requests per minute per user.
     */
    public RateLimitResult checkMeLimit(String userId) {
        return checkRateLimit("me:" + userId, 60, 60);
    }

    /**
     * Check rate limit for general API access.
     * 100 requests per minute per IP.
     */
    public RateLimitResult checkApiLimit(String ipAddress) {
        return checkRateLimit("api:" + ipAddress, 100, 60);
    }

    /**
     * Calculate seconds until rate limit resets.
     */
    private long calculateRetryAfter(String redisKey, long windowStart) {
        try {
            // Get oldest entry in current window
            var oldest = redisTemplate.opsForZSet().rangeWithScores(redisKey, 0, 0);
            if (oldest != null && !oldest.isEmpty()) {
                var entry = oldest.iterator().next();
                if (entry.getScore() != null) {
                    long oldestTime = entry.getScore().longValue();
                    long retryAfter = (oldestTime - windowStart) / 1000;
                    return Math.max(retryAfter, 1);
                }
            }
        } catch (Exception e) {
            log.debug("Failed to calculate retry after: {}", e.getMessage());
        }
        return 60; // Default to 60 seconds
    }

    /**
     * Result of rate limit check.
     */
    public record RateLimitResult(boolean allowed, int remaining, long retryAfterSeconds) {
        public boolean isAllowed() {
            return allowed;
        }
    }
}
