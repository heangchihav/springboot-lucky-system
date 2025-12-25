package com.example.callservice.service;

import com.example.callservice.entity.Area;
import com.example.callservice.entity.Branch;
import com.example.callservice.repository.AreaRepository;
import com.example.callservice.repository.BranchRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class BranchService {
    
    @Autowired
    private BranchRepository branchRepository;
    
    @Autowired
    private AreaRepository areaRepository;
    
    public List<Branch> getAllBranches() {
        return branchRepository.findAll();
    }
    
    public List<Branch> getActiveBranches() {
        return branchRepository.findByActive(true);
    }
    
    public List<Branch> getActiveBranchesOrderByName() {
        return branchRepository.findActiveBranchesOrderByName();
    }
    
    public List<Branch> getBranchesByArea(Long areaId) {
        return branchRepository.findByAreaId(areaId);
    }
    
    public List<Branch> getActiveBranchesByArea(Long areaId) {
        return branchRepository.findByAreaIdAndActive(areaId, true);
    }
    
    public List<Branch> getActiveBranchesByAreaOrderByName(Long areaId) {
        return branchRepository.findActiveBranchesByAreaOrderByName(areaId);
    }
    
    public Optional<Branch> getBranchById(Long id) {
        return branchRepository.findById(id);
    }
    
    public Optional<Branch> getBranchByCode(String code) {
        return branchRepository.findByCode(code);
    }
    
    public List<Branch> searchBranchesByName(String name) {
        return branchRepository.findActiveBranchesByNameContaining(name);
    }
    
    public List<Branch> searchBranchesByAreaAndName(Long areaId, String name) {
        return branchRepository.findActiveBranchesByAreaAndNameContaining(areaId, name);
    }
    
    public Branch createBranch(Branch branch) {
        if (branch.getArea() == null || branch.getArea().getId() == null) {
            throw new IllegalArgumentException("Area is required for branch");
        }
        
        Area area = areaRepository.findById(branch.getArea().getId())
                .orElseThrow(() -> new IllegalArgumentException("Area not found with id: " + branch.getArea().getId()));
        
        if (!area.getActive()) {
            throw new IllegalArgumentException("Cannot create branch in inactive area: " + area.getName());
        }
        
        if (branch.getCode() != null && branchRepository.existsByCode(branch.getCode())) {
            throw new IllegalArgumentException("Branch with code '" + branch.getCode() + "' already exists");
        }
        
        if (branchRepository.existsByNameAndAreaId(branch.getName(), branch.getArea().getId())) {
            throw new IllegalArgumentException("Branch with name '" + branch.getName() + "' already exists in this area");
        }
        
        branch.setArea(area);
        return branchRepository.save(branch);
    }
    
    public Branch updateBranch(Long id, Branch branchDetails) {
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Branch not found with id: " + id));
        
        if (branchDetails.getArea() != null && branchDetails.getArea().getId() != null) {
            Area area = areaRepository.findById(branchDetails.getArea().getId())
                    .orElseThrow(() -> new IllegalArgumentException("Area not found with id: " + branchDetails.getArea().getId()));
            
            if (!area.getActive()) {
                throw new IllegalArgumentException("Cannot move branch to inactive area: " + area.getName());
            }
            
            if (!branch.getArea().getId().equals(area.getId()) && 
                branchRepository.existsByNameAndAreaId(branchDetails.getName(), area.getId())) {
                throw new IllegalArgumentException("Branch with name '" + branchDetails.getName() + "' already exists in target area");
            }
            
            branch.setArea(area);
        }
        
        if (!branch.getName().equals(branchDetails.getName()) && 
            branchRepository.existsByNameAndAreaId(branchDetails.getName(), branch.getArea().getId())) {
            throw new IllegalArgumentException("Branch with name '" + branchDetails.getName() + "' already exists in this area");
        }
        
        if (branchDetails.getCode() != null && !branch.getCode().equals(branchDetails.getCode()) && 
            branchRepository.existsByCode(branchDetails.getCode())) {
            throw new IllegalArgumentException("Branch with code '" + branchDetails.getCode() + "' already exists");
        }
        
        branch.setName(branchDetails.getName());
        branch.setDescription(branchDetails.getDescription());
        if (branchDetails.getCode() != null) {
            branch.setCode(branchDetails.getCode());
        }
        branch.setAddress(branchDetails.getAddress());
        branch.setPhone(branchDetails.getPhone());
        branch.setEmail(branchDetails.getEmail());
        branch.setActive(branchDetails.getActive());
        
        return branchRepository.save(branch);
    }
    
    public void deleteBranch(Long id) {
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Branch not found with id: " + id));
        
        branchRepository.delete(branch);
    }
    
    public Branch deactivateBranch(Long id) {
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Branch not found with id: " + id));
        
        branch.setActive(false);
        return branchRepository.save(branch);
    }
    
    public Branch activateBranch(Long id) {
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Branch not found with id: " + id));
        
        if (!branch.getArea().getActive()) {
            throw new IllegalArgumentException("Cannot activate branch in inactive area: " + branch.getArea().getName());
        }
        
        branch.setActive(true);
        return branchRepository.save(branch);
    }
    
    public long getBranchCountInArea(Long areaId) {
        return branchRepository.countBranchesInArea(areaId);
    }
    
    public long getActiveBranchCountInArea(Long areaId) {
        return branchRepository.countActiveBranchesInArea(areaId);
    }
}
