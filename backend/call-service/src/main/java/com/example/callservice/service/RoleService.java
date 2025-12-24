package com.example.callservice.service;

import com.example.callservice.dto.CreateRoleRequest;
import com.example.callservice.dto.UpdateRoleRequest;
import com.example.callservice.entity.Permission;
import com.example.callservice.entity.Role;
import com.example.callservice.repository.PermissionRepository;
import com.example.callservice.repository.RoleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class RoleService {
    
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    
    public RoleService(RoleRepository roleRepository, PermissionRepository permissionRepository) {
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
    }
    
    public List<Role> getAllRoles() {
        return roleRepository.findAll();
    }
    
    public Optional<Role> getRoleById(Long id) {
        return roleRepository.findById(id);
    }
    
    public Role createRole(CreateRoleRequest request) {
        if (roleRepository.existsByName(request.getName())) {
            throw new IllegalArgumentException("Role with name '" + request.getName() + "' already exists");
        }
        
        Role role = new Role(request.getName(), request.getDescription());
        
        // Add permissions based on permission codes
        if (request.getPermissionCodes() != null && !request.getPermissionCodes().isEmpty()) {
            Set<Permission> permissions = request.getPermissionCodes().stream()
                .map(permissionCode -> permissionRepository.findByCode(permissionCode)
                    .orElseThrow(() -> new IllegalArgumentException("Permission not found with code: " + permissionCode)))
                .collect(Collectors.toSet());
            role.setPermissions(permissions);
        }
        
        return roleRepository.save(role);
    }
    
    public Role updateRole(Long id, UpdateRoleRequest request) {
        Role role = roleRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Role not found with id: " + id));
        
        // Check if name is being changed and if new name already exists
        if (!role.getName().equals(request.getName()) && roleRepository.existsByName(request.getName())) {
            throw new IllegalArgumentException("Role with name '" + request.getName() + "' already exists");
        }
        
        role.setName(request.getName());
        role.setDescription(request.getDescription());
        
        // Update permissions based on permission codes
        if (request.getPermissionCodes() != null) {
            Set<Permission> permissions = request.getPermissionCodes().stream()
                .map(permissionCode -> permissionRepository.findByCode(permissionCode)
                    .orElseThrow(() -> new IllegalArgumentException("Permission not found with code: " + permissionCode)))
                .collect(Collectors.toSet());
            role.setPermissions(permissions);
        }
        
        return roleRepository.save(role);
    }
    
    public void deleteRole(Long id) {
        if (!roleRepository.existsById(id)) {
            throw new IllegalArgumentException("Role not found with id: " + id);
        }
        roleRepository.deleteById(id);
    }
    
    public Integer getUserCountForRole(Long roleId) {
        // This would typically query a user_role table
        // For now, return 0 as placeholder
        return 0;
    }
    
    public boolean existsById(Long id) {
        return roleRepository.existsById(id);
    }
    
    public boolean existsByName(String name) {
        return roleRepository.existsByName(name);
    }
}
