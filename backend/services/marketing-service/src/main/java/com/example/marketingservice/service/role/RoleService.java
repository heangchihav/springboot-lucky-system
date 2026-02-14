package com.example.marketingservice.service.role;

import com.example.marketingservice.dto.role.CreateRoleRequest;
import com.example.marketingservice.dto.role.UpdateRoleRequest;
import com.example.marketingservice.entity.permission.Permission;
import com.example.marketingservice.entity.role.Role;
import com.example.marketingservice.entity.role.UserRole;
import com.example.marketingservice.repository.permission.PermissionRepository;
import com.example.marketingservice.repository.role.RoleRepository;
import com.example.marketingservice.repository.role.UserRoleRepository;
import com.example.marketingservice.service.permission.PermissionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class RoleService {

    private static final Logger logger = LoggerFactory.getLogger(RoleService.class);

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final PermissionService permissionService;
    private final UserRoleRepository userRoleRepository;

    public RoleService(RoleRepository roleRepository,
            PermissionRepository permissionRepository,
            @Lazy PermissionService permissionService,
            UserRoleRepository userRoleRepository) {
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.permissionService = permissionService;
        this.userRoleRepository = userRoleRepository;
    }

    public List<Role> getAllRoles() {
        return roleRepository.findAll();
    }

    public List<Role> getRolesForUser(Long userId, boolean isRootUser) {
        if (isRootUser) {
            return roleRepository.findAll();
        }
        if (userId == null) {
            return Collections.emptyList();
        }
        return roleRepository.findByCreatedBy(userId);
    }

    public Optional<Role> getRoleById(Long id) {
        return roleRepository.findById(id);
    }

    public Role createRole(CreateRoleRequest request, Long createdBy, boolean isRootUser) {
        if (createdBy == null) {
            throw new IllegalArgumentException("Creator user ID is required to create a role");
        }
        if (roleRepository.existsByName(request.getName())) {
            throw new IllegalArgumentException("Role with name '" + request.getName() + "' already exists");
        }

        Role role = new Role(request.getName(), request.getDescription(), createdBy);

        if (request.getPermissionCodes() != null && !request.getPermissionCodes().isEmpty()) {
            Set<Permission> requestedPermissions = request.getPermissionCodes().stream()
                    .map(permissionCode -> permissionRepository.findByCode(permissionCode)
                            .orElseThrow(() -> new IllegalArgumentException(
                                    "Permission not found with code: " + permissionCode)))
                    .collect(Collectors.toSet());

            Set<Permission> allowedPermissions = requestedPermissions;

            if (!isRootUser) {
                List<Permission> userPermissions = permissionService.getPermissionsForUser(createdBy);
                Set<String> userPermissionCodes = userPermissions.stream()
                        .map(Permission::getCode)
                        .collect(Collectors.toSet());

                logger.info("User {} has {} permissions: {}", createdBy, userPermissionCodes.size(),
                        userPermissionCodes);
                logger.info("Requested permissions: {}", request.getPermissionCodes());

                allowedPermissions = requestedPermissions.stream()
                        .filter(permission -> userPermissionCodes.contains(permission.getCode()))
                        .collect(Collectors.toSet());

                logger.info("Allowed permissions after filtering: {}",
                        allowedPermissions.stream().map(Permission::getCode).collect(Collectors.toList()));
            } else {
                logger.info("Root user {} creating role with unrestricted permissions: {}", createdBy,
                        requestedPermissions.stream().map(Permission::getCode).collect(Collectors.toList()));
            }

            role.setPermissions(allowedPermissions);
        }

        Role updatedRole = roleRepository.save(role);

        synchronizeCreatorRolesForAssignments(updatedRole.getId());

        return updatedRole;
    }

    public Role updateRole(Long id, UpdateRoleRequest request, Long currentUserId, boolean isRootUser) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Role not found with id: " + id));

        if (!role.getName().equals(request.getName()) && roleRepository.existsByName(request.getName())) {
            throw new IllegalArgumentException("Role with name '" + request.getName() + "' already exists");
        }

        role.setName(request.getName());
        role.setDescription(request.getDescription());

        if (request.getPermissionCodes() != null) {
            Set<Permission> requestedPermissions = request.getPermissionCodes().stream()
                    .map(permissionCode -> permissionRepository.findByCode(permissionCode)
                            .orElseThrow(() -> new IllegalArgumentException(
                                    "Permission not found with code: " + permissionCode)))
                    .collect(Collectors.toSet());

            Set<Permission> allowedPermissions = requestedPermissions;

            if (!isRootUser) {
                List<Permission> userPermissions = permissionService.getPermissionsForUser(currentUserId);
                Set<String> userPermissionCodes = userPermissions.stream()
                        .map(Permission::getCode)
                        .collect(Collectors.toSet());

                allowedPermissions = requestedPermissions.stream()
                        .filter(permission -> userPermissionCodes.contains(permission.getCode()))
                        .collect(Collectors.toSet());
            }

            role.setPermissions(allowedPermissions);
        }

        Role updatedRole = roleRepository.save(role);
        synchronizeCreatorRolesForAssignments(updatedRole.getId());
        return updatedRole;
    }

    public void deleteRole(Long id) {
        if (!roleRepository.existsById(id)) {
            throw new IllegalArgumentException("Role not found with id: " + id);
        }
        roleRepository.deleteById(id);
    }

    public Integer getUserCountForRole(Long roleId) {
        return 0;
    }

    public boolean existsById(Long id) {
        return roleRepository.existsById(id);
    }

    public boolean existsByName(String name) {
        return roleRepository.existsByName(name);
    }

    private void synchronizeCreatorRolesForAssignments(Long roleId) {
        List<UserRole> assignments = userRoleRepository.findByRoleIdAndActiveTrue(roleId);
        Set<Long> creators = assignments.stream()
                .map(UserRole::getUserId)
                .filter(userId -> userId != null)
                .collect(Collectors.toSet());

        for (Long creatorId : creators) {
            reconcileRolesForCreator(creatorId);
        }
    }

    public void reconcileRolesForCreator(Long creatorId) {
        if (creatorId == null) {
            return;
        }
        synchronizeRolesCreatedByUser(creatorId, new HashSet<>());
    }

    private void synchronizeRolesCreatedByUser(Long creatorId, Set<Long> visitedCreators) {
        if (creatorId == null || visitedCreators.contains(creatorId)) {
            return;
        }
        visitedCreators.add(creatorId);

        List<Role> createdRoles = roleRepository.findByCreatedBy(creatorId);
        if (createdRoles.isEmpty()) {
            return;
        }

        Set<String> creatorPermissionCodes = permissionService.getPermissionsForUser(creatorId).stream()
                .map(Permission::getCode)
                .collect(Collectors.toSet());

        permissionService.trimUserPermissionsToAllowedCodes(creatorId, creatorPermissionCodes);

        for (Role createdRole : createdRoles) {
            Set<Permission> filteredPermissions = createdRole.getPermissions().stream()
                    .filter(permission -> creatorPermissionCodes.contains(permission.getCode()))
                    .collect(Collectors.toSet());

            if (!filteredPermissions.equals(createdRole.getPermissions())) {
                createdRole.setPermissions(filteredPermissions);
                roleRepository.save(createdRole);
                logger.info("Synchronized permissions for role {} created by user {}", createdRole.getId(), creatorId);
            }

            List<UserRole> downstreamAssignments = userRoleRepository.findByRoleIdAndActiveTrue(createdRole.getId());
            for (UserRole assignment : downstreamAssignments) {
                synchronizeRolesCreatedByUser(assignment.getUserId(), visitedCreators);
            }
        }
    }
}
