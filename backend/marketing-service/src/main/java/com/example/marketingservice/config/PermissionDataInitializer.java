package com.example.marketingservice.config;

import com.example.marketingservice.entity.permission.Permission;
import com.example.marketingservice.entity.role.Role;
import com.example.marketingservice.repository.permission.PermissionRepository;
import com.example.marketingservice.repository.role.RoleRepository;
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
        logger.info("Initializing marketing-service permissions...");

        List<Permission> defaultPermissions = Arrays.asList(
                new Permission("menu.1.view", "View Dashboard", "Can view marketing service dashboard"),
                new Permission("menu.1.analytics", "View Analytics", "Can view dashboard analytics and metrics"),

                new Permission("area.view", "View Areas", "Can view marketing areas"),
                new Permission("area.create", "Create Areas", "Can create new marketing areas"),
                new Permission("area.edit", "Edit Areas", "Can edit existing areas"),
                new Permission("area.delete", "Delete Areas", "Can delete areas"),

                new Permission("subarea.view", "View Sub-Areas", "Can view marketing sub-areas"),
                new Permission("subarea.create", "Create Sub-Areas", "Can create new sub-areas"),
                new Permission("subarea.edit", "Edit Sub-Areas", "Can edit existing sub-areas"),
                new Permission("subarea.delete", "Delete Sub-Areas", "Can delete sub-areas"),

                new Permission("branch.view", "View Branches", "Can view marketing branches"),
                new Permission("branch.create", "Create Branches", "Can create new branches"),
                new Permission("branch.edit", "Edit Branches", "Can edit existing branches"),
                new Permission("branch.delete", "Delete Branches", "Can delete branches"),

                new Permission("competitor.view", "View Competitors", "Can view competitor information"),
                new Permission("competitor.create", "Create Competitors", "Can create new competitors"),
                new Permission("competitor.edit", "Edit Competitors", "Can edit competitor information"),
                new Permission("competitor.delete", "Delete Competitors", "Can delete competitors"),

                new Permission("problem.view", "View Problems", "Can view marketing problems"),
                new Permission("problem.create", "Create Problems", "Can create new problems"),
                new Permission("problem.edit", "Edit Problems", "Can edit existing problems"),
                new Permission("problem.delete", "Delete Problems", "Can delete problems"),

                new Permission("member.view", "View VIP Members", "Can view VIP member information"),
                new Permission("member.create", "Create VIP Members", "Can create new VIP members"),
                new Permission("member.edit", "Edit VIP Members", "Can edit VIP member information"),
                new Permission("member.delete", "Delete VIP Members", "Can delete VIP members"),

                new Permission("goods.view", "View Goods Shipments", "Can view goods shipment records"),
                new Permission("goods.create", "Create Goods Shipments", "Can create goods shipment records"),
                new Permission("goods.edit", "Edit Goods Shipments", "Can edit goods shipment records"),
                new Permission("goods.delete", "Delete Goods Shipments", "Can delete goods shipment records"),

                new Permission("user.view", "View Users", "Can view marketing service users"),
                new Permission("user.create", "Create Users", "Can create new users"),
                new Permission("user.edit", "Edit Users", "Can edit existing users"),
                new Permission("user.delete", "Delete Users", "Can delete users"),

                new Permission("menu.5.view", "View Permissions", "Can view permission settings"),
                new Permission("menu.5.manage", "Manage Permissions", "Can manage roles and permissions"),
                new Permission("menu.5.assign", "Assign Permissions", "Can assign permissions to roles"),

                new Permission("menu.marketing.reports.view", "View Daily Reports", "Can view daily marketing reports"),
                new Permission("menu.marketing.reports.create", "Create Daily Reports",
                        "Can create new daily marketing reports"),
                new Permission("menu.marketing.reports.edit", "Edit Daily Reports",
                        "Can edit existing daily marketing reports"),
                new Permission("menu.marketing.reports.delete", "Delete Daily Reports",
                        "Can delete daily marketing reports"));

        long existingCount = permissionRepository.count();
        logger.info("Found {} existing permissions in database", existingCount);

        int createdCount = 0;
        int skippedCount = 0;

        for (Permission permission : defaultPermissions) {
            try {
                // Check if permission already exists
                if (permissionRepository.existsByCode(permission.getCode())) {
                    skippedCount++;
                    logger.debug("Permission already exists, skipping: {}", permission.getCode());
                    continue;
                }

                // Create new permission
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
        logger.info("Successfully initialized {} permissions for marketing-service", totalPermissions);

        createDefaultRole();
    }

    private void setMenuMetadata(Permission permission) {
        String code = permission.getCode();

        if (code.startsWith("area.")) {
            permission.setMenuGroup("Areas");
            permission.setMenuNumber("2");
            return;
        }

        if (code.startsWith("subarea.")) {
            permission.setMenuGroup("Sub-Areas");
            permission.setMenuNumber("3");
            return;
        }

        if (code.startsWith("branch.")) {
            permission.setMenuGroup("Branches");
            permission.setMenuNumber("4");
            return;
        }

        if (code.startsWith("competitor.")) {
            permission.setMenuGroup("Competitors");
            permission.setMenuNumber("5");
            return;
        }

        if (code.startsWith("problem.")) {
            permission.setMenuGroup("Problems");
            permission.setMenuNumber("6");
            return;
        }

        if (code.startsWith("member.")) {
            permission.setMenuGroup("VIP Members");
            permission.setMenuNumber("7");
            return;
        }

        if (code.startsWith("goods.")) {
            permission.setMenuGroup("Goods Shipments");
            permission.setMenuNumber("8");
            return;
        }

        if (code.startsWith("user.")) {
            permission.setMenuGroup("User Management");
            permission.setMenuNumber("9");
            return;
        }

        if (code.startsWith("menu.marketing.reports")) {
            permission.setMenuGroup("Daily Reports");
            permission.setMenuNumber("10");
            return;
        }

        if (code.startsWith("menu.")) {
            String[] parts = code.split("\\.");
            if (parts.length >= 2) {
                String menuNumber = parts[1];
                permission.setMenuNumber(menuNumber);

                switch (menuNumber) {
                    case "1":
                        permission.setMenuGroup("Dashboard");
                        break;
                    case "5":
                        permission.setMenuGroup("Permissions Management");
                        break;
                    default:
                        permission.setMenuGroup("Other");
                        break;
                }

                if (parts.length >= 3) {
                    String subNumber = parts[2];
                    String subNum = getSubNumber(subNumber);
                    permission.setMenuNumber(menuNumber + "." + subNum);
                }
            }
        }
    }

    private String getSubNumber(String subAction) {
        switch (subAction) {
            case "view":
                return "1";
            case "analytics":
                return "2";
            case "create":
                return "2";
            case "edit":
                return "3";
            case "delete":
                return "4";
            case "assign":
                return "5";
            case "export":
                return "2";
            case "manage":
                return "2";
            default:
                return "1";
        }
    }

    private void createDefaultRole() {
        logger.info("Creating default role with all permissions...");

        if (roleRepository.existsByName("Full Access")) {
            logger.info("Default role 'Full Access' already exists, skipping role creation");
            return;
        }

        Role fullAccessRole = new Role("Full Access", "Role with access to all marketing-service permissions", 0L);

        List<Permission> allPermissions = permissionRepository.findAll();
        fullAccessRole.setPermissions(new java.util.HashSet<>(allPermissions));

        roleRepository.save(fullAccessRole);

        logger.info("Created default role 'Full Access' with {} permissions", allPermissions.size());
    }
}
