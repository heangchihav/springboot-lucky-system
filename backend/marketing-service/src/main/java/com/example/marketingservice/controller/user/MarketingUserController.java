package com.example.marketingservice.controller.user;

import com.example.marketingservice.service.shared.MarketingServiceIdProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/marketing/users")
public class MarketingUserController {

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private MarketingServiceIdProvider serviceIdProvider;

    @Value("${user.service.url:http://gateway:8080}")
    private String userServiceUrl;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getMarketingUsers() {
        try {
            // Get marketing service ID
            Long marketingServiceId = serviceIdProvider.getMarketingServiceId();
            if (marketingServiceId == null) {
                System.err.println("Marketing service ID not found");
                return ResponseEntity.ok(new ArrayList<>());
            }

            System.out.println("Fetching users for marketing service ID: " + marketingServiceId);

            // Get users assigned to marketing service from user-service
            String url = userServiceUrl + "/api/services/services/" + marketingServiceId + "/users";
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> marketingUsers = restTemplate.getForObject(url, List.class);

            if (marketingUsers == null) {
                return ResponseEntity.ok(new ArrayList<>());
            }

            System.out.println("Found " + marketingUsers.size() + " marketing users");
            return ResponseEntity.ok(marketingUsers);
        } catch (Exception e) {
            System.err.println("Error fetching marketing users: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.ok(new ArrayList<>());
        }
    }
}
