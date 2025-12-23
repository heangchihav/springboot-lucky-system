package com.example.demo.user;

import com.example.demo.service.UserServiceEntity;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.core.userdetails.User.UserBuilder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final UserXServiceRepository userXServiceRepository;
    private final com.example.demo.service.UserServiceManagementService userServiceManagementService;
    private final PasswordEncoder passwordEncoder;
    private final ObjectProvider<UserService> selfProvider;

    public UserService(UserRepository userRepository,
                       UserXServiceRepository userXServiceRepository,
                       com.example.demo.service.UserServiceManagementService userServiceManagementService,
                       PasswordEncoder passwordEncoder,
                       ObjectProvider<UserService> selfProvider) {
        this.userRepository = userRepository;
        this.userXServiceRepository = userXServiceRepository;
        this.userServiceManagementService = userServiceManagementService;
        this.passwordEncoder = passwordEncoder;
        this.selfProvider = selfProvider;
    }

    @CacheEvict(cacheNames = "usersByUsername", key = "#username")
    public com.example.demo.user.User register(String username, String rawPassword, String fullName) {
        com.example.demo.user.User u = new com.example.demo.user.User();
        u.setUsername(username);
        u.setPassword(passwordEncoder.encode(rawPassword));
        u.setFullName(fullName);
        return save(u);
    }

    @Transactional
    public com.example.demo.user.User createUser(String username, String rawPassword, String fullName, String phone, List<Long> serviceIds) {
        com.example.demo.user.User u = new com.example.demo.user.User();
        u.setUsername(username);
        u.setPassword(passwordEncoder.encode(rawPassword));
        u.setFullName(fullName);
        u.setPhone(phone);
        u.setEnabled(true);
        u.setAccountLocked(false);
        u = save(u);
        
        // Assign services if provided
        if (serviceIds != null && !serviceIds.isEmpty()) {
            assignServicesToUser(u.getId(), serviceIds);
        }
        
        return u;
    }

    @Transactional
    public void assignServicesToUser(Long userId, List<Long> serviceIds) {
        com.example.demo.user.User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        for (Long serviceId : serviceIds) {
            // Check if already assigned
            if (!userXServiceRepository.findByUserIdAndServiceIdAndActiveTrue(userId, serviceId).isPresent()) {
                com.example.demo.service.UserServiceEntity service = userServiceManagementService.getServiceById(serviceId)
                    .orElseThrow(() -> new RuntimeException("Service not found: " + serviceId));
                
                UserXService userXService = new UserXService(user, service, "system");
                userXServiceRepository.save(userXService);
            }
        }
    }

    @Transactional
    public void removeServiceFromUser(Long userId, Long serviceId) {
        userXServiceRepository.deleteByUserIdAndServiceId(userId, serviceId);
    }

    public List<UserServiceEntity> getUserServices(Long userId) {
        return userXServiceRepository.findActiveServicesByUserId(userId);
    }

    public List<com.example.demo.user.User> getActiveUsers() {
        return userRepository.findByEnabledTrue();
    }

    public com.example.demo.user.User activateUser(Long userId) {
        com.example.demo.user.User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        user.setEnabled(true);
        return save(user);
    }

    public com.example.demo.user.User deactivateUser(Long userId) {
        com.example.demo.user.User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        user.setEnabled(false);
        return save(user);
    }

    public void deleteUser(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new IllegalArgumentException("User not found with id: " + userId);
        }
        userRepository.deleteById(userId);
    }

    public User updateUser(Long userId, String fullName, String phone, List<Long> serviceIds) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

        // Update user details
        user.setFullName(fullName);
        if (phone != null) {
            user.setPhone(phone);
        }

        // Update service assignments
        if (serviceIds != null) {
            // Remove existing service assignments
            userXServiceRepository.deleteAllByUserId(userId);
            
            // Add new service assignments
            if (!serviceIds.isEmpty()) {
                assignServicesToUser(userId, serviceIds);
            }
        }

        return userRepository.save(user);
    }

    @Cacheable(cacheNames = "usersByUsername", key = "#username", unless = "#result == null")
    public com.example.demo.user.User getUserByUsername(String username) {
        return userRepository.findByUsername(username).orElse(null);
    }

    public Optional<com.example.demo.user.User> findUserByUsername(String username) {
        return Optional.ofNullable(selfProvider.getObject().getUserByUsername(username));
    }

    @CacheEvict(cacheNames = "usersByUsername", key = "#user.username")
    public com.example.demo.user.User save(com.example.demo.user.User user) {
        return userRepository.save(user);
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        com.example.demo.user.User u = selfProvider.getObject().getUserByUsername(username);
        if (u == null) {
            throw new UsernameNotFoundException("User not found");
        }

        UserBuilder builder = org.springframework.security.core.userdetails.User.withUsername(u.getUsername())
                .password(u.getPassword())
                .authorities(Collections.emptyList()); // no roles for now

        return builder.build();
    }
}