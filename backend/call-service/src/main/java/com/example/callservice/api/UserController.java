package com.example.callservice.api;

import com.example.callservice.dto.UserResponse;
import com.example.callservice.service.UserService;
import com.example.callservice.annotation.RequirePermission;
import com.example.callservice.api.BaseController;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/calls/users")
public class UserController extends BaseController {
    
    private static final Logger logger = LoggerFactory.getLogger(UserController.class);
    
    private final UserService userService;
    
    public UserController(UserService userService) {
        this.userService = userService;
    }
    
    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers(HttpServletRequest request) {
        ResponseEntity<List<UserResponse>> permissionCheck = checkPermissionAndReturn(request, "menu.4.view");
        if (permissionCheck != null) {
            return permissionCheck;
        }
        logger.info("Fetching all users");
        List<UserResponse> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }
    
    @PostMapping
    @RequirePermission("menu.4.create")
    public ResponseEntity<UserResponse> createUser(@RequestBody Object request, HttpServletRequest httpRequest) {
        ResponseEntity<UserResponse> permissionCheck = checkPermissionAndReturn(httpRequest, "menu.4.create");
        if (permissionCheck != null) {
            return permissionCheck;
        }
        logger.info("Creating new user");
        // TODO: Implement user creation logic
        return ResponseEntity.status(501).build();
    }
    
    @PutMapping("/{id}")
    @RequirePermission("menu.4.edit")
    public ResponseEntity<UserResponse> updateUser(@PathVariable Long id, @RequestBody Object request, HttpServletRequest httpRequest) {
        ResponseEntity<UserResponse> permissionCheck = checkPermissionAndReturn(httpRequest, "menu.4.edit");
        if (permissionCheck != null) {
            return permissionCheck;
        }
        logger.info("Updating user {}", id);
        // TODO: Implement user update logic
        return ResponseEntity.status(501).build();
    }
    
    @DeleteMapping("/{id}")
    @RequirePermission("menu.4.delete")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id, HttpServletRequest request) {
        ResponseEntity<Void> permissionCheck = checkPermissionAndReturn(request, "menu.4.delete");
        if (permissionCheck != null) {
            return permissionCheck;
        }
        logger.info("Deleting user with id: {}", id);
        // TODO: Implement user deletion logic
        return ResponseEntity.status(501).build();
    }
}
