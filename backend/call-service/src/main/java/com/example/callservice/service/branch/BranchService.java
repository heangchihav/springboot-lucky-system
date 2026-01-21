package com.example.callservice.service.branch;

import com.example.callservice.entity.area.Area;
import com.example.callservice.entity.subarea.Subarea;
import com.example.callservice.entity.branch.Branch;
import com.example.callservice.repository.area.AreaRepository;
import com.example.callservice.repository.subarea.SubareaRepository;
import com.example.callservice.repository.branch.BranchRepository;
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
    private SubareaRepository subareaRepository;

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

    public List<Branch> getBranchesBySubarea(Long subareaId) {
        return branchRepository.findBySubareaId(subareaId);
    }

    public List<Branch> getActiveBranchesBySubarea(Long subareaId) {
        return branchRepository.findBySubareaIdAndActive(subareaId, true);
    }

    public List<Branch> getActiveBranchesBySubareaOrderByName(Long subareaId) {
        return branchRepository.findActiveBranchesBySubareaOrderByName(subareaId);
    }

    // Legacy methods for backward compatibility
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

    public List<Branch> searchBranchesBySubareaAndName(Long subareaId, String name) {
        return branchRepository.findActiveBranchesBySubareaAndNameContaining(subareaId, name);
    }

    // Legacy method for backward compatibility
    public List<Branch> searchBranchesByAreaAndName(Long areaId, String name) {
        return branchRepository.findActiveBranchesByAreaAndNameContaining(areaId, name);
    }

    public Branch createBranch(Branch branch) {
        if (branch.getSubarea() == null || branch.getSubarea().getId() == null) {
            throw new IllegalArgumentException("Subarea is required for branch");
        }

        Subarea subarea = subareaRepository.findById(branch.getSubarea().getId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Subarea not found with id: " + branch.getSubarea().getId()));

        if (!subarea.getActive()) {
            throw new IllegalArgumentException("Cannot create branch in inactive subarea: " + subarea.getName());
        }

        if (!subarea.getArea().getActive()) {
            throw new IllegalArgumentException("Cannot create branch in inactive area: " + subarea.getArea().getName());
        }

        if (branch.getCode() != null && branchRepository.existsByCode(branch.getCode())) {
            throw new IllegalArgumentException("Branch with code '" + branch.getCode() + "' already exists");
        }

        if (branchRepository.existsByNameAndSubareaId(branch.getName(), branch.getSubarea().getId())) {
            throw new IllegalArgumentException(
                    "Branch with name '" + branch.getName() + "' already exists in this subarea");
        }

        branch.setSubarea(subarea);
        branch.setArea(subarea.getArea()); // Set area from subarea for consistency
        return branchRepository.save(branch);
    }

    public Branch updateBranch(Long id, Branch branchDetails) {
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Branch not found with id: " + id));

        if (branchDetails.getSubarea() != null && branchDetails.getSubarea().getId() != null) {
            Subarea subarea = subareaRepository.findById(branchDetails.getSubarea().getId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Subarea not found with id: " + branchDetails.getSubarea().getId()));

            if (!subarea.getActive()) {
                throw new IllegalArgumentException("Cannot move branch to inactive subarea: " + subarea.getName());
            }

            if (!subarea.getArea().getActive()) {
                throw new IllegalArgumentException(
                        "Cannot move branch to inactive area: " + subarea.getArea().getName());
            }

            if (!branch.getSubarea().getId().equals(subarea.getId()) &&
                    branchRepository.existsByNameAndSubareaId(branchDetails.getName(), subarea.getId())) {
                throw new IllegalArgumentException(
                        "Branch with name '" + branchDetails.getName() + "' already exists in target subarea");
            }

            branch.setSubarea(subarea);
            branch.setArea(subarea.getArea()); // Update area when subarea changes
        }

        if (!branch.getName().equals(branchDetails.getName()) &&
                branchRepository.existsByNameAndSubareaId(branchDetails.getName(), branch.getSubarea().getId())) {
            throw new IllegalArgumentException(
                    "Branch with name '" + branchDetails.getName() + "' already exists in this subarea");
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

        if (!branch.getSubarea().getActive()) {
            throw new IllegalArgumentException(
                    "Cannot activate branch in inactive subarea: " + branch.getSubarea().getName());
        }

        if (!branch.getArea().getActive()) {
            throw new IllegalArgumentException(
                    "Cannot activate branch in inactive area: " + branch.getArea().getName());
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
