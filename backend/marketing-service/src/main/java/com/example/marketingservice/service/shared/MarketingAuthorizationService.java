package com.example.marketingservice.service.shared;

import com.example.marketingservice.entity.userassignment.MarketingUserAssignment;
import com.example.marketingservice.repository.userassignment.MarketingUserAssignmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class MarketingAuthorizationService {

    @Autowired
    private MarketingUserAssignmentRepository assignmentRepository;

    public Optional<MarketingUserAssignment> getUserAssignment(Long userId) {
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

    public boolean canCreateSubArea(Long userId, Long areaId) {
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
