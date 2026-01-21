package com.example.callservice.api.branch;

import com.example.callservice.annotation.RequirePermission;
import com.example.callservice.dto.branch.BranchDTO;
import com.example.callservice.entity.branch.Branch;
import com.example.callservice.entity.subarea.Subarea;
import com.example.callservice.service.branch.BranchService;
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
@RequestMapping("/api/calls/branches")
public class BranchController extends BaseController {

    @Autowired
    private BranchService branchService;

    private BranchDTO convertToDTO(Branch branch) {
        BranchDTO dto = new BranchDTO();
        dto.setId(branch.getId());
        dto.setName(branch.getName());
        dto.setDescription(branch.getDescription());
        dto.setCode(branch.getCode());
        dto.setAddress(branch.getAddress());
        dto.setPhone(branch.getPhone());
        dto.setEmail(branch.getEmail());
        dto.setActive(branch.getActive());
        if (branch.getSubarea() != null) {
            dto.setSubareaId(branch.getSubarea().getId());
            dto.setSubareaName(branch.getSubarea().getName());
            // Also set area name for display purposes
            if (branch.getSubarea().getArea() != null) {
                dto.setAreaName(branch.getSubarea().getArea().getName());
            }
        }
        return dto;
    }

    @GetMapping
    @RequirePermission("branch.view")
    public ResponseEntity<List<BranchDTO>> getAllBranches(HttpServletRequest request) {
        ResponseEntity<List<BranchDTO>> permissionCheck = checkPermissionAndReturn(request, "branch.view");
        if (permissionCheck != null) {
            return permissionCheck;
        }

        List<Branch> branches = branchService.getAllBranches();
        List<BranchDTO> branchDTOs = branches.stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(branchDTOs);
    }

    @GetMapping("/active")
    @RequirePermission("branch.view")
    public ResponseEntity<List<BranchDTO>> getActiveBranches(HttpServletRequest request) {
        ResponseEntity<List<BranchDTO>> permissionCheck = checkPermissionAndReturn(request, "branch.view");
        if (permissionCheck != null) {
            return permissionCheck;
        }

        List<Branch> branches = branchService.getActiveBranchesOrderByName();
        List<BranchDTO> branchDTOs = branches.stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(branchDTOs);
    }

    @GetMapping("/area/{areaId}")
    @RequirePermission("branch.view")
    public ResponseEntity<List<BranchDTO>> getBranchesByArea(@PathVariable Long areaId, HttpServletRequest request) {
        ResponseEntity<List<BranchDTO>> permissionCheck = checkPermissionAndReturn(request, "branch.view");
        if (permissionCheck != null) {
            return permissionCheck;
        }

        List<Branch> branches = branchService.getActiveBranchesByAreaOrderByName(areaId);
        List<BranchDTO> branchDTOs = branches.stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(branchDTOs);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BranchDTO> getBranchById(@PathVariable Long id, HttpServletRequest request) {
        ResponseEntity<BranchDTO> permissionCheck = checkPermissionAndReturn(request, "branch.view");
        if (permissionCheck != null) {
            return permissionCheck;
        }

        Optional<Branch> branch = branchService.getBranchById(id);
        return branch.map(b -> ResponseEntity.ok(convertToDTO(b)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<BranchDTO> getBranchByCode(@PathVariable String code) {
        Optional<Branch> branch = branchService.getBranchByCode(code);
        return branch.map(b -> ResponseEntity.ok(convertToDTO(b)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/search")
    public ResponseEntity<List<BranchDTO>> searchBranchesByName(@RequestParam String name) {
        List<Branch> branches = branchService.searchBranchesByName(name);
        List<BranchDTO> branchDTOs = branches.stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(branchDTOs);
    }

    @PostMapping
    @RequirePermission("branch.create")
    public ResponseEntity<BranchDTO> createBranch(@Valid @RequestBody BranchDTO branchDTO, HttpServletRequest request) {
        ResponseEntity<BranchDTO> permissionCheck = checkPermissionAndReturn(request, "branch.create");
        if (permissionCheck != null) {
            return permissionCheck;
        }

        try {
            Branch branch = new Branch();
            branch.setName(branchDTO.getName());
            branch.setDescription(branchDTO.getDescription());
            branch.setCode(branchDTO.getCode());
            branch.setAddress(branchDTO.getAddress());
            branch.setPhone(branchDTO.getPhone());
            branch.setEmail(branchDTO.getEmail());
            branch.setActive(branchDTO.getActive() != null ? branchDTO.getActive() : true);

            // Set subarea with just the ID - the service will fetch the full entity
            Subarea subarea = new Subarea();
            subarea.setId(branchDTO.getSubareaId());
            branch.setSubarea(subarea);

            Branch createdBranch = branchService.createBranch(branch);
            return ResponseEntity.status(HttpStatus.CREATED).body(convertToDTO(createdBranch));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<BranchDTO> updateBranch(@PathVariable Long id, @Valid @RequestBody Branch branch,
            HttpServletRequest request) {
        ResponseEntity<BranchDTO> permissionCheck = checkPermissionAndReturn(request, "branch.update");
        if (permissionCheck != null) {
            return permissionCheck;
        }

        try {
            Branch updatedBranch = branchService.updateBranch(id, branch);
            return ResponseEntity.ok(convertToDTO(updatedBranch));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBranch(@PathVariable Long id, HttpServletRequest request) {
        ResponseEntity<Void> permissionCheck = checkPermissionAndReturn(request, "branch.delete");
        if (permissionCheck != null) {
            return permissionCheck;
        }

        try {
            branchService.deleteBranch(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<BranchDTO> deactivateBranch(@PathVariable Long id, HttpServletRequest request) {
        ResponseEntity<BranchDTO> permissionCheck = checkPermissionAndReturn(request, "branch.update");
        if (permissionCheck != null) {
            return permissionCheck;
        }

        try {
            Branch branch = branchService.deactivateBranch(id);
            return ResponseEntity.ok(convertToDTO(branch));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}/activate")
    public ResponseEntity<BranchDTO> activateBranch(@PathVariable Long id, HttpServletRequest request) {
        ResponseEntity<BranchDTO> permissionCheck = checkPermissionAndReturn(request, "branch.update");
        if (permissionCheck != null) {
            return permissionCheck;
        }

        try {
            Branch branch = branchService.activateBranch(id);
            return ResponseEntity.ok(convertToDTO(branch));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/area/{areaId}/count")
    public ResponseEntity<Long> getBranchCountByArea(@PathVariable Long areaId) {
        long count = branchService.getActiveBranchCountInArea(areaId);
        return ResponseEntity.ok(count);
    }
}
