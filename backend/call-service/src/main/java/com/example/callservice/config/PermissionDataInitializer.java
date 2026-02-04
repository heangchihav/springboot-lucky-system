package com.example.callservice.config;

import com.example.callservice.entity.permission.Permission;
import com.example.callservice.entity.role.Role;
import com.example.callservice.repository.permission.PermissionRepository;
import com.example.callservice.repository.role.RoleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
public class PermissionDataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(PermissionDataInitializer.class);

    private final PermissionRepository permissionRepository;
    private final RoleRepository roleRepository;

    public PermissionDataInitializer(PermissionRepository permissionRepository, RoleRepository roleRepository) {
        this.permissionRepository = permissionRepository;
        this.roleRepository = roleRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        logger.info("Initializing permissions for call-service...");
        initializePermissions();
    }

    private void initializePermissions() {
        logger.info("Initializing call-service permissions...");

        List<Permission> defaultPermissions = Arrays.asList(
                // Dashboard permissions
                new Permission("dashboard.view", "View Dashboard", "Can view call service dashboard"),
                new Permission("dashboard.overview", "View Overview", "Can view call service overview"),
                new Permission("dashboard.escalations", "View Escalations", "Can view call escalations"),
                new Permission("dashboard.queue-health", "View Queue Health", "Can view queue health metrics"),

                // Area permissions (API: /api/calls/areas)
                new Permission("area.view", "View Areas", "Can view call service areas"),
                new Permission("area.create", "Create Areas", "Can create new call service areas"),
                new Permission("area.edit", "Edit Areas", "Can edit existing call service areas"),
                new Permission("area.delete", "Delete Areas", "Can delete call service areas"),

                // Subarea permissions (API: /api/calls/subareas)
                new Permission("subarea.view", "View Subareas", "Can view call service subareas"),
                new Permission("subarea.create", "Create Subareas", "Can create new call service subareas"),
                new Permission("subarea.edit", "Edit Subareas", "Can edit existing call service subareas"),
                new Permission("subarea.delete", "Delete Subareas", "Can delete call service subareas"),

                // Branch permissions (API: /api/calls/branches)
                new Permission("branch.view", "View Branches", "Can view call service branches"),
                new Permission("branch.create", "Create Branches", "Can create new call service branches"),
                new Permission("branch.edit", "Edit Branches", "Can edit existing call service branches"),
                new Permission("branch.update", "Update Branches", "Can update call service branches"),
                new Permission("branch.delete", "Delete Branches", "Can delete call service branches"),

                // User branch assignment permissions (API: /api/calls/user-branches)
                new Permission("user.branch.assign", "Assign User to Branch", "Can assign users to branches"),
                new Permission("user.branch.remove", "Remove User from Branch", "Can remove users from branches"),
                new Permission("user.branch.view", "View User Branch Assignments", "Can view user branch assignments"),

                // Call management permissions (API: /api/calls/reports)
                new Permission("call-report.view", "View Call Reports", "Can view call records and reports"),
                new Permission("call-report.create", "Create Call Reports", "Can create new call records"),
                new Permission("call-report.edit", "Edit Call Reports", "Can edit existing call records"),
                new Permission("call-report.delete", "Delete Call Reports", "Can delete call records"),

                // Call Status permissions (API: /api/calls/statuses)
                new Permission("call-status.view", "View Call Status", "Can view call status options"),
                new Permission("call-status.create", "Create Call Status", "Can create new call status"),
                new Permission("call-status.edit", "Edit Call Status", "Can edit existing call status"),
                new Permission("call-status.delete", "Delete Call Status", "Can delete call status"),

                // Role permissions (API: /api/calls/roles)
                new Permission("role.view", "View Roles", "Can view call service roles"),
                new Permission("role.manage", "Manage Roles", "Can create, edit, delete roles"),
                new Permission("role.assign", "Assign Roles", "Can assign users to roles"),

                // Permission permissions (API: /api/calls/permissions)
                new Permission("permission.view", "View Permissions", "Can view call service permissions"),
                new Permission("permission.manage", "Manage Permissions",
                        "Can create, edit, delete permissions"),

                // User management permissions (API: /api/calls/users)
                new Permission("user.view", "View Users", "Can view call service users"),
                new Permission("user.create", "Create Users", "Can create new call service users"),
                new Permission("user.edit", "Edit Users", "Can edit existing call service users"),
                new Permission("user.delete", "Delete Users", "Can delete call service users"),

                // User assignment permissions (API: /api/calls/user-assignments)
                new Permission("user.assign", "Assign Users", "Can assign users to roles and branches"));

        logger.info("Processing {} default permissions", defaultPermissions.size());

        // Check if permissions already exist and add missing ones
        long existingCount = permissionRepository.count();
        logger.info("Found {} existing permissions in database", existingCount);

        int createdCount = 0;
        int skippedCount = 0;

        for (Permission permission : defaultPermissions) {
            try {
                logger.info("Checking permission: {}", permission.getCode());

                // Check if permission already exists
                if (permissionRepository.existsByCode(permission.getCode())) {
                    skippedCount++;
                    logger.info("Permission already exists, skipping: {}", permission.getCode());
                    continue;
                }

                // Create new permission
                logger.info("Creating new permission: {}", permission.getCode());
                setMenuMetadata(permission);
                permissionRepository.save(permission);
                createdCount++;
                logger.info("Created permission: {} - {}", permission.getCode(), permission.getName());
            } catch (Exception e) {
                logger.error("Failed to create permission {}: {}", permission.getCode(), e.getMessage());
            }
        }

        logger.info("Permission initialization complete: {} created, {} skipped", createdCount, skippedCount);

        long totalPermissions = permissionRepository.count();
        logger.info("Successfully initialized {} permissions for call-service", totalPermissions);

        // Always update default role to include all permissions
        updateDefaultRole();
    }

    private void updateDefaultRole() {
        logger.info("Updating default role with all permissions...");

        // Find or create default role
        Role fullAccessRole = roleRepository.findByName("Full Access")
                .orElseGet(() -> {
                    logger.info("Creating new 'Full Access' role");
                    return new Role("Full Access", "Role with access to all call-service permissions", 0L);
                });

        // Get all permissions and assign them to the role
        List<Permission> allPermissions = permissionRepository.findAll();
        fullAccessRole.setPermissions(new java.util.HashSet<>(allPermissions));

        // Save the role
        roleRepository.save(fullAccessRole);

        logger.info("Updated 'Full Access' role with {} permissions", allPermissions.size());
    }

    private void setMenuMetadata(Permission permission) {
        String code = permission.getCode();

        // Dashboard permissions
        if (code.startsWith("dashboard.")) {
            permission.setMenuGroup("Dashboard");
            if (code.equals("dashboard.view")) {
                permission.setMenuNumber("1.1");
            } else if (code.equals("dashboard.overview")) {
                permission.setMenuNumber("1.2");
            } else if (code.equals("dashboard.escalations")) {
                permission.setMenuNumber("1.3");
            } else if (code.equals("dashboard.queue-health")) {
                permission.setMenuNumber("1.4");
            }
            return;
        }

        // Area Management permissions
        if (code.startsWith("area.")) {
            permission.setMenuGroup("Areas");
            if (code.equals("area.view")) {
                permission.setMenuNumber("2.1");
            } else if (code.equals("area.create")) {
                permission.setMenuNumber("2.2");
            } else if (code.equals("area.edit")) {
                permission.setMenuNumber("2.3");
            } else if (code.equals("area.delete")) {
                permission.setMenuNumber("2.4");
            }
            return;
        }

        // Subarea Management permissions
        if (code.startsWith("subarea.")) {
            permission.setMenuGroup("Sub-Areas");
            if (code.equals("subarea.view")) {
                permission.setMenuNumber("3.1");
            } else if (code.equals("subarea.create")) {
                permission.setMenuNumber("3.2");
            } else if (code.equals("subarea.edit")) {
                permission.setMenuNumber("3.3");
            } else if (code.equals("subarea.delete")) {
                permission.setMenuNumber("3.4");
            }
            return;
        }

        // Branch permissions
        if (code.startsWith("branch.")) {
            permission.setMenuGroup("Branches");
            if (code.equals("branch.view")) {
                permission.setMenuNumber("4.1");
            } else if (code.equals("branch.create")) {
                permission.setMenuNumber("4.2");
            } else if (code.equals("branch.edit")) {
                permission.setMenuNumber("4.3");
            } else if (code.equals("branch.update")) {
                permission.setMenuNumber("4.4");
            } else if (code.equals("branch.delete")) {
                permission.setMenuNumber("4.5");
            }
            return;
        }

        // User branch assignment permissions
        if (code.startsWith("user.branch.")) {
            permission.setMenuGroup("User Branch Assignments");
            if (code.equals("user.branch.assign")) {
                permission.setMenuNumber("5.1");
            } else if (code.equals("user.branch.remove")) {
                permission.setMenuNumber("5.2");
            } else if (code.equals("user.branch.view")) {
                permission.setMenuNumber("5.3");
            }
            return;
        }

        // Call Reports permissions
        if (code.startsWith("call-report.")) {
            permission.setMenuGroup("Call Reports");
            if (code.equals("call-report.view")) {
                permission.setMenuNumber("6.1");
            } else if (code.equals("call-report.create")) {
                permission.setMenuNumber("6.2");
            } else if (code.equals("call-report.edit")) {
                permission.setMenuNumber("6.3");
            } else if (code.equals("call-report.delete")) {
                permission.setMenuNumber("6.4");
            }
            return;
        }

        // Call Status permissions
        if (code.startsWith("call-status.")) {
            permission.setMenuGroup("Call Status");
            if (code.equals("call-status.view")) {
                permission.setMenuNumber("7.1");
            } else if (code.equals("call-status.create")) {
                permission.setMenuNumber("7.2");
            } else if (code.equals("call-status.edit")) {
                permission.setMenuNumber("7.3");
            } else if (code.equals("call-status.delete")) {
                permission.setMenuNumber("7.4");
            }
            return;
        }

        // Role permissions
        if (code.startsWith("role.")) {
            permission.setMenuGroup("Role Management");
            if (code.equals("role.view")) {
                permission.setMenuNumber("8.1");
            } else if (code.equals("role.manage")) {
                permission.setMenuNumber("8.2");
            } else if (code.equals("role.assign")) {
                permission.setMenuNumber("8.3");
            }
            return;
        }

        // Permission permissions
        if (code.startsWith("permission.")) {
            permission.setMenuGroup("Permissions Management");
            if (code.equals("permission.view")) {
                permission.setMenuNumber("9.1");
            } else if (code.equals("permission.manage")) {
                permission.setMenuNumber("9.2");
            }
            return;
        }

        // User Management permissions
        if (code.startsWith("user.") && !code.startsWith("user.branch.")) {
            permission.setMenuGroup("User Management");
            if (code.equals("user.view")) {
                permission.setMenuNumber("10.1");
            } else if (code.equals("user.create")) {
                permission.setMenuNumber("10.2");
            } else if (code.equals("user.edit")) {
                permission.setMenuNumber("10.3");
            } else if (code.equals("user.delete")) {
                permission.setMenuNumber("10.4");
            } else if (code.equals("user.assign")) {
                permission.setMenuNumber("10.5");
            }
            return;
        }

        // Default grouping
        permission.setMenuGroup("Other");
    }
}
