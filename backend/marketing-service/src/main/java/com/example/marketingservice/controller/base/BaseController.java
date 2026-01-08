package com.example.marketingservice.controller.base;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public abstract class BaseController extends com.example.marketingservice.api.base.BaseController {

    private static final Logger logger = LoggerFactory.getLogger(BaseController.class);

    protected Long requireUserId(HttpServletRequest request) {
        String headerValue = request.getHeader("X-User-Id");
        if (headerValue == null || headerValue.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing X-User-Id header");
        }
        try {
            return Long.valueOf(headerValue);
        } catch (NumberFormatException ex) {
            logger.warn("Invalid X-User-Id header value: {}", headerValue);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid X-User-Id header");
        }
    }

    protected void checkPermission(HttpServletRequest request, String permissionCode) {
        Long userId = getCurrentUserId(request);
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing user ID");
        }

        if (isRootUser(userId)) {
            logger.debug("Root user {} bypassing permission check for {}", userId, permissionCode);
            return;
        }

        if (!permissionCheckService.hasPermission(userId, permissionCode)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Insufficient permissions");
        }
    }
}
