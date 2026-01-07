package com.example.marketingservice.service.area;

import com.example.marketingservice.dto.area.MarketingAreaRequest;
import com.example.marketingservice.entity.area.MarketingArea;
import com.example.marketingservice.exception.ResourceNotFoundException;
import com.example.marketingservice.repository.area.MarketingAreaRepository;
import com.example.marketingservice.service.shared.MarketingAuthorizationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MarketingAreaService {

    private final MarketingAreaRepository areaRepository;

    @Autowired
    private MarketingAuthorizationService authorizationService;

    public MarketingAreaService(MarketingAreaRepository areaRepository) {
        this.areaRepository = areaRepository;
    }

    public List<MarketingArea> findAll() {
        return areaRepository.findAll();
    }

    public List<MarketingArea> findAllForUser(Long userId) {
        List<Long> accessibleAreaIds = authorizationService.getAccessibleAreaIds(userId);

        if (accessibleAreaIds == null) {
            return areaRepository.findAll();
        }

        if (accessibleAreaIds.isEmpty()) {
            return List.of();
        }

        return areaRepository.findAll().stream()
                .filter(area -> accessibleAreaIds.contains(area.getId()))
                .collect(Collectors.toList());
    }

    public MarketingArea getById(Long id) {
        return areaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Marketing area not found: " + id));
    }

    @Transactional
    public MarketingArea create(MarketingAreaRequest request, Long creatorId) {
        if (!authorizationService.canCreateArea(creatorId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You don't have permission to create areas. Only administrators can create areas.");
        }

        MarketingArea area = new MarketingArea();
        applyRequest(area, request);
        area.setCreatedBy(creatorId);
        return areaRepository.save(area);
    }

    @Transactional
    public MarketingArea update(Long id, MarketingAreaRequest request, Long userId) {
        if (!authorizationService.canCreateArea(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You don't have permission to update areas. Only administrators can update areas.");
        }

        MarketingArea area = getById(id);
        applyRequest(area, request);
        return areaRepository.save(area);
    }

    @Transactional
    public void delete(Long id, Long userId) {
        if (!authorizationService.canCreateArea(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You don't have permission to delete areas. Only administrators can delete areas.");
        }

        if (!areaRepository.existsById(id)) {
            throw new ResourceNotFoundException("Marketing area not found: " + id);
        }
        areaRepository.deleteById(id);
    }

    private void applyRequest(MarketingArea area, MarketingAreaRequest request) {
        area.setName(request.getName());
        area.setCode(request.getCode());
        area.setDescription(request.getDescription());
        area.setActive(request.getActive());
    }
}
