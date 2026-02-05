package com.example.callservice.service.area;

import com.example.callservice.entity.area.Area;
import com.example.callservice.repository.area.AreaRepository;
import com.example.callservice.service.userbranch.UserBranchService;
import com.example.callservice.service.shared.CallAuthorizationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class AreaService {

    @Autowired
    private AreaRepository areaRepository;

    @Autowired
    private UserBranchService userBranchService;

    @Autowired
    private CallAuthorizationService callAuthorizationService;

    public List<Area> getAllAreas() {
        return areaRepository.findAll();
    }

    public List<Area> getActiveAreas() {
        return areaRepository.findByActive(true);
    }

    public List<Area> getActiveAreasOrderByName() {
        return areaRepository.findActiveAreasOrderByName();
    }

    public Optional<Area> getAreaById(Long id) {
        return areaRepository.findById(id);
    }

    public Optional<Area> getAreaByCode(String code) {
        return areaRepository.findByCode(code);
    }

    public Optional<Area> getAreaByName(String name) {
        return areaRepository.findByName(name);
    }

    public List<Area> searchAreasByName(String name) {
        return areaRepository.findActiveAreasByNameContaining(name);
    }

    public Area createArea(Area area) {
        if (areaRepository.existsByCode(area.getCode())) {
            throw new IllegalArgumentException("Area with code '" + area.getCode() + "' already exists");
        }
        if (areaRepository.existsByName(area.getName())) {
            throw new IllegalArgumentException("Area with name '" + area.getName() + "' already exists");
        }
        return areaRepository.save(area);
    }

    public Area updateArea(Long id, Area areaDetails) {
        Area area = areaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Area not found with id: " + id));

        if (!area.getName().equals(areaDetails.getName()) && areaRepository.existsByName(areaDetails.getName())) {
            throw new IllegalArgumentException("Area with name '" + areaDetails.getName() + "' already exists");
        }

        if (areaDetails.getCode() != null && !area.getCode().equals(areaDetails.getCode()) &&
                areaRepository.existsByCode(areaDetails.getCode())) {
            throw new IllegalArgumentException("Area with code '" + areaDetails.getCode() + "' already exists");
        }

        area.setName(areaDetails.getName());
        area.setDescription(areaDetails.getDescription());
        if (areaDetails.getCode() != null) {
            area.setCode(areaDetails.getCode());
        }
        area.setActive(areaDetails.getActive());

        return areaRepository.save(area);
    }

    public void deleteArea(Long id) {
        Area area = areaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Area not found with id: " + id));

        long activeBranchCount = areaRepository.countActiveBranchesInArea(id);
        if (activeBranchCount > 0) {
            throw new IllegalArgumentException("Cannot delete area with " + activeBranchCount
                    + " active branches. Please deactivate or move branches first.");
        }

        areaRepository.delete(area);
    }

    public Area deactivateArea(Long id) {
        Area area = areaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Area not found with id: " + id));

        area.setActive(false);
        return areaRepository.save(area);
    }

    public Area activateArea(Long id) {
        Area area = areaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Area not found with id: " + id));

        area.setActive(true);
        return areaRepository.save(area);
    }

    public long getActiveBranchCount(Long areaId) {
        return areaRepository.countActiveBranchesInArea(areaId);
    }

    public List<Area> getAreasByUserId(Long userId) {
        return userBranchService.getUserBranchesByUserId(userId).stream()
                .filter(ub -> ub.getActive())
                .map(ub -> ub.getBranch().getArea())
                .filter(area -> area != null && area.getActive())
                .distinct()
                .collect(Collectors.toList());
    }

    public List<Area> findAllForUser(Long userId) {
        System.out.println("DEBUG: AreaService.findAllForUser called for userId: " + userId);

        List<Long> accessibleAreaIds = callAuthorizationService.getAccessibleAreaIds(userId);
        System.out.println("DEBUG: AreaService received accessible area IDs: " + accessibleAreaIds);

        if (accessibleAreaIds == null) {
            System.out.println("DEBUG: Accessible area IDs is null, returning all areas");
            return getAllAreas();
        }

        if (accessibleAreaIds.isEmpty()) {
            System.out.println("DEBUG: Accessible area IDs is empty, returning empty list");
            return List.of();
        }

        List<Area> filteredAreas = areaRepository.findAll().stream()
                .filter(area -> accessibleAreaIds.contains(area.getId()))
                .collect(Collectors.toList());

        System.out.println("DEBUG: AreaService returning " + filteredAreas.size() + " filtered areas");
        return filteredAreas;
    }
}
