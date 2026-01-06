package com.example.marketingservice.repository.problem;

import com.example.marketingservice.entity.problem.MarketingProblem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MarketingProblemRepository extends JpaRepository<MarketingProblem, Long> {

    @Query("SELECT p FROM MarketingProblem p ORDER BY p.createdAt DESC")
    List<MarketingProblem> findAllOrderByCreatedAtDesc();

    @Query("SELECT p FROM MarketingProblem p WHERE LOWER(p.name) LIKE LOWER(CONCAT('%', :name, '%')) ORDER BY p.createdAt DESC")
    List<MarketingProblem> findByNameContainingIgnoreCase(@Param("name") String name);

    Optional<MarketingProblem> findByName(String name);

    boolean existsByName(String name);
}
