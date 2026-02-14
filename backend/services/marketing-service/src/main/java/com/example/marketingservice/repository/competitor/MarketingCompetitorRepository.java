package com.example.marketingservice.repository.competitor;

import com.example.marketingservice.entity.competitor.MarketingCompetitor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MarketingCompetitorRepository extends JpaRepository<MarketingCompetitor, Long> {

    @Query("SELECT c FROM MarketingCompetitor c ORDER BY c.createdAt DESC")
    List<MarketingCompetitor> findAllOrderByCreatedAtDesc();

    @Query("SELECT c FROM MarketingCompetitor c WHERE LOWER(c.name) LIKE LOWER(CONCAT('%', :name, '%')) ORDER BY c.createdAt DESC")
    List<MarketingCompetitor> findByNameContainingIgnoreCase(@Param("name") String name);

    Optional<MarketingCompetitor> findByName(String name);

    boolean existsByName(String name);
}
