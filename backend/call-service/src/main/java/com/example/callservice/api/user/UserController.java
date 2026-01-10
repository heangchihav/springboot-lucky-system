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

            // Get users assigned to call service from user-service
            String url = userServiceUrl + "/api/services/services/" + callServiceId + "/users";
            logger.info("Calling user-service URL: {}", url);

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> callUsers = restTemplate.getForObject(url, List.class);

            if (callUsers == null) {
                logger.warn("Received null response from user-service");
                return ResponseEntity.ok(new ArrayList<>());
            }

            logger.info("Found {} call users", callUsers.size());
            return ResponseEntity.ok(callUsers);
        } catch (Exception e) {
            logger.error("Error fetching call users: {}", e.getMessage(), e);
            return ResponseEntity.ok(new ArrayList<>());
        }
    }
}
