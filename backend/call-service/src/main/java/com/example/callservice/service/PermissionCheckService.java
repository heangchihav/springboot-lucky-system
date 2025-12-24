package com.example.callservice.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class PermissionCheckService {
    
    private static final Logger logger = LoggerFactory.getLogger(PermissionCheckService.class);
    
    private final RestTemplate restTemplate;
    
    @Value("${user.service.url:http://localhost:8081}")
    private String userServiceUrl;
    
    public PermissionCheckService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }
    
    public boolean hasPermission(Long userId, String permissionCode) {
        try {
            String url = userServiceUrl + "/api/rbac/check-permission";
            Map<String, Object> request = Map.of(
                "userId", userId,
                "permissionCode", permissionCode
            );
            
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(url, request, Map.class);
            boolean hasPermission = response != null && Boolean.TRUE.equals(response.get("hasPermission"));
            
            logger.debug("Permission check for user {} permission {}: {}", userId, permissionCode, hasPermission);
            return hasPermission;
        } catch (Exception e) {
            logger.error("Error checking permission for user {} permission {}: {}", userId, permissionCode, e.getMessage());
            return false;
        }
    }
    
    public boolean hasServiceAccess(Long userId, String serviceKey) {
        try {
            String url = userServiceUrl + "/api/rbac/check-service-access";
            Map<String, Object> request = Map.of(
                "userId", userId,
                "serviceKey", serviceKey
            );
            
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(url, request, Map.class);
            boolean hasAccess = response != null && Boolean.TRUE.equals(response.get("hasAccess"));
            
            logger.debug("Service access check for user {} service {}: {}", userId, serviceKey, hasAccess);
            return hasAccess;
        } catch (Exception e) {
            logger.error("Error checking service access for user {} service {}: {}", userId, serviceKey, e.getMessage());
            return false;
        }
    }
}
