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

    public UserBranch removeUserFromBranch(Long userId, Long branchId) {
        UserBranch userBranch = userBranchRepository.findByUserIdAndBranchId(userId, branchId)
                .orElseThrow(() -> new IllegalArgumentException("User-Branch assignment not found"));

        userBranch.setActive(false);
        return userBranchRepository.save(userBranch);
    }

    public List<UserBranch> removeUserFromBranches(Long userId, List<Long> branchIds) {
        List<UserBranch> assignments = new ArrayList<>();

        for (Long branchId : branchIds) {
            try {
                UserBranch userBranch = removeUserFromBranch(userId, branchId);
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

        userBranch.setActive(userBranchDetails.getActive());
        return userBranchRepository.save(userBranch);
    }

    public void deleteUserBranchAssignment(Long id) {
        UserBranch userBranch = userBranchRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User-Branch assignment not found with id: " + id));

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
