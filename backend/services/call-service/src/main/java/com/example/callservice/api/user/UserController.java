package com.example.callservice.api.user;

import com.example.callservice.service.shared.CallServiceIdProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/calls/users")
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private CallServiceIdProvider serviceIdProvider;

    @Value("${user.service.url:http://gateway:8080}")
    private String userServiceUrl;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getCallUsers() {
        logger.info("GET /api/calls/users - Fetching call service users");
        try {
            // Get call service ID
            Long callServiceId = serviceIdProvider.getCallServiceId();
            if (callServiceId == null) {
                logger.error("Call service ID not found");
                return ResponseEntity.ok(new ArrayList<>());
            }

            logger.info("Fetching users for call service ID: {}", callServiceId);

            // Get users assigned to call service from auth-server
            String url = userServiceUrl + "/api/services/services/" + callServiceId + "/users";
            logger.info("Calling auth-server URL: {}", url);

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> callUsers = restTemplate.getForObject(url, List.class);

            if (callUsers == null) {
                logger.warn("Received null response from auth-server");
                return ResponseEntity.ok(new ArrayList<>());
            }

            logger.info("Found {} call users", callUsers.size());
            return ResponseEntity.ok(callUsers);
        } catch (Exception e) {
            logger.error("Error fetching call users: {}", e.getMessage(), e);
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    @PatchMapping("/{userId}/toggle-status")
    public ResponseEntity<Map<String, Object>> toggleUserStatus(@PathVariable Long userId) {
        logger.info("PATCH /api/calls/users/{}/toggle-status - Toggling user status", userId);
        try {
            String url = userServiceUrl + "/api/users/" + userId + "/toggle-status";
            logger.info("Calling auth-server URL: {}", url);

            @SuppressWarnings("unchecked")
            Map<String, Object> updatedUser = restTemplate.patchForObject(url, null, Map.class);

            if (updatedUser == null) {
                logger.error("Received null response from auth-server");
                return ResponseEntity.internalServerError().build();
            }

            logger.info("Successfully toggled status for user {}", userId);
            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            logger.error("Error toggling user status: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/{userId}")
    public ResponseEntity<Map<String, Object>> updateUser(@PathVariable Long userId,
            @RequestBody Map<String, Object> userData) {
        logger.info("PUT /api/calls/users/{} - Updating user", userId);
        try {
            String url = userServiceUrl + "/api/users/" + userId;
            logger.info("Calling auth-server URL: {}", url);

            restTemplate.put(url, userData);

            // Return success response without fetching the updated user
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "User updated successfully");
            response.put("userId", userId);

            logger.info("Successfully updated user {}", userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error updating user: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
