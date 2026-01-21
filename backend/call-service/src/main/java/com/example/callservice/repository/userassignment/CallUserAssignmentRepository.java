package com.example.callservice.repository.userassignment;

import com.example.callservice.entity.userassignment.CallUserAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CallUserAssignmentRepository extends JpaRepository<CallUserAssignment, Long> {

    List<CallUserAssignment> findByUserId(Long userId);

    @Query("SELECT cua FROM CallUserAssignment cua WHERE cua.userId = :userId AND cua.active = true")
    List<CallUserAssignment> findActiveByUserId(@Param("userId") Long userId);

    @Query("SELECT cua FROM CallUserAssignment cua WHERE cua.area.id = :areaId AND cua.active = true")
    List<CallUserAssignment> findActiveByAreaId(@Param("areaId") Long areaId);

    @Query("SELECT cua FROM CallUserAssignment cua WHERE cua.subArea.id = :subAreaId AND cua.active = true")
    List<CallUserAssignment> findActiveBySubAreaId(@Param("subAreaId") Long subAreaId);

    @Query("SELECT cua FROM CallUserAssignment cua WHERE cua.branch.id = :branchId AND cua.active = true")
    List<CallUserAssignment> findActiveByBranchId(@Param("branchId") Long branchId);

    @Query("SELECT cua FROM CallUserAssignment cua WHERE cua.userId = :userId AND cua.area.id = :areaId")
    Optional<CallUserAssignment> findByUserIdAndAreaId(@Param("userId") Long userId,
            @Param("areaId") Long areaId);

    @Query("SELECT cua FROM CallUserAssignment cua WHERE cua.userId = :userId AND cua.subArea.id = :subAreaId")
    Optional<CallUserAssignment> findByUserIdAndSubAreaId(@Param("userId") Long userId,
            @Param("subAreaId") Long subAreaId);

    @Query("SELECT cua FROM CallUserAssignment cua WHERE cua.userId = :userId AND cua.branch.id = :branchId")
    Optional<CallUserAssignment> findByUserIdAndBranchId(@Param("userId") Long userId,
            @Param("branchId") Long branchId);

    @Query("SELECT COUNT(cua) FROM CallUserAssignment cua WHERE cua.userId = :userId AND cua.active = true")
    long countActiveByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(cua) FROM CallUserAssignment cua WHERE cua.area.id = :areaId AND cua.active = true")
    long countActiveByAreaId(@Param("areaId") Long areaId);

    @Query("SELECT COUNT(cua) FROM CallUserAssignment cua WHERE cua.subArea.id = :subAreaId AND cua.active = true")
    long countActiveBySubAreaId(@Param("subAreaId") Long subAreaId);

    @Query("SELECT COUNT(cua) FROM CallUserAssignment cua WHERE cua.branch.id = :branchId AND cua.active = true")
    long countActiveByBranchId(@Param("branchId") Long branchId);
}
