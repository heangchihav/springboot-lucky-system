package com.example.callservice.repository.area;

import com.example.callservice.entity.area.Area;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AreaRepository extends JpaRepository<Area, Long> {
    
    Optional<Area> findByCode(String code);
    
    Optional<Area> findByName(String name);
    
    List<Area> findByActive(Boolean active);
    
    @Query("SELECT a FROM Area a WHERE a.active = true ORDER BY a.name")
    List<Area> findActiveAreasOrderByName();
    
    @Query("SELECT a FROM Area a WHERE LOWER(a.name) LIKE LOWER(CONCAT('%', :name, '%')) AND a.active = true")
    List<Area> findActiveAreasByNameContaining(@Param("name") String name);
    
    @Query("SELECT COUNT(b) FROM Branch b WHERE b.area.id = :areaId AND b.active = true")
    long countActiveBranchesInArea(@Param("areaId") Long areaId);
    
    boolean existsByCode(String code);
    
    boolean existsByName(String name);
}
