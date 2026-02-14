package com.example.marketingservice.repository.subarea;

import com.example.marketingservice.entity.subarea.MarketingSubArea;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MarketingSubAreaRepository extends JpaRepository<MarketingSubArea, Long> {
    List<MarketingSubArea> findByAreaId(Long areaId);
}
