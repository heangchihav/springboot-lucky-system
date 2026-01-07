package com.example.marketingservice.service.shared;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class MarketingServiceIdProvider {

    @Autowired
    private RestTemplate restTemplate;

    @Value("${user.service.url:http://gateway:8080}")
    private String userServiceUrl;

    @Value("${marketing.service-key:marketing-service}")
    private String serviceCode;

    private Long cachedServiceId;

    public Long getMarketingServiceId() {
        if (cachedServiceId != null) {
            return cachedServiceId;
        }

        try {
            String url = userServiceUrl + "/api/services/code/" + serviceCode;
            @SuppressWarnings("unchecked")
            Map<String, Object> service = restTemplate.getForObject(url, Map.class);

            if (service != null && service.containsKey("id")) {
                cachedServiceId = ((Number) service.get("id")).longValue();
                System.out.println("Marketing service ID cached: " + cachedServiceId);
                return cachedServiceId;
            }
        } catch (Exception e) {
            System.err.println("Error fetching marketing service ID: " + e.getMessage());
        }

        return null;
    }
}
