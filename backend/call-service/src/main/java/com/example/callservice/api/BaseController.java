package com.example.callservice.api;

import com.example.callservice.service.PermissionCheckService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;

import java.util.Map;

public class BaseController {
    
    @Autowired
    protected PermissionCheckService permissionCheckService;
    
    protected ResponseEntity<?> checkPermission(HttpServletRequest request, String permissionCode) {
        try {
            String userIdHeader = request.getHeader("X-User-Id");
            if (userIdHeader == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized", "message", "User ID required"));
            }
            
            Long userId = Long.valueOf(userIdHeader);
            if (!permissionCheckService.hasPermission(userId, permissionCode)) {
                return ResponseEntity.status(403).body(Map.of("error", "Forbidden", "message", "Insufficient permissions"));
            }
            
            return null; // Permission check passed
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Internal Server Error", "message", "Permission check failed"));
        }
    }
}
