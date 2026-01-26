package com.example.marketingservice.service.competitor;

import com.example.marketingservice.dto.competitor.MarketingCompetitorAssignmentRequest;
import com.example.marketingservice.dto.competitor.MarketingCompetitorAssignmentResponse;
import com.example.marketingservice.entity.area.MarketingArea;
import com.example.marketingservice.entity.competitor.MarketingCompetitorAssignment;
import com.example.marketingservice.entity.subarea.MarketingSubArea;
import com.example.marketingservice.exception.ResourceNotFoundException;
import com.example.marketingservice.repository.area.MarketingAreaRepository;
import com.example.marketingservice.repository.competitor.MarketingCompetitorAssignmentRepository;
import com.example.marketingservice.repository.competitor.MarketingCompetitorRepository;
import com.example.marketingservice.repository.subarea.MarketingSubAreaRepository;
import com.example.marketingservice.service.shared.MarketingAuthorizationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class MarketingCompetitorAssignmentService {

    @Autowired
    private MarketingCompetitorAssignmentRepository assignmentRepository;

    @Autowired
    private MarketingAreaRepository areaRepository;

    @Autowired
    private MarketingSubAreaRepository subAreaRepository;

    @Autowired
    private MarketingCompetitorRepository competitorRepository;

    @Autowired
    private MarketingAuthorizationService authorizationService;

    public List<MarketingCompetitorAssignmentResponse> getAllAssignments() {
        return assignmentRepository.findAll().stream()
                .map(MarketingCompetitorAssignmentResponse::from)
                .collect(Collectors.toList());
    }

    public List<MarketingCompetitorAssignmentResponse> getAllAssignmentsForUser(Long userId) {
        List<Long> accessibleAreaIds = authorizationService.getAccessibleAreaIds(userId);
        List<Long> accessibleSubAreaIds = authorizationService.getAccessibleSubAreaIds(userId);

        if (accessibleAreaIds == null && accessibleSubAreaIds == null) {
            return assignmentRepository.findAll().stream()
                    .map(MarketingCompetitorAssignmentResponse::from)
                    .collect(Collectors.toList());
        }

        return assignmentRepository.findAll().stream()
                .filter(assignment -> {
                    // If user has sub-area assignments, show assignments for those sub-areas
                    if (accessibleSubAreaIds != null && !accessibleSubAreaIds.isEmpty()) {
                        // If assignment has a sub-area, check if user has access to it
                        if (assignment.getSubArea() != null) {
                            return accessibleSubAreaIds.contains(assignment.getSubArea().getId());
                        }
                        // If assignment is area-level (subArea=null), check if user has access to the
                        // area
                        if (accessibleAreaIds != null && !accessibleAreaIds.isEmpty()) {
                            return accessibleAreaIds.contains(assignment.getArea().getId());
                        }
                    }
                    // If user has area assignments (and no sub-area assignments), show assignments
                    // for those areas
                    if (accessibleAreaIds != null && !accessibleAreaIds.isEmpty()) {
                        return accessibleAreaIds.contains(assignment.getArea().getId());
                    }
                    return false;
                })
                .map(MarketingCompetitorAssignmentResponse::from)
                .collect(Collectors.toList());
    }

    public List<MarketingCompetitorAssignmentResponse> getAssignmentsByAreaAndSubArea(Long areaId, Long subAreaId) {
        return assignmentRepository.findByAreaAndSubArea(areaId, subAreaId).stream()
                .map(MarketingCompetitorAssignmentResponse::from)
                .collect(Collectors.toList());
    }

    public List<MarketingCompetitorAssignmentResponse> getAssignmentsByAreaAndSubAreaForUser(Long areaId,
            Long subAreaId, Long userId) {
        List<Long> accessibleAreaIds = authorizationService.getAccessibleAreaIds(userId);
        List<Long> accessibleSubAreaIds = authorizationService.getAccessibleSubAreaIds(userId);

        if (accessibleAreaIds == null && accessibleSubAreaIds == null) {
            return assignmentRepository.findByAreaAndSubArea(areaId, subAreaId).stream()
                    .map(MarketingCompetitorAssignmentResponse::from)
                    .collect(Collectors.toList());
        }

        return assignmentRepository.findByAreaAndSubArea(areaId, subAreaId).stream()
                .filter(assignment -> {
                    // If user has sub-area assignments, show assignments for those sub-areas
                    if (accessibleSubAreaIds != null && !accessibleSubAreaIds.isEmpty()) {
                        // If assignment has a sub-area, check if user has access to it
                        if (assignment.getSubArea() != null) {
                            return accessibleSubAreaIds.contains(assignment.getSubArea().getId());
                        }
                        // If assignment is area-level (subArea=null), check if user has access to the
                        // area
                        if (accessibleAreaIds != null && !accessibleAreaIds.isEmpty()) {
                            return accessibleAreaIds.contains(assignment.getArea().getId());
                        }
                    }
                    // If user has area assignments (and no sub-area assignments), show assignments
                    // for those areas
                    if (accessibleAreaIds != null && !accessibleAreaIds.isEmpty()) {
                        return accessibleAreaIds.contains(assignment.getArea().getId());
                    }
                    return false;
                })
                .map(MarketingCompetitorAssignmentResponse::from)
                .collect(Collectors.toList());
    }

    public MarketingCompetitorAssignmentResponse getAssignmentById(Long id) {
        MarketingCompetitorAssignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + id));
        return MarketingCompetitorAssignmentResponse.from(assignment);
    }

    public MarketingCompetitorAssignmentResponse createAssignment(MarketingCompetitorAssignmentRequest request,
            Long userId) {
        // Check authorization
        if (!authorizationService.canCreateSubArea(userId, request.getAreaId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You don't have permission to create competitor assignments in this area.");
        }

        // Validate area exists
        MarketingArea area = areaRepository.findById(request.getAreaId())
                .orElseThrow(() -> new ResourceNotFoundException("Area not found with id: " + request.getAreaId()));

        // Validate sub-area if provided
        MarketingSubArea subArea = null;
        if (request.getSubAreaId() != null) {
            subArea = subAreaRepository.findById(request.getSubAreaId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Sub-area not found with id: " + request.getSubAreaId()));
        }

        // Convert competitor profiles
        Map<Long, com.example.marketingservice.entity.competitor.CompetitorProfile> competitorProfiles = new HashMap<>();
        if (request.getCompetitorProfiles() != null) {
            request.getCompetitorProfiles().forEach((competitorId, profileRequest) -> {
                // Validate competitor exists
                competitorRepository.findById(competitorId)
                        .orElseThrow(
                                () -> new ResourceNotFoundException("Competitor not found with id: " + competitorId));

                // Create price range
                com.example.marketingservice.entity.competitor.CompetitorPriceRange priceRange = new com.example.marketingservice.entity.competitor.CompetitorPriceRange(
                        profileRequest.getPriceRange().getLowestPrice(),
                        profileRequest.getPriceRange().getHighestPrice());

                // Create competitor profile
                com.example.marketingservice.entity.competitor.CompetitorProfile profile = new com.example.marketingservice.entity.competitor.CompetitorProfile(
                        priceRange,
                        profileRequest.getStrengths(),
                        profileRequest.getWeaknesses(),
                        profileRequest.getRemarks(),
                        profileRequest.getBranchCount());

                competitorProfiles.put(competitorId, profile);
            });
        }

        MarketingCompetitorAssignment assignment = new MarketingCompetitorAssignment(
                area,
                subArea,
                competitorProfiles,
                userId);

        MarketingCompetitorAssignment savedAssignment = assignmentRepository.save(assignment);
        return MarketingCompetitorAssignmentResponse.from(savedAssignment);
    }

    public MarketingCompetitorAssignmentResponse updateAssignment(Long id, MarketingCompetitorAssignmentRequest request,
            Long userId) {
        MarketingCompetitorAssignment existingAssignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + id));

        authorizationService.validateCreator(userId, existingAssignment.getCreatedBy(), "competitor assignment");

        // Validate area exists
        MarketingArea area = areaRepository.findById(request.getAreaId())
                .orElseThrow(() -> new ResourceNotFoundException("Area not found with id: " + request.getAreaId()));

        // Validate sub-area if provided
        MarketingSubArea subArea = null;
        if (request.getSubAreaId() != null) {
            subArea = subAreaRepository.findById(request.getSubAreaId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Sub-area not found with id: " + request.getSubAreaId()));
        }

        // Convert competitor profiles
        Map<Long, com.example.marketingservice.entity.competitor.CompetitorProfile> competitorProfiles = new HashMap<>();
        if (request.getCompetitorProfiles() != null) {
            request.getCompetitorProfiles().forEach((competitorId, profileRequest) -> {
                // Validate competitor exists
                competitorRepository.findById(competitorId)
                        .orElseThrow(
                                () -> new ResourceNotFoundException("Competitor not found with id: " + competitorId));

                // Create price range
                com.example.marketingservice.entity.competitor.CompetitorPriceRange priceRange = new com.example.marketingservice.entity.competitor.CompetitorPriceRange(
                        profileRequest.getPriceRange().getLowestPrice(),
                        profileRequest.getPriceRange().getHighestPrice());

                // Create competitor profile
                com.example.marketingservice.entity.competitor.CompetitorProfile profile = new com.example.marketingservice.entity.competitor.CompetitorProfile(
                        priceRange,
                        profileRequest.getStrengths(),
                        profileRequest.getWeaknesses(),
                        profileRequest.getRemarks(),
                        profileRequest.getBranchCount());

                competitorProfiles.put(competitorId, profile);
            });
        }

        existingAssignment.setArea(area);
        existingAssignment.setSubArea(subArea);
        existingAssignment.setCompetitorProfiles(competitorProfiles);
        existingAssignment.setUpdatedBy(userId);

        MarketingCompetitorAssignment updatedAssignment = assignmentRepository.save(existingAssignment);
        return MarketingCompetitorAssignmentResponse.from(updatedAssignment);
    }

    public void deleteAssignment(Long id, Long userId) {
        MarketingCompetitorAssignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + id));

        authorizationService.validateCreator(userId, assignment.getCreatedBy(), "competitor assignment");

        assignmentRepository.deleteById(id);
    }

    public List<MarketingCompetitorAssignmentResponse> getAssignmentsByArea(Long areaId) {
        return assignmentRepository.findByArea(areaId).stream()
                .map(MarketingCompetitorAssignmentResponse::from)
                .collect(Collectors.toList());
    }

    public List<MarketingCompetitorAssignmentResponse> getAssignmentsByAreaForUser(Long areaId, Long userId) {
        List<Long> accessibleAreaIds = authorizationService.getAccessibleAreaIds(userId);

        if (accessibleAreaIds == null) {
            return assignmentRepository.findByArea(areaId).stream()
                    .map(MarketingCompetitorAssignmentResponse::from)
                    .collect(Collectors.toList());
        }

        if (accessibleAreaIds.contains(areaId)) {
            return assignmentRepository.findByArea(areaId).stream()
                    .map(MarketingCompetitorAssignmentResponse::from)
                    .collect(Collectors.toList());
        }

        return List.of();
    }

    public List<MarketingCompetitorAssignmentResponse> getAssignmentsBySubArea(Long subAreaId) {
        return assignmentRepository.findBySubArea(subAreaId).stream()
                .map(MarketingCompetitorAssignmentResponse::from)
                .collect(Collectors.toList());
    }

    public List<MarketingCompetitorAssignmentResponse> getAssignmentsBySubAreaForUser(Long subAreaId, Long userId) {
        List<Long> accessibleSubAreaIds = authorizationService.getAccessibleSubAreaIds(userId);
        List<Long> accessibleAreaIds = authorizationService.getAccessibleAreaIds(userId);

        if (accessibleSubAreaIds == null && accessibleAreaIds == null) {
            return assignmentRepository.findBySubArea(subAreaId).stream()
                    .map(MarketingCompetitorAssignmentResponse::from)
                    .collect(Collectors.toList());
        }

        // If user has sub-area assignments, check if they have access to this specific
        // sub-area
        if (accessibleSubAreaIds != null && accessibleSubAreaIds.contains(subAreaId)) {
            return assignmentRepository.findBySubArea(subAreaId).stream()
                    .map(MarketingCompetitorAssignmentResponse::from)
                    .collect(Collectors.toList());
        }

        // If user has area assignments, check if they have access to the area that
        // contains this sub-area
        if (accessibleAreaIds != null && !accessibleAreaIds.isEmpty()) {
            return assignmentRepository.findBySubArea(subAreaId).stream()
                    .filter(assignment -> accessibleAreaIds.contains(assignment.getArea().getId()))
                    .map(MarketingCompetitorAssignmentResponse::from)
                    .collect(Collectors.toList());
        }

        return List.of();
    }

    public boolean existsByAreaAndSubArea(Long areaId, Long subAreaId) {
        return assignmentRepository.existsByAreaAndSubArea(areaId, subAreaId);
    }
}
