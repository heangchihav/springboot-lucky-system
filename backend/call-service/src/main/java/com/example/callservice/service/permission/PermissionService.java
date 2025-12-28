package com.example.callservice.service.permission;

import com.example.callservice.entity.permission.Permission;
import com.example.callservice.entity.shared.UserPermission;
import com.example.callservice.entity.role.Role;
import com.example.callservice.repository.permission.PermissionRepository;
import com.example.callservice.repository.shared.UserPermissionRepository;
import com.example.callservice.service.shared.RoleAssignmentService;
import com.example.callservice.service.role.RoleService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@Transactional
public class PermissionService {
    
    private static final Logger logger = LoggerFactory.getLogger(PermissionService.class);
    
    private final PermissionRepository permissionRepository;
    private final UserPermissionRepository userPermissionRepository;
    private final RoleAssignmentService roleAssignmentService;
    private final RoleService roleService;
    
    public PermissionService(PermissionRepository permissionRepository, 
                           UserPermissionRepository userPermissionRepository,
                           RoleAssignmentService roleAssignmentService,
                           RoleService roleService) {
        this.permissionRepository = permissionRepository;
        this.userPermissionRepository = userPermissionRepository;
        this.roleAssignmentService = roleAssignmentService;
        this.roleService = roleService;
    }
    
    // Permission management
    public List<Permission> getAllPermissions() {
        return permissionRepository.findByActiveTrueOrderByName();
    }
    
    public Optional<Permission> getPermissionById(Long id) {
        return permissionRepository.findById(id);
    }
    
    public Optional<Permission> getPermissionByCode(String code) {
        return permissionRepository.findByCode(code);
    }
    
    public List<Permission> getPermissionsForUser(Long userId) {
        if (userId == null) {
            return List.of();
        }
        
        // Get permissions directly assigned to user
        List<String> userPermissionCodes = userPermissionRepository.findPermissionCodesByUserId(userId);
        List<Permission> directPermissions = permissionRepository.findByCodeIn(userPermissionCodes);
        
        // Get permissions through user's roles
        List<Role> allRoles = roleService.getAllRoles();
        List<String> rolePermissionCodes = roleAssignmentService.getPermissionCodesForUserThroughRoles(userId, allRoles);
        List<Permission> rolePermissions = permissionRepository.findByCodeIn(rolePermissionCodes);
        
        // Combine and deduplicate
        return Stream.concat(directPermissions.stream(), rolePermissions.stream())
            .collect(Collectors.toSet())
            .stream()
            .collect(Collectors.toList());
    }
    
    public Permission createPermission(String code, String name, String description) {
        return createPermission(code, name, description, null, null);
    }
    
    public Permission createPermission(String code, String name, String description, String menuGroup, String menuNumber) {
        if (permissionRepository.existsByCode(code)) {
            throw new IllegalArgumentException("Permission with code " + code + " already exists");
        }
        
        Permission permission = new Permission(code, name, description);
        permission.setMenuGroup(menuGroup);
        permission.setMenuNumber(menuNumber);
        Permission saved = permissionRepository.save(permission);
        logger.info("Created permission: {}", saved.getCode());
        return saved;
    }
    
    public Permission updatePermission(Long id, String name, String description) {
        Permission permission = permissionRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Permission not found with id: " + id));
        
        permission.setName(name);
        permission.setDescription(description);
        Permission updated = permissionRepository.save(permission);
        logger.info("Updated permission: {}", updated.getCode());
        return updated;
    }
    
    public void deletePermission(Long id) {
        Permission permission = permissionRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Permission not found with id: " + id));
        
        permission.setActive(false);
        permissionRepository.save(permission);
        logger.info("Deactivated permission: {}", permission.getCode());
    }
    
    // User permission management
    public List<UserPermission> getUserPermissions(Long userId) {
        return userPermissionRepository.findByUserIdAndActiveTrue(userId);
    }
    
    public boolean hasUserPermission(Long userId, String permissionCode) {
        // Check direct user permissions first
        List<String> userPermissionCodes = userPermissionRepository.findPermissionCodesByUserId(userId);
        if (userPermissionCodes.contains(permissionCode)) {
            return true;
        }
        
        // Check role-based permissions using in-memory assignments
        List<Role> allRoles = roleService.getAllRoles();
        List<String> rolePermissionCodes = roleAssignmentService.getPermissionCodesForUserThroughRoles(userId, allRoles);
        return rolePermissionCodes.contains(permissionCode);
    }
    
    public UserPermission assignPermissionToUser(Long userId, Long permissionId, String assignedBy) {
        // Check if assignment already exists
        Optional<UserPermission> existing = userPermissionRepository.findByUserIdAndPermissionIdAndActiveTrue(userId, permissionId);
        
        if (existing.isPresent()) {
            // Reactivate if inactive
            UserPermission userPermission = existing.get();
            userPermission.setActive(true);
            userPermission.setAssignedBy(assignedBy);
            UserPermission updated = userPermissionRepository.save(userPermission);
            logger.info("Reactivated permission assignment for user {} to permission {}", userId, permissionId);
            return updated;
        }
        
        // Create new assignment
        Permission permission = permissionRepository.findById(permissionId)
            .orElseThrow(() -> new IllegalArgumentException("Permission not found with id: " + permissionId));
        
        UserPermission userPermission = new UserPermission(userId, permission, assignedBy);
        UserPermission saved = userPermissionRepository.save(userPermission);
        logger.info("Assigned permission {} to user {}", permission.getCode(), userId);
        return saved;
    }
    
    public void removePermissionFromUser(Long userId, Long permissionId) {
        Optional<UserPermission> userPermission = userPermissionRepository.findByUserIdAndPermissionIdAndActiveTrue(userId, permissionId);
        
        if (userPermission.isPresent()) {
            UserPermission up = userPermission.get();
            up.setActive(false);
            userPermissionRepository.save(up);
            logger.info("Removed permission {} from user {}", permissionId, userId);
        }
    }
    
    public void replaceUserPermissions(Long userId, List<Long> permissionIds, String assignedBy) {
        // Get current active assignments
        List<UserPermission> currentAssignments = userPermissionRepository.findByUserIdAndActiveTrue(userId);
        
        // Deactivate all current assignments
        for (UserPermission assignment : currentAssignments) {
            assignment.setActive(false);
            userPermissionRepository.save(assignment);
        }
        
        // Create new assignments
        for (Long permissionId : permissionIds) {
            try {
                assignPermissionToUser(userId, permissionId, assignedBy);
            } catch (Exception e) {
                logger.warn("Failed to assign permission {} to user {}: {}", permissionId, userId, e.getMessage());
            }
        }
        
        logger.info("Replaced permissions for user {} with {} permissions", userId, permissionIds.size());
    }
}
