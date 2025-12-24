package com.example.callservice.api;

import com.example.callservice.entity.UserBranch;
import com.example.callservice.service.UserBranchService;
import com.example.callservice.dto.AssignUserRequest;
import com.example.callservice.dto.UserBranchResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import jakarta.servlet.http.HttpServletRequest;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/calls/user-branches")
public class UserBranchController {
    
    private static final Logger logger = LoggerFactory.getLogger(UserBranchController.class);
    
    @Autowired
    private UserBranchService userBranchService;
    
    @GetMapping
    public ResponseEntity<List<UserBranch>> getAllUserBranches() {
        List<UserBranch> userBranches = userBranchService.getAllUserBranches();
        return ResponseEntity.ok(userBranches);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<UserBranch> getUserBranchById(@PathVariable Long id) {
        Optional<UserBranch> userBranch = userBranchService.getUserBranchById(id);
        return userBranch.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<UserBranchResponse>> getUserBranchesByUser(@PathVariable Long userId) {
        List<UserBranch> userBranches = userBranchService.getActiveUserBranchesByUserId(userId);
        List<UserBranchResponse> response = userBranches.stream()
                .map(ub -> new UserBranchResponse(
                        ub.getId(),
                        ub.getUserId(),
                        ub.getBranch().getId(),
                        ub.getBranch().getName(),
                        ub.getActive(),
                        ub.getAssignedAt(),
                        ub.getUpdatedAt()
                ))
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/branch/{branchId}")
    public ResponseEntity<List<UserBranchResponse>> getUserBranchesByBranch(@PathVariable Long branchId) {
        List<UserBranch> userBranches = userBranchService.getActiveUserBranchesByBranchId(branchId);
        List<UserBranchResponse> response = userBranches.stream()
                .map(ub -> new UserBranchResponse(
                        ub.getId(),
                        ub.getUserId(),
                        ub.getBranch().getId(),
                        ub.getBranch().getName(),
                        ub.getActive(),
                        ub.getAssignedAt(),
                        ub.getUpdatedAt()
                ))
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/area/{areaId}")
    public ResponseEntity<List<UserBranchResponse>> getUserBranchesByArea(@PathVariable Long areaId) {
        List<UserBranch> userBranches = userBranchService.getUserBranchesByAreaId(areaId);
        List<UserBranchResponse> response = userBranches.stream()
                .map(ub -> new UserBranchResponse(
                        ub.getId(),
                        ub.getUserId(),
                        ub.getBranch().getId(),
                        ub.getBranch().getName(),
                        ub.getActive(),
                        ub.getAssignedAt(),
                        ub.getUpdatedAt()
                ))
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/assign")
    public ResponseEntity<UserBranchResponse> assignUserToBranch(@RequestBody AssignUserRequest request, HttpServletRequest httpRequest) {
        logger.info("=== ASSIGN USER TO BRANCH REQUEST ===");
        logger.info("Request URL: {} {}", httpRequest.getMethod(), httpRequest.getRequestURI());
        logger.info("Content-Type: {}", httpRequest.getContentType());
        logger.info("Request body: userId={}, branchId={}", request.getUserId(), request.getBranchId());
        
        Long userId = request.getUserId();
        Long branchId = request.getBranchId();
        
        if (userId == null || branchId == null) {
            logger.error("Validation failed: userId or branchId is null. userId={}, branchId={}", userId, branchId);
            return ResponseEntity.badRequest().build();
        }
        
        try {
            logger.info("Calling userBranchService.assignUserToBranch with userId={}, branchId={}", userId, branchId);
            UserBranch userBranch = userBranchService.assignUserToBranch(userId, branchId);
            logger.info("Successfully assigned user to branch: {}", userBranch);
            
            // Convert to DTO to avoid circular reference issues
            UserBranchResponse response = new UserBranchResponse(
                userBranch.getId(),
                userBranch.getUserId(),
                userBranch.getBranch().getId(),
                userBranch.getBranch().getName(),
                userBranch.getActive(),
                userBranch.getAssignedAt(),
                userBranch.getUpdatedAt()
            );
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            logger.error("Unexpected error assigning user to branch: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    @PostMapping("/remove")
    public ResponseEntity<UserBranchResponse> removeUserFromBranch(@RequestBody Map<String, Long> request) {
        Long userId = request.get("userId");
        Long branchId = request.get("branchId");
        
        if (userId == null || branchId == null) {
            return ResponseEntity.badRequest().build();
        }
        
        try {
            UserBranch userBranch = userBranchService.removeUserFromBranch(userId, branchId);
            UserBranchResponse response = new UserBranchResponse(
                    userBranch.getId(),
                    userBranch.getUserId(),
                    userBranch.getBranch().getId(),
                    userBranch.getBranch().getName(),
                    userBranch.getActive(),
                    userBranch.getAssignedAt(),
                    userBranch.getUpdatedAt()
            );
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<UserBranchResponse> updateUserBranch(@PathVariable Long id, @RequestBody UserBranch userBranch) {
        try {
            UserBranch updatedUserBranch = userBranchService.updateUserBranchAssignment(id, userBranch);
            UserBranchResponse response = new UserBranchResponse(
                    updatedUserBranch.getId(),
                    updatedUserBranch.getUserId(),
                    updatedUserBranch.getBranch().getId(),
                    updatedUserBranch.getBranch().getName(),
                    updatedUserBranch.getActive(),
                    updatedUserBranch.getAssignedAt(),
                    updatedUserBranch.getUpdatedAt()
            );
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUserBranch(@PathVariable Long id) {
        try {
            userBranchService.deleteUserBranchAssignment(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/user/{userId}/branch-count")
    public ResponseEntity<Long> getBranchCountForUser(@PathVariable Long userId) {
        long count = userBranchService.countActiveBranchesForUser(userId);
        return ResponseEntity.ok(count);
    }
    
    @GetMapping("/branch/{branchId}/user-count")
    public ResponseEntity<Long> getUserCountForBranch(@PathVariable Long branchId) {
        long count = userBranchService.countActiveUsersForBranch(branchId);
        return ResponseEntity.ok(count);
    }
    
    @GetMapping("/area/{areaId}/user-count")
    public ResponseEntity<Long> getUserCountInArea(@PathVariable Long areaId) {
        long count = userBranchService.countActiveUsersInArea(areaId);
        return ResponseEntity.ok(count);
    }
    
    @GetMapping("/check/user/{userId}/branch/{branchId}")
    public ResponseEntity<Boolean> checkUserBranchAssignment(@PathVariable Long userId, @PathVariable Long branchId) {
        boolean isAssigned = userBranchService.isUserAssignedToBranch(userId, branchId);
        return ResponseEntity.ok(isAssigned);
    }
    
    @GetMapping("/check/user/{userId}/area/{areaId}")
    public ResponseEntity<Boolean> checkUserAreaAssignment(@PathVariable Long userId, @PathVariable Long areaId) {
        boolean isAssigned = userBranchService.isUserAssignedToAnyBranchInArea(userId, areaId);
        return ResponseEntity.ok(isAssigned);
    }
}
