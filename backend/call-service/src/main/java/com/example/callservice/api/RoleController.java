package com.example.callservice.api;

import com.example.callservice.dto.CreateRoleRequest;
import com.example.callservice.dto.PermissionResponse;
import com.example.callservice.dto.RoleResponse;
import com.example.callservice.dto.UpdateRoleRequest;
import com.example.callservice.dto.UserResponse;
import com.example.callservice.entity.Role;
import com.example.callservice.service.RoleService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/calls/roles")
public class RoleController {
    
    private static final Logger logger = LoggerFactory.getLogger(RoleController.class);
    
    private final RoleService roleService;
    
    // Simple in-memory storage for user-role assignments (for demo purposes)
    private static final Map<Long, List<Long>> roleUserAssignments = new ConcurrentHashMap<>();
    
    public RoleController(RoleService roleService) {
        this.roleService = roleService;
    }
    
    @GetMapping
    public ResponseEntity<List<RoleResponse>> getAllRoles() {
        List<Role> roles = roleService.getAllRoles();
        List<RoleResponse> response = roles.stream()
            .map(role -> new RoleResponse(
                role.getId(),
                role.getName(),
                role.getDescription(),
                role.getPermissions().stream()
                    .map(permission -> new PermissionResponse(
                        permission.getId(),
                        permission.getCode(),
                        permission.getName(),
                        permission.getDescription(),
                        permission.getActive(),
                        permission.getCreatedAt(),
                        permission.getUpdatedAt(),
                        permission.getMenuGroup(),
                        permission.getMenuNumber()
                    ))
                    .collect(Collectors.toList()),
                roleService.getUserCountForRole(role.getId()),
                role.getActive(),
                role.getCreatedAt(),
                role.getUpdatedAt()
            ))
            .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<RoleResponse> getRoleById(@PathVariable Long id) {
        Role role = roleService.getRoleById(id)
            .orElseThrow(() -> new IllegalArgumentException("Role not found with id: " + id));
        
        RoleResponse response = new RoleResponse(
            role.getId(),
            role.getName(),
            role.getDescription(),
            role.getPermissions().stream()
                .map(permission -> new PermissionResponse(
                    permission.getId(),
                    permission.getCode(),
                    permission.getName(),
                    permission.getDescription(),
                    permission.getActive(),
                    permission.getCreatedAt(),
                    permission.getUpdatedAt(),
                    permission.getMenuGroup(),
                    permission.getMenuNumber()
                ))
                .collect(Collectors.toList()),
            roleService.getUserCountForRole(role.getId()),
            role.getActive(),
            role.getCreatedAt(),
            role.getUpdatedAt()
        );
        return ResponseEntity.ok(response);
    }
    
    @PostMapping
    public ResponseEntity<RoleResponse> createRole(@RequestBody CreateRoleRequest request) {
        logger.info("Creating new role: {}", request.getName());
        
        Role role = roleService.createRole(request);
        
        RoleResponse response = new RoleResponse(
            role.getId(),
            role.getName(),
            role.getDescription(),
            role.getPermissions().stream()
                .map(permission -> new PermissionResponse(
                    permission.getId(),
                    permission.getCode(),
                    permission.getName(),
                    permission.getDescription(),
                    permission.getActive(),
                    permission.getCreatedAt(),
                    permission.getUpdatedAt(),
                    permission.getMenuGroup(),
                    permission.getMenuNumber()
                ))
                .collect(Collectors.toList()),
            roleService.getUserCountForRole(role.getId()),
            role.getActive(),
            role.getCreatedAt(),
            role.getUpdatedAt()
        );
        return ResponseEntity.ok(response);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<RoleResponse> updateRole(@PathVariable Long id, @RequestBody UpdateRoleRequest request) {
        logger.info("Updating role {}: {}", id, request.getName());
        
        Role role = roleService.updateRole(id, request);
        
        RoleResponse response = new RoleResponse(
            role.getId(),
            role.getName(),
            role.getDescription(),
            role.getPermissions().stream()
                .map(permission -> new PermissionResponse(
                    permission.getId(),
                    permission.getCode(),
                    permission.getName(),
                    permission.getDescription(),
                    permission.getActive(),
                    permission.getCreatedAt(),
                    permission.getUpdatedAt(),
                    permission.getMenuGroup(),
                    permission.getMenuNumber()
                ))
                .collect(Collectors.toList()),
            roleService.getUserCountForRole(role.getId()),
            role.getActive(),
            role.getCreatedAt(),
            role.getUpdatedAt()
        );
        return ResponseEntity.ok(response);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRole(@PathVariable Long id) {
        logger.info("Deleting role with id: {}", id);
        
        if (!roleService.existsById(id)) {
            throw new IllegalArgumentException("Role not found with id: " + id);
        }
        
        roleService.deleteRole(id);
        return ResponseEntity.noContent().build();
    }
    
    @PostMapping("/{roleId}/assign-users")
    public ResponseEntity<Void> assignUsersToRole(
            @PathVariable Long roleId, 
            @RequestBody Map<String, List<Long>> request) {
        
        List<Long> userIds = request.get("userIds");
        if (userIds == null || userIds.isEmpty()) {
            throw new IllegalArgumentException("User IDs are required");
        }
        
        logger.info("Assigning {} users to role {}", userIds.size(), roleId);
        
        if (!roleService.existsById(roleId)) {
            throw new IllegalArgumentException("Role not found with id: " + roleId);
        }
        
        // Store the user-role assignments in memory (prevent duplicates)
        List<Long> currentAssignments = roleUserAssignments.computeIfAbsent(roleId, k -> new ArrayList<>());
        List<Long> newAssignments = userIds.stream()
            .filter(userId -> !currentAssignments.contains(userId))
            .collect(Collectors.toList());
        currentAssignments.addAll(newAssignments);
        logger.info("Users assigned to role {}: {} (new: {})", roleId, currentAssignments, newAssignments);
        
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/{roleId}/users")
    public ResponseEntity<List<UserResponse>> getUsersInRole(@PathVariable Long roleId) {
        logger.info("Getting users for role: {}", roleId);
        
        if (!roleService.existsById(roleId)) {
            throw new IllegalArgumentException("Role not found with id: " + roleId);
        }
        
        // Return the actual stored user assignments with real user data
        List<Long> assignedUserIds = roleUserAssignments.getOrDefault(roleId, new ArrayList<>());
        List<UserResponse> users = new ArrayList<>();
        
        // For now, create mock responses that match the real user structure
        for (Long userId : assignedUserIds) {
            UserResponse user = new UserResponse();
            user.setId(userId);
            user.setUsername("user" + userId);
            user.setEmail("user" + userId + "@example.com"); // Required by UserResponse
            user.setFullName("User " + userId);
            user.setActive(true);
            users.add(user);
        }
        return ResponseEntity.ok(users);
    }
    
    @PostMapping("/{roleId}/remove-users")
    public ResponseEntity<Void> removeUsersFromRole(@PathVariable Long roleId, @RequestBody Map<String, List<Long>> request) {
        logger.info("Removing users from role: {}", roleId);
        
        List<Long> userIds = request.get("userIds");
        if (userIds == null || userIds.isEmpty()) {
            throw new IllegalArgumentException("User IDs are required");
        }
        
        if (!roleService.existsById(roleId)) {
            throw new IllegalArgumentException("Role not found with id: " + roleId);
        }
        
        // Remove users from the role assignment
        List<Long> currentAssignments = roleUserAssignments.getOrDefault(roleId, new ArrayList<>());
        List<Long> removedUsers = userIds.stream()
            .filter(currentAssignments::contains)
            .collect(Collectors.toList());
        currentAssignments.removeAll(removedUsers);
        
        logger.info("Users removed from role {}: {} (removed: {})", roleId, currentAssignments, removedUsers);
        
        return ResponseEntity.ok().build();
    }
}
