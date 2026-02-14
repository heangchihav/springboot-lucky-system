package com.example.marketingservice.service.shared;

import com.example.marketingservice.entity.userassignment.MarketingUserAssignment;
import com.example.marketingservice.repository.userassignment.MarketingUserAssignmentRepository;
import com.example.marketingservice.entity.branch.MarketingBranch;
import com.example.marketingservice.repository.branch.MarketingBranchRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Optional;

@Service
public class MarketingAuthorizationService {

    @Autowired
    private MarketingUserAssignmentRepository assignmentRepository;

    @Autowired
    private MarketingBranchRepository branchRepository;

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

        // If user has branch assignment, check if the branch belongs to the requested
        // area
        if (userAssignment.getBranch() != null) {
            return userAssignment.getBranch().getArea().getId().equals(areaId);
        }

        // If user has sub-area assignment, check if the sub-area belongs to the
        // requested area
        if (userAssignment.getSubArea() != null) {
            return userAssignment.getSubArea().getArea().getId().equals(areaId);
        }

        // If user has area assignment, check if it matches the requested area
        if (userAssignment.getArea() != null) {
            return userAssignment.getArea().getId().equals(areaId);
        }

        return false;
    }

    public boolean canCreateBranch(Long userId, Long areaId, Long branchId) {
        if (isRootUser(userId)) {
            return true;
        }

        List<MarketingUserAssignment> assignments = assignmentRepository.findActiveByUserId(userId);

        // Check each assignment to see if any allows creation in the requested branch
        for (MarketingUserAssignment userAssignment : assignments) {
            // If user is assigned to a specific branch, they can only create in that branch
            if (userAssignment.getBranch() != null) {
                boolean canCreate = userAssignment.getBranch().getId().equals(branchId);
                if (canCreate) {
                    return true;
                }
            }

            // If user is assigned to a sub-area, they can create in any branch within that
            // sub-area
            if (userAssignment.getSubArea() != null) {
                // Check if the requested branch belongs to user's assigned sub-area
                if (branchId != null && userAssignment.getSubArea().getId().equals(
                        getBranchSubAreaId(branchId))) {
                    return true;
                }
            }

            // If user is assigned to an area, they can create in any branch within that
            // area
            if (userAssignment.getArea() != null) {
                // Check if the requested branch belongs to user's assigned area
                if (branchId != null && userAssignment.getArea().getId().equals(
                        getBranchAreaId(branchId))) {
                    return true;
                }
            }
        }

        return false;
    }

    private Long getBranchSubAreaId(Long branchId) {
        if (branchId == null) {
            return null;
        }
        try {
            MarketingBranch branch = branchRepository.findById(branchId).orElse(null);
            return branch != null && branch.getSubArea() != null ? branch.getSubArea().getId() : null;
        } catch (Exception e) {
            System.err.println("Error getting branch sub-area: " + e.getMessage());
            return null;
        }
    }

    private Long getBranchAreaId(Long branchId) {
        if (branchId == null) {
            return null;
        }
        try {
            MarketingBranch branch = branchRepository.findById(branchId).orElse(null);
            return branch != null && branch.getArea() != null ? branch.getArea().getId() : null;
        } catch (Exception e) {
            System.err.println("Error getting branch area: " + e.getMessage());
            return null;
        }
    }

    public List<Long> getAccessibleAreaIds(Long userId) {
        if (isRootUser(userId)) {
            return null;
        }

        List<MarketingUserAssignment> assignments = assignmentRepository.findActiveByUserId(userId);
        if (assignments.isEmpty()) {
            return null;
        }

        return assignments.stream()
                .filter(assignment -> assignment.getArea() != null)
                .map(assignment -> assignment.getArea().getId())
                .distinct()
                .toList();
    }

    public List<Long> getAccessibleSubAreaIds(Long userId) {
        if (isRootUser(userId)) {
            return null;
        }

        List<MarketingUserAssignment> assignments = assignmentRepository.findActiveByUserId(userId);
        if (assignments.isEmpty()) {
            return null;
        }

        return assignments.stream()
                .filter(assignment -> assignment.getSubArea() != null)
                .map(assignment -> assignment.getSubArea().getId())
                .distinct()
                .toList();
    }

    // New method to get accessible area IDs for users with branch assignments
    public List<Long> getAccessibleAreaIdsIncludingBranches(Long userId) {
        if (isRootUser(userId)) {
            return null;
        }

        List<MarketingUserAssignment> assignments = assignmentRepository.findActiveByUserId(userId);
        if (assignments.isEmpty()) {
            return null;
        }

        return assignments.stream()
                .filter(assignment -> assignment.getArea() != null) // Include area, sub-area, and branch assignments
                .map(assignment -> assignment.getArea().getId())
                .distinct()
                .toList();
    }

    // New method to get accessible sub-area IDs for users with branch assignments
    public List<Long> getAccessibleSubAreaIdsIncludingBranches(Long userId) {
        if (isRootUser(userId)) {
            return null;
        }

        List<MarketingUserAssignment> assignments = assignmentRepository.findActiveByUserId(userId);
        if (assignments.isEmpty()) {
            return null;
        }

        return assignments.stream()
                .filter(assignment -> assignment.getSubArea() != null) // Include sub-area and branch assignments
                .map(assignment -> assignment.getSubArea().getId())
                .distinct()
                .toList();
    }

    public List<Long> getAccessibleBranchIds(Long userId) {
        if (isRootUser(userId)) {
            return null;
        }

        List<MarketingUserAssignment> assignments = assignmentRepository.findActiveByUserId(userId);
        if (assignments.isEmpty()) {
            return null;
        }

        return assignments.stream()
                .filter(assignment -> assignment.getBranch() != null)
                .map(assignment -> assignment.getBranch().getId())
                .distinct()
                .toList();
    }

    public Long getCurrentUserId() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder
                    .getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                String userIdHeader = request.getHeader("X-User-Id");
                if (userIdHeader != null) {
                    return Long.parseLong(userIdHeader);
                }
            }
        } catch (Exception e) {
            System.err.println("Error getting current user ID: " + e.getMessage());
        }
        return null;
    }

    public boolean canManageUsers() {
        Long currentUserId = getCurrentUserId();
        return currentUserId != null && isRootUser(currentUserId);
    }
}
