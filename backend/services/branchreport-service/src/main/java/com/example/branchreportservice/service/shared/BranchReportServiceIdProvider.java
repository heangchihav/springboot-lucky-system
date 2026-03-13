package com.example.branchreportservice.service.shared;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class BranchReportServiceIdProvider {

    @Autowired
    private RestTemplate restTemplate;

    @Value("${user.service.url:http://gateway:8080}")
    private String userServiceUrl;

    @Value("${branchreport.service-code:branchreport-service}")
    private String serviceCode;

    private Long cachedServiceId;

    public Long getBranchReportServiceId() {
        if (cachedServiceId != null) {
            return cachedServiceId;
        }

        try {
            String url = userServiceUrl + "/api/services/code/" + serviceCode;
            System.out.println("Fetching service from URL: " + url);
            @SuppressWarnings("unchecked")
            Map<String, Object> service = restTemplate.getForObject(url, Map.class);

            System.out.println("Service response: " + service);

            if (service != null && service.containsKey("id")) {
                cachedServiceId = ((Number) service.get("id")).longValue();
                System.out.println("Branch report service ID cached: " + cachedServiceId);
                return cachedServiceId;
            } else {
                System.out.println("Service not found or no ID in response");
            }
        } catch (Exception e) {
            System.err.println("Error fetching branch report service ID: " + e.getMessage());
            e.printStackTrace();
        }

        return null;
    }
}
