package com.example.callservice.service.subarea;

import com.example.callservice.entity.subarea.Subarea;
import com.example.callservice.entity.area.Area;
import com.example.callservice.repository.subarea.SubareaRepository;
import com.example.callservice.repository.area.AreaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class SubareaService {

    @Autowired
    private SubareaRepository subareaRepository;

    @Autowired
    private AreaRepository areaRepository;

    public List<Subarea> getAllSubareas() {
        return subareaRepository.findAll();
    }

    public List<Subarea> getActiveSubareas() {
        return subareaRepository.findByActive(true);
    }

    public List<Subarea> getActiveSubareasOrderByName() {
        return subareaRepository.findActiveSubareasOrderByName();
    }

    public List<Subarea> getSubareasByAreaId(Long areaId) {
        return subareaRepository.findByAreaId(areaId);
    }

    public List<Subarea> getActiveSubareasByAreaId(Long areaId) {
        return subareaRepository.findByAreaIdAndActive(areaId, true);
    }

    public List<Subarea> getActiveSubareasByAreaIdOrderByName(Long areaId) {
        return subareaRepository.findActiveSubareasByAreaIdOrderByName(areaId);
    }

    public Optional<Subarea> getSubareaById(Long id) {
        return subareaRepository.findById(id);
    }

    public Optional<Subarea> getSubareaByCode(String code) {
        return subareaRepository.findByCode(code);
    }

    public Optional<Subarea> getSubareaByName(String name) {
        return subareaRepository.findByName(name);
    }

    public List<Subarea> searchSubareasByName(String name) {
        return subareaRepository.findActiveSubareasByNameContaining(name);
    }

    public List<Subarea> searchSubareasByAreaIdAndName(Long areaId, String name) {
        return subareaRepository.findActiveSubareasByAreaIdAndNameContaining(areaId, name);
    }

    public Subarea createSubarea(Subarea subarea) {
        // Validate area exists
        Area area = areaRepository.findById(subarea.getArea().getId())
                .orElseThrow(
                        () -> new IllegalArgumentException("Area not found with id: " + subarea.getArea().getId()));

        if (subarea.getCode() != null && subareaRepository.existsByCode(subarea.getCode())) {
            throw new IllegalArgumentException("Subarea with code '" + subarea.getCode() + "' already exists");
        }
        if (subareaRepository.existsByName(subarea.getName())) {
            throw new IllegalArgumentException("Subarea with name '" + subarea.getName() + "' already exists");
        }

        subarea.setArea(area);
        return subareaRepository.save(subarea);
    }

    public Subarea updateSubarea(Long id, Subarea subareaDetails) {
        Subarea subarea = subareaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Subarea not found with id: " + id));

        // Validate area if changed
        if (subareaDetails.getArea() != null && !subarea.getArea().getId().equals(subareaDetails.getArea().getId())) {
            Area area = areaRepository.findById(subareaDetails.getArea().getId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Area not found with id: " + subareaDetails.getArea().getId()));
            subarea.setArea(area);
        }

        if (!subarea.getName().equals(subareaDetails.getName())
                && subareaRepository.existsByName(subareaDetails.getName())) {
            throw new IllegalArgumentException("Subarea with name '" + subareaDetails.getName() + "' already exists");
        }

        if (subareaDetails.getCode() != null && !subarea.getCode().equals(subareaDetails.getCode()) &&
                subareaRepository.existsByCode(subareaDetails.getCode())) {
            throw new IllegalArgumentException("Subarea with code '" + subareaDetails.getCode() + "' already exists");
        }

        subarea.setName(subareaDetails.getName());
        subarea.setDescription(subareaDetails.getDescription());
        if (subareaDetails.getCode() != null) {
            subarea.setCode(subareaDetails.getCode());
        }
        subarea.setActive(subareaDetails.getActive());

        return subareaRepository.save(subarea);
    }

    public void deleteSubarea(Long id) {
        Subarea subarea = subareaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Subarea not found with id: " + id));

        long activeBranchCount = subareaRepository.countActiveBranchesInSubarea(id);
        if (activeBranchCount > 0) {
            throw new IllegalArgumentException("Cannot delete subarea with " + activeBranchCount
                    + " active branches. Please deactivate or move branches first.");
        }

        subareaRepository.delete(subarea);
    }

    public Subarea deactivateSubarea(Long id) {
        Subarea subarea = subareaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Subarea not found with id: " + id));

        subarea.setActive(false);
        return subareaRepository.save(subarea);
    }

    public Subarea activateSubarea(Long id) {
        Subarea subarea = subareaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Subarea not found with id: " + id));

        subarea.setActive(true);
        return subareaRepository.save(subarea);
    }

    public long getActiveBranchCount(Long subareaId) {
        return subareaRepository.countActiveBranchesInSubarea(subareaId);
    }
}
