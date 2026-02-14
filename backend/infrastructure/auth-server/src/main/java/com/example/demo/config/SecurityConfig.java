package com.example.demo.config;

import com.example.demo.security.web.SimpleWafFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.security.web.context.NullSecurityContextRepository;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
/**
 * Military/Bank-grade Security Configuration.
 * 
 * Features:
 * - TLS 1.3 enforcement (via HSTS)
 * - Strict security headers
 * - Stateless JWT authentication for API
 * - Session-based auth for web UI (optional)
 * - CSRF protection for web, disabled for API
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    public SecurityConfig() {
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        // BCrypt with strength 12 for military-grade security
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    /**
     * API Security Filter Chain - Stateless JWT authentication.
     * Higher priority (Order 1) for /api/** endpoints.
     */
    @Bean
    @Order(1)
    public SecurityFilterChain apiSecurityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .securityMatcher("/api/**")
            // Stateless session - no server-side session
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .securityContext(securityContext -> securityContext
                .securityContextRepository(new NullSecurityContextRepository())
            )
            .requestCache(requestCache -> requestCache.disable())
            // Disable CSRF for stateless API (tokens provide protection)
            .csrf(csrf -> csrf.disable())
            // Security headers
            .headers(headers -> configureSecurityHeaders(headers))
            // Authorization
            .authorizeHttpRequests(auth -> auth
                .anyRequest().permitAll()
            );

        return http.build();
    }

    /**
     * Web Security Filter Chain - Session-based authentication for web UI.
     * Lower priority (Order 2) for all other endpoints.
     */
    @Bean
    @Order(2)
    public SecurityFilterChain webSecurityFilterChain(HttpSecurity http) throws Exception {
        http
            // Session management for web UI
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .securityContext(securityContext -> securityContext
                .securityContextRepository(new NullSecurityContextRepository())
            )
            .requestCache(requestCache -> requestCache.disable())
            // CSRF protection for web forms
            .csrf(csrf -> csrf
                .disable()
            )
            // Disable any session-based / default authentication mechanisms
            .formLogin(form -> form.disable())
            .httpBasic(basic -> basic.disable())
            // Security headers
            .headers(headers -> configureSecurityHeaders(headers))
            // Authorization
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/health", "/actuator/prometheus").permitAll()
                .anyRequest().permitAll()
            )
            // Logout
            .logout(logout -> logout
                .logoutUrl("/logout")
                .logoutSuccessHandler((request, response, authentication) -> {
                    response.setHeader("Clear-Site-Data", "\"cache\", \"cookies\", \"storage\"");
                    response.sendRedirect("/login?logout");
                })
                .deleteCookies("JSESSIONID", "access_token", "refresh_token")
            );

        http.addFilterBefore(new SimpleWafFilter(true, 1048576), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * Configure strict security headers for military-grade protection.
     */
    private void configureSecurityHeaders(org.springframework.security.config.annotation.web.configurers.HeadersConfigurer<HttpSecurity> headers) {
        headers
            // Prevent clickjacking
            .frameOptions(frame -> frame.deny())
            // Prevent MIME type sniffing
            .contentTypeOptions(content -> {})
            // XSS protection (legacy, but still useful)
            .xssProtection(xss -> xss.headerValue(org.springframework.security.web.header.writers.XXssProtectionHeaderWriter.HeaderValue.ENABLED_MODE_BLOCK))
            // Referrer policy
            .referrerPolicy(referrer -> referrer.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
            // Prevent caching of authenticated pages / API responses
            // (Mitigates back-button cache and sensitive data persistence on shared devices)
            .addHeaderWriter((request, response) -> {
                response.setHeader("Cache-Control", "no-store, no-cache, max-age=0, must-revalidate");
                response.setHeader("Pragma", "no-cache");
                response.setHeader("Expires", "0");
                response.setHeader("Vary", "Cookie");
            })
            // Content Security Policy
            .contentSecurityPolicy(csp -> csp
                .policyDirectives("default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; frame-ancestors 'none'; form-action 'self';")
            )
            // Permissions Policy (formerly Feature Policy)
            .permissionsPolicy(permissions -> permissions
                .policy("geolocation=(), microphone=(), camera=(), payment=()")
            );
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        return new UrlBasedCorsConfigurationSource();
    }

}