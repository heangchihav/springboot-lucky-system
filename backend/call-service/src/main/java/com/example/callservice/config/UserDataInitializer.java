package com.example.callservice.config;

import com.example.callservice.entity.User;
import com.example.callservice.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(2) // Run after permissions
public class UserDataInitializer implements CommandLineRunner {
    
    private static final Logger logger = LoggerFactory.getLogger(UserDataInitializer.class);
    
    private final UserRepository userRepository;
    
    public UserDataInitializer(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    
    @Override
    public void run(String... args) throws Exception {
        initializeUsers();
    }
    
    private void initializeUsers() {
        logger.info("Initializing call-service users...");
        
        // Check if users already exist
        long existingCount = userRepository.count();
        if (existingCount > 0) {
            logger.info("Users already exist ({} users), skipping initialization", existingCount);
            return;
        }
        
        // Create sample users
        User[] sampleUsers = {
            new User("admin", "admin@callservice.com", "System Administrator"),
            new User("jsmith", "john.smith@callservice.com", "John Smith"),
            new User("mjohnson", "mary.johnson@callservice.com", "Mary Johnson"),
            new User("rwilliams", "robert.williams@callservice.com", "Robert Williams"),
            new User("sbrown", "sarah.brown@callservice.com", "Sarah Brown"),
            new User("tdavis", "tom.davis@callservice.com", "Tom Davis"),
            new User("emiller", "emily.miller@callservice.com", "Emily Miller"),
            new User("jwilson", "james.wilson@callservice.com", "James Wilson"),
            new User("amoore", "ashley.moore@callservice.com", "Ashley Moore"),
            new User("ctaylor", "chris.taylor@callservice.com", "Chris Taylor")
        };
        
        // Save users
        for (User user : sampleUsers) {
            try {
                userRepository.save(user);
                logger.debug("Created user: {}", user.getUsername());
            } catch (Exception e) {
                logger.error("Failed to create user {}: {}", user.getUsername(), e.getMessage());
            }
        }
        
        long totalUsers = userRepository.count();
        logger.info("Successfully initialized {} users for call-service", totalUsers);
    }
}
