package com.example.demo.security.token;

import com.example.demo.user.User;
import jakarta.persistence.*;
import java.time.Instant;

/**
 * Refresh token entity with device binding for military-grade security.
 * - Token is stored as SHA-256 hash (never plain text)
 * - Bound to specific device fingerprint
 * - Supports token rotation (family tracking)
 * - Automatic expiration
 */
@Entity
@Table(name = "refresh_tokens", indexes = {
    @Index(name = "idx_refresh_token_hash", columnList = "tokenHash"),
    @Index(name = "idx_refresh_token_user", columnList = "user_id"),
    @Index(name = "idx_refresh_token_family", columnList = "tokenFamily")
})
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * SHA-256 hash of the actual token - never store plain text
     */
    @Column(nullable = false, unique = true, length = 64)
    private String tokenHash;

    /**
     * Token family ID for rotation tracking.
     * All tokens in a rotation chain share the same family.
     * If a token is reused, the entire family is invalidated (theft detection).
     */
    @Column(nullable = false, length = 36)
    private String tokenFamily;

    /**
     * The user this token belongs to
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * Device fingerprint - combination of User-Agent, IP prefix, etc.
     * Token is only valid when used from the same device.
     */
    @Column(nullable = false, length = 64)
    private String deviceFingerprint;

    /**
     * Human-readable device name for user's device management UI
     */
    @Column(length = 255)
    private String deviceName;

    /**
     * IP address at token creation (for audit)
     */
    @Column(length = 45)
    private String ipAddress;

    /**
     * IP prefix (/24 for IPv4, /64 for IPv6) - used for validation
     */
    @Column(nullable = false, length = 45)
    private String ipPrefix;

    /**
     * SHA-256 hash of User-Agent - used for validation
     */
    @Column(nullable = false, length = 64)
    private String userAgentHash;

    /**
     * Client-provided device ID (optional, for mobile apps)
     */
    @Column(length = 64)
    private String deviceId;

    /**
     * Token creation timestamp
     */
    @Column(nullable = false)
    private Instant createdAt;

    /**
     * Token expiration timestamp
     */
    @Column(nullable = false)
    private Instant expiresAt;

    /**
     * Last used timestamp - updated on each refresh
     */
    private Instant lastUsedAt;

    /**
     * Whether this token has been used (for rotation)
     * Once used, a new token is issued and this becomes invalid
     */
    @Column(nullable = false)
    private boolean used = false;

    /**
     * Whether this token has been revoked
     */
    @Column(nullable = false)
    private boolean revoked = false;

    /**
     * User's token version at creation time.
     * If user.tokenVersion > this, token is invalid.
     */
    @Column(nullable = false)
    private Long userTokenVersion;

    // ========== CONSTRUCTORS ==========

    public RefreshToken() {
        this.createdAt = Instant.now();
    }

    // ========== BUSINESS METHODS ==========

    public boolean isExpired() {
        return Instant.now().isAfter(expiresAt);
    }

    public boolean isValid() {
        return !revoked && !used && !isExpired();
    }

    /**
     * Check if token version matches user's current version
     */
    public boolean isTokenVersionValid(Long currentUserTokenVersion) {
        return this.userTokenVersion.equals(currentUserTokenVersion);
    }

    // ========== GETTERS & SETTERS ==========

    public Long getId() { return id; }

    public String getTokenHash() { return tokenHash; }
    public void setTokenHash(String tokenHash) { this.tokenHash = tokenHash; }

    public String getTokenFamily() { return tokenFamily; }
    public void setTokenFamily(String tokenFamily) { this.tokenFamily = tokenFamily; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getDeviceFingerprint() { return deviceFingerprint; }
    public void setDeviceFingerprint(String deviceFingerprint) { this.deviceFingerprint = deviceFingerprint; }

    public String getDeviceName() { return deviceName; }
    public void setDeviceName(String deviceName) { this.deviceName = deviceName; }

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }

    public Instant getLastUsedAt() { return lastUsedAt; }
    public void setLastUsedAt(Instant lastUsedAt) { this.lastUsedAt = lastUsedAt; }

    public boolean isUsed() { return used; }
    public void setUsed(boolean used) { this.used = used; }

    public boolean isRevoked() { return revoked; }
    public void setRevoked(boolean revoked) { this.revoked = revoked; }

    public Long getUserTokenVersion() { return userTokenVersion; }
    public void setUserTokenVersion(Long userTokenVersion) { this.userTokenVersion = userTokenVersion; }

    public String getIpPrefix() { return ipPrefix; }
    public void setIpPrefix(String ipPrefix) { this.ipPrefix = ipPrefix; }

    public String getUserAgentHash() { return userAgentHash; }
    public void setUserAgentHash(String userAgentHash) { this.userAgentHash = userAgentHash; }

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }
}
