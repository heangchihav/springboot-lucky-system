package com.example.demo.security.jwt;

import com.example.demo.security.blacklist.TokenBlacklistService;
import com.example.demo.security.device.DeviceInfo;
import com.example.demo.security.jti.JtiTrackingService;
import com.example.demo.security.jti.JtiTrackingService.JtiValidationResult;
import com.example.demo.security.token.RefreshTokenService;
import com.example.demo.security.token.RefreshTokenService.RefreshTokenRotationResult;
import com.example.demo.user.User;
import com.example.demo.user.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

/**
 * JWT Authentication Filter for stateless authentication.
 * 
 * Validates JWT access tokens from:
 * 1. Authorization header (Bearer token)
 * 2. HTTP-only cookie (for web clients)
 * 
 * Performs multi-layer validation:
 * 1. Token signature and expiration
 * 2. JTI blacklist check (Redis)
 * 3. Token version validation against user's current version
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";
    private static final String ACCESS_TOKEN_COOKIE = "access_token";
    private static final String DEVICE_ID_COOKIE = "device_id";

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final UserRepository userRepository;
    private final TokenBlacklistService tokenBlacklistService;
    private final JtiTrackingService jtiTrackingService;
    private final RefreshTokenService refreshTokenService;

    @Value("${security.jwt.device-binding-required:true}")
    private boolean deviceBindingRequired;

    @Value("${security.jti.reject-suspicious:false}")
    private boolean rejectSuspiciousJti;

    @Value("${security.jwt.access-token-expiration-minutes:3}")
    private int accessTokenExpirationMinutes;

    @Value("${security.refresh-token.expiration-days:7}")
    private int refreshTokenExpirationDays;

    @Value("${security.cookie.secure:true}")
    private boolean secureCookies;

    public JwtAuthenticationFilter(JwtService jwtService,
                                   @Lazy UserDetailsService userDetailsService,
                                   UserRepository userRepository,
                                   TokenBlacklistService tokenBlacklistService,
                                   JtiTrackingService jtiTrackingService,
                                   RefreshTokenService refreshTokenService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.userRepository = userRepository;
        this.tokenBlacklistService = tokenBlacklistService;
        this.jtiTrackingService = jtiTrackingService;
        this.refreshTokenService = refreshTokenService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        
        log.debug("JwtAuthenticationFilter processing: {} {}", request.getMethod(), request.getRequestURI());
        
        try {
            String token = extractToken(request);
            
            if (token == null) {
                log.debug("No access token found; attempting transparent refresh");
                // Try transparent refresh using refresh token cookie
                if (!tryTransparentRefresh(request, response)) {
                    log.debug("Transparent refresh failed or no refresh token cookie");
                    filterChain.doFilter(request, response);
                } else {
                    log.debug("Transparent refresh succeeded; authentication set");
                }
                return;
            }

            // Validate token and handle expiration
            if (jwtService.getExpirationSeconds(token) <= 0) {
                log.debug("Access token invalid/expired; attempting transparent refresh");
                if (!tryTransparentRefresh(request, response)) {
                    log.debug("Transparent refresh failed for expired token");
                    filterChain.doFilter(request, response);
                } else {
                    log.debug("Transparent refresh succeeded for expired token; authentication set");
                }
                return;
            }

            authenticateWithToken(token, request);
        } catch (Exception e) {
            log.debug("JWT authentication failed: {}", e.getMessage());
            // Don't throw - let the request continue without authentication
            // The security config will handle unauthorized access
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Attempt transparent refresh token rotation and set new access token cookie.
     * Returns true if refresh succeeded and request should be retried with new token.
     */
    private boolean tryTransparentRefresh(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = extractRefreshTokenCookie(request);
        if (refreshToken == null) {
            log.debug("No refresh_token cookie found for transparent refresh");
            return false;
        }
        log.debug("Found refresh_token cookie; attempting rotation");

        String deviceId = extractDeviceId(request);
        DeviceInfo deviceInfo = DeviceInfo.fromRequest(request, deviceId);
        Optional<RefreshTokenRotationResult> result = refreshTokenService.rotateToken(refreshToken, deviceInfo);

        if (result.isEmpty()) {
            log.debug("Refresh token rotation failed (invalid/expired/reused?)");
            return false;
        }

        RefreshTokenRotationResult rotationResult = result.get();
        User user = rotationResult.user();
        String newAccessToken = jwtService.generateAccessToken(user, deviceInfo.getFingerprint());
        String newRefreshToken = rotationResult.newToken();

        // Register new JTI for tracking
        String jti = jwtService.extractJti(newAccessToken);
        String clientIp = extractClientIp(request);
        long ttl = accessTokenExpirationMinutes * 60L;
        jtiTrackingService.registerJti(jti, user.getId(), deviceInfo.getFingerprint(), clientIp, ttl);

        // Set new cookies
        setTokenCookies(response, newAccessToken, newRefreshToken, deviceInfo);
        log.debug("Set new access_token and refresh_token cookies");

        // Retry authentication with new token
        authenticateWithToken(newAccessToken, request);
        log.debug("Re-authenticated with new access token");
        return true;
    }

    private String extractRefreshTokenCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("refresh_token".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }

    private void setTokenCookies(HttpServletResponse response, String accessToken, String refreshToken, DeviceInfo deviceInfo) {
        // Device ID cookie (not HttpOnly)
        if (deviceInfo != null && deviceInfo.getDeviceId() != null && !deviceInfo.getDeviceId().isBlank()) {
            Cookie deviceCookie = new Cookie("device_id", deviceInfo.getDeviceId());
            deviceCookie.setHttpOnly(false);
            deviceCookie.setSecure(secureCookies);
            deviceCookie.setPath("/");
            deviceCookie.setMaxAge(refreshTokenExpirationDays * 24 * 60 * 60);
            deviceCookie.setAttribute("SameSite", "Strict");
            response.addCookie(deviceCookie);
        }

        // Access token cookie
        Cookie accessCookie = new Cookie("access_token", accessToken);
        accessCookie.setHttpOnly(true);
        accessCookie.setSecure(secureCookies);
        accessCookie.setPath("/");
        accessCookie.setMaxAge(accessTokenExpirationMinutes * 60);
        accessCookie.setAttribute("SameSite", "Strict");
        response.addCookie(accessCookie);

        // Refresh token cookie
        Cookie refreshCookie = new Cookie("refresh_token", refreshToken);
        refreshCookie.setHttpOnly(true);
        refreshCookie.setSecure(secureCookies);
        refreshCookie.setPath("/");
        refreshCookie.setMaxAge(refreshTokenExpirationDays * 24 * 60 * 60);
        refreshCookie.setAttribute("SameSite", "Strict");
        response.addCookie(refreshCookie);
    }

    /**
     * Extract JWT from request (header or cookie).
     */
    private String extractToken(HttpServletRequest request) {
        // Try Authorization header first
        String authHeader = request.getHeader(AUTHORIZATION_HEADER);
        if (authHeader != null && authHeader.startsWith(BEARER_PREFIX)) {
            return authHeader.substring(BEARER_PREFIX.length());
        }

        // Try cookie
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (ACCESS_TOKEN_COOKIE.equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }

        return null;
    }

    /**
     * Authenticate the request using the JWT token.
     */
    private void authenticateWithToken(String token, HttpServletRequest request) {
        try {
            // Parse token and extract claims
            Claims claims = jwtService.parseToken(token);
            String username = claims.getSubject();
            String jti = claims.getId();
            Long tokenVersion = claims.get("ver", Long.class);
            String tokenDeviceFingerprint = claims.get("dfp", String.class);

            if (username == null) {
                log.debug("Token has no subject");
                return;
            }

            // Check JTI blacklist (legacy)
            if (tokenBlacklistService.isBlacklisted(jti)) {
                log.debug("Token JTI is blacklisted: {}", jti);
                return;
            }

            // Validate JTI with tracking service (checks blacklist + IP consistency)
            String clientIp = extractClientIp(request);
            JtiValidationResult jtiResult = jtiTrackingService.validateJti(jti, clientIp);
            if (!jtiResult.isValid()) {
                log.warn("JTI validation failed: {}", jtiResult.reason());
                return;
            }
            if (jtiResult.isSuspicious()) {
                log.warn("Suspicious JTI usage detected: {}", jtiResult.reason());
                if (rejectSuspiciousJti) {
                    long remainingTtl = jwtService.getExpirationSeconds(token);
                    if (remainingTtl > 0) {
                        tokenBlacklistService.blacklistToken(jti, remainingTtl);
                        jtiTrackingService.blacklistJti(jti, remainingTtl);
                    }
                    return;
                }
                // Continue but flag for monitoring
            }

            String deviceId = extractDeviceId(request);
            DeviceInfo deviceInfo = DeviceInfo.fromRequest(request, deviceId);
            if (deviceBindingRequired) {
                if (tokenDeviceFingerprint == null || tokenDeviceFingerprint.isBlank()) {
                    log.warn("Missing device fingerprint claim (dfp) for token JTI: {}", jti);
                    return;
                }
                if (!tokenDeviceFingerprint.equals(deviceInfo.getFingerprint())) {
                    log.error("SECURITY ALERT: Access token device fingerprint mismatch for user {} (jti={})", username, jti);
                    long remainingTtl = jwtService.getExpirationSeconds(token);
                    if (remainingTtl > 0) {
                        tokenBlacklistService.blacklistToken(jti, remainingTtl);
                        jtiTrackingService.blacklistJti(jti, remainingTtl);
                    }
                    return;
                }
            }

            // Load user and validate token version
            Optional<User> userOpt = userRepository.findByUsername(username);
            if (userOpt.isEmpty()) {
                log.debug("User not found: {}", username);
                return;
            }

            User user = userOpt.get();

            // Validate token version against user's current version
            if (tokenVersion == null || !tokenVersion.equals(user.getTokenVersion())) {
                log.debug("Token version mismatch for user {}: token={}, current={}", 
                        username, tokenVersion, user.getTokenVersion());
                return;
            }

            // Check if account is locked or disabled
            if (!user.isEnabled()) {
                log.debug("User account is disabled: {}", username);
                return;
            }

            if (user.isAccountLocked() && !user.isLockExpired()) {
                log.debug("User account is locked: {}", username);
                return;
            }

            // Load UserDetails and create authentication
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
            
            UsernamePasswordAuthenticationToken authentication = 
                    new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );
            
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);
            
            log.debug("Authenticated user: {}", username);

        } catch (JwtException e) {
            log.debug("Invalid JWT token: {}", e.getMessage());
        }
    }

    private String extractDeviceId(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (DEVICE_ID_COOKIE.equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        // Skip filter for public endpoints
        return path.startsWith("/api/auth/login") || 
               path.startsWith("/api/auth/register") ||
               path.startsWith("/actuator/") ||
               path.startsWith("/css/") || 
               path.startsWith("/js/") ||
               path.equals("/register") ||
               path.equals("/login");
    }

    /**
     * Extract client IP, handling proxies.
     */
    private String extractClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }
}
