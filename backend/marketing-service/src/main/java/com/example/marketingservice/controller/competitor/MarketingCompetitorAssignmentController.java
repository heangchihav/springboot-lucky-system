package com.example.marketingservice.controller.competitor;

import com.example.marketingservice.controller.base.BaseController;
import com.example.marketingservice.dto.competitor.MarketingCompetitorAssignmentRequest;
import com.example.marketingservice.dto.competitor.MarketingCompetitorAssignmentResponse;
import com.example.marketingservice.service.competitor.MarketingCompetitorAssignmentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/marketing/competitor-assignments")
public class MarketingCompetitorAssignmentController extends BaseController {

    @Autowired
    private MarketingCompetitorAssignmentService assignmentService;

    @GetMapping
    public ResponseEntity<List<MarketingCompetitorAssignmentResponse>> getAllAssignments() {
        List<MarketingCompetitorAssignmentResponse> assignments = assignmentService.getAllAssignments();
        return ResponseEntity.ok(assignments);
    }

    @GetMapping("/{id}")
    public ResponseEntity<MarketingCompetitorAssignmentResponse> getAssignmentById(@PathVariable Long id) {
        MarketingCompetitorAssignmentResponse assignment = assignmentService.getAssignmentById(id);
        return ResponseEntity.ok(assignment);
    }

    @GetMapping("/by-area-subarea")
    public ResponseEntity<List<MarketingCompetitorAssignmentResponse>> getAssignmentsByAreaAndSubArea(
            @RequestParam(required = false) Long areaId,
            @RequestParam(required = false) Long subAreaId) {
        List<MarketingCompetitorAssignmentResponse> assignments = assignmentService.getAssignmentsByAreaAndSubArea(areaId, subAreaId);
        return ResponseEntity.ok(assignments);
    }

    @GetMapping("/by-area/{areaId}")
    public ResponseEntity<List<MarketingCompetitorAssignmentResponse>> getAssignmentsByArea(
            @PathVariable Long areaId) {
        List<MarketingCompetitorAssignmentResponse> assignments = assignmentService.getAssignmentsByArea(areaId);
        return ResponseEntity.ok(assignments);
    }

    @GetMapping("/by-subarea/{subAreaId}")
    public ResponseEntity<List<MarketingCompetitorAssignmentResponse>> getAssignmentsBySubArea(
            @PathVariable Long subAreaId) {
        List<MarketingCompetitorAssignmentResponse> assignments = assignmentService.getAssignmentsBySubArea(subAreaId);
        return ResponseEntity.ok(assignments);
    }

    @PostMapping
    public ResponseEntity<MarketingCompetitorAssignmentResponse> createAssignment(
            @Valid @RequestBody MarketingCompetitorAssignmentRequest request,
            HttpServletRequest httpRequest) {
        Long userId = requireUserId(httpRequest);
        MarketingCompetitorAssignmentResponse createdAssignment = assignmentService.createAssignment(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdAssignment);
    }

    @PutMapping("/{id}")
    public ResponseEntity<MarketingCompetitorAssignmentResponse> updateAssignment(
            @PathVariable Long id,
            @Valid @RequestBody MarketingCompetitorAssignmentRequest request,
            HttpServletRequest httpRequest) {
        Long userId = requireUserId(httpRequest);
        MarketingCompetitorAssignmentResponse updatedAssignment = assignmentService.updateAssignment(id, request, userId);
        return ResponseEntity.ok(updatedAssignment);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAssignment(@PathVariable Long id) {
        assignmentService.deleteAssignment(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/exists")
    public ResponseEntity<Boolean> checkAssignmentExists(
            @RequestParam(required = false) Long areaId,
            @RequestParam(required = false) Long subAreaId) {
        boolean exists = assignmentService.existsByAreaAndSubArea(areaId, subAreaId);
        return ResponseEntity.ok(exists);
    }
}
