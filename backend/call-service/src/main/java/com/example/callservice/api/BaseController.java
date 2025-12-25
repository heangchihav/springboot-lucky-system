package com.example.callservice.api;

import com.example.callservice.service.PermissionCheckService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;

import java.util.Map;

public class BaseController {

    private static final Logger logger = LoggerFactory.getLogger(BaseController.class);
    
    @Autowired
    protected PermissionCheckService permissionCheckService;
    
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
    
    protected <T> ResponseEntity<T> checkPermissionAndReturn(HttpServletRequest request, String permissionCode) {
        try {
            Long userId = getCurrentUserId(request);
            if (userId == null) {
                return ResponseEntity.status(401).body(null);
            }
            
            if (!permissionCheckService.hasPermission(userId, permissionCode)) {
                return ResponseEntity.status(403).body(null);
            }
            
            return null; // Permission check passed
        } catch (Exception e) {
            return ResponseEntity.status(500).body(null);
        }
    }
    
    protected ResponseEntity<Map<String, Object>> createErrorResponse(int status, String error, String message) {
        return ResponseEntity.status(status).body(Map.of("error", error, "message", message));
    }
}
