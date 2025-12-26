package com.example.callservice.service.shared;

import com.example.callservice.entity.role.Role;
import com.example.callservice.entity.role.UserRole;
import com.example.callservice.repository.role.RoleRepository;
import com.example.callservice.repository.role.UserRoleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class RoleAssignmentService {
    
    private final UserRoleRepository userRoleRepository;
    private final RoleRepository roleRepository;
    
    public RoleAssignmentService(UserRoleRepository userRoleRepository, RoleRepository roleRepository) {
        this.userRoleRepository = userRoleRepository;
        this.roleRepository = roleRepository;
    }
    
    @Transactional
    public void assignUsersToRole(Long roleId, List<Long> userIds, String assignedBy) {
        Role role = roleRepository.findById(roleId)
            .orElseThrow(() -> new IllegalArgumentException("Role not found with id: " + roleId));
        
        List<UserRole> existingAssignments = userRoleRepository.findByRoleIdAndUserIdIn(roleId, userIds);
        List<Long> alreadyAssigned = existingAssignments.stream()
            .filter(UserRole::getActive)
            .map(UserRole::getUserId)
            .collect(Collectors.toList());
        
        List<Long> toAssign = userIds.stream()
            .filter(userId -> !alreadyAssigned.contains(userId))
            .collect(Collectors.toList());
        
        for (Long userId : toAssign) {
            UserRole userRole = new UserRole(userId, role, assignedBy);
            userRoleRepository.save(userRole);
        }
        
        // Reactivate any inactive assignments
        existingAssignments.stream()
            .filter(userRole -> !userRole.getActive())
            .forEach(userRole -> {
                userRole.setActive(true);
                userRoleRepository.save(userRole);
            });
    }
    
    @Transactional
    public void removeUsersFromRole(Long roleId, List<Long> userIds) {
        List<UserRole> assignments = userRoleRepository.findByRoleIdAndUserIdIn(roleId, userIds);
        assignments.forEach(assignment -> {
            assignment.setActive(false);
            userRoleRepository.save(assignment);
        });
    }
    
    public List<Long> getUsersInRole(Long roleId) {
        return userRoleRepository.findByRoleIdAndActiveTrue(roleId).stream()
            .map(UserRole::getUserId)
            .collect(Collectors.toList());
    }
    
    public List<Long> getRolesForUser(Long userId) {
        return userRoleRepository.findByUserIdAndActiveTrue(userId).stream()
            .map(userRole -> userRole.getRole().getId())
            .collect(Collectors.toList());
    }
    
    public List<String> getPermissionCodesForUserThroughRoles(Long userId, List<Role> allRoles) {
        List<Long> userRoleIds = getRolesForUser(userId);
        
        return allRoles.stream()
            .filter(role -> userRoleIds.contains(role.getId()) && role.getActive())
            .flatMap(role -> role.getPermissions().stream())
            .filter(permission -> permission.getActive())
            .map(permission -> permission.getCode())
            .collect(Collectors.toList());
    }
}
