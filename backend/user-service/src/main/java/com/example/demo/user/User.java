package com.example.demo.user;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String password;

    private String fullName;

    // ========== SECURITY FIELDS ==========
    
    /**
     * Token version - increment to invalidate ALL tokens for this user.
     * Used in JWT 'ver' claim for global session revocation.
     */
    @Column(columnDefinition = "BIGINT DEFAULT 0")
    private Long tokenVersion = 0L;

    /**
     * Account locked status - for brute force protection
     */
    @Column(columnDefinition = "BOOLEAN DEFAULT FALSE")
    private boolean accountLocked = false;

    /**
     * Failed login attempts counter
     */
    @Column(columnDefinition = "INT DEFAULT 0")
    private int failedLoginAttempts = 0;

    /**
     * Lock expiry time - null if not locked
     */
    private Instant lockExpiresAt;

    /**
     * Last successful login timestamp
     */
    private Instant lastLoginAt;

    /**
     * Last password change timestamp
     */
    private Instant passwordChangedAt;

    /**
     * Account enabled status
     */
    @Column(columnDefinition = "BOOLEAN DEFAULT TRUE")
    private boolean enabled = true;

    @PrePersist
    @PreUpdate
    private void ensureDefaults() {
        if (tokenVersion == null) tokenVersion = 0L;
    }

    // ========== GETTERS & SETTERS ==========

    public Long getId() { return id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public Long getTokenVersion() { return tokenVersion; }
    public void setTokenVersion(Long tokenVersion) { this.tokenVersion = tokenVersion; }

    public boolean isAccountLocked() { return accountLocked; }
    public void setAccountLocked(boolean accountLocked) { this.accountLocked = accountLocked; }

    public int getFailedLoginAttempts() { return failedLoginAttempts; }
    public void setFailedLoginAttempts(int failedLoginAttempts) { this.failedLoginAttempts = failedLoginAttempts; }

    public Instant getLockExpiresAt() { return lockExpiresAt; }
    public void setLockExpiresAt(Instant lockExpiresAt) { this.lockExpiresAt = lockExpiresAt; }

    public Instant getLastLoginAt() { return lastLoginAt; }
    public void setLastLoginAt(Instant lastLoginAt) { this.lastLoginAt = lastLoginAt; }

    public Instant getPasswordChangedAt() { return passwordChangedAt; }
    public void setPasswordChangedAt(Instant passwordChangedAt) { this.passwordChangedAt = passwordChangedAt; }

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    /**
     * Increment token version to invalidate all existing tokens
     */
    public void incrementTokenVersion() {
        this.tokenVersion++;
    }

    /**
     * Check if account lock has expired
     */
    public boolean isLockExpired() {
        return lockExpiresAt != null && Instant.now().isAfter(lockExpiresAt);
    }
}