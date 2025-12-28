package com.example.callservice.service.user;

import com.example.callservice.dto.user.UserResponse;
import com.example.callservice.entity.userbranch.UserBranch;
import com.example.callservice.repository.userbranch.UserBranchRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserService {
    
    private static final Logger logger = LoggerFactory.getLogger(UserService.class);
    
    private final UserBranchRepository userBranchRepository;
    private final RestTemplate restTemplate;
    
    private static final String USER_SERVICE_URL = "http://demo-gateway:8080";
    
    public UserService(UserBranchRepository userBranchRepository, RestTemplate restTemplate) {
        this.userBranchRepository = userBranchRepository;
        this.restTemplate = restTemplate;
    }
    
    public List<UserResponse> getAllUsers() {
        try {
            // Fetch all users from user-service
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> allUsers = restTemplate.getForObject(
                USER_SERVICE_URL + "/api/users", 
                List.class
            );
            
            if (allUsers == null) {
                logger.warn("Received null response from user-service");
                return List.of();
            }
            
            // Get all user IDs that have branch assignments in call-service
            List<Long> userIdsWithBranches = userBranchRepository.findAll().stream()
                .map(UserBranch::getUserId)
                .distinct()
                .collect(Collectors.toList());
            
            // Filter to only show users who have branch assignments in call-service
            return allUsers.stream()
                .filter(userData -> userIdsWithBranches.contains(((Number) userData.get("id")).longValue()))
                .map(this::mapUserToResponse)
                .collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("Error fetching users from user-service: {}", e.getMessage(), e);
            // If user-service is unavailable, return empty list
            // We don't want to show local call-service users as they're not real
            return List.of();
        }
    }
    
    private UserResponse mapUserToResponse(Map<String, Object> userData) {
        return new UserResponse(
            ((Number) userData.get("id")).longValue(),
            (String) userData.get("username"),
            (String) userData.get("email"),
            (String) userData.get("fullName"),
            (Boolean) userData.get("enabled")
        );
    }
    
    private boolean wasCreatedByUser(Map<String, Object> userData, Long creatorId) {
        if (creatorId == null) {
            return false;
        }
        Object createdBy = userData.get("createdBy");
        if (createdBy instanceof Number number) {
            return number.longValue() == creatorId;
        }
        return false;
    }
    
    public List<UserResponse> getUsersInSameBranch(Long currentUserId, boolean isRootUser) {
        // Root users can see all users
        if (isRootUser) {
            return getAllUsers();
        }
        
        // Get current user's active branches
        List<UserBranch> currentUserBranches = userBranchRepository.findActiveUserBranchesByUserId(currentUserId);
        
        if (currentUserBranches.isEmpty()) {
            return List.of(); // User has no branches assigned
        }
        
        // Get branch IDs from current user's branches
        List<Long> branchIds = currentUserBranches.stream()
            .map(ub -> ub.getBranch().getId())
            .collect(Collectors.toList());
        
        // Find all users in the same branches
        List<UserBranch> sameBranchUsers = userBranchRepository.findByBranchIdAndActive(branchIds.get(0), true);
        
        // For multiple branches, we need to query each branch and combine results
        for (int i = 1; i < branchIds.size(); i++) {
            List<UserBranch> branchUsers = userBranchRepository.findByBranchIdAndActive(branchIds.get(i), true);
            sameBranchUsers.addAll(branchUsers);
        }
        
        // Get unique user IDs
        List<Long> userIds = sameBranchUsers.stream()
            .map(UserBranch::getUserId)
            .distinct()
            .collect(Collectors.toList());
        
        // Fetch users from user-service and filter by branch assignments
        try {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> allUsers = restTemplate.getForObject(
                USER_SERVICE_URL + "/api/users", 
                List.class
            );
            
            if (allUsers == null) {
                return List.of();
            }
            
            // Filter users by those assigned to same branches
            return allUsers.stream()
                .filter(userData -> userIds.contains(((Number) userData.get("id")).longValue()))
                .filter(userData -> wasCreatedByUser(userData, currentUserId))
                .map(this::mapUserToResponse)
                .collect(Collectors.toList());
        } catch (Exception e) {
            // If user-service is unavailable, return empty list
            // We don't want to show local call-service users as they're not real
            return List.of();
        }
    }
}
