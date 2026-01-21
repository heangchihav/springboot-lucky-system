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
        initializePermissions();
    }

    private void initializePermissions() {
        logger.info("Initializing call-service permissions...");

        List<Permission> defaultPermissions = Arrays.asList(
                // Dashboard permissions
                new Permission("menu.6.view", "View Dashboard", "Can view call service dashboard"),
                new Permission("menu.6.overview", "View Overview", "Can view call service overview"),
                new Permission("menu.6.escalations", "View Escalations", "Can view call escalations"),
                new Permission("menu.6.queue-health", "View Queue Health", "Can view queue health metrics"),

                // Area permissions
                new Permission("area.view", "View Areas", "Can view call service areas"),
                new Permission("area.create", "Create Areas", "Can create new call service areas"),
                new Permission("area.edit", "Edit Areas", "Can edit existing call service areas"),
                new Permission("area.delete", "Delete Areas", "Can delete call service areas"),

                // Subarea permissions
                new Permission("subarea.view", "View Subareas", "Can view call service subareas"),
                new Permission("subarea.create", "Create Subareas", "Can create new call service subareas"),
                new Permission("subarea.edit", "Edit Subareas", "Can edit existing call service subareas"),
                new Permission("subarea.delete", "Delete Subareas", "Can delete call service subareas"),

                // Branch permissions
                new Permission("branch.view", "View Branches", "Can view call service branches"),
                new Permission("branch.create", "Create Branches", "Can create new call service branches"),
                new Permission("branch.edit", "Edit Branches", "Can edit existing call service branches"),
                new Permission("branch.update", "Update Branches", "Can update call service branches"),
                new Permission("branch.delete", "Delete Branches", "Can delete call service branches"),

                // User branch assignment permissions
                new Permission("user.branch.assign", "Assign User to Branch", "Can assign users to branches"),
                new Permission("user.branch.remove", "Remove User from Branch", "Can remove users from branches"),
                new Permission("user.branch.view", "View User Branch Assignments", "Can view user branch assignments"),

                // Call management permissions
                new Permission("call.view", "View Calls", "Can view call records"),
                new Permission("call.create", "Create Calls", "Can create new call records"),
                new Permission("call.edit", "Edit Calls", "Can edit existing call records"),
                new Permission("call.delete", "Delete Calls", "Can delete call records"),
                new Permission("call.assign", "Assign Calls", "Can assign calls to agents"),

                // Agent permissions
                new Permission("agent.view", "View Agents", "Can view call agents"),
                new Permission("agent.create", "Create Agents", "Can create new call agents"),
                new Permission("agent.edit", "Edit Agents", "Can edit existing call agents"),
                new Permission("agent.delete", "Delete Agents", "Can delete call agents"),
                new Permission("agent.assign", "Assign Agents", "Can assign agents to calls"),

                // Queue management permissions
                new Permission("queue.view", "View Queues", "Can view call queues"),
                new Permission("queue.manage", "Manage Queues", "Can manage call queue settings"),
                new Permission("queue.priority", "Set Priority", "Can set call priority levels"),

                // Reporting permissions
                new Permission("report.view", "View Reports", "Can view call service reports"),
                new Permission("report.create", "Create Reports", "Can generate new reports"),
                new Permission("report.export", "Export Reports", "Can export reports to various formats"),

                // System permissions
                new Permission("system.config", "System Configuration", "Can configure system settings"),
                new Permission("system.monitor", "System Monitoring", "Can monitor system performance"),
                new Permission("system.logs", "View System Logs", "Can view system logs and audit trails"));

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
                logger.info("Created new permission: {}", permission.getCode());
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

    private void setMenuMetadata(Permission permission) {
        String code = permission.getCode();

        if (code.startsWith("area.")) {
            permission.setMenuGroup("Areas");
            return;
        }

        if (code.startsWith("subarea.")) {
            permission.setMenuGroup("Subareas");
            return;
        }

        if (code.startsWith("branch.")) {
            permission.setMenuGroup("Branches");
            return;
        }

        if (code.startsWith("user.branch.")) {
            permission.setMenuGroup("User Branch Assignments");
            return;
        }

        if (code.startsWith("call.")) {
            permission.setMenuGroup("Call Management");
            return;
        }

        if (code.startsWith("agent.")) {
            permission.setMenuGroup("Agent Management");
            return;
        }

        if (code.startsWith("queue.")) {
            permission.setMenuGroup("Queue Management");
            return;
        }

        if (code.startsWith("report.")) {
            permission.setMenuGroup("Reports");
            return;
        }

        if (code.startsWith("system.")) {
            permission.setMenuGroup("System Management");
            return;
        }

        if (code.startsWith("menu.")) {
            String[] parts = code.split("\\.");
            if (parts.length >= 2) {
                String menuNumber = parts[1];

                switch (menuNumber) {
                    case "6":
                        permission.setMenuGroup("Call Service");
                        break;
                    default:
                        permission.setMenuGroup("Other");
                        break;
                }
            }
        }
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
}
