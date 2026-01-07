package com.example.marketingservice.repository.competitor;

import com.example.marketingservice.entity.competitor.MarketingCompetitorAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MarketingCompetitorAssignmentRepository extends JpaRepository<MarketingCompetitorAssignment, Long> {

    @Query("SELECT a FROM MarketingCompetitorAssignment a WHERE " +
           "(:areaId IS NULL OR a.area.id = :areaId) AND " +
           "(:subAreaId IS NULL OR a.subArea.id = :subAreaId)")
    List<MarketingCompetitorAssignment> findByAreaAndSubArea(@Param("areaId") Long areaId, 
                                                            @Param("subAreaId") Long subAreaId);

    @Query("SELECT a FROM MarketingCompetitorAssignment a WHERE a.area.id = :areaId")
    List<MarketingCompetitorAssignment> findByArea(@Param("areaId") Long areaId);

    @Query("SELECT a FROM MarketingCompetitorAssignment a WHERE a.subArea.id = :subAreaId")
    List<MarketingCompetitorAssignment> findBySubArea(@Param("subAreaId") Long subAreaId);

    @Query("SELECT COUNT(a) > 0 FROM MarketingCompetitorAssignment a WHERE " +
           "(:areaId IS NULL OR a.area.id = :areaId) AND " +
           "(:subAreaId IS NULL OR a.subArea.id = :subAreaId)")
    boolean existsByAreaAndSubArea(@Param("areaId") Long areaId, @Param("subAreaId") Long subAreaId);
}
