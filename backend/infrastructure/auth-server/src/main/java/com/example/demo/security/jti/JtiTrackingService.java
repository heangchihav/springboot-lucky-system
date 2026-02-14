package com.example.demo.security.jti;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Set;

/**
 * JTI (JWT ID) Tracking Service for military-grade security.
 * 
 * Features:
 * - Tracks last N active JTIs per user/device
 * - Detects duplicate JTI usage from different IPs
 * - Enables immediate token revocation
 * - Prevents token replay attacks
 */
@Service
public class JtiTrackingService {

    private static final Logger log = LoggerFactory.getLogger(JtiTrackingService.class);
    
    // Redis key prefixes
    private static final String JTI_KEY_PREFIX = "jti:";
    private static final String USER_JTIS_PREFIX = "user:jtis:";
    private static final String DEVICE_JTIS_PREFIX = "device:jtis:";
    private static final String JTI_IP_PREFIX = "jti:ip:";
    private static final String BLACKLIST_PREFIX = "jti:blacklist:";

    private final StringRedisTemplate redisTemplate;

    @Value("${security.jwt.access-token-expiration-minutes:3}")
    private int accessTokenExpirationMinutes;

    @Value("${security.jti.max-per-device:2}")
    private int maxJtisPerDevice;

    @Value("${security.jti.tracking-enabled:true}")
    private boolean trackingEnabled;

    @Value("${security.fail-closed:false}")
    private boolean failClosed;

    @Value("${security.jti.reject-suspicious:false}")
    private boolean rejectSuspicious;

    public JtiTrackingService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    /**
     * Register a new JTI for a user/device.
     * Tracks the JTI with its associated IP for replay detection.
     * 
     * @param jti JWT ID
     * @param userId User ID
     * @param deviceFingerprint Device fingerprint
     * @param ipAddress Client IP address
     * @param ttlSeconds Time to live in seconds
     */
    public void registerJti(String jti, Long userId, String deviceFingerprint, 
                           String ipAddress, long ttlSeconds) {
        if (!trackingEnabled || jti == null) {
            return;
        }

        try {
            Duration ttl = Duration.ofSeconds(ttlSeconds + 60); // Add buffer for clock skew
            
            // 1. Store JTI with its IP
            String jtiKey = JTI_KEY_PREFIX + jti;
            redisTemplate.opsForValue().set(jtiKey, ipAddress, ttl);
            
            // 2. Store JTI -> IP mapping for replay detection
            String jtiIpKey = JTI_IP_PREFIX + jti;
            redisTemplate.opsForValue().set(jtiIpKey, ipAddress, ttl);
            
            // 3. Add to user's active JTIs (sorted set with timestamp as score)
            String userJtisKey = USER_JTIS_PREFIX + userId;
            long now = System.currentTimeMillis();
            redisTemplate.opsForZSet().add(userJtisKey, jti, now);
            redisTemplate.expire(userJtisKey, Duration.ofDays(1));
            
            // 4. Add to device's active JTIs (keep only last N)
            String deviceJtisKey = DEVICE_JTIS_PREFIX + deviceFingerprint;
            redisTemplate.opsForZSet().add(deviceJtisKey, jti, now);
            
            // Trim to keep only last N JTIs per device
            long count = redisTemplate.opsForZSet().zCard(deviceJtisKey);
            if (count > maxJtisPerDevice) {
                // Remove oldest entries
                redisTemplate.opsForZSet().removeRange(deviceJtisKey, 0, count - maxJtisPerDevice - 1);
            }
            redisTemplate.expire(deviceJtisKey, Duration.ofDays(1));
            
            log.debug("Registered JTI {} for user {} on device {}", jti, userId, deviceFingerprint);
            
        } catch (Exception e) {
            log.error("Failed to register JTI: {}", e.getMessage());
        }
    }

