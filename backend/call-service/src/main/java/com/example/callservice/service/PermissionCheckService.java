package com.example.callservice.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class PermissionCheckService {
    
    private static final Logger logger = LoggerFactory.getLogger(PermissionCheckService.class);
    
    private final RestTemplate restTemplate;
    private final PermissionService permissionService;
    
    @Value("${user.service.url:http://localhost:8081}")
    private String userServiceUrl;
    
    public PermissionCheckService(RestTemplate restTemplate, PermissionService permissionService) {
        this.restTemplate = restTemplate;
        this.permissionService = permissionService;
    }
    
    public boolean hasPermission(Long userId, String permissionCode) {
        try {
            // Check if user is root (username = "root")
            if (isRootUser(userId)) {
                logger.debug("User {} is root user, granting all permissions", userId);
                return true;
            }
            boolean hasPermission = permissionService.hasUserPermission(userId, permissionCode);
            logger.debug("Permission check for user {} permission {}: {}", userId, permissionCode, hasPermission);
            return hasPermission;
        } catch (Exception e) {
            logger.error("Error checking permission for user {} permission {}: {}", userId, permissionCode, e.getMessage());
            return false;
        }
    }
    
    public boolean hasServiceAccess(Long userId, String serviceKey) {
        try {
            // Check if user is root (username = "root")
            if (isRootUser(userId)) {
                logger.debug("User {} is root user, granting all service access", userId);
                return true;
            }
            
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
    
    public Long getUserIdByUsername(String username) {
        try {
            String url = userServiceUrl + "/api/users/username/" + username + "/id";
            ResponseEntity<Long> response = restTemplate.getForEntity(url, Long.class);
            return response.getBody();
        } catch (Exception e) {
            logger.error("Error getting user ID by username {}: {}", username, e.getMessage());
            return null;
        }
    }

    private boolean isRootUser(Long userId) {
        try {
            String url = userServiceUrl + "/api/users/" + userId + "/username";
            String username = restTemplate.getForObject(url, String.class);
            return "root".equals(username);
        } catch (Exception e) {
            logger.error("Error checking if user {} is root: {}", userId, e.getMessage());
            return false;
        }
    }
}
