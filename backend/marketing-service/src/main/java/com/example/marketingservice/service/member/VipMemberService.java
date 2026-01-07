package com.example.marketingservice.service.member;

import com.example.marketingservice.dto.member.VipMemberRequest;
import com.example.marketingservice.entity.branch.MarketingBranch;
import com.example.marketingservice.entity.member.VipMember;
import com.example.marketingservice.exception.ResourceNotFoundException;
import com.example.marketingservice.repository.branch.MarketingBranchRepository;
import com.example.marketingservice.repository.member.VipMemberRepository;
import com.example.marketingservice.service.shared.MarketingAuthorizationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class VipMemberService {

    private final VipMemberRepository vipMemberRepository;
    private final MarketingBranchRepository branchRepository;

    @Autowired
    private MarketingAuthorizationService authorizationService;

    public VipMemberService(VipMemberRepository vipMemberRepository,
            MarketingBranchRepository branchRepository) {
        this.vipMemberRepository = vipMemberRepository;
        this.branchRepository = branchRepository;
    }

    @Transactional(readOnly = true)
    public List<VipMember> findAll(Long areaId, Long subAreaId, Long branchId) {
        if (branchId != null) {
            return vipMemberRepository.findByBranchId(branchId);
        }
        if (subAreaId != null) {
            return vipMemberRepository.findByBranch_SubArea_Id(subAreaId);
        }
        if (areaId != null) {
            return vipMemberRepository.findByBranch_Area_Id(areaId);
        }
        return vipMemberRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<VipMember> findAllForUser(Long userId, Long areaId, Long subAreaId, Long branchId) {
        List<Long> accessibleBranchIds = authorizationService.getAccessibleBranchIds(userId);
        List<Long> accessibleSubAreaIds = authorizationService.getAccessibleSubAreaIds(userId);
        List<Long> accessibleAreaIds = authorizationService.getAccessibleAreaIds(userId);

        List<VipMember> members;
        if (branchId != null) {
            members = vipMemberRepository.findByBranchId(branchId);
        } else if (subAreaId != null) {
            members = vipMemberRepository.findByBranch_SubArea_Id(subAreaId);
        } else if (areaId != null) {
            members = vipMemberRepository.findByBranch_Area_Id(areaId);
        } else {
            members = vipMemberRepository.findAll();
        }

        if (accessibleBranchIds == null && accessibleSubAreaIds == null && accessibleAreaIds == null) {
            return members;
        }

        return members.stream()
                .filter(member -> {
                    if (accessibleBranchIds != null && !accessibleBranchIds.isEmpty()) {
                        return member.getBranch() != null &&
                                accessibleBranchIds.contains(member.getBranch().getId());
                    }
                    if (accessibleSubAreaIds != null && !accessibleSubAreaIds.isEmpty()) {
                        return member.getBranch() != null &&
                                member.getBranch().getSubArea() != null &&
                                accessibleSubAreaIds.contains(member.getBranch().getSubArea().getId());
                    }
                    if (accessibleAreaIds != null && !accessibleAreaIds.isEmpty()) {
                        return member.getBranch() != null &&
                                member.getBranch().getArea() != null &&
                                accessibleAreaIds.contains(member.getBranch().getArea().getId());
                    }
                    return false;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public VipMember getById(Long id) {
        return vipMemberRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("VIP member not found: " + id));
    }

    @Transactional
    public VipMember create(VipMemberRequest request, Long creatorId) {
        if (request.getBranchId() != null) {
            MarketingBranch branch = branchRepository.findById(request.getBranchId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Marketing branch not found: " + request.getBranchId()));

            if (!authorizationService.canCreateBranch(creatorId,
                    branch.getArea().getId(),
                    branch.getSubArea() != null ? branch.getSubArea().getId() : null)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "You don't have permission to create VIP members in this branch.");
            }
        }

        VipMember member = new VipMember();
        applyRequest(member, request);
        member.setCreatedBy(creatorId);
        return vipMemberRepository.save(member);
    }

    @Transactional
    public VipMember update(Long id, VipMemberRequest request, Long userId) {
        VipMember member = getById(id);

        if (request.getBranchId() != null) {
            MarketingBranch branch = branchRepository.findById(request.getBranchId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Marketing branch not found: " + request.getBranchId()));

            if (!authorizationService.canCreateBranch(userId,
                    branch.getArea().getId(),
                    branch.getSubArea() != null ? branch.getSubArea().getId() : null)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "You don't have permission to update VIP members in this branch.");
            }
        }

        applyRequest(member, request);
        return vipMemberRepository.save(member);
    }

    @Transactional
    public void delete(Long id, Long userId) {
        VipMember member = getById(id);

        if (member.getBranch() != null) {
            MarketingBranch branch = member.getBranch();
            if (!authorizationService.canCreateBranch(userId,
                    branch.getArea().getId(),
                    branch.getSubArea() != null ? branch.getSubArea().getId() : null)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "You don't have permission to delete VIP members in this branch.");
            }
        }

        vipMemberRepository.deleteById(id);
    }

    private void applyRequest(VipMember member, VipMemberRequest request) {
        member.setName(request.getName());
        member.setPhone(request.getPhone());
        member.setMemberCreatedAt(request.getMemberCreatedAt());
        member.setMemberDeletedAt(request.getMemberDeletedAt());
        member.setCreateRemark(request.getCreateRemark());
        member.setDeleteRemark(request.getDeleteRemark());

        if (request.getBranchId() != null) {
            MarketingBranch branch = branchRepository.findById(request.getBranchId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Marketing branch not found: " + request.getBranchId()));
            member.setBranch(branch);
        }
    }
}
