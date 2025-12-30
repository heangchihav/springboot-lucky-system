package com.example.marketingservice.service.branch;

import com.example.marketingservice.dto.branch.MarketingBranchRequest;
import com.example.marketingservice.entity.branch.MarketingBranch;
import com.example.marketingservice.exception.ResourceNotFoundException;
import com.example.marketingservice.repository.branch.MarketingBranchRepository;
import com.example.marketingservice.service.area.MarketingAreaService;
import com.example.marketingservice.service.subarea.MarketingSubAreaService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MarketingBranchService {

    private final MarketingBranchRepository branchRepository;
    private final MarketingAreaService areaService;
    private final MarketingSubAreaService subAreaService;

    public MarketingBranchService(MarketingBranchRepository branchRepository,
                                  MarketingAreaService areaService,
                                  MarketingSubAreaService subAreaService) {
        this.branchRepository = branchRepository;
        this.areaService = areaService;
        this.subAreaService = subAreaService;
    }

    public List<MarketingBranch> findAll() {
        return branchRepository.findAll();
    }

    public List<MarketingBranch> findByArea(Long areaId) {
        return branchRepository.findByAreaId(areaId);
    }

    public List<MarketingBranch> findBySubArea(Long subAreaId) {
        return branchRepository.findBySubAreaId(subAreaId);
    }

    public MarketingBranch getById(Long id) {
        return branchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Marketing branch not found: " + id));
    }

    @Transactional
    public MarketingBranch create(MarketingBranchRequest request, Long creatorId) {
        MarketingBranch branch = new MarketingBranch();
        applyRequest(branch, request);
        branch.setCreatedBy(creatorId);
        return branchRepository.save(branch);
    }

    @Transactional
    public MarketingBranch update(Long id, MarketingBranchRequest request) {
        MarketingBranch branch = getById(id);
        applyRequest(branch, request);
        return branchRepository.save(branch);
    }

    @Transactional
    public void delete(Long id) {
        if (!branchRepository.existsById(id)) {
            throw new ResourceNotFoundException("Marketing branch not found: " + id);
        }
        branchRepository.deleteById(id);
    }

    private void applyRequest(MarketingBranch branch, MarketingBranchRequest request) {
        branch.setName(request.getName());
        branch.setCode(request.getCode());
        branch.setDescription(request.getDescription());
        branch.setActive(request.getActive());
        branch.setArea(areaService.getById(request.getAreaId()));
        branch.setSubArea(request.getSubAreaId() != null ? subAreaService.getById(request.getSubAreaId()) : null);
    }
}
