package com.example.demo.service;

import com.example.demo.user.User;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/services")
public class UserServiceController {

    private final UserServiceManagementService userServiceManagementService;

    public UserServiceController(UserServiceManagementService userServiceManagementService) {
        this.userServiceManagementService = userServiceManagementService;
    }

    // ========== SERVICE MANAGEMENT ENDPOINTS ==========

    @PostMapping
    public ResponseEntity<UserServiceEntity> createService(@RequestBody CreateServiceRequest request) {
        UserServiceEntity service = userServiceManagementService.createService(
                request.getCode(), 
                request.getName(), 
                request.getDescription()
        );
        return ResponseEntity.ok(service);
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserServiceEntity> updateService(
            @PathVariable Long id, 
            @RequestBody UpdateServiceRequest request) {
        UserServiceEntity service = userServiceManagementService.updateService(id, request.getName(), request.getDescription());
        return ResponseEntity.ok(service);
    }

    @PostMapping("/{id}/activate")
    public ResponseEntity<Void> activateService(@PathVariable Long id) {
        userServiceManagementService.activateService(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivateService(@PathVariable Long id) {
        userServiceManagementService.deactivateService(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteService(@PathVariable Long id) {
        userServiceManagementService.deleteService(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<List<UserServiceEntity>> getAllServices() {
        List<UserServiceEntity> services = userServiceManagementService.getAllServices();
        return ResponseEntity.ok(services);
    }

    @GetMapping("/active")
    public ResponseEntity<List<UserServiceEntity>> getActiveServices() {
        List<UserServiceEntity> services = userServiceManagementService.getAllActiveServices();
        return ResponseEntity.ok(services);
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<UserServiceEntity> getServiceByCode(@PathVariable String code) {
        return userServiceManagementService.getServiceByCode(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ========== USER-SERVICE ASSIGNMENT ENDPOINTS ==========

    @PostMapping("/assign")
    public ResponseEntity<Void> assignUserToService(@RequestBody AssignUserRequest request) {
        userServiceManagementService.assignUserToService(request.getUserId(), request.getServiceCode());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/remove")
    public ResponseEntity<Void> removeUserFromService(@RequestBody RemoveUserRequest request) {
        userServiceManagementService.removeUserFromService(request.getUserId(), request.getServiceCode());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/users/{userId}/services")
    public ResponseEntity<List<UserServiceEntity>> getUserServices(@PathVariable Long userId) {
        List<UserServiceEntity> services = userServiceManagementService.getUserServices(userId);
        return ResponseEntity.ok(services);
    }

    @GetMapping("/services/{serviceId}/users")
    public ResponseEntity<List<User>> getServiceUsers(@PathVariable Long serviceId) {
        List<User> users = userServiceManagementService.getServiceUsers(serviceId);
        return ResponseEntity.ok(users);
    }

    @GetMapping("/users/{userId}/has-access/{serviceCode}")
    public ResponseEntity<Map<String, Boolean>> checkUserAccess(
            @PathVariable Long userId, 
            @PathVariable String serviceCode) {
        boolean hasAccess = userServiceManagementService.hasUserAccessToService(userId, serviceCode);
        return ResponseEntity.ok(Map.of("hasAccess", hasAccess));
    }

    // ========== DTO CLASSES ==========

    public static class CreateServiceRequest {
        private String code;
        private String name;
        private String description;

        // Getters and setters
        public String getCode() { return code; }
        public void setCode(String code) { this.code = code; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }

    public static class UpdateServiceRequest {
        private String name;
        private String description;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }

    public static class AssignUserRequest {
        private Long userId;
        private String serviceCode;

        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }

        public String getServiceCode() { return serviceCode; }
        public void setServiceCode(String serviceCode) { this.serviceCode = serviceCode; }
    }

    public static class RemoveUserRequest {
        private Long userId;
        private String serviceCode;

        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }

        public String getServiceCode() { return serviceCode; }
        public void setServiceCode(String serviceCode) { this.serviceCode = serviceCode; }
    }
}
