package com.example.callservice.api;

import com.example.callservice.entity.UserBranch;
import com.example.callservice.service.UserBranchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/calls/user-branches")
public class UserBranchController {
    
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
    public ResponseEntity<List<UserBranch>> getUserBranchesByUser(@PathVariable Long userId) {
        List<UserBranch> userBranches = userBranchService.getActiveUserBranchesByUserId(userId);
        return ResponseEntity.ok(userBranches);
    }
    
    @GetMapping("/branch/{branchId}")
    public ResponseEntity<List<UserBranch>> getUserBranchesByBranch(@PathVariable Long branchId) {
        List<UserBranch> userBranches = userBranchService.getActiveUserBranchesByBranchId(branchId);
        return ResponseEntity.ok(userBranches);
    }
    
    @GetMapping("/area/{areaId}")
    public ResponseEntity<List<UserBranch>> getUserBranchesByArea(@PathVariable Long areaId) {
        List<UserBranch> userBranches = userBranchService.getUserBranchesByAreaId(areaId);
        return ResponseEntity.ok(userBranches);
    }
    
    @PostMapping("/assign")
    public ResponseEntity<UserBranch> assignUserToBranch(@RequestBody Map<String, Long> request) {
        Long userId = request.get("userId");
        Long branchId = request.get("branchId");
        
        if (userId == null || branchId == null) {
            return ResponseEntity.badRequest().build();
        }
        
        try {
            UserBranch userBranch = userBranchService.assignUserToBranch(userId, branchId);
            return ResponseEntity.status(HttpStatus.CREATED).body(userBranch);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PostMapping("/remove")
    public ResponseEntity<UserBranch> removeUserFromBranch(@RequestBody Map<String, Long> request) {
        Long userId = request.get("userId");
        Long branchId = request.get("branchId");
        
        if (userId == null || branchId == null) {
            return ResponseEntity.badRequest().build();
        }
        
        try {
            UserBranch userBranch = userBranchService.removeUserFromBranch(userId, branchId);
            return ResponseEntity.ok(userBranch);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<UserBranch> updateUserBranch(@PathVariable Long id, @RequestBody UserBranch userBranch) {
        try {
            UserBranch updatedUserBranch = userBranchService.updateUserBranchAssignment(id, userBranch);
            return ResponseEntity.ok(updatedUserBranch);
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
