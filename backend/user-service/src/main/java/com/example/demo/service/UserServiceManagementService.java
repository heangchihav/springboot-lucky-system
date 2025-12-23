package com.example.demo.service;

import com.example.demo.user.User;
import com.example.demo.user.UserRepository;
import com.example.demo.user.UserXService;
import com.example.demo.user.UserXServiceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class UserServiceManagementService {

    private final UserServiceRepository userServiceRepository;
    private final UserRepository userRepository;
    private final UserXServiceRepository userXServiceRepository;

    public UserServiceManagementService(UserServiceRepository userServiceRepository, 
                                       UserRepository userRepository,
                                       UserXServiceRepository userXServiceRepository) {
        this.userServiceRepository = userServiceRepository;
        this.userRepository = userRepository;
        this.userXServiceRepository = userXServiceRepository;
    }

    // ========== SERVICE MANAGEMENT ==========

    public UserServiceEntity createService(String code, String name, String description) {
        if (userServiceRepository.existsByCode(code)) {
            throw new IllegalArgumentException("Service with code '" + code + "' already exists");
        }

        UserServiceEntity service = new UserServiceEntity();
        service.setCode(code);
        service.setName(name);
        service.setDescription(description);
        service.setActive(true);

        return userServiceRepository.save(service);
    }

    public UserServiceEntity updateService(Long serviceId, String name, String description) {
        UserServiceEntity service = userServiceRepository.findById(serviceId)
                .orElseThrow(() -> new IllegalArgumentException("Service not found with id: " + serviceId));

        service.setName(name);
        service.setDescription(description);

        return userServiceRepository.save(service);
    }

    public void activateService(Long serviceId) {
        UserServiceEntity service = userServiceRepository.findById(serviceId)
                .orElseThrow(() -> new IllegalArgumentException("Service not found with id: " + serviceId));
        service.setActive(true);
        userServiceRepository.save(service);
    }

    public void deactivateService(Long serviceId) {
        UserServiceEntity service = userServiceRepository.findById(serviceId)
                .orElseThrow(() -> new IllegalArgumentException("Service not found with id: " + serviceId));
        service.setActive(false);
        userServiceRepository.save(service);
    }

    public void deleteService(Long serviceId) {
        UserServiceEntity service = userServiceRepository.findById(serviceId)
                .orElseThrow(() -> new IllegalArgumentException("Service not found with id: " + serviceId));
        
        // Check if service is assigned to any users
        List<User> usersWithService = userXServiceRepository.findActiveUsersByServiceId(serviceId);
        if (!usersWithService.isEmpty()) {
            throw new IllegalStateException("Cannot delete service that is assigned to users");
        }

        userServiceRepository.delete(service);
    }

    public Optional<UserServiceEntity> getServiceByCode(String code) {
        return userServiceRepository.findByCode(code);
    }

    public List<UserServiceEntity> getAllActiveServices() {
        return userServiceRepository.findByActiveTrue();
    }

    public List<UserServiceEntity> getAllServices() {
        return userServiceRepository.findAll();
    }

    // ========== USER-SERVICE ASSIGNMENT MANAGEMENT ==========

    public Optional<UserServiceEntity> getServiceById(Long serviceId) {
        return userServiceRepository.findById(serviceId);
    }

    public void assignUserToService(Long userId, String serviceCode) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

        UserServiceEntity service = userServiceRepository.findByCode(serviceCode)
                .orElseThrow(() -> new IllegalArgumentException("Service not found with code: " + serviceCode));

        if (!service.isActive()) {
            throw new IllegalStateException("Cannot assign user to inactive service");
        }

        // Create new UserXService assignment
        UserXService userXService = new UserXService(user, service, "system");
        userXServiceRepository.save(userXService);
    }

    public void removeUserFromService(Long userId, String serviceCode) {
        UserServiceEntity service = userServiceRepository.findByCode(serviceCode)
                .orElseThrow(() -> new IllegalArgumentException("Service not found with code: " + serviceCode));

        userXServiceRepository.deleteByUserIdAndServiceId(userId, service.getId());
    }

    public List<UserServiceEntity> getUserServices(Long userId) {
        return userXServiceRepository.findActiveServicesByUserId(userId);
    }

    public List<User> getServiceUsers(Long serviceId) {
        return userXServiceRepository.findActiveUsersByServiceId(serviceId);
    }

    public boolean hasUserAccessToService(Long userId, String serviceCode) {
        List<UserServiceEntity> userServices = getUserServices(userId);
        return userServices.stream()
                .anyMatch(service -> service.getCode().equals(serviceCode) && service.isActive());
    }
}
