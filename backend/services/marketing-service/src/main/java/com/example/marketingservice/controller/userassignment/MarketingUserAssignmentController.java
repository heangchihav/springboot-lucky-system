package com.example.marketingservice.controller.userassignment;

import com.example.marketingservice.controller.base.BaseController;
import com.example.marketingservice.dto.userassignment.BulkAreaAssignmentRequest;
import com.example.marketingservice.dto.userassignment.BulkBranchAssignmentRequest;
import com.example.marketingservice.dto.userassignment.BulkSubAreaAssignmentRequest;
import com.example.marketingservice.dto.userassignment.MarketingUserAssignmentRequest;
import com.example.marketingservice.dto.userassignment.MarketingUserAssignmentResponse;
import com.example.marketingservice.entity.userassignment.MarketingUserAssignment;
import com.example.marketingservice.service.userassignment.MarketingUserAssignmentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/marketing/user-assignments")
public class MarketingUserAssignmentController extends BaseController {

    private static final Logger logger = LoggerFactory.getLogger(MarketingUserAssignmentController.class);

    @Autowired
    private MarketingUserAssignmentService assignmentService;

    @GetMapping
    public ResponseEntity<List<MarketingUserAssignmentResponse>> getAllAssignments() {
        List<MarketingUserAssignment> assignments = assignmentService.getAllAssignments();
        List<MarketingUserAssignmentResponse> response = assignments.stream()
                .map(MarketingUserAssignmentResponse::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<MarketingUserAssignmentResponse> getAssignmentById(@PathVariable Long id) {
        return assignmentService.getAssignmentById(id)
                .map(assignment -> ResponseEntity.ok(MarketingUserAssignmentResponse.fromEntity(assignment)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<MarketingUserAssignmentResponse>> getAssignmentsByUser(@PathVariable Long userId) {
        List<MarketingUserAssignment> assignments = assignmentService.getActiveAssignmentsByUserId(userId);
        List<MarketingUserAssignmentResponse> response = assignments.stream()
                .map(MarketingUserAssignmentResponse::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/my-assignments")
    public ResponseEntity<List<MarketingUserAssignmentResponse>> getMyAssignments(HttpServletRequest httpRequest) {
        Long userId = requireUserId(httpRequest);
        List<MarketingUserAssignment> assignments = assignmentService.getActiveAssignmentsByUserId(userId);
        List<MarketingUserAssignmentResponse> response = assignments.stream()
                .map(MarketingUserAssignmentResponse::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/area/{areaId}")
    public ResponseEntity<List<MarketingUserAssignmentResponse>> getAssignmentsByArea(@PathVariable Long areaId) {
        List<MarketingUserAssignment> assignments = assignmentService.getActiveAssignmentsByAreaId(areaId);
        List<MarketingUserAssignmentResponse> response = assignments.stream()
                .map(MarketingUserAssignmentResponse::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/sub-area/{subAreaId}")
    public ResponseEntity<List<MarketingUserAssignmentResponse>> getAssignmentsBySubArea(@PathVariable Long subAreaId) {
        List<MarketingUserAssignment> assignments = assignmentService.getActiveAssignmentsBySubAreaId(subAreaId);
        List<MarketingUserAssignmentResponse> response = assignments.stream()
                .map(MarketingUserAssignmentResponse::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/branch/{branchId}")
    public ResponseEntity<List<MarketingUserAssignmentResponse>> getAssignmentsByBranch(@PathVariable Long branchId) {
        List<MarketingUserAssignment> assignments = assignmentService.getActiveAssignmentsByBranchId(branchId);
        List<MarketingUserAssignmentResponse> response = assignments.stream()
                .map(MarketingUserAssignmentResponse::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/assign")
    public ResponseEntity<MarketingUserAssignmentResponse> assignUser(
            @Valid @RequestBody MarketingUserAssignmentRequest request,
            HttpServletRequest httpRequest) {

        logger.info("=== ASSIGN USER REQUEST ===");
        logger.info("Request: userId={}, areaId={}, subAreaId={}, branchId={}",
                request.getUserId(), request.getAreaId(), request.getSubAreaId(), request.getBranchId());

        Long userId = request.getUserId();

        if (userId == null) {
            logger.error("Validation failed: userId is null");
            return ResponseEntity.badRequest().build();
        }

        try {
            logger.info("Starting assignment process for user {}", userId);
            MarketingUserAssignment assignment;

            if (request.getBranchId() != null) {
                logger.info("Assigning user {} to branch {}", userId, request.getBranchId());
                assignment = assignmentService.assignUserToBranch(userId, request.getBranchId());
            } else if (request.getSubAreaId() != null) {
                logger.info("Assigning user {} to sub-area {}", userId, request.getSubAreaId());
                assignment = assignmentService.assignUserToSubArea(userId, request.getSubAreaId());
            } else if (request.getAreaId() != null) {
                logger.info("Assigning user {} to area {}", userId, request.getAreaId());
                assignment = assignmentService.assignUserToArea(userId, request.getAreaId());
            } else {
                logger.error("No valid assignment provided for user {}", userId);
                return ResponseEntity.badRequest().body(null);
            }

            logger.info("Assignment created successfully: ID={}, Area={}, SubArea={}, Branch={}",
                    assignment.getId(),
                    assignment.getArea() != null ? assignment.getArea().getId() : null,
                    assignment.getSubArea() != null ? assignment.getSubArea().getId() : null,
                    assignment.getBranch() != null ? assignment.getBranch().getId() : null);

            MarketingUserAssignmentResponse response = MarketingUserAssignmentResponse.fromEntity(assignment);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Error assigning user {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.status(500).body(null);
        }
    }

    @PostMapping("/assign-multiple-areas")
    public ResponseEntity<List<MarketingUserAssignmentResponse>> assignUserToMultipleAreas(
            @RequestBody BulkAreaAssignmentRequest request) {

        logger.info("=== BULK AREA ASSIGNMENT REQUEST ===");
        logger.info("Request: userId={}, areaIds={}", request.getUserId(), request.getAreaIds());

        try {
            List<MarketingUserAssignment> assignments = assignmentService.assignUserToMultipleAreas(
                    request.getUserId(), request.getAreaIds());

            List<MarketingUserAssignmentResponse> responses = assignments.stream()
                    .map(MarketingUserAssignmentResponse::fromEntity)
                    .toList();

            logger.info("Successfully assigned user to {} areas", assignments.size());
            return ResponseEntity.status(HttpStatus.CREATED).body(responses);

        } catch (IllegalArgumentException e) {
            logger.error("Bulk area assignment failed: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            logger.error("Unexpected error during bulk area assignment: {}", e.getMessage(), e);
            throw e;
        }
    }

    @PostMapping("/assign-multiple-subareas")
    public ResponseEntity<List<MarketingUserAssignmentResponse>> assignUserToMultipleSubAreas(
            @RequestBody BulkSubAreaAssignmentRequest request) {

        logger.info("=== BULK SUB-AREA ASSIGNMENT REQUEST ===");
        logger.info("Request: userId={}, subAreaIds={}", request.getUserId(), request.getSubAreaIds());

        try {
            List<MarketingUserAssignment> assignments = assignmentService.assignUserToMultipleSubAreas(
                    request.getUserId(), request.getSubAreaIds());

            List<MarketingUserAssignmentResponse> responses = assignments.stream()
                    .map(MarketingUserAssignmentResponse::fromEntity)
                    .toList();

            logger.info("Successfully assigned user to {} sub-areas", assignments.size());
            return ResponseEntity.status(HttpStatus.CREATED).body(responses);

        } catch (IllegalArgumentException e) {
            logger.error("Bulk sub-area assignment failed: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            logger.error("Unexpected error during bulk sub-area assignment: {}", e.getMessage(), e);
            throw e;
        }
    }

    @PostMapping("/assign-multiple-branches")
    public ResponseEntity<List<MarketingUserAssignmentResponse>> assignUserToMultipleBranches(
            @RequestBody BulkBranchAssignmentRequest request) {

        logger.info("=== BULK BRANCH ASSIGNMENT REQUEST ===");
        logger.info("Request: userId={}, branchIds={}", request.getUserId(), request.getBranchIds());

        try {
            List<MarketingUserAssignment> assignments = assignmentService.assignUserToMultipleBranches(
                    request.getUserId(), request.getBranchIds());

            List<MarketingUserAssignmentResponse> responses = assignments.stream()
                    .map(MarketingUserAssignmentResponse::fromEntity)
                    .toList();

            logger.info("Successfully assigned user to {} branches", assignments.size());
            return ResponseEntity.status(HttpStatus.CREATED).body(responses);

        } catch (IllegalArgumentException e) {
            logger.error("Bulk branch assignment failed: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            logger.error("Unexpected error during bulk branch assignment: {}", e.getMessage(), e);
            throw e;
        }
    }

    @PostMapping("/remove-all/{userId}")
    public ResponseEntity<List<MarketingUserAssignmentResponse>> removeAllUserAssignments(
            @PathVariable Long userId) {

        logger.info("=== REMOVE ALL ASSIGNMENTS REQUEST ===");
        logger.info("Removing all assignments for userId: {}", userId);

        try {
            List<MarketingUserAssignment> deactivatedAssignments = assignmentService.removeAllUserAssignments(userId);

            List<MarketingUserAssignmentResponse> responses = deactivatedAssignments.stream()
                    .map(MarketingUserAssignmentResponse::fromEntity)
                    .toList();

            logger.info("Successfully removed {} assignments for user {}", deactivatedAssignments.size(), userId);
            return ResponseEntity.ok(responses);

        } catch (IllegalArgumentException e) {
            logger.error("Remove all assignments failed: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            logger.error("Unexpected error during remove all assignments: {}", e.getMessage(), e);
            throw e;
        }
    }

    @PostMapping("/remove/{assignmentId}")
    public ResponseEntity<MarketingUserAssignmentResponse> removeAssignment(
            @PathVariable Long assignmentId,
            @RequestParam Long userId) {

        try {
            MarketingUserAssignment assignment = assignmentService.removeUserAssignment(userId, assignmentId);
            MarketingUserAssignmentResponse response = MarketingUserAssignmentResponse.fromEntity(assignment);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.error("Remove assignment failed: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAssignment(@PathVariable Long id) {
        try {
            assignmentService.deleteAssignment(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            logger.error("Delete assignment failed: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/user/{userId}/count")
    public ResponseEntity<Long> getAssignmentCountForUser(@PathVariable Long userId) {
        long count = assignmentService.countActiveAssignmentsByUserId(userId);
        return ResponseEntity.ok(count);
    }

    @GetMapping("/area/{areaId}/count")
    public ResponseEntity<Long> getAssignmentCountForArea(@PathVariable Long areaId) {
        long count = assignmentService.countActiveAssignmentsByAreaId(areaId);
        return ResponseEntity.ok(count);
    }

    @GetMapping("/sub-area/{subAreaId}/count")
    public ResponseEntity<Long> getAssignmentCountForSubArea(@PathVariable Long subAreaId) {
        long count = assignmentService.countActiveAssignmentsBySubAreaId(subAreaId);
        return ResponseEntity.ok(count);
    }

    @GetMapping("/branch/{branchId}/count")
    public ResponseEntity<Long> getAssignmentCountForBranch(@PathVariable Long branchId) {
        long count = assignmentService.countActiveAssignmentsByBranchId(branchId);
        return ResponseEntity.ok(count);
    }
}
