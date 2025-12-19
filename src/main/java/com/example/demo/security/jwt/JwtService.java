package com.example.demo.security.jwt;

import com.example.demo.user.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

/**
 * JWT Service for military-grade token management.
 * 
 * Features:
 * - Short-lived access tokens (3 minutes default)
 * - JTI (JWT ID) for token uniqueness and blacklisting
 * - VER claim for token version validation
 * - Secure key derivation
 */
@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);

    @Value("${security.jwt.secret}")
    private String jwtSecret;

    @Value("${security.jwt.access-token-expiration-minutes:3}")
    private int accessTokenExpirationMinutes;

    @Value("${security.jwt.issuer:secure-app}")
    private String issuer;

    private SecretKey signingKey;

    @PostConstruct
    public void init() {
        // Derive a secure key from the secret
        // For production, use at least 256-bit key
        if (jwtSecret.length() < 32) {
            throw new IllegalStateException("JWT secret must be at least 32 characters for HS256");
        }
        this.signingKey = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        log.info("JWT Service initialized with {} minute access token expiration", accessTokenExpirationMinutes);
    }

    /**
     * Generate a short-lived access token with security claims.
     * 
     * @param user The authenticated user
     * @return JWT access token
     */
    public String generateAccessToken(User user) {
        return generateAccessToken(user, null);
    }

    public String generateAccessToken(User user, String deviceFingerprint) {
        Instant now = Instant.now();
        Instant expiration = now.plusSeconds(accessTokenExpirationMinutes * 60L);

        JwtBuilder builder = Jwts.builder()
                .header()
                    .type("JWT")
                    .and()
                .subject(user.getUsername())
                .issuer(issuer)
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiration))
                // JTI - unique token ID for blacklisting
                .id(UUID.randomUUID().toString())
                // VER - token version for global invalidation
                .claim("ver", user.getTokenVersion())
                // User ID for quick lookup
                .claim("uid", user.getId())
                .signWith(signingKey, Jwts.SIG.HS256);

        if (deviceFingerprint != null && !deviceFingerprint.isBlank()) {
            builder.claim("dfp", deviceFingerprint);
        }

        return builder.compact();
    }

    /**
     * Parse and validate an access token.
     * 
     * @param token The JWT token string
     * @return Parsed claims if valid
     * @throws JwtException if token is invalid
     */
    public Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .requireIssuer(issuer)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Validate token and check version against user's current version.
     * 
     * @param token The JWT token
     * @param currentTokenVersion User's current token version
     * @return true if token is valid and version matches
     */
    public boolean validateToken(String token, Long currentTokenVersion) {
        try {
            Claims claims = parseToken(token);
            Long tokenVersion = claims.get("ver", Long.class);
            
            // Check if token version matches user's current version
            if (tokenVersion == null || !tokenVersion.equals(currentTokenVersion)) {
                log.debug("Token version mismatch: token={}, current={}", tokenVersion, currentTokenVersion);
                return false;
            }
            
            return true;
        } catch (ExpiredJwtException e) {
            log.debug("Token expired: {}", e.getMessage());
            return false;
        } catch (JwtException e) {
            log.warn("Invalid token: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Extract username from token without full validation.
     * Used for initial lookup before version check.
     */
    public String extractUsername(String token) {
        try {
            return parseToken(token).getSubject();
        } catch (JwtException e) {
            return null;
        }
    }

    /**
     * Extract JTI (token ID) for blacklist checking.
     */
    public String extractJti(String token) {
        try {
            return parseToken(token).getId();
        } catch (JwtException e) {
            return null;
        }
    }

    /**
     * Extract token version claim.
     */
    public Long extractTokenVersion(String token) {
        try {
            return parseToken(token).get("ver", Long.class);
        } catch (JwtException e) {
            return null;
        }
    }

    /**
     * Get remaining time until token expiration in seconds.
     */
    public long getExpirationSeconds(String token) {
        try {
            Date expiration = parseToken(token).getExpiration();
            return (expiration.getTime() - System.currentTimeMillis()) / 1000;
        } catch (JwtException e) {
            return 0;
        }
    }

    public int getAccessTokenExpirationMinutes() {
        return accessTokenExpirationMinutes;
    }
}
