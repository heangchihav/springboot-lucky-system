package com.example.demo.security.web;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

public class SimpleWafFilter extends OncePerRequestFilter {

    private static final Set<String> ALLOWED_METHODS = Set.of("GET", "HEAD", "OPTIONS", "POST", "PUT", "PATCH", "DELETE");

    private static final Pattern PATH_TRAVERSAL = Pattern.compile("(?i)(\\.\\./|\\.\\.\\\\|%2e%2e%2f|%2e%2e%5c)");
    private static final Pattern NULL_BYTE = Pattern.compile("(?i)%00|\\x00");

    private static final Pattern SQLI = Pattern.compile("(?i)(\\bunion\\b\\s+\\bselect\\b|\\bor\\b\\s+1\\s*=\\s*1|\\bdrop\\b\\s+\\btable\\b|\\bsleep\\s*\\(|\\bbenchmark\\s*\\(|\\binto\\b\\s+\\boutfile\\b)");
    private static final Pattern XSS = Pattern.compile("(?i)(<\\s*script|javascript:|onerror\\s*=|onload\\s*=|<\\s*img|<\\s*svg|<\\s*iframe)");

    private final boolean enabled;
    private final long maxContentLengthBytes;

    public SimpleWafFilter(boolean enabled, long maxContentLengthBytes) {
        this.enabled = enabled;
        this.maxContentLengthBytes = maxContentLengthBytes;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !enabled;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String method = request.getMethod();
        if (method == null || !ALLOWED_METHODS.contains(method.toUpperCase(Locale.ROOT))) {
            response.setStatus(HttpServletResponse.SC_METHOD_NOT_ALLOWED);
            return;
        }

        long contentLength = request.getContentLengthLong();
        if (contentLength > maxContentLengthBytes) {
            response.setStatus(HttpServletResponse.SC_REQUEST_ENTITY_TOO_LARGE);
            return;
        }

        String uri = safe(request.getRequestURI());
        String query = safe(request.getQueryString());

        if (PATH_TRAVERSAL.matcher(uri).find() || PATH_TRAVERSAL.matcher(query).find()) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            return;
        }

        if (NULL_BYTE.matcher(uri).find() || NULL_BYTE.matcher(query).find()) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            return;
        }

        String combined = (uri + "?" + query).toLowerCase(Locale.ROOT);
        if (SQLI.matcher(combined).find() || XSS.matcher(combined).find()) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            return;
        }

        String userAgent = safe(request.getHeader("User-Agent"));
        if (userAgent.length() > 1024) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String safe(String s) {
        if (s == null) {
            return "";
        }
        byte[] bytes = s.getBytes(StandardCharsets.UTF_8);
        if (bytes.length > 8192) {
            return new String(bytes, 0, 8192, StandardCharsets.UTF_8);
        }
        return s;
    }
}
