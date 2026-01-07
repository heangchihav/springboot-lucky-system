package com.example.marketingservice.service.shared;

import com.example.marketingservice.entity.userassignment.MarketingUserAssignment;
import com.example.marketingservice.repository.userassignment.MarketingUserAssignmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Optional;

@Service
public class MarketingAuthorizationService {

    @Autowired
    private MarketingUserAssignmentRepository assignmentRepository;

    @Autowired
    private RestTemplate restTemplate;

    @Value("${user.service.url:http://localhost:8081}")
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

    public Optional<MarketingUserAssignment> getUserAssignment(Long userId) {
        if (isRootUser(userId)) {
            return Optional.empty();
        }

        List<MarketingUserAssignment> assignments = assignmentRepository.findActiveByUserId(userId);
        return assignments.isEmpty() ? Optional.empty() : Optional.of(assignments.get(0));
    }

    public boolean canAccessArea(Long userId, Long areaId) {
        Optional<MarketingUserAssignment> assignment = getUserAssignment(userId);

        if (assignment.isEmpty()) {
            return true;
        }

        MarketingUserAssignment userAssignment = assignment.get();

        if (userAssignment.getArea() != null) {
            return userAssignment.getArea().getId().equals(areaId);
        }

        return false;
    }

    public boolean canAccessSubArea(Long userId, Long subAreaId) {
        Optional<MarketingUserAssignment> assignment = getUserAssignment(userId);

        if (assignment.isEmpty()) {
            return true;
        }

        MarketingUserAssignment userAssignment = assignment.get();

        if (userAssignment.getSubArea() != null) {
            return userAssignment.getSubArea().getId().equals(subAreaId);
        }

        if (userAssignment.getArea() != null && userAssignment.getBranch() == null) {
            return true;
        }

        return false;
    }

    public boolean canAccessBranch(Long userId, Long branchId) {
        Optional<MarketingUserAssignment> assignment = getUserAssignment(userId);

        if (assignment.isEmpty()) {
            return true;
        }

        MarketingUserAssignment userAssignment = assignment.get();

        if (userAssignment.getBranch() != null) {
            return userAssignment.getBranch().getId().equals(branchId);
        }

        return true;
    }

    public boolean canCreateArea(Long userId) {
        Optional<MarketingUserAssignment> assignment = getUserAssignment(userId);
        return assignment.isEmpty();
    }

    public boolean isCreator(Long userId, Long creatorId) {
        return userId != null && creatorId != null && userId.equals(creatorId);
    }

    public void validateCreator(Long userId, Long creatorId, String entityType) {
        if (isRootUser(userId)) {
            return;
        }

        if (!isCreator(userId, creatorId)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN,
                    "You don't have permission to modify this " + entityType
                            + ". Only the creator can update or delete it.");
        }
    }

    public boolean canCreateSubArea(Long userId, Long areaId) {
        if (isRootUser(userId)) {
            return true;
        }

        Optional<MarketingUserAssignment> assignment = getUserAssignment(userId);

        if (assignment.isEmpty()) {
            return true;
        }

        MarketingUserAssignment userAssignment = assignment.get();

        if (userAssignment.getBranch() != null || userAssignment.getSubArea() != null) {
            return false;
        }

        if (userAssignment.getArea() != null) {
            return userAssignment.getArea().getId().equals(areaId);
        }

        return false;
    }

    public boolean canCreateBranch(Long userId, Long areaId, Long subAreaId) {
        Optional<MarketingUserAssignment> assignment = getUserAssignment(userId);

        if (assignment.isEmpty()) {
            return true;
        }

        MarketingUserAssignment userAssignment = assignment.get();

        if (userAssignment.getBranch() != null) {
            return false;
        }

        if (userAssignment.getSubArea() != null) {
            return userAssignment.getSubArea().getId().equals(subAreaId);
        }

        if (userAssignment.getArea() != null) {
            return userAssignment.getArea().getId().equals(areaId);
        }

        return false;
    }

    public List<Long> getAccessibleAreaIds(Long userId) {
        Optional<MarketingUserAssignment> assignment = getUserAssignment(userId);

        if (assignment.isEmpty()) {
            return null;
        }

        MarketingUserAssignment userAssignment = assignment.get();

        if (userAssignment.getArea() != null) {
            return List.of(userAssignment.getArea().getId());
        }

        return List.of();
    }

    public List<Long> getAccessibleSubAreaIds(Long userId) {
        Optional<MarketingUserAssignment> assignment = getUserAssignment(userId);

        if (assignment.isEmpty()) {
            return null;
        }

        MarketingUserAssignment userAssignment = assignment.get();

        if (userAssignment.getSubArea() != null) {
            return List.of(userAssignment.getSubArea().getId());
        }

        return null;
    }

    public List<Long> getAccessibleBranchIds(Long userId) {
        Optional<MarketingUserAssignment> assignment = getUserAssignment(userId);

        if (assignment.isEmpty()) {
            return null;
        }

        MarketingUserAssignment userAssignment = assignment.get();

        if (userAssignment.getBranch() != null) {
            return List.of(userAssignment.getBranch().getId());
        }

        return null;
    }
}
