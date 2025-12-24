package com.example.callservice.api;

import com.example.callservice.dto.AreaDTO;
import com.example.callservice.entity.Area;
import com.example.callservice.service.AreaService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/calls/areas")
public class AreaController {
    
    @Autowired
    private AreaService areaService;
    
    private AreaDTO convertToDTO(Area area) {
        AreaDTO dto = new AreaDTO();
        dto.setId(area.getId());
        dto.setName(area.getName());
        dto.setDescription(area.getDescription());
        dto.setCode(area.getCode());
        dto.setActive(area.getActive());
        return dto;
    }
    
    @GetMapping
    public ResponseEntity<List<AreaDTO>> getAllAreas() {
        List<Area> areas = areaService.getAllAreas();
        List<AreaDTO> areaDTOs = areas.stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(areaDTOs);
    }
    
    @GetMapping("/active")
    public ResponseEntity<List<AreaDTO>> getActiveAreas() {
        List<Area> areas = areaService.getActiveAreasOrderByName();
        List<AreaDTO> areaDTOs = areas.stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(areaDTOs);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<AreaDTO> getAreaById(@PathVariable Long id) {
        Optional<Area> area = areaService.getAreaById(id);
        return area.map(a -> ResponseEntity.ok(convertToDTO(a)))
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/code/{code}")
    public ResponseEntity<AreaDTO> getAreaByCode(@PathVariable String code) {
        Optional<Area> area = areaService.getAreaByCode(code);
        return area.map(a -> ResponseEntity.ok(convertToDTO(a)))
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/search")
    public ResponseEntity<List<AreaDTO>> searchAreas(@RequestParam String name) {
        List<Area> areas = areaService.searchAreasByName(name);
        List<AreaDTO> areaDTOs = areas.stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(areaDTOs);
    }
    
    @PostMapping
    public ResponseEntity<AreaDTO> createArea(@Valid @RequestBody Area area) {
        try {
            Area createdArea = areaService.createArea(area);
            return ResponseEntity.status(HttpStatus.CREATED).body(convertToDTO(createdArea));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<AreaDTO> updateArea(@PathVariable Long id, @Valid @RequestBody Area area) {
        try {
            Area updatedArea = areaService.updateArea(id, area);
            return ResponseEntity.ok(convertToDTO(updatedArea));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteArea(@PathVariable Long id) {
        try {
            areaService.deleteArea(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PutMapping("/{id}/deactivate")
    public ResponseEntity<Area> deactivateArea(@PathVariable Long id) {
        try {
            Area area = areaService.deactivateArea(id);
            return ResponseEntity.ok(area);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @PutMapping("/{id}/activate")
    public ResponseEntity<Area> activateArea(@PathVariable Long id) {
        try {
            Area area = areaService.activateArea(id);
            return ResponseEntity.ok(area);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/{id}/branch-count")
    public ResponseEntity<Long> getBranchCount(@PathVariable Long id) {
        if (!areaService.getAreaById(id).isPresent()) {
            return ResponseEntity.notFound().build();
        }
        long count = areaService.getActiveBranchCount(id);
        return ResponseEntity.ok(count);
    }
}
