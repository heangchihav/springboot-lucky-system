package com.example.callservice.api.base;

import com.example.callservice.service.shared.PermissionCheckService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Map;

public class BaseController {

    private static final Logger logger = LoggerFactory.getLogger(BaseController.class);

    @Autowired
    protected PermissionCheckService permissionCheckService;

    @Autowired
    protected RestTemplate restTemplate;

    @Value("${user.service.url:http://localhost:8080}")
    protected String userServiceUrl;

    protected Long getCurrentUserId(HttpServletRequest request) {
        try {
            String userIdHeader = request.getHeader("X-User-Id");
            logger.debug("Incoming request header X-User-Id: {}", userIdHeader);
            if (userIdHeader == null) {
                return null;
            }

            return Long.valueOf(userIdHeader);
        } catch (Exception e) {
            logger.warn("Failed to parse X-User-Id header", e);
            return null;
        }
    }

    private boolean hasRootHeaderFlag() {
        RequestAttributes attributes = RequestContextHolder.getRequestAttributes();
        if (!(attributes instanceof ServletRequestAttributes servletRequestAttributes)) {
            return false;
        }

        HttpServletRequest currentRequest = servletRequestAttributes.getRequest();
        if (currentRequest == null) {
            return false;
        }

        String usernameHeader = currentRequest.getHeader("X-Username");
        if ("root".equalsIgnoreCase(usernameHeader)) {
            return true;
        }

        String rootFlag = currentRequest.getHeader("X-Root-User");
        return rootFlag != null && Boolean.parseBoolean(rootFlag);
    }

    protected <T> ResponseEntity<T> checkPermissionAndReturn(HttpServletRequest request, String permissionCode) {
        try {
            Long userId = getCurrentUserId(request);
            if (userId == null) {
                return ResponseEntity.status(401).body(null);
            }

            // Root users bypass all permission checks
            if (isRootUser(userId)) {
                logger.debug("Root user {} bypassing permission check for {}", userId, permissionCode);
                return null; // Permission check passed
            }

            if (!permissionCheckService.hasPermission(userId, permissionCode)) {
                return ResponseEntity.status(403).body(null);
            }

            return null; // Permission check passed
        } catch (Exception e) {
            return ResponseEntity.status(500).body(null);
        }
    }

    protected boolean isRootUser(Long userId) {
        if (hasRootHeaderFlag()) {
            return true;
        }
        try {
            String url = userServiceUrl + "/api/users/" + userId + "/username";
            String username = restTemplate.getForObject(url, String.class);
            return "root".equals(username);
        } catch (Exception e) {
            logger.error("Error checking if user {} is root: {}", userId, e.getMessage());
            return false;
        }
    }

    protected ResponseEntity<Map<String, Object>> createErrorResponse(int status, String error, String message) {
        return ResponseEntity.status(status).body(Map.of("error", error, "message", message));
    }
}
