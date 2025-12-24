package com.example.callservice.api;

import com.example.callservice.service.PermissionCheckService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;

@RestController
@RequestMapping("/api/calls/test")
public class TestController {
    
    private final PermissionCheckService permissionCheckService;
    
    public TestController(PermissionCheckService permissionCheckService) {
        this.permissionCheckService = permissionCheckService;
    }
    
    @GetMapping("/permissions-service")
    public ResponseEntity<String> testPermissionService() {
        try {
            return ResponseEntity.ok("PermissionCheckService working and ready to check permissions");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }
    
    @GetMapping("/check-permission")
    public ResponseEntity<?> checkPermission(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String permissionCode,
            HttpServletRequest request) {
        
        // Get user ID from header if not provided as parameter
        if (userId == null) {
            String userIdHeader = request.getHeader("X-User-Id");
            if (userIdHeader != null) {
                userId = Long.valueOf(userIdHeader);
            }
        }
        
        if (userId == null || permissionCode == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Bad Request",
                "message", "userId and permissionCode are required"
            ));
        }
        
        try {
            boolean hasPermission = permissionCheckService.hasPermission(userId, permissionCode);
            return ResponseEntity.ok(Map.of(
                "userId", userId,
                "permissionCode", permissionCode,
                "hasPermission", hasPermission
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "error", "Internal Server Error",
                "message", "Permission check failed: " + e.getMessage()
            ));
        }
    }
    
    @GetMapping("/protected-endpoint")
    public ResponseEntity<?> protectedEndpoint(HttpServletRequest request) {
        // Manual permission check
        String userIdHeader = request.getHeader("X-User-Id");
        if (userIdHeader == null) {
            return ResponseEntity.status(401).body(Map.of(
                "error", "Unauthorized",
                "message", "X-User-Id header is required"
            ));
        }
        
        Long userId = Long.valueOf(userIdHeader);
        boolean hasPermission = permissionCheckService.hasPermission(userId, "branch.view");
        
        if (!hasPermission) {
            return ResponseEntity.status(403).body(Map.of(
                "error", "Forbidden",
                "message", "User does not have branch.view permission"
            ));
        }
        
        return ResponseEntity.ok(Map.of(
            "message", "Access granted",
            "userId", userId,
            "permission", "branch.view"
        ));
    }
}
