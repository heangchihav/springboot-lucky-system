package com.example.callservice.api;

import com.example.callservice.annotation.RequirePermission;
import com.example.callservice.dto.BranchDTO;
import com.example.callservice.entity.Branch;
import com.example.callservice.service.BranchService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
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
        if (branch.getArea() != null) {
            dto.setAreaId(branch.getArea().getId());
            dto.setAreaName(branch.getArea().getName());
        }
        return dto;
    }
    
    @GetMapping
    public ResponseEntity<List<BranchDTO>> getAllBranches(HttpServletRequest request) {
        ResponseEntity<?> permissionCheck = checkPermission(request, "branch.view");
        if (permissionCheck != null) {
            @SuppressWarnings("unchecked")
            ResponseEntity<List<BranchDTO>> errorResponse = (ResponseEntity<List<BranchDTO>>) permissionCheck;
            return errorResponse;
        }
        
        List<Branch> branches = branchService.getAllBranches();
        List<BranchDTO> branchDTOs = branches.stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(branchDTOs);
    }
    
    @GetMapping("/active")
    @RequirePermission("branch.view")
    public ResponseEntity<List<BranchDTO>> getActiveBranches() {
        List<Branch> branches = branchService.getActiveBranchesOrderByName();
        List<BranchDTO> branchDTOs = branches.stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(branchDTOs);
    }
    
    @GetMapping("/area/{areaId}")
    @RequirePermission("branch.view")
    public ResponseEntity<List<BranchDTO>> getBranchesByArea(@PathVariable Long areaId) {
        List<Branch> branches = branchService.getActiveBranchesByAreaOrderByName(areaId);
        List<BranchDTO> branchDTOs = branches.stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(branchDTOs);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<BranchDTO> getBranchById(@PathVariable Long id) {
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
    public ResponseEntity<BranchDTO> createBranch(@Valid @RequestBody Branch branch) {
        try {
            Branch createdBranch = branchService.createBranch(branch);
            return ResponseEntity.status(HttpStatus.CREATED).body(convertToDTO(createdBranch));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<BranchDTO> updateBranch(@PathVariable Long id, @Valid @RequestBody Branch branch) {
        try {
            Branch updatedBranch = branchService.updateBranch(id, branch);
            return ResponseEntity.ok(convertToDTO(updatedBranch));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBranch(@PathVariable Long id) {
        try {
            branchService.deleteBranch(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PutMapping("/{id}/deactivate")
    public ResponseEntity<BranchDTO> deactivateBranch(@PathVariable Long id) {
        try {
            Branch branch = branchService.deactivateBranch(id);
            return ResponseEntity.ok(convertToDTO(branch));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @PutMapping("/{id}/activate")
    public ResponseEntity<BranchDTO> activateBranch(@PathVariable Long id) {
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
