package com.example.callservice.aspect;

import com.example.callservice.annotation.RequirePermission;
import com.example.callservice.service.shared.PermissionCheckService;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;

@Aspect
@Component
public class PermissionAspect {
    
    private static final Logger logger = LoggerFactory.getLogger(PermissionAspect.class);
    
    private final PermissionCheckService permissionCheckService;
    
    public PermissionAspect(PermissionCheckService permissionCheckService) {
        this.permissionCheckService = permissionCheckService;
    }
    
    @Around("@annotation(requirePermission)")
    public Object checkPermission(ProceedingJoinPoint joinPoint, RequirePermission requirePermission) throws Throwable {
        try {
            // Get user ID from request header (assuming it's passed as X-User-Id)
            HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
            String userIdHeader = request.getHeader("X-User-Id");
            
            if (userIdHeader == null) {
                logger.warn("Missing X-User-Id header for permission check");
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized", "message", "User ID required"));
            }
            
            Long userId = Long.valueOf(userIdHeader);
            String permissionCode = requirePermission.value();
            
            if (!permissionCheckService.hasPermission(userId, permissionCode)) {
                logger.warn("User {} does not have permission: {}", userId, permissionCode);
                return ResponseEntity.status(403).body(Map.of("error", "Forbidden", "message", "Insufficient permissions"));
            }
            
            logger.debug("User {} has permission: {}", userId, permissionCode);
            return joinPoint.proceed();
            
        } catch (Exception e) {
            logger.error("Error during permission check: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", "Internal Server Error", "message", "Permission check failed"));
        }
    }
}
