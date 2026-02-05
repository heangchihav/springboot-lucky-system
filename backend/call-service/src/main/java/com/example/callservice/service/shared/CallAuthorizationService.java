package com.example.callservice.service.shared;

import com.example.callservice.entity.userbranch.UserBranch;
import com.example.callservice.repository.userbranch.UserBranchRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Optional;

@Service
public class CallAuthorizationService {

    @Autowired
    private UserBranchRepository userBranchRepository;

    @Autowired
    private RestTemplate restTemplate;

    @Value("${user.service.url:http://localhost:8080}")
    private String userServiceUrl;

    private static final String ROOT_USERNAME = "root";

    public boolean isRootUser(Long userId) {
        if (userId == null) {
            return false;
        }

        try {
            String url = userServiceUrl + "/api/users/" + userId + "/username";
            String username = restTemplate.getForObject(url, String.class);

            boolean isRoot = ROOT_USERNAME.equals(username);
            System.out
                    .println("Root user check - userId: " + userId + ", username: " + username + ", isRoot: " + isRoot);

            return isRoot;
        } catch (Exception e) {
            System.err.println("Error checking root user for userId " + userId + ": " + e.getMessage());
            // If we can't verify, assume not root for security
            return false;
        }
    }

    public List<Long> getAccessibleAreaIds(Long userId) {
        System.out.println("DEBUG: getAccessibleAreaIds called for userId: " + userId);

        if (isRootUser(userId)) {
            System.out.println("DEBUG: User is root, returning null");
            return null;
        }

        List<UserBranch> assignments = userBranchRepository.findActiveUserBranchesByUserId(userId);
        System.out.println("DEBUG: Found " + assignments.size() + " active assignments for user " + userId);

        // Also check all assignments (including inactive) for debugging
        List<UserBranch> allAssignments = userBranchRepository.findByUserId(userId);
        System.out.println("DEBUG: Total assignments (including inactive): " + allAssignments.size());
        for (UserBranch assignment : allAssignments) {
            System.out.println("DEBUG: Assignment - Branch: " +
                    (assignment.getBranch() != null ? assignment.getBranch().getName() : "null") +
                    ", Active: " + assignment.getActive());
        }

        if (assignments.isEmpty()) {
            System.out.println("DEBUG: No active assignments found, returning null (user can see all areas)");
            return null; // User has no assignments, can see all areas
        }

        List<Long> areaIds = assignments.stream()
                .filter(assignment -> assignment.getBranch() != null && assignment.getBranch().getArea() != null)
                .map(assignment -> assignment.getBranch().getArea().getId())
                .distinct()
                .toList();

        System.out.println("DEBUG: Returning area IDs: " + areaIds);
        return areaIds;
    }

    public List<Long> getAccessibleSubAreaIds(Long userId) {
        if (isRootUser(userId)) {
            return null;
        }

        List<UserBranch> assignments = userBranchRepository.findActiveUserBranchesByUserId(userId);
        if (assignments.isEmpty()) {
            return null; // User has no assignments, can see all subareas
        }

        return assignments.stream()
                .filter(assignment -> assignment.getBranch() != null && assignment.getBranch().getSubarea() != null)
                .map(assignment -> assignment.getBranch().getSubarea().getId())
                .distinct()
                .toList();
    }

    public List<Long> getAccessibleBranchIds(Long userId) {
        if (isRootUser(userId)) {
            return null;
        }

        List<UserBranch> assignments = userBranchRepository.findActiveUserBranchesByUserId(userId);
        if (assignments.isEmpty()) {
            return null; // User has no assignments, can see all branches
        }

        return assignments.stream()
                .filter(assignment -> assignment.getBranch() != null)
                .map(assignment -> assignment.getBranch().getId())
                .distinct()
                .toList();
    }

    public boolean canAccessArea(Long userId, Long areaId) {
        if (isRootUser(userId)) {
            return true;
        }

        List<Long> accessibleAreaIds = getAccessibleAreaIds(userId);
        return accessibleAreaIds == null || accessibleAreaIds.contains(areaId);
    }

    public boolean canAccessSubArea(Long userId, Long subAreaId) {
        if (isRootUser(userId)) {
            return true;
        }

        List<Long> accessibleSubAreaIds = getAccessibleSubAreaIds(userId);
        return accessibleSubAreaIds == null || accessibleSubAreaIds.contains(subAreaId);
    }

    public boolean canAccessBranch(Long userId, Long branchId) {
        if (isRootUser(userId)) {
            return true;
        }

        List<Long> accessibleBranchIds = getAccessibleBranchIds(userId);
        return accessibleBranchIds == null || accessibleBranchIds.contains(branchId);
    }
}
