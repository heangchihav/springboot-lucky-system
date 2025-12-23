package com.example.callservice.api;

import com.example.callservice.entity.Branch;
import com.example.callservice.service.BranchService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/calls/branches")
public class BranchController {
    
    @Autowired
    private BranchService branchService;
    
    @GetMapping
    public ResponseEntity<List<Branch>> getAllBranches() {
        List<Branch> branches = branchService.getAllBranches();
        return ResponseEntity.ok(branches);
    }
    
    @GetMapping("/active")
    public ResponseEntity<List<Branch>> getActiveBranches() {
        List<Branch> branches = branchService.getActiveBranchesOrderByName();
        return ResponseEntity.ok(branches);
    }
    
    @GetMapping("/area/{areaId}")
    public ResponseEntity<List<Branch>> getBranchesByArea(@PathVariable Long areaId) {
        List<Branch> branches = branchService.getActiveBranchesByAreaOrderByName(areaId);
        return ResponseEntity.ok(branches);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Branch> getBranchById(@PathVariable Long id) {
        Optional<Branch> branch = branchService.getBranchById(id);
        return branch.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/code/{code}")
    public ResponseEntity<Branch> getBranchByCode(@PathVariable String code) {
        Optional<Branch> branch = branchService.getBranchByCode(code);
        return branch.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/search")
    public ResponseEntity<List<Branch>> searchBranches(@RequestParam String name, 
                                                      @RequestParam(required = false) Long areaId) {
        List<Branch> branches;
        if (areaId != null) {
            branches = branchService.searchBranchesByAreaAndName(areaId, name);
        } else {
            branches = branchService.searchBranchesByName(name);
        }
        return ResponseEntity.ok(branches);
    }
    
    @PostMapping
    public ResponseEntity<Branch> createBranch(@Valid @RequestBody Branch branch) {
        try {
            Branch createdBranch = branchService.createBranch(branch);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdBranch);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Branch> updateBranch(@PathVariable Long id, @Valid @RequestBody Branch branch) {
        try {
            Branch updatedBranch = branchService.updateBranch(id, branch);
            return ResponseEntity.ok(updatedBranch);
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
    public ResponseEntity<Branch> deactivateBranch(@PathVariable Long id) {
        try {
            Branch branch = branchService.deactivateBranch(id);
            return ResponseEntity.ok(branch);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @PutMapping("/{id}/activate")
    public ResponseEntity<Branch> activateBranch(@PathVariable Long id) {
        try {
            Branch branch = branchService.activateBranch(id);
            return ResponseEntity.ok(branch);
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
