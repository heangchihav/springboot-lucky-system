package com.example.callservice.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(2) // Run after permissions
public class UserDataInitializer implements CommandLineRunner {
    
    private static final Logger logger = LoggerFactory.getLogger(UserDataInitializer.class);
    
    @Override
    public void run(String... args) throws Exception {
        logger.info("Call-service user data initialization disabled - using real users from user-service");
        logger.info("Users are fetched dynamically from user-service via API calls");
    }
}
