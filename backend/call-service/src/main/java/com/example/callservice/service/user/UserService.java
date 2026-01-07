package com.example.callservice.service.user;

import com.example.callservice.dto.user.UserResponse;
import com.example.callservice.entity.userbranch.UserBranch;
import com.example.callservice.repository.userbranch.UserBranchRepository;
import com.example.callservice.service.shared.CallServiceIdProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    private final UserBranchRepository userBranchRepository;
    private final RestTemplate restTemplate;

    @Autowired
    private CallServiceIdProvider serviceIdProvider;

    @Value("${user.service.url:http://gateway:8080}")
    private String userServiceUrl;

    public UserService(UserBranchRepository userBranchRepository, RestTemplate restTemplate) {
        this.userBranchRepository = userBranchRepository;
        this.restTemplate = restTemplate;
    }

    public List<UserResponse> getAllUsers() {
        try {
            // Get call service ID
            Long callServiceId = serviceIdProvider.getCallServiceId();
            if (callServiceId == null) {
                logger.error("Call service ID not found");
                return List.of();
            }

            logger.info("Fetching users for call service ID: {}", callServiceId);

            // Get users assigned to call service from user-service
            String url = userServiceUrl + "/api/services/services/" + callServiceId + "/users";
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> callUsers = restTemplate.getForObject(url, List.class);

            if (callUsers == null) {
                return new ArrayList<>();
            }

            logger.info("Found {} call users", callUsers.size());

            return callUsers.stream()
                    .map(this::mapUserToResponse)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("Error fetching call users: {}", e.getMessage(), e);
            return List.of();
        }
    }

    private UserResponse mapUserToResponse(Map<String, Object> userData) {
        return new UserResponse(
                ((Number) userData.get("id")).longValue(),
                (String) userData.get("username"),
                (String) userData.get("email"),
                (String) userData.get("fullName"),
                (Boolean) userData.get("enabled"));
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

        List<Long> userIds = sameBranchUsers.stream()
                .map(UserBranch::getUserId)
                .distinct()
                .collect(Collectors.toList());

        // Fetch all call-service users and filter by branch assignments
        List<UserResponse> allCallUsers = getAllUsers();

        // Filter users by those assigned to same branches
        return allCallUsers.stream()
                .filter(user -> userIds.contains(user.getId()))
                .collect(Collectors.toList());
    }
}
