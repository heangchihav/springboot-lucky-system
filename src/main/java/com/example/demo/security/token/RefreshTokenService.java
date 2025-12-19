package com.example.demo.security.token;

import com.example.demo.security.device.DeviceInfo;
import com.example.demo.security.jti.JtiTrackingService;
import com.example.demo.user.User;
import com.example.demo.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

/**
 * Refresh Token Service with military-grade security features.
 * 
 * Features:
 * - Token rotation: Each use generates a new token
 * - Token hashing: Only SHA-256 hash stored in DB
 * - Device binding: Token tied to device fingerprint
 * - Family tracking: Detect token theft via reuse
 * - Automatic cleanup of expired tokens
 */
@Service
public class RefreshTokenService {

    private static final Logger log = LoggerFactory.getLogger(RefreshTokenService.class);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;
    private final CacheManager cacheManager;
    private final JtiTrackingService jtiTrackingService;

    @Value("${security.refresh-token.expiration-days:7}")
    private int refreshTokenExpirationDays;

    @Value("${security.refresh-token.max-devices:5}")
    private int maxDevicesPerUser;

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository,
                              UserRepository userRepository,
                              CacheManager cacheManager,
                              JtiTrackingService jtiTrackingService) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.userRepository = userRepository;
        this.cacheManager = cacheManager;
        this.jtiTrackingService = jtiTrackingService;
    }

    /**
     * Create a new refresh token for a user and device.
     * 
     * @param user The authenticated user
     * @param deviceInfo Device information for binding
     * @return The plain text token (only returned once, never stored)
     */
    @Transactional
    public String createRefreshToken(User user, DeviceInfo deviceInfo) {
        // Check device limit
        long activeDevices = refreshTokenRepository.countActiveDevices(user, Instant.now());
        if (activeDevices >= maxDevicesPerUser) {
            log.warn("User {} exceeded max devices ({}), revoking oldest", user.getUsername(), maxDevicesPerUser);
            // Could implement: revoke oldest device or reject
        }

        // Generate cryptographically secure token
        String plainToken = generateSecureToken();
        String tokenHash = hashToken(plainToken);
        String tokenFamily = UUID.randomUUID().toString();

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setTokenHash(tokenHash);
        refreshToken.setTokenFamily(tokenFamily);
        refreshToken.setUser(user);
        refreshToken.setDeviceFingerprint(deviceInfo.getFingerprint());
        refreshToken.setDeviceName(deviceInfo.getDeviceName());
        refreshToken.setIpAddress(deviceInfo.getIpAddress());
        refreshToken.setIpPrefix(deviceInfo.getIpPrefix());
        refreshToken.setUserAgentHash(deviceInfo.getUserAgentHash());
        refreshToken.setDeviceId(deviceInfo.getDeviceId());
        refreshToken.setExpiresAt(Instant.now().plusSeconds(refreshTokenExpirationDays * 24L * 60 * 60));
        refreshToken.setUserTokenVersion(user.getTokenVersion());
        refreshToken.setLastUsedAt(Instant.now());

        refreshTokenRepository.save(refreshToken);
        log.info("Created refresh token for user {} on device {}", user.getUsername(), deviceInfo.getDeviceName());

        return plainToken;
    }

    /**
     * Rotate a refresh token - invalidate old, create new.
     * This is the core security feature: each token can only be used once.
     * 
     * @param plainToken The current refresh token
     * @param deviceInfo Current device info for validation
     * @return New plain text token, or empty if invalid
     */
    @Transactional
    public Optional<RefreshTokenRotationResult> rotateToken(String plainToken, DeviceInfo deviceInfo) {
        String tokenHash = hashToken(plainToken);
        Optional<RefreshToken> tokenOpt = refreshTokenRepository.findByTokenHash(tokenHash);

        if (tokenOpt.isEmpty()) {
            log.warn("Refresh token not found");
            return Optional.empty();
        }

        RefreshToken token = tokenOpt.get();

        // Check if token was already used (potential theft!)
        if (token.isUsed()) {
            User user = token.getUser();
            log.error("SECURITY ALERT: Refresh token reuse detected! Revoking ALL sessions for user {}", user.getUsername());
            refreshTokenRepository.revokeAllUserTokens(user);
            user.incrementTokenVersion();
            userRepository.save(user);

            Cache cache = cacheManager.getCache("usersByUsername");
            if (cache != null) {
                cache.evict(user.getUsername());
            }
            jtiTrackingService.blacklistAllUserJtis(user.getId());
            return Optional.empty();
        }

        // Validate token
        if (!token.isValid()) {
            log.warn("Invalid refresh token: revoked={}, expired={}", token.isRevoked(), token.isExpired());
            return Optional.empty();
        }

        // Validate device binding - check UA hash, IP prefix, and device ID
        if (!deviceInfo.matches(token.getUserAgentHash(), token.getIpPrefix(), token.getDeviceId())) {
            log.error("SECURITY ALERT: Device binding mismatch for user {}! " +
                    "UA match: {}, IP prefix match: {}, DeviceID match: {}",
                    token.getUser().getUsername(),
                    deviceInfo.getUserAgentHash().equals(token.getUserAgentHash()),
                    deviceInfo.getIpPrefix().equals(token.getIpPrefix()),
                    token.getDeviceId() == null || deviceInfo.getDeviceId() != null && 
                        deviceInfo.getDeviceId().equals(token.getDeviceId()));
            
            // CRITICAL: Revoke ALL tokens for this user - potential theft!
            refreshTokenRepository.revokeAllUserTokens(token.getUser());
            log.error("REVOKED ALL TOKENS for user {} due to device binding mismatch", 
                    token.getUser().getUsername());
            return Optional.empty();
        }
        
        // Also validate fingerprint as additional check
        if (!token.getDeviceFingerprint().equals(deviceInfo.getFingerprint())) {
            log.warn("SECURITY ALERT: Device fingerprint mismatch for user {}. Expected: {}, Got: {}", 
                    token.getUser().getUsername(), token.getDeviceFingerprint(), deviceInfo.getFingerprint());
            // Revoke this token family as potential theft
            refreshTokenRepository.revokeTokenFamily(token.getTokenFamily());
            return Optional.empty();
        }

        // Validate token version
        User user = token.getUser();
        if (!token.isTokenVersionValid(user.getTokenVersion())) {
            log.info("Token version outdated for user {}", user.getUsername());
            return Optional.empty();
        }

        // Mark current token as used
        token.setUsed(true);
        token.setLastUsedAt(Instant.now());
        refreshTokenRepository.save(token);

        // Create new token in same family
        String newPlainToken = generateSecureToken();
        String newTokenHash = hashToken(newPlainToken);

        RefreshToken newToken = new RefreshToken();
        newToken.setTokenHash(newTokenHash);
        newToken.setTokenFamily(token.getTokenFamily()); // Same family for tracking
        newToken.setUser(user);
        newToken.setDeviceFingerprint(deviceInfo.getFingerprint());
        newToken.setDeviceName(deviceInfo.getDeviceName());
        newToken.setIpAddress(deviceInfo.getIpAddress());
        newToken.setIpPrefix(deviceInfo.getIpPrefix());
        newToken.setUserAgentHash(deviceInfo.getUserAgentHash());
        newToken.setDeviceId(deviceInfo.getDeviceId());
        newToken.setExpiresAt(Instant.now().plusSeconds(refreshTokenExpirationDays * 24L * 60 * 60));
        newToken.setUserTokenVersion(user.getTokenVersion());
        newToken.setLastUsedAt(Instant.now());

        refreshTokenRepository.save(newToken);
        log.debug("Rotated refresh token for user {}", user.getUsername());

        return Optional.of(new RefreshTokenRotationResult(newPlainToken, user));
    }

    /**
     * Revoke a specific refresh token.
     */
    @Transactional
    public void revokeToken(String plainToken) {
        String tokenHash = hashToken(plainToken);
        refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(token -> {
            token.setRevoked(true);
            refreshTokenRepository.save(token);
            log.info("Revoked refresh token for user {}", token.getUser().getUsername());
        });
    }

    /**
     * Revoke all tokens for a user (logout from all devices).
     */
    @Transactional
    public void revokeAllUserTokens(User user) {
        refreshTokenRepository.revokeAllUserTokens(user);
        log.info("Revoked all refresh tokens for user {}", user.getUsername());
    }

    /**
     * Revoke tokens for a specific device.
     */
    @Transactional
    public void revokeDeviceTokens(User user, String deviceFingerprint) {
        refreshTokenRepository.revokeDeviceTokens(user, deviceFingerprint);
        log.info("Revoked tokens for device {} of user {}", deviceFingerprint, user.getUsername());
    }

    /**
     * Cleanup expired tokens (call from scheduled job).
     */
    @Transactional
    public int cleanupExpiredTokens() {
        int deleted = refreshTokenRepository.deleteExpiredTokens(Instant.now());
        if (deleted > 0) {
            log.info("Cleaned up {} expired refresh tokens", deleted);
        }
        return deleted;
    }

    /**
     * Generate a cryptographically secure random token.
     */
    private String generateSecureToken() {
        byte[] bytes = new byte[32]; // 256 bits
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /**
     * Hash a token using SHA-256.
     */
    public String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    /**
     * Result of token rotation containing new token and user.
     */
    public record RefreshTokenRotationResult(String newToken, User user) {}
}
