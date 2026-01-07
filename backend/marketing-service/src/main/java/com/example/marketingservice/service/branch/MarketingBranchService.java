package com.example.marketingservice.service.branch;

import com.example.marketingservice.dto.branch.MarketingBranchRequest;
import com.example.marketingservice.entity.branch.MarketingBranch;
import com.example.marketingservice.exception.ResourceNotFoundException;
import com.example.marketingservice.repository.branch.MarketingBranchRepository;
import com.example.marketingservice.service.area.MarketingAreaService;
import com.example.marketingservice.service.subarea.MarketingSubAreaService;
import com.example.marketingservice.service.shared.MarketingAuthorizationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MarketingBranchService {

    private final MarketingBranchRepository branchRepository;
    private final MarketingAreaService areaService;
    private final MarketingSubAreaService subAreaService;

    @Autowired
    private MarketingAuthorizationService authorizationService;

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

    public List<MarketingBranch> findAllForUser(Long userId) {
        List<Long> accessibleBranchIds = authorizationService.getAccessibleBranchIds(userId);
        List<Long> accessibleSubAreaIds = authorizationService.getAccessibleSubAreaIds(userId);
        List<Long> accessibleAreaIds = authorizationService.getAccessibleAreaIds(userId);

        if (accessibleBranchIds == null && accessibleSubAreaIds == null && accessibleAreaIds == null) {
            return branchRepository.findAll();
        }

        if (accessibleBranchIds != null && !accessibleBranchIds.isEmpty()) {
            return branchRepository.findAll().stream()
                    .filter(branch -> accessibleBranchIds.contains(branch.getId()))
                    .collect(Collectors.toList());
        }

        if (accessibleSubAreaIds != null && !accessibleSubAreaIds.isEmpty()) {
            return branchRepository.findAll().stream()
                    .filter(branch -> branch.getSubArea() != null &&
                            accessibleSubAreaIds.contains(branch.getSubArea().getId()))
                    .collect(Collectors.toList());
        }

        if (accessibleAreaIds != null && !accessibleAreaIds.isEmpty()) {
            return branchRepository.findAll().stream()
                    .filter(branch -> accessibleAreaIds.contains(branch.getArea().getId()))
                    .collect(Collectors.toList());
        }

        return List.of();
    }

    public List<MarketingBranch> findByArea(Long areaId) {
        return branchRepository.findByAreaId(areaId);
    }

    public List<MarketingBranch> findByAreaForUser(Long areaId, Long userId) {
        List<Long> accessibleBranchIds = authorizationService.getAccessibleBranchIds(userId);
        List<Long> accessibleSubAreaIds = authorizationService.getAccessibleSubAreaIds(userId);
        List<Long> accessibleAreaIds = authorizationService.getAccessibleAreaIds(userId);

        if (accessibleBranchIds == null && accessibleSubAreaIds == null && accessibleAreaIds == null) {
            return branchRepository.findByAreaId(areaId);
        }

        List<MarketingBranch> branches = branchRepository.findByAreaId(areaId);

        if (accessibleBranchIds != null && !accessibleBranchIds.isEmpty()) {
            return branches.stream()
                    .filter(branch -> accessibleBranchIds.contains(branch.getId()))
                    .collect(Collectors.toList());
        }

        if (accessibleSubAreaIds != null && !accessibleSubAreaIds.isEmpty()) {
            return branches.stream()
                    .filter(branch -> branch.getSubArea() != null &&
                            accessibleSubAreaIds.contains(branch.getSubArea().getId()))
                    .collect(Collectors.toList());
        }

        if (accessibleAreaIds != null && accessibleAreaIds.contains(areaId)) {
            return branches;
        }

        return List.of();
    }

    public List<MarketingBranch> findBySubArea(Long subAreaId) {
        return branchRepository.findBySubAreaId(subAreaId);
    }

    public List<MarketingBranch> findBySubAreaForUser(Long subAreaId, Long userId) {
        List<Long> accessibleBranchIds = authorizationService.getAccessibleBranchIds(userId);
        List<Long> accessibleSubAreaIds = authorizationService.getAccessibleSubAreaIds(userId);

        if (accessibleBranchIds == null && accessibleSubAreaIds == null) {
            return branchRepository.findBySubAreaId(subAreaId);
        }

        List<MarketingBranch> branches = branchRepository.findBySubAreaId(subAreaId);

        if (accessibleBranchIds != null && !accessibleBranchIds.isEmpty()) {
            return branches.stream()
                    .filter(branch -> accessibleBranchIds.contains(branch.getId()))
                    .collect(Collectors.toList());
        }

        if (accessibleSubAreaIds != null && accessibleSubAreaIds.contains(subAreaId)) {
            return branches;
        }

        return List.of();
    }

    public MarketingBranch getById(Long id) {
        return branchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Marketing branch not found: " + id));
    }

    @Transactional
    public MarketingBranch create(MarketingBranchRequest request, Long creatorId) {
        if (!authorizationService.canCreateBranch(creatorId, request.getAreaId(), request.getSubAreaId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You don't have permission to create branches. Only area-assigned, sub-area-assigned users, or administrators can create branches.");
        }

        MarketingBranch branch = new MarketingBranch();
        applyRequest(branch, request);
        branch.setCreatedBy(creatorId);
        return branchRepository.save(branch);
    }

    @Transactional
    public MarketingBranch update(Long id, MarketingBranchRequest request, Long userId) {
        if (!authorizationService.canCreateBranch(userId, request.getAreaId(), request.getSubAreaId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You don't have permission to update branches. Only area-assigned, sub-area-assigned users, or administrators can update branches.");
        }

        MarketingBranch branch = getById(id);
        applyRequest(branch, request);
        return branchRepository.save(branch);
    }

    @Transactional
    public void delete(Long id, Long userId) {
        MarketingBranch branch = getById(id);

        if (!authorizationService.canCreateBranch(userId, branch.getArea().getId(),
                branch.getSubArea() != null ? branch.getSubArea().getId() : null)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You don't have permission to delete branches. Only area-assigned, sub-area-assigned users, or administrators can delete branches.");
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
