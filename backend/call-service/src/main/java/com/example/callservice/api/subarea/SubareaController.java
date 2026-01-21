package com.example.callservice.api.subarea;

import com.example.callservice.dto.subarea.SubareaDTO;
import com.example.callservice.entity.subarea.Subarea;
import com.example.callservice.entity.area.Area;
import com.example.callservice.service.subarea.SubareaService;
import com.example.callservice.service.area.AreaService;
import com.example.callservice.annotation.RequirePermission;
import com.example.callservice.api.base.BaseController;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/calls/subareas")
public class SubareaController extends BaseController {

    @Autowired
    private SubareaService subareaService;

    @Autowired
    private AreaService areaService;

    private SubareaDTO convertToDTO(Subarea subarea) {
        SubareaDTO dto = new SubareaDTO();
        dto.setId(subarea.getId());
        dto.setName(subarea.getName());
        dto.setDescription(subarea.getDescription());
        dto.setCode(subarea.getCode());
        dto.setAreaId(subarea.getArea().getId());
        dto.setAreaName(subarea.getArea().getName());
        dto.setActive(subarea.getActive());
        dto.setBranchCount(subareaService.getActiveBranchCount(subarea.getId()));
        return dto;
    }

    private Subarea convertToEntity(SubareaDTO dto) {
        Subarea subarea = new Subarea();
        subarea.setName(dto.getName());
        subarea.setDescription(dto.getDescription());
        subarea.setCode(dto.getCode());
        subarea.setActive(dto.getActive());

        if (dto.getAreaId() != null) {
            Area area = new Area();
            area.setId(dto.getAreaId());
            subarea.setArea(area);
        }

        return subarea;
    }

    @GetMapping
    public ResponseEntity<List<SubareaDTO>> getAllSubareas(HttpServletRequest request) {
        ResponseEntity<List<SubareaDTO>> permissionCheck = checkPermissionAndReturn(request, "subarea.view");
        if (permissionCheck != null) {
            return permissionCheck;
        }
        List<Subarea> subareas = subareaService.getAllSubareas();
        List<SubareaDTO> subareaDTOs = subareas.stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(subareaDTOs);
    }

    @GetMapping("/active")
    public ResponseEntity<List<SubareaDTO>> getActiveSubareas(HttpServletRequest request) {
        ResponseEntity<List<SubareaDTO>> permissionCheck = checkPermissionAndReturn(request, "subarea.view");
        if (permissionCheck != null) {
            return permissionCheck;
        }
        List<Subarea> subareas = subareaService.getActiveSubareasOrderByName();
        List<SubareaDTO> subareaDTOs = subareas.stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(subareaDTOs);
    }

    @GetMapping("/area/{areaId}")
    public ResponseEntity<List<SubareaDTO>> getSubareasByAreaId(@PathVariable Long areaId, HttpServletRequest request) {
        ResponseEntity<List<SubareaDTO>> permissionCheck = checkPermissionAndReturn(request, "subarea.view");
        if (permissionCheck != null) {
            return permissionCheck;
        }

        // Verify area exists
        if (!areaService.getAreaById(areaId).isPresent()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        List<Subarea> subareas = subareaService.getActiveSubareasByAreaIdOrderByName(areaId);
        List<SubareaDTO> subareaDTOs = subareas.stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(subareaDTOs);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SubareaDTO> getSubareaById(@PathVariable Long id, HttpServletRequest request) {
        ResponseEntity<SubareaDTO> permissionCheck = checkPermissionAndReturn(request, "subarea.view");
        if (permissionCheck != null) {
            return permissionCheck;
        }

        Optional<Subarea> subarea = subareaService.getSubareaById(id);
        if (subarea.isPresent()) {
            return ResponseEntity.ok(convertToDTO(subarea.get()));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }

    @PostMapping
    public ResponseEntity<SubareaDTO> createSubarea(@Valid @RequestBody SubareaDTO subareaDTO,
            HttpServletRequest request) {
        ResponseEntity<SubareaDTO> permissionCheck = checkPermissionAndReturn(request, "subarea.create");
        if (permissionCheck != null) {
            return permissionCheck;
        }

        try {
            Subarea subarea = convertToEntity(subareaDTO);
            Subarea createdSubarea = subareaService.createSubarea(subarea);
            return ResponseEntity.status(HttpStatus.CREATED).body(convertToDTO(createdSubarea));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<SubareaDTO> updateSubarea(@PathVariable Long id, @Valid @RequestBody SubareaDTO subareaDTO,
            HttpServletRequest request) {
        ResponseEntity<SubareaDTO> permissionCheck = checkPermissionAndReturn(request, "subarea.edit");
        if (permissionCheck != null) {
            return permissionCheck;
        }

        try {
            Subarea subareaDetails = convertToEntity(subareaDTO);
            Subarea updatedSubarea = subareaService.updateSubarea(id, subareaDetails);
            return ResponseEntity.ok(convertToDTO(updatedSubarea));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSubarea(@PathVariable Long id, HttpServletRequest request) {
        ResponseEntity<Void> permissionCheck = checkPermissionAndReturn(request, "subarea.delete");
        if (permissionCheck != null) {
            return permissionCheck;
        }

        try {
            subareaService.deleteSubarea(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PutMapping("/{id}/activate")
    public ResponseEntity<SubareaDTO> activateSubarea(@PathVariable Long id, HttpServletRequest request) {
        ResponseEntity<SubareaDTO> permissionCheck = checkPermissionAndReturn(request, "subarea.edit");
        if (permissionCheck != null) {
            return permissionCheck;
        }

        try {
            Subarea activatedSubarea = subareaService.activateSubarea(id);
            return ResponseEntity.ok(convertToDTO(activatedSubarea));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<SubareaDTO> deactivateSubarea(@PathVariable Long id, HttpServletRequest request) {
        ResponseEntity<SubareaDTO> permissionCheck = checkPermissionAndReturn(request, "subarea.edit");
        if (permissionCheck != null) {
            return permissionCheck;
        }

        try {
            Subarea deactivatedSubarea = subareaService.deactivateSubarea(id);
            return ResponseEntity.ok(convertToDTO(deactivatedSubarea));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<SubareaDTO>> searchSubareas(@RequestParam String name,
            @RequestParam(required = false) Long areaId, HttpServletRequest request) {
        ResponseEntity<List<SubareaDTO>> permissionCheck = checkPermissionAndReturn(request, "subarea.view");
        if (permissionCheck != null) {
            return permissionCheck;
        }

        List<Subarea> subareas;
        if (areaId != null) {
            subareas = subareaService.searchSubareasByAreaIdAndName(areaId, name);
        } else {
            subareas = subareaService.searchSubareasByName(name);
        }

        List<SubareaDTO> subareaDTOs = subareas.stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(subareaDTOs);
    }
}
