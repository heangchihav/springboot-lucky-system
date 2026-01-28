package com.example.callservice.repository.branch;

import com.example.callservice.entity.branch.Branch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BranchRepository extends JpaRepository<Branch, Long> {

    Optional<Branch> findByCode(String code);

    List<Branch> findBySubareaId(Long subareaId);

    List<Branch> findBySubareaIdAndActive(Long subareaId, Boolean active);

    // Legacy methods for backward compatibility
    List<Branch> findByAreaId(Long areaId);

    List<Branch> findByAreaIdAndActive(Long areaId, Boolean active);

    List<Branch> findByActive(Boolean active);

    @Query("SELECT b FROM Branch b WHERE b.active = true ORDER BY b.name")
    List<Branch> findActiveBranchesOrderByName();

    @Query("SELECT b FROM Branch b WHERE b.subarea.id = :subareaId AND b.active = true ORDER BY b.name")
    List<Branch> findActiveBranchesBySubareaOrderByName(@Param("subareaId") Long subareaId);

    // Legacy method for backward compatibility
    @Query("SELECT b FROM Branch b WHERE b.area.id = :areaId AND b.active = true ORDER BY b.name")
    List<Branch> findActiveBranchesByAreaOrderByName(@Param("areaId") Long areaId);

    @Query("SELECT b FROM Branch b WHERE LOWER(b.name) LIKE LOWER(CONCAT('%', :name, '%')) AND b.active = true")
    List<Branch> findActiveBranchesByNameContaining(@Param("name") String name);

    @Query("SELECT b FROM Branch b WHERE b.subarea.id = :subareaId AND LOWER(b.name) LIKE LOWER(CONCAT('%', :name, '%')) AND b.active = true")
    List<Branch> findActiveBranchesBySubareaAndNameContaining(@Param("subareaId") Long subareaId,
            @Param("name") String name);

    // Legacy method for backward compatibility
    @Query("SELECT b FROM Branch b WHERE b.area.id = :areaId AND LOWER(b.name) LIKE LOWER(CONCAT('%', :name, '%')) AND b.active = true")
    List<Branch> findActiveBranchesByAreaAndNameContaining(@Param("areaId") Long areaId, @Param("name") String name);

    @Query("SELECT COUNT(b) FROM Branch b WHERE b.subarea.id = :subareaId")
    long countBranchesInSubarea(@Param("subareaId") Long subareaId);

    @Query("SELECT COUNT(b) FROM Branch b WHERE b.subarea.id = :subareaId AND b.active = true")
    long countActiveBranchesInSubarea(@Param("subareaId") Long subareaId);

    @Query("SELECT COUNT(b) FROM Branch b WHERE b.area.id = :areaId")
    long countBranchesInArea(@Param("areaId") Long areaId);

    @Query("SELECT COUNT(b) FROM Branch b WHERE b.area.id = :areaId AND b.active = true")
    long countActiveBranchesInArea(@Param("areaId") Long areaId);

    boolean existsByCode(String code);

    boolean existsByNameAndSubareaId(String name, Long subareaId);

    boolean existsByNameAndAreaId(String name, Long areaId);

    @Query("SELECT b.area.id FROM Branch b WHERE b.id = :branchId")
    Long findAreaIdById(@Param("branchId") Long branchId);

    @Query("SELECT b.subarea.id FROM Branch b WHERE b.id = :branchId")
    Long findSubareaIdById(@Param("branchId") Long branchId);
}
