package com.example.gateway.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.security.Key;

/**
 * Gateway JWT Authentication Filter.
 * 
 * Validates JWT tokens from cookies and forwards user context
 * to downstream microservices via HTTP headers.
 */
@Component
public class JwtAuthenticationFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    private static final String ACCESS_TOKEN_COOKIE = "access_token";

    @Value("${security.jwt.secret:mySecretKey123456789012345678901234567890}")
    private String jwtSecret;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        
        log.info("JwtAuthenticationFilter processing: {} {}", request.getMethod(), request.getURI().getPath());
        
        // Skip authentication for public endpoints
        String path = request.getURI().getPath();
        if (isPublicEndpoint(path)) {
            return chain.filter(exchange);
        }
        
        try {
            String token = extractToken(request);
            log.info("Extracted token: {}", token != null ? "present" : "missing");
            
            if (token != null) {
                Claims claims = validateToken(token);
                if (claims != null) {
                    ServerHttpRequest mutatedRequest = forwardUserContext(request, claims);
                    log.info("Forwarding user context for user {}", claims.getSubject());
                    return chain.filter(exchange.mutate().request(mutatedRequest).build());
                } else {
                    log.warn("Token validation failed");
                }
            } else {
                log.warn("No token found in request");
            }
        } catch (Exception e) {
            log.error("JWT authentication failed: {}", e.getMessage(), e);
        }
        
        return chain.filter(exchange);
    }

    private boolean isPublicEndpoint(String path) {
        return path.startsWith("/api/auth/login") || 
               path.startsWith("/api/auth/register") ||
               path.startsWith("/actuator/");
    }

    private String extractToken(ServerHttpRequest request) {
        // Try to get token from cookies
        String cookieHeader = request.getHeaders().getFirst(HttpHeaders.COOKIE);
        if (cookieHeader != null) {
            String[] cookies = cookieHeader.split(";");
            for (String cookie : cookies) {
                cookie = cookie.trim();
                if (cookie.startsWith(ACCESS_TOKEN_COOKIE + "=")) {
                    return cookie.substring((ACCESS_TOKEN_COOKIE + "=").length());
                }
            }
        }
        return null;
    }

    private Claims validateToken(String token) {
        try {
            log.info("Validating token with secret length: {}", jwtSecret.length());
            Key key = Keys.hmacShaKeyFor(jwtSecret.getBytes());
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
            log.info("Token validation successful for user: {}", claims.getSubject());
            return claims;
        } catch (JwtException e) {
            log.error("Invalid JWT token: {}", e.getMessage());
            return null;
        } catch (Exception e) {
            log.error("Error validating JWT token: {}", e.getMessage(), e);
            return null;
        }
    }

    private ServerHttpRequest forwardUserContext(ServerHttpRequest request, Claims claims) {
        String username = claims.getSubject();
        Number userIdNumber = claims.get("uid", Number.class);
        Long userId = userIdNumber != null ? userIdNumber.longValue() : null;
        
        if (username != null) {
            // Add user context headers for downstream services
            return request.mutate()
                    .header("X-User-Id", userId != null ? userId.toString() : "")
                    .header("X-Username", username)
                    .build();
        }
        
        return request;
    }

    @Override
    public int getOrder() {
        return -100; // High priority to run early
    }
}
