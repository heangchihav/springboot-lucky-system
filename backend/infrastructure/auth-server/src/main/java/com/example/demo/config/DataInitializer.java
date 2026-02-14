package com.example.demo.config;

import com.example.demo.service.UserServiceEntity;
import com.example.demo.user.User;
import com.example.demo.user.UserXService;
import com.example.demo.user.UserRepository;
import com.example.demo.user.UserXServiceRepository;
import com.example.demo.service.UserServiceManagementService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final UserXServiceRepository userXServiceRepository;
    private final UserServiceManagementService userServiceManagementService;

    public DataInitializer(UserRepository userRepository, 
                          UserXServiceRepository userXServiceRepository,
                          UserServiceManagementService userServiceManagementService) {
        this.userRepository = userRepository;
        this.userXServiceRepository = userXServiceRepository;
        this.userServiceManagementService = userServiceManagementService;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        logger.info("Initializing system data...");
        
        // Initialize services
        initializeServices();
        
        // Initialize root user
        initializeRootUser();
        
        logger.info("System data initialization completed.");
    }

    private void initializeServices() {
        logger.info("Checking and initializing services...");
        
        // Check if services already exist
        List<UserServiceEntity> existingServices = userServiceManagementService.getAllActiveServices();
        
        if (existingServices.isEmpty()) {
            logger.info("Creating default services...");
            // Create marketing-service
            userServiceManagementService.createService("marketing-service", "Marketing Service", "Marketing management operations");
            
            // Create call-service
            userServiceManagementService.createService("call-service", "Call Service", "Call management operations");
            
            // Create delivery-service
            userServiceManagementService.createService("delivery-service", "Delivery Service", "Delivery operations");
            
            // Create user service
            userServiceManagementService.createService("user", "User Service", "User management operations");
            
            logger.info("Default services created successfully.");
        } else {
            logger.info("Services already exist, skipping initialization.");
        }
    }

    private void initializeRootUser() {
        logger.info("Checking and initializing root user...");
        
        // Check if root user exists
        if (!userRepository.findByUsername("root").isPresent()) {
            logger.info("Creating root user...");
            
            // Create root user with default password
            User rootUser = new User();
            rootUser.setUsername("root");
            rootUser.setPassword("$2a$12$srkQOipYKlx6H.cLJ8ro3eQuucdPK/.nrsMML1YtbOPoCe.MsSnYq"); // "root123"
            rootUser.setFullName("Root Administrator");
            rootUser.setEnabled(true);
            rootUser.setAccountLocked(false);
            rootUser.setFailedLoginAttempts(0);
            rootUser.setTokenVersion(0L);
            
            userRepository.save(rootUser);
            
            // Assign root user to all services
            assignAllServicesToUser(rootUser.getId());
            
            logger.info("Root user created successfully.");
        } else {
            logger.info("Root user already exists, skipping initialization.");
        }
    }
    
    private void assignAllServicesToUser(Long userId) {
        logger.info("Assigning all services to user {}", userId);
        
        List<UserServiceEntity> services = userServiceManagementService.getAllActiveServices();
        
        for (UserServiceEntity service : services) {
            UserXService userXService = new UserXService();
            userXService.setUser(userRepository.findById(userId).orElse(null));
            userXService.setService(service);
            userXService.setAssignedBy("system");
            userXService.setActive(true);
            userXServiceRepository.save(userXService);
        }
        
        logger.info("Assigned {} services to user {}", services.size(), userId);
    }
}
