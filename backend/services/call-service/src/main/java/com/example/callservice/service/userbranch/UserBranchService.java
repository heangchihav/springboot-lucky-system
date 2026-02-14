package com.example.callservice.service.userbranch;

import com.example.callservice.entity.userbranch.UserBranch;
import com.example.callservice.entity.branch.Branch;
import com.example.callservice.repository.userbranch.UserBranchRepository;
import com.example.callservice.repository.branch.BranchRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class UserBranchService {

    @Autowired
    private UserBranchRepository userBranchRepository;

    @Autowired
    private BranchRepository branchRepository;

    public List<UserBranch> getAllUserBranches() {
        return userBranchRepository.findAll();
    }

    public List<UserBranch> getUserBranchesByUserId(Long userId) {
        return userBranchRepository.findByUserId(userId);
    }

    public List<UserBranch> getActiveUserBranchesByUserId(Long userId) {
        return userBranchRepository.findActiveUserBranchesByUserId(userId);
    }

    public List<UserBranch> getUserBranchesByBranchId(Long branchId) {
        return userBranchRepository.findByBranchId(branchId);
    }

    public List<UserBranch> getActiveUserBranchesByBranchId(Long branchId) {
        return userBranchRepository.findActiveUserBranchesByBranchId(branchId);
    }

    public List<UserBranch> getUserBranchesByAreaId(Long areaId) {
        return userBranchRepository.findActiveUserBranchesByAreaId(areaId);
    }

    public Optional<UserBranch> getUserBranchById(Long id) {
        return userBranchRepository.findById(id);
    }

    public Optional<UserBranch> getUserBranchByUserAndBranch(Long userId, Long branchId) {
        return userBranchRepository.findByUserIdAndBranchId(userId, branchId);
    }

    public Optional<UserBranch> getActiveUserBranchByUserAndBranch(Long userId, Long branchId) {
        return userBranchRepository.findByUserIdAndBranchIdAndActive(userId, branchId, true);
    }

    private boolean isRootUser(Long userId) {
        if (userId == null) {
            return false;
        }

        try {
            // TODO: Implement proper user-service API call when user-service is available
            // For now, check if username is "root" - this is a temporary implementation
            // In production, this should call user-service to verify root status
            return userId.equals(1L); // Assuming root user has ID 1, adjust as needed
        } catch (Exception e) {
            System.err.println("Error checking root user for userId " + userId + ": " + e.getMessage());
            // If we can't verify, assume not root for security
            return false;
        }
    }

    private boolean isUserActive(Long userId) {
        // TODO: Implement proper user-service API call when user-service is available
        // For now, assume user exists and is active to test branch assignment
        // functionality
        return true;
    }

    public UserBranch assignUserToBranch(Long userId, Long branchId) {
        // Validate user exists and is active via user-service API
        if (!isUserActive(userId)) {
            throw new IllegalArgumentException("User not found or inactive with id: " + userId);
        }

        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new IllegalArgumentException("Branch not found with id: " + branchId));

        if (!branch.getActive()) {
            throw new IllegalArgumentException("Cannot assign user to inactive branch: " + branch.getName());
        }

        Optional<UserBranch> existingAssignment = userBranchRepository.findByUserIdAndBranchId(userId, branchId);
        if (existingAssignment.isPresent()) {
            UserBranch userBranch = existingAssignment.get();
            if (!userBranch.getActive()) {
                userBranch.setActive(true);
                return userBranchRepository.save(userBranch);
            } else {
                throw new IllegalArgumentException("User is already assigned to this branch");
            }
        }

        // Allow multiple active assignments - don't deactivate existing ones
        UserBranch userBranch = new UserBranch(userId, branch);
        return userBranchRepository.save(userBranch);
    }

    public List<UserBranch> assignUserToBranches(Long userId, List<Long> branchIds) {
        // Validate user exists and is active via user-service API
        if (!isUserActive(userId)) {
            throw new IllegalArgumentException("User not found or inactive with id: " + userId);
        }

        List<UserBranch> assignments = new ArrayList<>();

        for (Long branchId : branchIds) {
            Branch branch = branchRepository.findById(branchId)
                    .orElseThrow(() -> new IllegalArgumentException("Branch not found with id: " + branchId));

            if (!branch.getActive()) {
                throw new IllegalArgumentException("Cannot assign user to inactive branch: " + branch.getName());
            }

            Optional<UserBranch> existingAssignment = userBranchRepository.findByUserIdAndBranchId(userId, branchId);
            if (existingAssignment.isPresent()) {
                UserBranch userBranch = existingAssignment.get();
                if (!userBranch.getActive()) {
                    userBranch.setActive(true);
                    assignments.add(userBranchRepository.save(userBranch));
                }
                // Skip if already active
            } else {
                // Create new assignment
                UserBranch userBranch = new UserBranch(userId, branch);
                assignments.add(userBranchRepository.save(userBranch));
            }
        }

        return assignments;
    }

    public UserBranch removeUserFromBranch(Long userId, Long branchId, Long currentUserId) {
        System.out.println("DEBUG: removeUserFromBranch called for userId: " + userId + ", branchId: " + branchId
                + ", currentUserId: " + currentUserId);

        UserBranch userBranch = userBranchRepository.findByUserIdAndBranchId(userId, branchId)
                .orElseThrow(() -> new IllegalArgumentException("User-Branch assignment not found"));

        // Check if this is the last active assignment (security measure) - but allow
        // root users
        // Check current user's assignments, not target user's assignments
        List<UserBranch> currentUserActiveAssignments = userBranchRepository
                .findActiveUserBranchesByUserId(currentUserId);
        System.out.println("DEBUG: Current user active assignments count: " + currentUserActiveAssignments.size());

        if (currentUserActiveAssignments.size() <= 1 && userBranch.getActive() && !isRootUser(currentUserId)) {
            System.out.println("DEBUG: Blocking removal - current user would have 0 assignments left");
            throw new IllegalArgumentException(
                    "Cannot remove the last active branch assignment. User must have at least one active branch assignment for security reasons.");
        }

        userBranch.setActive(false);
        return userBranchRepository.save(userBranch);
    }

    public List<UserBranch> removeUserFromBranches(Long userId, List<Long> branchIds) {
        // Check if this would remove all active assignments - but allow root users
        List<UserBranch> currentActiveAssignments = userBranchRepository.findActiveUserBranchesByUserId(userId);
        List<UserBranch> assignmentsToBeRemoved = new ArrayList<>();

        for (Long branchId : branchIds) {
            Optional<UserBranch> assignment = userBranchRepository.findByUserIdAndBranchId(userId, branchId);
            if (assignment.isPresent() && assignment.get().getActive()) {
                assignmentsToBeRemoved.add(assignment.get());
            }
        }

        // Calculate remaining active assignments after removal
        int remainingActiveAssignments = currentActiveAssignments.size() - assignmentsToBeRemoved.size();

        // Prevent removing all assignments (security measure) - but allow root users
        // Only apply restriction if user currently has assignments and would end up
        // with zero
        if (remainingActiveAssignments <= 0 && !currentActiveAssignments.isEmpty() && !isRootUser(userId)) {
            throw new IllegalArgumentException(
                    "Cannot remove all branch assignments. User must have at least one active branch assignment for security reasons.");
        }

        List<UserBranch> assignments = new ArrayList<>();

        for (Long branchId : branchIds) {
            try {
                UserBranch userBranch = removeUserFromBranch(userId, branchId, userId);
                assignments.add(userBranch);
            } catch (IllegalArgumentException e) {
                // Skip if assignment not found, continue with others
                continue;
            }
        }

        return assignments;
    }

    public UserBranch updateUserBranchAssignment(Long id, UserBranch userBranchDetails) {
        UserBranch userBranch = userBranchRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User-Branch assignment not found with id: " + id));

        // Check if this would deactivate the last active assignment (security measure)
        // - but allow root users
        if (!userBranchDetails.getActive() && userBranch.getActive() && !isRootUser(userBranch.getUserId())) {
            List<UserBranch> currentActiveAssignments = userBranchRepository
                    .findActiveUserBranchesByUserId(userBranch.getUserId());
            if (currentActiveAssignments.size() <= 1) {
                throw new IllegalArgumentException(
                        "Cannot deactivate the last active branch assignment. User must have at least one active branch assignment for security reasons.");
            }
        }

        userBranch.setActive(userBranchDetails.getActive());
        return userBranchRepository.save(userBranch);
    }

    public void deleteUserBranchAssignment(Long id) {
        UserBranch userBranch = userBranchRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User-Branch assignment not found with id: " + id));

        // Check if this would delete the last active assignment (security measure) -
        // but allow root users
        if (userBranch.getActive() && !isRootUser(userBranch.getUserId())) {
            List<UserBranch> currentActiveAssignments = userBranchRepository
                    .findActiveUserBranchesByUserId(userBranch.getUserId());
            if (currentActiveAssignments.size() <= 1) {
                throw new IllegalArgumentException(
                        "Cannot delete the last active branch assignment. User must have at least one active branch assignment for security reasons.");
            }
        }

        userBranchRepository.delete(userBranch);
    }

    public long countActiveBranchesForUser(Long userId) {
        return userBranchRepository.countActiveBranchesForUser(userId);
    }

    public long countActiveUsersForBranch(Long branchId) {
        return userBranchRepository.countActiveUsersForBranch(branchId);
    }

    public long countActiveUsersInArea(Long areaId) {
        return userBranchRepository.countActiveUsersInArea(areaId);
    }

    public boolean isUserAssignedToBranch(Long userId, Long branchId) {
        return userBranchRepository.findByUserIdAndBranchIdAndActive(userId, branchId, true).isPresent();
    }

    public boolean isUserAssignedToAnyBranchInArea(Long userId, Long areaId) {
        List<UserBranch> userBranches = userBranchRepository.findActiveUserBranchesByUserId(userId);
        return userBranches.stream()
                .anyMatch(ub -> ub.getBranch().getArea().getId().equals(areaId));
    }
}
