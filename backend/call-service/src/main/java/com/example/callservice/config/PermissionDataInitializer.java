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
            // 1. Dashboard Permissions (Menu 1)
            new Permission("menu.1.view", "View Dashboard", "Can view call service dashboard"),
            new Permission("menu.1.analytics", "View Analytics", "Can view dashboard analytics and metrics"),
            
            // 2. Area & Branch Permissions (Menu 2)
            new Permission("menu.2.view", "View Areas & Branches", "Can view area and branch information"),
            new Permission("menu.2.area.create", "Create Areas", "Can create new areas"),
            new Permission("menu.2.area.edit", "Edit Areas", "Can edit existing areas"),
            new Permission("menu.2.area.delete", "Delete Areas", "Can delete areas"),
            new Permission("menu.2.branch.create", "Create Branches", "Can create new branches"),
            new Permission("menu.2.branch.edit", "Edit Branches", "Can edit existing branches"),
            new Permission("menu.2.branch.delete", "Delete Branches", "Can delete branches"),
            
            // 3. Reports Permissions (Menu 3)
            new Permission("menu.3.view", "View Reports", "Can view call reports"),
            new Permission("menu.3.export", "Export Reports", "Can export call reports"),
            new Permission("menu.3.analytics", "Advanced Analytics", "Can access advanced analytics"),
            
            // 4. Manage Users Permissions (Menu 4)
            new Permission("menu.4.view", "View Users", "Can view user information"),
            new Permission("menu.4.create", "Create Users", "Can create new users"),
            new Permission("menu.4.edit", "Edit Users", "Can edit user information"),
            new Permission("menu.4.delete", "Delete Users", "Can delete users"),
            new Permission("menu.4.assign", "Assign Users", "Can assign users to branches/roles"),
            
            // 5. Permissions Management Permissions (Menu 5)
            new Permission("menu.5.view", "View Permissions", "Can view permission settings"),
            new Permission("menu.5.manage", "Manage Permissions", "Can manage roles and permissions"),
            new Permission("menu.5.assign", "Assign Permissions", "Can assign permissions to roles"),
            
            // 6. Areas Management Permissions (Menu 6) - Required by AreaController
            new Permission("menu.6.area.view", "View Areas", "Can view areas list"),
            new Permission("menu.6.area.create", "Create Areas", "Can create new areas"),
            new Permission("menu.6.area.edit", "Edit Areas", "Can edit existing areas"),
            new Permission("menu.6.area.delete", "Delete Areas", "Can delete areas"),
            
            // 7. Branch Permissions (additional runtime permissions)
            new Permission("branch.view", "View Branches", "Can view branch information"),
            new Permission("branch.create", "Create Branches", "Can create new branches"),
            new Permission("branch.update", "Update Branches", "Can update branch information"),
            new Permission("branch.delete", "Delete Branches", "Can delete branches")
        );
        
        // Check if permissions already exist to avoid deleting on every restart
        long existingCount = permissionRepository.count();
        if (existingCount > 0) {
            logger.info("Permissions already exist ({}), skipping initialization", existingCount);
            return;
        }
        
        logger.info("No existing permissions found, creating default permissions...");
        
        // Save new permissions
        for (Permission permission : defaultPermissions) {
            try {
                // Set menuGroup and menuNumber based on permission code
                setMenuMetadata(permission);
                permissionRepository.save(permission);
                logger.debug("Created permission: {}", permission.getCode());
            } catch (Exception e) {
                logger.error("Failed to create permission {}: {}", permission.getCode(), e.getMessage());
            }
        }
        
        long totalPermissions = permissionRepository.count();
        logger.info("Successfully initialized {} permissions for call-service", totalPermissions);
        
        // Create default role with all permissions
        createDefaultRole();
    }
    
    private void setMenuMetadata(Permission permission) {
        String code = permission.getCode();
        
        // Handle branch.* permissions separately
        if (code.startsWith("branch.")) {
            permission.setMenuGroup("Areas");
            permission.setMenuNumber("2.1");
            return;
        }
        
        // Extract menu number from code (e.g., "menu.1.view" -> "1")
        if (code.startsWith("menu.")) {
            String[] parts = code.split("\\.");
            if (parts.length >= 2) {
                String menuNumber = parts[1];
                permission.setMenuNumber(menuNumber);
                
                // Set menu group based on menu number
                switch (menuNumber) {
                    case "1":
                        permission.setMenuGroup("Dashboard");
                        break;
                    case "2":
                        permission.setMenuGroup("Area & Branch");
                        break;
                    case "3":
                        permission.setMenuGroup("Reports");
                        break;
                    case "4":
                        permission.setMenuGroup("User Management");
                        break;
                    case "5":
                        permission.setMenuGroup("Permissions Management");
                        break;
                    case "6":
                        permission.setMenuGroup("Areas");
                        break;
                    default:
                        permission.setMenuGroup("Other");
                        break;
                }
                
                // Set detailed menu number (e.g., "1.1", "2.1", etc.)
                if (parts.length >= 3) {
                    String subNumber = parts[2];
                    // Map sub-actions to numbers
                    String subNum = getSubNumber(subNumber);
                    permission.setMenuNumber(menuNumber + "." + subNum);
                }
            }
        }
    }
    
    private String getSubNumber(String subAction) {
        switch (subAction) {
            case "view": return "1";
            case "analytics": return "2";
            case "create": return "2";
            case "edit": return "3";
            case "delete": return "4";
            case "assign": return "5";
            case "export": return "2";
            case "manage": return "2";
            default: return "1";
        }
    }
    
    private void createDefaultRole() {
        logger.info("Creating default role with all permissions...");
        
        // Check if default role already exists
        if (roleRepository.existsByName("Full Access")) {
            logger.info("Default role 'Full Access' already exists, skipping role creation");
            return;
        }
        
        // Create default role
        Role fullAccessRole = new Role("Full Access", "Role with access to all call-service permissions");
        
        // Assign all permissions to this role
        List<Permission> allPermissions = permissionRepository.findAll();
        fullAccessRole.setPermissions(new java.util.HashSet<>(allPermissions));
        
        // Save the role
        roleRepository.save(fullAccessRole);
        
        logger.info("Created default role 'Full Access' with {} permissions", allPermissions.size());
    }
}
