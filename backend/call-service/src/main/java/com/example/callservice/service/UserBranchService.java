package com.example.callservice.service;

import com.example.callservice.entity.User;
import com.example.callservice.entity.UserBranch;
import com.example.callservice.entity.Branch;
import com.example.callservice.repository.UserBranchRepository;
import com.example.callservice.repository.UserRepository;
import com.example.callservice.repository.BranchRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class UserBranchService {
    
    @Autowired
    private UserBranchRepository userBranchRepository;
    
    @Autowired
    private UserRepository userRepository;
    
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
    
    public UserBranch assignUserToBranch(Long userId, Long branchId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));
        
        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new IllegalArgumentException("Branch not found with id: " + branchId));
        
        if (!user.getActive()) {
            throw new IllegalArgumentException("Cannot assign inactive user: " + user.getUsername());
        }
        
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
        
        UserBranch userBranch = new UserBranch(user, branch);
        return userBranchRepository.save(userBranch);
    }
    
    public UserBranch removeUserFromBranch(Long userId, Long branchId) {
        UserBranch userBranch = userBranchRepository.findByUserIdAndBranchId(userId, branchId)
                .orElseThrow(() -> new IllegalArgumentException("User-Branch assignment not found"));
        
        userBranch.setActive(false);
        return userBranchRepository.save(userBranch);
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
