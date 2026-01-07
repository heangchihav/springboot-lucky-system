package com.example.marketingservice.service.subarea;

import com.example.marketingservice.dto.subarea.MarketingSubAreaRequest;
import com.example.marketingservice.entity.subarea.MarketingSubArea;
import com.example.marketingservice.exception.ResourceNotFoundException;
import com.example.marketingservice.repository.subarea.MarketingSubAreaRepository;
import com.example.marketingservice.service.area.MarketingAreaService;
import com.example.marketingservice.service.shared.MarketingAuthorizationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MarketingSubAreaService {

    private final MarketingSubAreaRepository subAreaRepository;
    private final MarketingAreaService areaService;

    @Autowired
    private MarketingAuthorizationService authorizationService;

    public MarketingSubAreaService(MarketingSubAreaRepository subAreaRepository,
            MarketingAreaService areaService) {
        this.subAreaRepository = subAreaRepository;
        this.areaService = areaService;
    }

    public List<MarketingSubArea> findAll() {
        return subAreaRepository.findAll();
    }

    public List<MarketingSubArea> findAllForUser(Long userId) {
        List<Long> accessibleSubAreaIds = authorizationService.getAccessibleSubAreaIds(userId);
        List<Long> accessibleAreaIds = authorizationService.getAccessibleAreaIds(userId);

        if (accessibleSubAreaIds == null && accessibleAreaIds == null) {
            return subAreaRepository.findAll();
        }

        if (accessibleSubAreaIds != null && !accessibleSubAreaIds.isEmpty()) {
            return subAreaRepository.findAll().stream()
                    .filter(subArea -> accessibleSubAreaIds.contains(subArea.getId()))
                    .collect(Collectors.toList());
        }

        if (accessibleAreaIds != null && !accessibleAreaIds.isEmpty()) {
            return subAreaRepository.findAll().stream()
                    .filter(subArea -> accessibleAreaIds.contains(subArea.getArea().getId()))
                    .collect(Collectors.toList());
        }

        return List.of();
    }

    public List<MarketingSubArea> findByAreaId(Long areaId) {
        return subAreaRepository.findByAreaId(areaId);
    }

    public List<MarketingSubArea> findByAreaIdForUser(Long areaId, Long userId) {
        List<Long> accessibleSubAreaIds = authorizationService.getAccessibleSubAreaIds(userId);
        List<Long> accessibleAreaIds = authorizationService.getAccessibleAreaIds(userId);

        if (accessibleSubAreaIds == null && accessibleAreaIds == null) {
            return subAreaRepository.findByAreaId(areaId);
        }

        if (accessibleSubAreaIds != null && !accessibleSubAreaIds.isEmpty()) {
            return subAreaRepository.findByAreaId(areaId).stream()
                    .filter(subArea -> accessibleSubAreaIds.contains(subArea.getId()))
                    .collect(Collectors.toList());
        }

        if (accessibleAreaIds != null && accessibleAreaIds.contains(areaId)) {
            return subAreaRepository.findByAreaId(areaId);
        }

        return List.of();
    }

    public MarketingSubArea getById(Long id) {
        return subAreaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Marketing sub-area not found: " + id));
    }

    @Transactional
    public MarketingSubArea create(MarketingSubAreaRequest request, Long creatorId) {
        if (!authorizationService.canCreateSubArea(creatorId, request.getAreaId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You don't have permission to create sub-areas. Only area-assigned users or administrators can create sub-areas.");
        }

        MarketingSubArea subArea = new MarketingSubArea();
        applyRequest(subArea, request);
        subArea.setCreatedBy(creatorId);
        return subAreaRepository.save(subArea);
    }

    @Transactional
    public MarketingSubArea update(Long id, MarketingSubAreaRequest request, Long userId) {
        MarketingSubArea subArea = getById(id);
        authorizationService.validateCreator(userId, subArea.getCreatedBy(), "sub-area");
        applyRequest(subArea, request);
        return subAreaRepository.save(subArea);
    }

    @Transactional
    public void delete(Long id, Long userId) {
        MarketingSubArea subArea = getById(id);
        authorizationService.validateCreator(userId, subArea.getCreatedBy(), "sub-area");
        subAreaRepository.deleteById(id);
    }

    private void applyRequest(MarketingSubArea subArea, MarketingSubAreaRequest request) {
        subArea.setName(request.getName());
        subArea.setCode(request.getCode());
        subArea.setDescription(request.getDescription());
        subArea.setActive(request.getActive());
        subArea.setArea(areaService.getById(request.getAreaId()));
    }
}
