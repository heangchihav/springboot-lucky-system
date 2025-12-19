package com.example.demo.security.token;

import com.example.demo.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    List<RefreshToken> findByUserAndRevokedFalse(User user);

    List<RefreshToken> findByTokenFamily(String tokenFamily);

    /**
     * Revoke all tokens in a family (theft detection)
     */
    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.revoked = true WHERE rt.tokenFamily = :family")
    void revokeTokenFamily(@Param("family") String family);

    /**
     * Revoke all tokens for a user (logout all devices)
     */
    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.revoked = true WHERE rt.user = :user")
    void revokeAllUserTokens(@Param("user") User user);

    /**
     * Revoke specific device tokens
     */
    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.revoked = true WHERE rt.user = :user AND rt.deviceFingerprint = :fingerprint")
    void revokeDeviceTokens(@Param("user") User user, @Param("fingerprint") String fingerprint);

    /**
     * Delete expired tokens (cleanup job)
     */
    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.expiresAt < :now")
    int deleteExpiredTokens(@Param("now") Instant now);

    /**
     * Count active sessions for a user
     */
    @Query("SELECT COUNT(DISTINCT rt.deviceFingerprint) FROM RefreshToken rt WHERE rt.user = :user AND rt.revoked = false AND rt.used = false AND rt.expiresAt > :now")
    long countActiveDevices(@Param("user") User user, @Param("now") Instant now);

    /**
     * Get active sessions for device management
     */
    @Query("SELECT rt FROM RefreshToken rt WHERE rt.user = :user AND rt.revoked = false AND rt.used = false AND rt.expiresAt > :now ORDER BY rt.lastUsedAt DESC")
    List<RefreshToken> findActiveSessions(@Param("user") User user, @Param("now") Instant now);
}
