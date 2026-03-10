package com.example.branchreportservice.service;

import com.example.branchreportservice.entity.UserAssignment;
import com.example.branchreportservice.dto.CreateUserAssignmentRequest;
import com.example.branchreportservice.dto.UpdateUserAssignmentRequest;
import com.example.branchreportservice.repository.UserAssignmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class UserAssignmentService {

    private final UserAssignmentRepository userAssignmentRepository;
    private final RestTemplate restTemplate;

    private static final String REGION_SERVICE_URL = "http://region-service:8086/api/region";

    public UserAssignmentService(UserAssignmentRepository userAssignmentRepository, RestTemplate restTemplate) {
        this.userAssignmentRepository = userAssignmentRepository;
        this.restTemplate = restTemplate;
    }

    @Transactional
    public UserAssignment createUserAssignment(CreateUserAssignmentRequest request) {
        System.out.println("Creating user assignment for userId: " + request.getUserId());
        UserAssignment assignment = new UserAssignment(
                request.getUserId(),
                request.getAreaId(),
                request.getSubAreaId(),
                request.getBranchId());

        // Fetch and set names from region-service
        System.out.println("About to fetch names...");
        fetchAndSetNames(assignment);
        System.out.println("Finished fetching names.");

        // Set assignment type based on what's provided
        if (request.getBranchId() != null) {
            assignment.setAssignmentType(com.example.branchreportservice.enums.AssignmentType.BRANCH);
        } else if (request.getSubAreaId() != null) {
            assignment.setAssignmentType(com.example.branchreportservice.enums.AssignmentType.SUB_AREA);
        } else if (request.getAreaId() != null) {
            assignment.setAssignmentType(com.example.branchreportservice.enums.AssignmentType.AREA);
        }

        return userAssignmentRepository.save(assignment);
    }

    private void fetchAndSetNames(UserAssignment assignment) {
        try {
            System.out.println("Fetching names for assignment: areaId=" + assignment.getAreaId() +
                    ", subAreaId=" + assignment.getSubAreaId() +
                    ", branchId=" + assignment.getBranchId());

            // Fetch area name if areaId is provided and not already set
            if (assignment.getAreaId() != null && assignment.getAreaName() == null) {
                String url = REGION_SERVICE_URL + "/areas/" + assignment.getAreaId();
                System.out.println("Fetching area from URL: " + url);
                @SuppressWarnings("unchecked")
                Map<String, Object> area = restTemplate.getForObject(url, Map.class);
                System.out.println("Area response: " + area);
                if (area != null && area.containsKey("name")) {
                    assignment.setAreaName((String) area.get("name"));
                    System.out.println("Set area name: " + assignment.getAreaName());
                }
            }

            // Fetch subarea name if subAreaId is provided and not already set
            if (assignment.getSubAreaId() != null && assignment.getSubAreaName() == null) {
                String url = REGION_SERVICE_URL + "/sub-areas/" + assignment.getSubAreaId();
                System.out.println("Fetching subarea from URL: " + url);
                @SuppressWarnings("unchecked")
                Map<String, Object> subArea = restTemplate.getForObject(url, Map.class);
                System.out.println("SubArea response: " + subArea);
                if (subArea != null && subArea.containsKey("name")) {
                    assignment.setSubAreaName((String) subArea.get("name"));
                    System.out.println("Set subarea name: " + assignment.getSubAreaName());
                }

                // Also fetch area name from subarea data
                if (subArea != null && subArea.containsKey("areaName")) {
                    assignment.setAreaName((String) subArea.get("areaName"));
                    System.out.println("Set area name from subarea: " + assignment.getAreaName());
                }
            }

            // Fetch branch name if branchId is provided and not already set
            if (assignment.getBranchId() != null && assignment.getBranchName() == null) {
                String url = REGION_SERVICE_URL + "/branches/" + assignment.getBranchId();
                System.out.println("Fetching branch from URL: " + url);
                @SuppressWarnings("unchecked")
                Map<String, Object> branch = restTemplate.getForObject(url, Map.class);
                System.out.println("Branch response: " + branch);
                if (branch != null && branch.containsKey("name")) {
                    assignment.setBranchName((String) branch.get("name"));
                    System.out.println("Set branch name: " + assignment.getBranchName());
                }

                // Also fetch subarea and area names from the branch data
                if (branch != null) {
                    if (branch.containsKey("subAreaName")) {
                        assignment.setSubAreaName((String) branch.get("subAreaName"));
                        System.out.println("Set subarea name from branch: " + assignment.getSubAreaName());
                    }
                    if (branch.containsKey("areaName")) {
                        assignment.setAreaName((String) branch.get("areaName"));
                        System.out.println("Set area name from branch: " + assignment.getAreaName());
                    }
                }
            }
        } catch (Exception e) {
            // Log error but don't fail the assignment creation
            System.err.println("Error fetching names for assignment: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @Transactional
    public UserAssignment updateUserAssignment(Long assignmentId, UpdateUserAssignmentRequest request) {
        UserAssignment assignment = userAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("User assignment not found with id: " + assignmentId));

        // Update fields
        if (request.getAreaId() != null) {
            assignment.setAreaId(request.getAreaId());
        }
        if (request.getSubAreaId() != null) {
            assignment.setSubAreaId(request.getSubAreaId());
        }
        if (request.getBranchId() != null) {
            assignment.setBranchId(request.getBranchId());
        }

        // Fetch and update names from region-service
        fetchAndSetNames(assignment);

        // Update assignment type based on what's provided
        if (request.getBranchId() != null) {
            assignment.setAssignmentType(com.example.branchreportservice.enums.AssignmentType.BRANCH);
        } else if (request.getSubAreaId() != null) {
            assignment.setAssignmentType(com.example.branchreportservice.enums.AssignmentType.SUB_AREA);
        } else if (request.getAreaId() != null) {
            assignment.setAssignmentType(com.example.branchreportservice.enums.AssignmentType.AREA);
        }

        return userAssignmentRepository.save(assignment);
    }

    @Transactional
    public void deleteUserAssignment(Long assignmentId) {
        userAssignmentRepository.deleteById(assignmentId);
    }

    public List<UserAssignment> getUserAssignments(String userId) {
        return userAssignmentRepository.findByUserIdOrderByAssignedAtDesc(userId);
    }

    public List<UserAssignment> getUserAssignmentsByType(String userId, String assignmentType) {
        return userAssignmentRepository.findByUserIdAndAssignmentTypeOrderByAssignedAtDesc(userId, assignmentType);
    }
}
