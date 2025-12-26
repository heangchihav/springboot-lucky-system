package com.example.callservice.dto.role;

import java.util.List;

public class UpdateRoleRequest {
    private String name;
    private String description;
    private List<String> permissionCodes;
    
    public UpdateRoleRequest() {}
    
    public UpdateRoleRequest(String name, String description, List<String> permissionCodes) {
        this.name = name;
        this.description = description;
        this.permissionCodes = permissionCodes;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public List<String> getPermissionCodes() {
        return permissionCodes;
    }
    
    public void setPermissionCodes(List<String> permissionCodes) {
        this.permissionCodes = permissionCodes;
    }
}
