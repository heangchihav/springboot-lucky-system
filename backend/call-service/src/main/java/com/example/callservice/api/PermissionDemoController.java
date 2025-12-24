package com.example.callservice.api;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;

@RestController
@RequestMapping("/api/calls/permissions")
public class PermissionDemoController {
    
    @GetMapping("/demo")
    public ResponseEntity<?> demoPermissionSystem(HttpServletRequest request) {
        // Simulate permission checking
        String userIdHeader = request.getHeader("X-User-Id");
        
        if (userIdHeader == null) {
            return ResponseEntity.status(401).body(Map.of(
                "error", "Unauthorized",
                "message", "X-User-Id header is required for permission checking"
            ));
        }
        
        Long userId = Long.valueOf(userIdHeader);
        
        // Simulate different permission scenarios
        Map<String, Boolean> userPermissions = Map.of(
            "branch.view", true,
            "branch.create", userId % 2 == 0, // Even users can create
            "branch.edit", userId % 3 == 0,  // Users divisible by 3 can edit
            "branch.delete", userId == 1,    // Only user 1 can delete
            "call.view", true,
            "call.create", userId % 2 == 0,
            "queue.view", true,
            "queue.manage", userId % 3 == 0
        );
        
        return ResponseEntity.ok(Map.of(
            "userId", userId,
            "permissions", userPermissions,
            "message", "Permission system demo - checking access based on user ID",
            "description", "This demonstrates how permissions work in the call-service",
            "usage", "Add X-User-Id header to test different permission scenarios"
        ));
    }
    
    @GetMapping("/check")
    public ResponseEntity<?> checkSpecificPermission(
            @RequestParam String permission,
            HttpServletRequest request) {
        
        String userIdHeader = request.getHeader("X-User-Id");
        if (userIdHeader == null) {
            return ResponseEntity.status(401).body(Map.of(
                "error", "Unauthorized",
                "message", "X-User-Id header is required"
            ));
        }
        
        Long userId = Long.valueOf(userIdHeader);
        
        // Simulate permission check logic
        boolean hasPermission = switch (permission) {
            case "branch.view", "call.view", "queue.view" -> true;
            case "branch.create", "call.create" -> userId % 2 == 0;
            case "branch.edit", "queue.manage" -> userId % 3 == 0;
            case "branch.delete" -> userId == 1;
            default -> false;
        };
        
        return ResponseEntity.ok(Map.of(
            "userId", userId,
            "permission", permission,
            "hasPermission", hasPermission,
            "access", hasPermission ? "GRANTED" : "DENIED"
        ));
    }
    
    @GetMapping("/frontend-menu")
    public ResponseEntity<?> getFrontendMenuPermissions(HttpServletRequest request) {
        String userIdHeader = request.getHeader("X-User-Id");
        if (userIdHeader == null) {
            return ResponseEntity.status(401).body(Map.of(
                "error", "Unauthorized",
                "message", "X-User-Id header is required"
            ));
        }
        
        Long userId = Long.valueOf(userIdHeader);
        
        // Simulate frontend menu access control
        Map<String, Object> menuPermissions = Map.of(
            "canViewDashboard", true,
            "canViewBranches", true,
            "canManageBranches", userId % 2 == 0,
            "canViewCalls", true,
            "canManageCalls", userId % 2 == 0,
            "canViewQueue", true,
            "canManageQueue", userId % 3 == 0,
            "canViewReports", userId % 3 == 0,
            "canManageUsers", userId == 1
        );
        
        return ResponseEntity.ok(Map.of(
            "userId", userId,
            "menuPermissions", menuPermissions,
            "message", "Frontend menu permissions for call-service",
            "description", "Use this data to control menu visibility in the frontend"
        ));
    }
}
