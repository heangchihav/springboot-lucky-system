package com.example.marketingservice.service.subarea;

import com.example.marketingservice.dto.subarea.MarketingSubAreaRequest;
import com.example.marketingservice.entity.subarea.MarketingSubArea;
import com.example.marketingservice.exception.ResourceNotFoundException;
import com.example.marketingservice.repository.subarea.MarketingSubAreaRepository;
import com.example.marketingservice.service.area.MarketingAreaService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MarketingSubAreaService {

    private final MarketingSubAreaRepository subAreaRepository;
    private final MarketingAreaService areaService;

    public MarketingSubAreaService(MarketingSubAreaRepository subAreaRepository,
                                   MarketingAreaService areaService) {
        this.subAreaRepository = subAreaRepository;
        this.areaService = areaService;
    }

    public List<MarketingSubArea> findAll() {
        return subAreaRepository.findAll();
    }

    public List<MarketingSubArea> findByAreaId(Long areaId) {
        return subAreaRepository.findByAreaId(areaId);
    }

    public MarketingSubArea getById(Long id) {
        return subAreaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Marketing sub-area not found: " + id));
    }

    @Transactional
    public MarketingSubArea create(MarketingSubAreaRequest request, Long creatorId) {
        MarketingSubArea subArea = new MarketingSubArea();
        applyRequest(subArea, request);
        subArea.setCreatedBy(creatorId);
        return subAreaRepository.save(subArea);
    }

    @Transactional
    public MarketingSubArea update(Long id, MarketingSubAreaRequest request) {
        MarketingSubArea subArea = getById(id);
        applyRequest(subArea, request);
        return subAreaRepository.save(subArea);
    }

    @Transactional
    public void delete(Long id) {
        if (!subAreaRepository.existsById(id)) {
            throw new ResourceNotFoundException("Marketing sub-area not found: " + id);
        }
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
