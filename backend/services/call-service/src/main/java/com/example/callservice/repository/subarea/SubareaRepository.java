package com.example.callservice.repository.subarea;

import com.example.callservice.entity.subarea.Subarea;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubareaRepository extends JpaRepository<Subarea, Long> {

    Optional<Subarea> findByCode(String code);

    Optional<Subarea> findByName(String name);

    List<Subarea> findByActive(Boolean active);

    List<Subarea> findByAreaId(Long areaId);

    List<Subarea> findByAreaIdAndActive(Long areaId, Boolean active);

    @Query("SELECT s FROM Subarea s WHERE s.active = true ORDER BY s.name")
    List<Subarea> findActiveSubareasOrderByName();

    @Query("SELECT s FROM Subarea s WHERE s.area.id = :areaId AND s.active = true ORDER BY s.name")
    List<Subarea> findActiveSubareasByAreaIdOrderByName(@Param("areaId") Long areaId);

    @Query("SELECT s FROM Subarea s WHERE LOWER(s.name) LIKE LOWER(CONCAT('%', :name, '%')) AND s.active = true")
    List<Subarea> findActiveSubareasByNameContaining(@Param("name") String name);

    @Query("SELECT s FROM Subarea s WHERE s.area.id = :areaId AND LOWER(s.name) LIKE LOWER(CONCAT('%', :name, '%')) AND s.active = true")
    List<Subarea> findActiveSubareasByAreaIdAndNameContaining(@Param("areaId") Long areaId, @Param("name") String name);

    @Query("SELECT COUNT(b) FROM Branch b WHERE b.subarea.id = :subareaId AND b.active = true")
    long countActiveBranchesInSubarea(@Param("subareaId") Long subareaId);

    boolean existsByCode(String code);

    boolean existsByName(String name);

    boolean existsByCodeAndIdNot(String code, Long id);

    boolean existsByNameAndIdNot(String name, Long id);
}
