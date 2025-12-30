package com.example.marketingservice.repository.branch;

import com.example.marketingservice.entity.branch.MarketingBranch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MarketingBranchRepository extends JpaRepository<MarketingBranch, Long> {
    List<MarketingBranch> findByAreaId(Long areaId);

    List<MarketingBranch> findBySubAreaId(Long subAreaId);
}
