package com.example.callservice.service.shared;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class CallServiceIdProvider {

    @Autowired
    private RestTemplate restTemplate;

    @Value("${user.service.url:http://gateway:8080}")
    private String userServiceUrl;

    @Value("${call.service-code:call-service}")
    private String serviceCode;

    private Long cachedServiceId;

    public Long getCallServiceId() {
        if (cachedServiceId != null) {
            return cachedServiceId;
        }

        try {
            String url = userServiceUrl + "/api/services/code/" + serviceCode;
            @SuppressWarnings("unchecked")
            Map<String, Object> service = restTemplate.getForObject(url, Map.class);

            if (service != null && service.containsKey("id")) {
                cachedServiceId = ((Number) service.get("id")).longValue();
                System.out.println("Call service ID cached: " + cachedServiceId);
                return cachedServiceId;
            }
        } catch (Exception e) {
            System.err.println("Error fetching call service ID: " + e.getMessage());
        }

        return null;
    }
}
