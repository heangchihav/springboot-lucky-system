package com.example.callservice.api;

import com.example.callservice.entity.Area;
import com.example.callservice.service.AreaService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/calls/areas")
public class AreaController {
    
    @Autowired
    private AreaService areaService;
    
    @GetMapping
    public ResponseEntity<List<Area>> getAllAreas() {
        List<Area> areas = areaService.getAllAreas();
        return ResponseEntity.ok(areas);
    }
    
    @GetMapping("/active")
    public ResponseEntity<List<Area>> getActiveAreas() {
        List<Area> areas = areaService.getActiveAreasOrderByName();
        return ResponseEntity.ok(areas);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Area> getAreaById(@PathVariable Long id) {
        Optional<Area> area = areaService.getAreaById(id);
        return area.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/code/{code}")
    public ResponseEntity<Area> getAreaByCode(@PathVariable String code) {
        Optional<Area> area = areaService.getAreaByCode(code);
        return area.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/search")
    public ResponseEntity<List<Area>> searchAreas(@RequestParam String name) {
        List<Area> areas = areaService.searchAreasByName(name);
        return ResponseEntity.ok(areas);
    }
    
    @PostMapping
    public ResponseEntity<Area> createArea(@Valid @RequestBody Area area) {
        try {
            Area createdArea = areaService.createArea(area);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdArea);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Area> updateArea(@PathVariable Long id, @Valid @RequestBody Area area) {
        try {
            Area updatedArea = areaService.updateArea(id, area);
            return ResponseEntity.ok(updatedArea);
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
