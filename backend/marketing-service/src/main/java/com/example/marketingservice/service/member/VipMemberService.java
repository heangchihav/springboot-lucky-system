package com.example.marketingservice.service.member;

import com.example.marketingservice.dto.member.VipMemberRequest;
import com.example.marketingservice.entity.branch.MarketingBranch;
import com.example.marketingservice.entity.member.VipMember;
import com.example.marketingservice.exception.ResourceNotFoundException;
import com.example.marketingservice.repository.branch.MarketingBranchRepository;
import com.example.marketingservice.repository.member.VipMemberRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class VipMemberService {

    private final VipMemberRepository vipMemberRepository;
    private final MarketingBranchRepository branchRepository;

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
    public VipMember getById(Long id) {
        return vipMemberRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("VIP member not found: " + id));
    }

    @Transactional
    public VipMember create(VipMemberRequest request, Long creatorId) {
        VipMember member = new VipMember();
        applyRequest(member, request);
        member.setCreatedBy(creatorId);
        return vipMemberRepository.save(member);
    }

    @Transactional
    public VipMember update(Long id, VipMemberRequest request) {
        VipMember member = getById(id);
        applyRequest(member, request);
        return vipMemberRepository.save(member);
    }

    @Transactional
    public void delete(Long id) {
        if (!vipMemberRepository.existsById(id)) {
            throw new ResourceNotFoundException("VIP member not found: " + id);
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
                    .orElseThrow(() -> new ResourceNotFoundException("Marketing branch not found: " + request.getBranchId()));
            member.setBranch(branch);
        }
    }
}
