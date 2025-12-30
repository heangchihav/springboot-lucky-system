package com.example.marketingservice.service.area;

import com.example.marketingservice.dto.area.MarketingAreaRequest;
import com.example.marketingservice.entity.area.MarketingArea;
import com.example.marketingservice.exception.ResourceNotFoundException;
import com.example.marketingservice.repository.area.MarketingAreaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MarketingAreaService {

    private final MarketingAreaRepository areaRepository;

    public MarketingAreaService(MarketingAreaRepository areaRepository) {
        this.areaRepository = areaRepository;
    }

    public List<MarketingArea> findAll() {
        return areaRepository.findAll();
    }

    public MarketingArea getById(Long id) {
        return areaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Marketing area not found: " + id));
    }

    @Transactional
    public MarketingArea create(MarketingAreaRequest request, Long creatorId) {
        MarketingArea area = new MarketingArea();
        applyRequest(area, request);
        area.setCreatedBy(creatorId);
        return areaRepository.save(area);
    }

    @Transactional
    public MarketingArea update(Long id, MarketingAreaRequest request) {
        MarketingArea area = getById(id);
        applyRequest(area, request);
        return areaRepository.save(area);
    }

    @Transactional
    public void delete(Long id) {
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
