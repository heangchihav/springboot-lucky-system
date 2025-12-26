package com.example.callservice.service;

import com.example.callservice.entity.Role;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.ArrayList;
import java.util.stream.Collectors;

@Service
public class RoleAssignmentService {
    
    // Simple in-memory storage for user-role assignments (for demo purposes)
    private static final Map<Long, List<Long>> roleUserAssignments = new ConcurrentHashMap<>();
    
    public void assignUsersToRole(Long roleId, List<Long> userIds) {
        // Store the user-role assignments in memory (prevent duplicates)
        List<Long> currentAssignments = roleUserAssignments.computeIfAbsent(roleId, k -> new ArrayList<>());
        List<Long> newAssignments = userIds.stream()
            .filter(userId -> !currentAssignments.contains(userId))
            .collect(Collectors.toList());
        currentAssignments.addAll(newAssignments);
    }
    
    public void removeUsersFromRole(Long roleId, List<Long> userIds) {
        List<Long> currentAssignments = roleUserAssignments.getOrDefault(roleId, new ArrayList<>());
        currentAssignments.removeAll(userIds);
    }
    
    public List<Long> getUsersInRole(Long roleId) {
        return roleUserAssignments.getOrDefault(roleId, new ArrayList<>());
    }
    
    public List<Long> getRolesForUser(Long userId) {
        List<Long> userRoles = new ArrayList<>();
        for (Map.Entry<Long, List<Long>> entry : roleUserAssignments.entrySet()) {
            if (entry.getValue().contains(userId)) {
                userRoles.add(entry.getKey());
            }
        }
        return userRoles;
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
