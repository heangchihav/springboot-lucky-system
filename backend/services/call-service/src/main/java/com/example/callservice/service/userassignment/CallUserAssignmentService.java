package com.example.callservice.service.userassignment;

import com.example.callservice.entity.area.Area;
import com.example.callservice.entity.branch.Branch;
import com.example.callservice.entity.subarea.Subarea;
import com.example.callservice.entity.userassignment.CallUserAssignment;
import com.example.callservice.repository.area.AreaRepository;
import com.example.callservice.repository.branch.BranchRepository;
import com.example.callservice.repository.subarea.SubareaRepository;
import com.example.callservice.repository.userassignment.CallUserAssignmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class CallUserAssignmentService {

    @Autowired
    private CallUserAssignmentRepository assignmentRepository;

    @Autowired
    private AreaRepository areaRepository;

    @Autowired
    private SubareaRepository subareaRepository;

    @Autowired
    private BranchRepository branchRepository;

    public List<CallUserAssignment> getAllAssignments() {
        return assignmentRepository.findAll();
    }

    public List<CallUserAssignment> getAssignmentsByUserId(Long userId) {
        return assignmentRepository.findByUserId(userId);
    }

    public List<CallUserAssignment> getActiveAssignmentsByUserId(Long userId) {
        return assignmentRepository.findActiveByUserId(userId);
    }

    public List<CallUserAssignment> getActiveAssignmentsByAreaId(Long areaId) {
        return assignmentRepository.findActiveByAreaId(areaId);
    }

    public List<CallUserAssignment> getActiveAssignmentsBySubAreaId(Long subAreaId) {
        return assignmentRepository.findActiveBySubAreaId(subAreaId);
    }

    public List<CallUserAssignment> getActiveAssignmentsByBranchId(Long branchId) {
        return assignmentRepository.findActiveByBranchId(branchId);
    }

    public Optional<CallUserAssignment> getAssignmentById(Long id) {
        return assignmentRepository.findById(id);
    }

    public CallUserAssignment assignUserToArea(Long userId, Long areaId) {
        Area area = areaRepository.findById(areaId)
                .orElseThrow(() -> new IllegalArgumentException("Area not found with id: " + areaId));

        if (!area.getActive()) {
            throw new IllegalArgumentException("Cannot assign user to inactive area: " + area.getName());
        }

        Optional<CallUserAssignment> existingAssignment = assignmentRepository.findByUserIdAndAreaId(userId,
                areaId);

        if (existingAssignment.isPresent()) {
            CallUserAssignment assignment = existingAssignment.get();
            if (!assignment.getActive()) {
                assignment.setActive(true);
                return assignmentRepository.save(assignment);
            } else {
                throw new IllegalArgumentException("User is already assigned to this area");
            }
        }

        // Allow multiple assignments - don't deactivate existing ones
        CallUserAssignment assignment = new CallUserAssignment(userId, area);
        return assignmentRepository.save(assignment);
    }

    public CallUserAssignment assignUserToSubArea(Long userId, Long subAreaId) {
        Subarea subArea = subareaRepository.findById(subAreaId)
                .orElseThrow(() -> new IllegalArgumentException("Sub-area not found with id: " + subAreaId));

        if (!subArea.getActive()) {
            throw new IllegalArgumentException("Cannot assign user to inactive sub-area: " + subArea.getName());
        }

        Optional<CallUserAssignment> existingAssignment = assignmentRepository.findByUserIdAndSubAreaId(userId,
                subAreaId);

        if (existingAssignment.isPresent()) {
            CallUserAssignment assignment = existingAssignment.get();
            if (!assignment.getActive()) {
                assignment.setActive(true);
                return assignmentRepository.save(assignment);
            } else {
                throw new IllegalArgumentException("User is already assigned to this sub-area");
            }
        }

        // Allow multiple assignments - don't deactivate existing ones
        CallUserAssignment assignment = new CallUserAssignment(userId, subArea);
        return assignmentRepository.save(assignment);
    }

    public CallUserAssignment assignUserToBranch(Long userId, Long branchId) {
        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new IllegalArgumentException("Branch not found with id: " + branchId));

        if (!branch.getActive()) {
            throw new IllegalArgumentException("Cannot assign user to inactive branch: " + branch.getName());
        }

        Optional<CallUserAssignment> existingAssignment = assignmentRepository.findByUserIdAndBranchId(userId,
                branchId);

        if (existingAssignment.isPresent()) {
            CallUserAssignment assignment = existingAssignment.get();
            if (!assignment.getActive()) {
                assignment.setActive(true);
                return assignmentRepository.save(assignment);
            } else {
                throw new IllegalArgumentException("User is already assigned to this branch");
            }
        }

        // Allow multiple assignments - don't deactivate existing ones
        CallUserAssignment assignment = new CallUserAssignment(userId, branch);
        return assignmentRepository.save(assignment);
    }

    public CallUserAssignment removeUserAssignment(Long userId, Long assignmentId) {
        CallUserAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new IllegalArgumentException("Assignment not found with id: " + assignmentId));

        if (!assignment.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Assignment does not belong to user");
        }

        assignment.setActive(false);
        return assignmentRepository.save(assignment);
    }

    public void deleteAssignment(Long id) {
        CallUserAssignment assignment = assignmentRepository.findById(id)
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
    public List<CallUserAssignment> assignUserToMultipleAreas(Long userId, List<Long> areaIds) {
        if (areaIds == null || areaIds.isEmpty()) {
            throw new IllegalArgumentException("Area IDs list cannot be null or empty");
        }

        return areaIds.stream()
                .map(areaId -> assignUserToArea(userId, areaId))
                .toList();
    }

    public List<CallUserAssignment> assignUserToMultipleSubAreas(Long userId, List<Long> subAreaIds) {
        if (subAreaIds == null || subAreaIds.isEmpty()) {
            throw new IllegalArgumentException("Sub-area IDs list cannot be null or empty");
        }

        return subAreaIds.stream()
                .map(subAreaId -> assignUserToSubArea(userId, subAreaId))
                .toList();
    }

    public List<CallUserAssignment> assignUserToMultipleBranches(Long userId, List<Long> branchIds) {
        if (branchIds == null || branchIds.isEmpty()) {
            throw new IllegalArgumentException("Branch IDs list cannot be null or empty");
        }

        return branchIds.stream()
                .map(branchId -> assignUserToBranch(userId, branchId))
                .toList();
    }

    // Remove all assignments for a user
    public List<CallUserAssignment> removeAllAssignmentsForUser(Long userId) {
        List<CallUserAssignment> assignments = getActiveAssignmentsByUserId(userId);
        List<CallUserAssignment> deactivatedAssignments = new ArrayList<>();

        for (CallUserAssignment assignment : assignments) {
            assignment.setActive(false);
            deactivatedAssignments.add(assignmentRepository.save(assignment));
        }

        return deactivatedAssignments;
    }
}