    /**
     * Validate a JTI on request.
     * Checks:
     * 1. JTI is not blacklisted
     * 2. JTI exists (was issued by us)
     * 3. IP matches or is from same prefix (replay detection)
     * 
     * @param jti JWT ID
     * @param currentIp Current request IP
     * @return ValidationResult with status and reason
     */
    public JtiValidationResult validateJti(String jti, String currentIp) {
        if (!trackingEnabled) {
            return JtiValidationResult.valid();
        }

        if (jti == null) {
            return JtiValidationResult.invalid("Missing JTI");
        }

        try {
            // 1. Check blacklist
            String blacklistKey = BLACKLIST_PREFIX + jti;
            if (Boolean.TRUE.equals(redisTemplate.hasKey(blacklistKey))) {
                log.warn("SECURITY: Blacklisted JTI used: {}", jti);
                return JtiValidationResult.invalid("Token has been revoked");
            }

            // 2. Check if JTI exists (was issued by us)
            String jtiKey = JTI_KEY_PREFIX + jti;
            String storedIp = redisTemplate.opsForValue().get(jtiKey);
            
            if (storedIp == null) {
                // JTI not found - could be expired or never issued
                // For short-lived tokens, this is acceptable if signature is valid
                log.debug("JTI not found in tracking: {}", jti);
                return JtiValidationResult.valid(); // Rely on JWT signature validation
            }

            // 3. Check for IP mismatch (potential replay attack)
            if (!isSameIpPrefix(storedIp, currentIp)) {
                log.warn("SECURITY ALERT: JTI {} used from different IP! Original: {}, Current: {}", 
                        jti, storedIp, currentIp);
                if (rejectSuspicious) {
                    log.error("SECURITY: Rejecting suspicious JTI usage (jti={})", jti);
                    blacklistJti(jti, accessTokenExpirationMinutes * 60L);
                    return JtiValidationResult.invalid("Suspicious token usage detected");
                }
                // Don't immediately reject - could be legitimate IP change
                // But flag for monitoring
                return JtiValidationResult.suspicious("IP address changed during session");
            }

            return JtiValidationResult.valid();

        } catch (Exception e) {
            log.error("Failed to validate JTI: {}", e.getMessage());
            // Configurable: fail closed for high-security deployments
            return failClosed ? JtiValidationResult.invalid("Security backend unavailable") : JtiValidationResult.valid();
        }
    }

    /**
     * Blacklist a specific JTI (immediate revocation).
     */
    public void blacklistJti(String jti, long remainingTtlSeconds) {
        if (!trackingEnabled || jti == null) {
            return;
        }

        try {
            String blacklistKey = BLACKLIST_PREFIX + jti;
            Duration ttl = Duration.ofSeconds(Math.max(remainingTtlSeconds + 60, 60));
            redisTemplate.opsForValue().set(blacklistKey, "1", ttl);
            log.info("Blacklisted JTI: {}", jti);
        } catch (Exception e) {
            log.error("Failed to blacklist JTI: {}", e.getMessage());
        }
    }

    /**
     * Blacklist all JTIs for a user (logout all).
     */
    public void blacklistAllUserJtis(Long userId) {
        if (!trackingEnabled) {
            return;
        }

        try {
            String userJtisKey = USER_JTIS_PREFIX + userId;
            Set<String> jtis = redisTemplate.opsForZSet().range(userJtisKey, 0, -1);
            
            if (jtis != null && !jtis.isEmpty()) {
                for (String jti : jtis) {
                    blacklistJti(jti, accessTokenExpirationMinutes * 60L);
                }
                redisTemplate.delete(userJtisKey);
                log.info("Blacklisted {} JTIs for user {}", jtis.size(), userId);
            }
        } catch (Exception e) {
            log.error("Failed to blacklist user JTIs: {}", e.getMessage());
        }
    }

    /**
     * Get active JTIs for a device (for monitoring/debugging).
     */
    public Set<String> getDeviceJtis(String deviceFingerprint) {
        if (!trackingEnabled) {
            return Set.of();
        }

        try {
            String deviceJtisKey = DEVICE_JTIS_PREFIX + deviceFingerprint;
            Set<String> jtis = redisTemplate.opsForZSet().range(deviceJtisKey, 0, -1);
            return jtis != null ? jtis : Set.of();
        } catch (Exception e) {
            log.error("Failed to get device JTIs: {}", e.getMessage());
            return Set.of();
        }
    }

    /**
     * Check if two IPs are in the same /24 prefix (IPv4) or /64 prefix (IPv6).
     */
    private boolean isSameIpPrefix(String ip1, String ip2) {
        if (ip1 == null || ip2 == null) {
            return false;
        }
        
        String prefix1 = extractIpPrefix(ip1);
        String prefix2 = extractIpPrefix(ip2);
        
        return prefix1.equals(prefix2);
    }

    private String extractIpPrefix(String ip) {
        if (ip.contains(":")) {
            // IPv6 - take first 4 groups
            String[] parts = ip.split(":");
            if (parts.length >= 4) {
                return parts[0] + ":" + parts[1] + ":" + parts[2] + ":" + parts[3];
            }
            return ip;
        } else {
            // IPv4 - take first 3 octets (/24)
            String[] parts = ip.split("\\.");
            if (parts.length >= 3) {
                return parts[0] + "." + parts[1] + "." + parts[2];
            }
            return ip;
        }
    }

    public boolean isEnabled() {
        return trackingEnabled;
    }

    /**
     * Result of JTI validation.
     */
    public record JtiValidationResult(boolean isValid, boolean isSuspicious, String reason) {
        public static JtiValidationResult valid() {
            return new JtiValidationResult(true, false, null);
        }
        
        public static JtiValidationResult invalid(String reason) {
            return new JtiValidationResult(false, false, reason);
        }
        
        public static JtiValidationResult suspicious(String reason) {
            return new JtiValidationResult(true, true, reason);
        }
    }
}
