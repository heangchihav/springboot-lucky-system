package com.example.demo.user;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/active")
    public ResponseEntity<List<User>> getActiveUsers() {
        List<User> activeUsers = userService.getActiveUsers();
        return ResponseEntity.ok(activeUsers);
    }

    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody CreateUserRequest request) {
        User newUser = userService.createUser(
            request.getUsername(),
            request.getPassword(),
            request.getFullName(),
            request.getPhone(),
            request.getServiceIds()
        );
        return ResponseEntity.ok(newUser);
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody UpdateUserRequest request) {
        User updatedUser = userService.updateUser(
            id,
            request.getFullName(),
            request.getPhone(),
            request.getServiceIds()
        );
        return ResponseEntity.ok(updatedUser);
    }

    @PutMapping("/{id}/activate")
    public ResponseEntity<User> activateUser(@PathVariable Long id) {
        User user = userService.activateUser(id);
        return ResponseEntity.ok(user);
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<User> deactivateUser(@PathVariable Long id) {
        User user = userService.deactivateUser(id);
        return ResponseEntity.ok(user);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{userId}/services")
    public ResponseEntity<Void> assignServices(@PathVariable Long userId, @RequestBody AssignServicesRequest request) {
        userService.assignServicesToUser(userId, request.getServiceIds());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{userId}/services/{serviceId}")
    public ResponseEntity<Void> removeService(@PathVariable Long userId, @PathVariable Long serviceId) {
        userService.removeServiceFromUser(userId, serviceId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{userId}/services")
    public ResponseEntity<?> getUserServices(@PathVariable Long userId) {
        var services = userService.getUserServices(userId);
        return ResponseEntity.ok(services);
    }

    public static class CreateUserRequest {
        private String username;
        private String password;
        private String fullName;
        private String phone;
        private List<Long> serviceIds;

        // Getters and setters
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }

        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }

        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }

        public List<Long> getServiceIds() { return serviceIds; }
        public void setServiceIds(List<Long> serviceIds) { this.serviceIds = serviceIds; }
    }

    public static class UpdateUserRequest {
        private String fullName;
        private String phone;
        private List<Long> serviceIds;

        // Getters and setters
        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }

        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }

        public List<Long> getServiceIds() { return serviceIds; }
        public void setServiceIds(List<Long> serviceIds) { this.serviceIds = serviceIds; }
    }

    public static class AssignServicesRequest {
        private List<Long> serviceIds;

        public List<Long> getServiceIds() { return serviceIds; }
        public void setServiceIds(List<Long> serviceIds) { this.serviceIds = serviceIds; }
    }
}
