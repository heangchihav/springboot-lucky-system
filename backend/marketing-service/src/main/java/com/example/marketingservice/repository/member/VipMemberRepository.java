package com.example.marketingservice.repository.member;

import com.example.marketingservice.entity.member.VipMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface VipMemberRepository extends JpaRepository<VipMember, Long> {
    List<VipMember> findByBranchId(Long branchId);

    List<VipMember> findByBranch_SubArea_Id(Long subAreaId);

    List<VipMember> findByBranch_Area_Id(Long areaId);

    List<VipMember> findByMemberCreatedAtBetween(LocalDate start, LocalDate end);
}
