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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    public List<MarketingCompetitorAssignmentResponse> getAllAssignments() {
        return assignmentRepository.findAll().stream()
                .map(MarketingCompetitorAssignmentResponse::from)
                .collect(Collectors.toList());
    }

    public List<MarketingCompetitorAssignmentResponse> getAssignmentsByAreaAndSubArea(Long areaId, Long subAreaId) {
        return assignmentRepository.findByAreaAndSubArea(areaId, subAreaId).stream()
                .map(MarketingCompetitorAssignmentResponse::from)
                .collect(Collectors.toList());
    }

    public MarketingCompetitorAssignmentResponse getAssignmentById(Long id) {
        MarketingCompetitorAssignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + id));
        return MarketingCompetitorAssignmentResponse.from(assignment);
    }

    public MarketingCompetitorAssignmentResponse createAssignment(MarketingCompetitorAssignmentRequest request, Long userId) {
        // Validate area exists
        MarketingArea area = areaRepository.findById(request.getAreaId())
                .orElseThrow(() -> new ResourceNotFoundException("Area not found with id: " + request.getAreaId()));

        // Validate sub-area if provided
        MarketingSubArea subArea = null;
        if (request.getSubAreaId() != null) {
            subArea = subAreaRepository.findById(request.getSubAreaId())
                    .orElseThrow(() -> new ResourceNotFoundException("Sub-area not found with id: " + request.getSubAreaId()));
        }

        // Convert competitor profiles
        Map<Long, com.example.marketingservice.entity.competitor.CompetitorProfile> competitorProfiles = new HashMap<>();
        if (request.getCompetitorProfiles() != null) {
            request.getCompetitorProfiles().forEach((competitorId, profileRequest) -> {
                // Validate competitor exists
                competitorRepository.findById(competitorId)
                        .orElseThrow(() -> new ResourceNotFoundException("Competitor not found with id: " + competitorId));

                // Create price range
                com.example.marketingservice.entity.competitor.CompetitorPriceRange priceRange = new com.example.marketingservice.entity.competitor.CompetitorPriceRange(
                        profileRequest.getPriceRange().getLowestPrice(),
                        profileRequest.getPriceRange().getHighestPrice()
                );

                // Create competitor profile
                com.example.marketingservice.entity.competitor.CompetitorProfile profile = new com.example.marketingservice.entity.competitor.CompetitorProfile(
                        priceRange,
                        profileRequest.getStrengths(),
                        profileRequest.getWeaknesses(),
                        profileRequest.getRemarks(),
                        profileRequest.getBranchCount()
                );

                competitorProfiles.put(competitorId, profile);
            });
        }

        MarketingCompetitorAssignment assignment = new MarketingCompetitorAssignment(
                area,
                subArea,
                competitorProfiles,
                userId
        );

        MarketingCompetitorAssignment savedAssignment = assignmentRepository.save(assignment);
        return MarketingCompetitorAssignmentResponse.from(savedAssignment);
    }

    public MarketingCompetitorAssignmentResponse updateAssignment(Long id, MarketingCompetitorAssignmentRequest request, Long userId) {
        MarketingCompetitorAssignment existingAssignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + id));

        // Validate area exists
        MarketingArea area = areaRepository.findById(request.getAreaId())
                .orElseThrow(() -> new ResourceNotFoundException("Area not found with id: " + request.getAreaId()));

        // Validate sub-area if provided
        MarketingSubArea subArea = null;
        if (request.getSubAreaId() != null) {
            subArea = subAreaRepository.findById(request.getSubAreaId())
                    .orElseThrow(() -> new ResourceNotFoundException("Sub-area not found with id: " + request.getSubAreaId()));
        }

        // Convert competitor profiles
        Map<Long, com.example.marketingservice.entity.competitor.CompetitorProfile> competitorProfiles = new HashMap<>();
        if (request.getCompetitorProfiles() != null) {
            request.getCompetitorProfiles().forEach((competitorId, profileRequest) -> {
                // Validate competitor exists
                competitorRepository.findById(competitorId)
                        .orElseThrow(() -> new ResourceNotFoundException("Competitor not found with id: " + competitorId));

                // Create price range
                com.example.marketingservice.entity.competitor.CompetitorPriceRange priceRange = new com.example.marketingservice.entity.competitor.CompetitorPriceRange(
                        profileRequest.getPriceRange().getLowestPrice(),
                        profileRequest.getPriceRange().getHighestPrice()
                );

                // Create competitor profile
                com.example.marketingservice.entity.competitor.CompetitorProfile profile = new com.example.marketingservice.entity.competitor.CompetitorProfile(
                        priceRange,
                        profileRequest.getStrengths(),
                        profileRequest.getWeaknesses(),
                        profileRequest.getRemarks(),
                        profileRequest.getBranchCount()
                );

                competitorProfiles.put(competitorId, profile);
            });
        }

        existingAssignment.setArea(area);
        existingAssignment.setSubArea(subArea);
        existingAssignment.setCompetitorProfiles(competitorProfiles);

        MarketingCompetitorAssignment updatedAssignment = assignmentRepository.save(existingAssignment);
        return MarketingCompetitorAssignmentResponse.from(updatedAssignment);
    }

    public void deleteAssignment(Long id) {
        if (!assignmentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Assignment not found with id: " + id);
        }
        assignmentRepository.deleteById(id);
    }

    public List<MarketingCompetitorAssignmentResponse> getAssignmentsByArea(Long areaId) {
        return assignmentRepository.findByArea(areaId).stream()
                .map(MarketingCompetitorAssignmentResponse::from)
                .collect(Collectors.toList());
    }

    public List<MarketingCompetitorAssignmentResponse> getAssignmentsBySubArea(Long subAreaId) {
        return assignmentRepository.findBySubArea(subAreaId).stream()
                .map(MarketingCompetitorAssignmentResponse::from)
                .collect(Collectors.toList());
    }

    public boolean existsByAreaAndSubArea(Long areaId, Long subAreaId) {
        return assignmentRepository.existsByAreaAndSubArea(areaId, subAreaId);
    }
}
