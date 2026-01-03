package com.example.marketingservice.repository.goods;

import com.example.marketingservice.entity.goods.MarketingGoodsShipment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface MarketingGoodsShipmentRepository extends JpaRepository<MarketingGoodsShipment, Long>, JpaSpecificationExecutor<MarketingGoodsShipment> {
    Page<MarketingGoodsShipment> findByMember_Id(Long memberId, Pageable pageable);

    Page<MarketingGoodsShipment> findByMember_Branch_Id(Long branchId, Pageable pageable);
}
