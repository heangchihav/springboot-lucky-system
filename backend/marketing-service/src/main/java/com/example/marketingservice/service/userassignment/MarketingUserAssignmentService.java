package com.example.marketingservice.service.userassignment;

import com.example.marketingservice.entity.area.MarketingArea;
import com.example.marketingservice.entity.branch.MarketingBranch;
import com.example.marketingservice.entity.subarea.MarketingSubArea;
import com.example.marketingservice.entity.userassignment.MarketingUserAssignment;
import com.example.marketingservice.repository.area.MarketingAreaRepository;
import com.example.marketingservice.repository.branch.MarketingBranchRepository;
import com.example.marketingservice.repository.subarea.MarketingSubAreaRepository;
import com.example.marketingservice.repository.userassignment.MarketingUserAssignmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class MarketingUserAssignmentService {

    @Autowired
    private MarketingUserAssignmentRepository assignmentRepository;

    @Autowired
    private MarketingAreaRepository areaRepository;

    @Autowired
    private MarketingSubAreaRepository subAreaRepository;

    @Autowired
    private MarketingBranchRepository branchRepository;

    public List<MarketingUserAssignment> getAllAssignments() {
        return assignmentRepository.findAll();
    }

    public List<MarketingUserAssignment> getAssignmentsByUserId(Long userId) {
        return assignmentRepository.findByUserId(userId);
    }

    public List<MarketingUserAssignment> getActiveAssignmentsByUserId(Long userId) {
        return assignmentRepository.findActiveByUserId(userId);
    }

    public List<MarketingUserAssignment> getActiveAssignmentsByAreaId(Long areaId) {
        return assignmentRepository.findActiveByAreaId(areaId);
    }

    public List<MarketingUserAssignment> getActiveAssignmentsBySubAreaId(Long subAreaId) {
        return assignmentRepository.findActiveBySubAreaId(subAreaId);
    }

    public List<MarketingUserAssignment> getActiveAssignmentsByBranchId(Long branchId) {
        return assignmentRepository.findActiveByBranchId(branchId);
    }

    public Optional<MarketingUserAssignment> getAssignmentById(Long id) {
        return assignmentRepository.findById(id);
    }

    public MarketingUserAssignment assignUserToArea(Long userId, Long areaId) {
        MarketingArea area = areaRepository.findById(areaId)
                .orElseThrow(() -> new IllegalArgumentException("Area not found with id: " + areaId));

        if (!area.getActive()) {
            throw new IllegalArgumentException("Cannot assign user to inactive area: " + area.getName());
        }

        Optional<MarketingUserAssignment> existingAssignment = assignmentRepository.findByUserIdAndAreaId(userId,
                areaId);

        if (existingAssignment.isPresent()) {
            MarketingUserAssignment assignment = existingAssignment.get();
            if (!assignment.getActive()) {
                assignment.setActive(true);
                return assignmentRepository.save(assignment);
            } else {
                throw new IllegalArgumentException("User is already assigned to this area");
            }
        }

        // Allow multiple assignments - don't deactivate existing ones
        MarketingUserAssignment assignment = new MarketingUserAssignment(userId, area);
        return assignmentRepository.save(assignment);
    }

    public MarketingUserAssignment assignUserToSubArea(Long userId, Long subAreaId) {
        MarketingSubArea subArea = subAreaRepository.findById(subAreaId)
                .orElseThrow(() -> new IllegalArgumentException("Sub-area not found with id: " + subAreaId));

        if (!subArea.getActive()) {
            throw new IllegalArgumentException("Cannot assign user to inactive sub-area: " + subArea.getName());
        }

        Optional<MarketingUserAssignment> existingAssignment = assignmentRepository.findByUserIdAndSubAreaId(userId,
                subAreaId);

        if (existingAssignment.isPresent()) {
            MarketingUserAssignment assignment = existingAssignment.get();
            if (!assignment.getActive()) {
                assignment.setActive(true);
                return assignmentRepository.save(assignment);
            } else {
                throw new IllegalArgumentException("User is already assigned to this sub-area");
            }
        }

        // Allow multiple assignments - don't deactivate existing ones
        MarketingUserAssignment assignment = new MarketingUserAssignment(userId, subArea);
        return assignmentRepository.save(assignment);
    }

    public MarketingUserAssignment assignUserToBranch(Long userId, Long branchId) {
        MarketingBranch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new IllegalArgumentException("Branch not found with id: " + branchId));

        if (!branch.getActive()) {
            throw new IllegalArgumentException("Cannot assign user to inactive branch: " + branch.getName());
        }

        Optional<MarketingUserAssignment> existingAssignment = assignmentRepository.findByUserIdAndBranchId(userId,
                branchId);

        if (existingAssignment.isPresent()) {
            MarketingUserAssignment assignment = existingAssignment.get();
            if (!assignment.getActive()) {
                assignment.setActive(true);
                return assignmentRepository.save(assignment);
            } else {
                throw new IllegalArgumentException("User is already assigned to this branch");
            }
        }

        // Allow multiple assignments - don't deactivate existing ones
        MarketingUserAssignment assignment = new MarketingUserAssignment(userId, branch);
        return assignmentRepository.save(assignment);
    }

    public MarketingUserAssignment removeUserAssignment(Long userId, Long assignmentId) {
        MarketingUserAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new IllegalArgumentException("Assignment not found with id: " + assignmentId));

        if (!assignment.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Assignment does not belong to user");
        }

        assignment.setActive(false);
        return assignmentRepository.save(assignment);
    }

    public void deleteAssignment(Long id) {
        MarketingUserAssignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Assignment not found with id: " + id));

        assignmentRepository.delete(assignment);
    }

    public long countActiveAssignmentsByUserId(Long userId) {
        return assignmentRepository.countActiveByUserId(userId);
    }

    public long countActiveAssignmentsByAreaId(Long areaId) {
        return assignmentRepository.countActiveByAreaId(areaId);
    }

    public long countActiveAssignmentsBySubAreaId(Long subAreaId) {
        return assignmentRepository.countActiveBySubAreaId(subAreaId);
    }

    public long countActiveAssignmentsByBranchId(Long branchId) {
        return assignmentRepository.countActiveByBranchId(branchId);
    }

    // Bulk assignment methods for multiple assignments
    public List<MarketingUserAssignment> assignUserToMultipleAreas(Long userId, List<Long> areaIds) {
        if (areaIds == null || areaIds.isEmpty()) {
            throw new IllegalArgumentException("Area IDs list cannot be null or empty");
        }

        return areaIds.stream()
                .map(areaId -> assignUserToArea(userId, areaId))
                .toList();
    }

    public List<MarketingUserAssignment> assignUserToMultipleSubAreas(Long userId, List<Long> subAreaIds) {
        if (subAreaIds == null || subAreaIds.isEmpty()) {
            throw new IllegalArgumentException("Sub-area IDs list cannot be null or empty");
        }

        return subAreaIds.stream()
                .map(subAreaId -> assignUserToSubArea(userId, subAreaId))
                .toList();
    }

    public List<MarketingUserAssignment> assignUserToMultipleBranches(Long userId, List<Long> branchIds) {
        if (branchIds == null || branchIds.isEmpty()) {
            throw new IllegalArgumentException("Branch IDs list cannot be null or empty");
        }

        return branchIds.stream()
                .map(branchId -> assignUserToBranch(userId, branchId))
                .toList();
    }

    public List<MarketingUserAssignment> removeAllUserAssignments(Long userId) {
        List<MarketingUserAssignment> activeAssignments = assignmentRepository.findActiveByUserId(userId);
        List<MarketingUserAssignment> deactivatedAssignments = new ArrayList<>();

        for (MarketingUserAssignment assignment : activeAssignments) {
            assignment.setActive(false);
            deactivatedAssignments.add(assignmentRepository.save(assignment));
        }

        return deactivatedAssignments;
    }
}
