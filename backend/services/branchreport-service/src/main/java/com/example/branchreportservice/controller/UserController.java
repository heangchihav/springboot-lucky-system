package com.example.branchreportservice.controller;

import com.example.branchreportservice.service.shared.BranchReportServiceIdProvider;
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
@RequestMapping("/api/branchreport/users")
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private BranchReportServiceIdProvider serviceIdProvider;

    @Value("${user.service.url:http://gateway:8080}")
    private String userServiceUrl;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getBranchReportUsers() {
        logger.info("GET /api/branchreport/users - Fetching branch report service users");
        try {
            // Get branch report service ID
            Long branchReportServiceId = serviceIdProvider.getBranchReportServiceId();
            logger.info("Branch report service ID: {}", branchReportServiceId);
            if (branchReportServiceId == null) {
                logger.error("Branch report service ID not found");
                return ResponseEntity.ok(new ArrayList<>());
            }

            logger.info("Fetching users for branch report service ID: {}", branchReportServiceId);

            // Get users assigned to branch report service from auth-server
            String url = userServiceUrl + "/api/services/services/" + branchReportServiceId + "/users";
            logger.info("Calling auth-server URL: {}", url);

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> branchReportUsers = restTemplate.getForObject(url, List.class);

            if (branchReportUsers == null) {
                logger.warn("No users returned from auth-server");
                return ResponseEntity.ok(new ArrayList<>());
            }

            logger.info("Successfully fetched {} users for branch report service", branchReportUsers.size());
            return ResponseEntity.ok(branchReportUsers);

        } catch (Exception e) {
            logger.error("Error fetching branch report service users", e);
            return ResponseEntity.ok(new ArrayList<>());
        }
    }
}
