package com.example.marketingservice.repository.userassignment;

import com.example.marketingservice.entity.userassignment.MarketingUserAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MarketingUserAssignmentRepository extends JpaRepository<MarketingUserAssignment, Long> {

        List<MarketingUserAssignment> findByUserId(Long userId);

        @Query("SELECT mua FROM MarketingUserAssignment mua WHERE mua.userId = :userId AND mua.active = true")
        List<MarketingUserAssignment> findActiveByUserId(@Param("userId") Long userId);

        @Query("SELECT mua FROM MarketingUserAssignment mua WHERE mua.area.id = :areaId AND mua.active = true")
        List<MarketingUserAssignment> findActiveByAreaId(@Param("areaId") Long areaId);

        @Query("SELECT mua FROM MarketingUserAssignment mua WHERE mua.subArea.id = :subAreaId AND mua.active = true")
        List<MarketingUserAssignment> findActiveBySubAreaId(@Param("subAreaId") Long subAreaId);

        @Query("SELECT mua FROM MarketingUserAssignment mua WHERE mua.branch.id = :branchId AND mua.active = true")
        List<MarketingUserAssignment> findActiveByBranchId(@Param("branchId") Long branchId);

        @Query("SELECT mua FROM MarketingUserAssignment mua WHERE mua.userId = :userId AND mua.area.id = :areaId")
        Optional<MarketingUserAssignment> findByUserIdAndAreaId(@Param("userId") Long userId,
                        @Param("areaId") Long areaId);

        @Query("SELECT mua FROM MarketingUserAssignment mua WHERE mua.userId = :userId AND mua.subArea.id = :subAreaId")
        Optional<MarketingUserAssignment> findByUserIdAndSubAreaId(@Param("userId") Long userId,
                        @Param("subAreaId") Long subAreaId);

        @Query("SELECT mua FROM MarketingUserAssignment mua WHERE mua.userId = :userId AND mua.branch.id = :branchId")
        Optional<MarketingUserAssignment> findByUserIdAndBranchId(@Param("userId") Long userId,
                        @Param("branchId") Long branchId);

        @Query("SELECT COUNT(mua) FROM MarketingUserAssignment mua WHERE mua.userId = :userId AND mua.active = true")
        long countActiveByUserId(@Param("userId") Long userId);

        @Query("SELECT COUNT(mua) FROM MarketingUserAssignment mua WHERE mua.area.id = :areaId AND mua.active = true")
        long countActiveByAreaId(@Param("areaId") Long areaId);

        @Query("SELECT COUNT(mua) FROM MarketingUserAssignment mua WHERE mua.subArea.id = :subAreaId AND mua.active = true")
        long countActiveBySubAreaId(@Param("subAreaId") Long subAreaId);

        @Query("SELECT COUNT(mua) FROM MarketingUserAssignment mua WHERE mua.branch.id = :branchId AND mua.active = true")
        long countActiveByBranchId(@Param("branchId") Long branchId);
}
