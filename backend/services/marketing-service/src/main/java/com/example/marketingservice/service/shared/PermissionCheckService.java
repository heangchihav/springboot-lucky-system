package com.example.marketingservice.service.shared;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class PermissionCheckService {

    @Autowired
    private com.example.marketingservice.service.permission.PermissionService permissionService;

    public boolean hasPermission(Long userId, String permissionCode) {
        if (userId == null || permissionCode == null) {
            return false;
        }
        return permissionService.hasUserPermission(userId, permissionCode);
    }
}
