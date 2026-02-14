package com.example.demo.security.web;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

public class OriginEnforcementFilter extends OncePerRequestFilter {

    private final boolean enabled;
    private final Set<String> allowedOrigins;
    private final List<Pattern> allowedOriginPatterns;

    public OriginEnforcementFilter(boolean enabled, String allowedOriginsCsv) {
        this.enabled = enabled;
        if (allowedOriginsCsv == null || allowedOriginsCsv.trim().isEmpty()) {
            this.allowedOrigins = Collections.emptySet();
            this.allowedOriginPatterns = Collections.emptyList();
        } else {
            Set<String> tmp = new HashSet<>();
            List<Pattern> patterns = new ArrayList<>();
            Arrays.stream(allowedOriginsCsv.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .forEach(value -> {
                        if (value.contains("*")) {
                            patterns.add(wildcardToPattern(value));
                        } else {
                            tmp.add(value);
                        }
                    });
            this.allowedOrigins = Collections.unmodifiableSet(tmp);
            this.allowedOriginPatterns = Collections.unmodifiableList(patterns);
        }
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if (!enabled) {
            return true;
        }

        String path = request.getRequestURI();
        if (path == null || !path.startsWith("/api/")) {
            return true;
        }

        // Allow public auth endpoints without origin check
        if (path.startsWith("/api/auth/login") || path.startsWith("/api/auth/register")) {
            return true;
        }

        String method = request.getMethod();
        if (method == null) {
            return true;
        }

        if ("GET".equalsIgnoreCase(method) || "HEAD".equalsIgnoreCase(method) || "OPTIONS".equalsIgnoreCase(method)) {
            return true;
        }

        String authz = request.getHeader("Authorization");
        if (authz != null && authz.startsWith("Bearer ")) {
            return true;
        }

        return false;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String requestOrigin = buildRequestOrigin(request);

        String origin = request.getHeader("Origin");
        if (origin != null && !origin.isBlank()) {
            if (!isAllowedOrigin(origin, requestOrigin)) {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                return;
            }
            filterChain.doFilter(request, response);
            return;
        }

        String referer = request.getHeader("Referer");
        if (referer != null && !referer.isBlank()) {
            String refererOrigin = toOrigin(referer);
            if (refererOrigin == null || !isAllowedOrigin(refererOrigin, requestOrigin)) {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                return;
            }
            filterChain.doFilter(request, response);
            return;
        }

        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
    }

    private boolean isAllowedOrigin(String candidateOrigin, String requestOrigin) {
        if (candidateOrigin == null || candidateOrigin.isBlank()) {
            return false;
        }

        if (requestOrigin != null && candidateOrigin.equalsIgnoreCase(requestOrigin)) {
            return true;
        }

        if (allowedOrigins.contains(candidateOrigin)) {
            return true;
        }

        for (Pattern pattern : allowedOriginPatterns) {
            if (pattern.matcher(candidateOrigin).matches()) {
                return true;
            }
        }

        return false;
    }

    private static Pattern wildcardToPattern(String wildcard) {
        String[] parts = wildcard.split("\\*", -1);
        StringBuilder regex = new StringBuilder("^");
        for (int i = 0; i < parts.length; i++) {
            regex.append(Pattern.quote(parts[i]));
            if (i < parts.length - 1) {
                regex.append(".*");
            }
        }
        regex.append("$");
        return Pattern.compile(regex.toString(), Pattern.CASE_INSENSITIVE);
    }

    private String buildRequestOrigin(HttpServletRequest request) {
        String scheme = request.getScheme();
        String host = request.getServerName();
        int port = request.getServerPort();
        if (scheme == null || host == null) {
            return null;
        }

        boolean defaultPort = ("http".equalsIgnoreCase(scheme) && port == 80)
                || ("https".equalsIgnoreCase(scheme) && port == 443)
                || port <= 0;

        if (defaultPort) {
            return scheme + "://" + host;
        }

        return scheme + "://" + host + ":" + port;
    }

    private String toOrigin(String url) {
        try {
            URI uri = new URI(url);
            if (uri.getScheme() == null || uri.getHost() == null) {
                return null;
            }
            int port = uri.getPort();
            if (port == -1) {
                return uri.getScheme() + "://" + uri.getHost();
            }
            return uri.getScheme() + "://" + uri.getHost() + ":" + port;
        } catch (URISyntaxException e) {
            return null;
        }
    }
}
