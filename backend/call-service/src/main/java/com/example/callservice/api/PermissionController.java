package com.example.callservice.api;

import com.example.callservice.dto.PermissionResponse;
import com.example.callservice.dto.UserPermissionResponse;
import com.example.callservice.entity.Permission;
import com.example.callservice.entity.UserPermission;
import com.example.callservice.service.PermissionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/calls/permissions")
public class PermissionController {
    
    private final PermissionService permissionService;
    
    public PermissionController(PermissionService permissionService) {
        this.permissionService = permissionService;
    }
    
    // Permission management endpoints
    
    @GetMapping
    public ResponseEntity<List<PermissionResponse>> getAllPermissions() {
        List<Permission> permissions = permissionService.getAllPermissions();
        List<PermissionResponse> response = permissions.stream()
            .map(p -> new PermissionResponse(
                p.getId(),
                p.getCode(),
                p.getName(),
                p.getDescription(),
                p.getActive(),
                p.getCreatedAt(),
                p.getUpdatedAt(),
                p.getMenuGroup(),
                p.getMenuNumber()
            ))
            .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<PermissionResponse> getPermissionById(@PathVariable Long id) {
        Permission permission = permissionService.getPermissionById(id)
            .orElseThrow(() -> new IllegalArgumentException("Permission not found with id: " + id));
        
        PermissionResponse response = new PermissionResponse(
            permission.getId(),
            permission.getCode(),
            permission.getName(),
            permission.getDescription(),
            permission.getActive(),
            permission.getCreatedAt(),
            permission.getUpdatedAt(),
            permission.getMenuGroup(),
            permission.getMenuNumber()
        );
        return ResponseEntity.ok(response);
    }
    
    @PostMapping
    public ResponseEntity<PermissionResponse> createPermission(@RequestBody Map<String, String> request) {
        String code = request.get("code");
        String name = request.get("name");
        String description = request.get("description");
        
        if (code == null || name == null || description == null) {
            throw new IllegalArgumentException("code, name, and description are required");
        }
        
        Permission permission = permissionService.createPermission(code, name, description);
        
        PermissionResponse response = new PermissionResponse(
            permission.getId(),
            permission.getCode(),
            permission.getName(),
            permission.getDescription(),
            permission.getActive(),
            permission.getCreatedAt(),
            permission.getUpdatedAt(),
            permission.getMenuGroup(),
            permission.getMenuNumber()
        );
        return ResponseEntity.ok(response);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<PermissionResponse> updatePermission(@PathVariable Long id, @RequestBody Map<String, String> request) {
        String name = request.get("name");
        String description = request.get("description");
        
        if (name == null || description == null) {
            throw new IllegalArgumentException("name and description are required");
        }
        
        Permission permission = permissionService.updatePermission(id, name, description);
        
        PermissionResponse response = new PermissionResponse(
            permission.getId(),
            permission.getCode(),
            permission.getName(),
            permission.getDescription(),
            permission.getActive(),
            permission.getCreatedAt(),
            permission.getUpdatedAt(),
            permission.getMenuGroup(),
            permission.getMenuNumber()
        );
        return ResponseEntity.ok(response);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePermission(@PathVariable Long id) {
        permissionService.deletePermission(id);
        return ResponseEntity.noContent().build();
    }
    
    // User permission management endpoints
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<UserPermissionResponse>> getUserPermissions(@PathVariable Long userId) {
        List<UserPermission> userPermissions = permissionService.getUserPermissions(userId);
        List<UserPermissionResponse> response = userPermissions.stream()
            .map(up -> new UserPermissionResponse(
                up.getId(),
                up.getUserId(),
                up.getPermission().getId(),
                up.getPermission().getCode(),
                up.getPermission().getName(),
                up.getPermission().getDescription(),
                up.getActive(),
                up.getAssignedBy(),
                up.getAssignedAt(),
                up.getUpdatedAt()
            ))
            .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/assign")
    public ResponseEntity<UserPermissionResponse> assignPermissionToUser(@RequestBody Map<String, Object> request) {
        Long userId = Long.valueOf(request.get("userId").toString());
        Long permissionId = Long.valueOf(request.get("permissionId").toString());
        String assignedBy = request.get("assignedBy") != null ? request.get("assignedBy").toString() : "system";
        
        UserPermission userPermission = permissionService.assignPermissionToUser(userId, permissionId, assignedBy);
        
        UserPermissionResponse response = new UserPermissionResponse(
            userPermission.getId(),
            userPermission.getUserId(),
            userPermission.getPermission().getId(),
            userPermission.getPermission().getCode(),
            userPermission.getPermission().getName(),
            userPermission.getPermission().getDescription(),
            userPermission.getActive(),
            userPermission.getAssignedBy(),
            userPermission.getAssignedAt(),
            userPermission.getUpdatedAt()
        );
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/user/{userId}/replace")
    public ResponseEntity<Void> replaceUserPermissions(@PathVariable Long userId, @RequestBody Map<String, Object> request) {
        @SuppressWarnings("unchecked")
        List<Long> permissionIds = (List<Long>) request.get("permissionIds");
        String assignedBy = request.get("assignedBy") != null ? request.get("assignedBy").toString() : "system";
        
        permissionService.replaceUserPermissions(userId, permissionIds, assignedBy);
        return ResponseEntity.ok().build();
    }
    
    @DeleteMapping("/user/{userId}/permission/{permissionId}")
    public ResponseEntity<Void> removePermissionFromUser(@PathVariable Long userId, @PathVariable Long permissionId) {
        permissionService.removePermissionFromUser(userId, permissionId);
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/user/{userId}/check/{permissionCode}")
    public ResponseEntity<Map<String, Boolean>> checkUserPermission(@PathVariable Long userId, @PathVariable String permissionCode) {
        boolean hasPermission = permissionService.hasUserPermission(userId, permissionCode);
        return ResponseEntity.ok(Map.of("hasPermission", hasPermission));
    }
}
