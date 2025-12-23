package com.example.demo.service;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserServiceRepository extends JpaRepository<UserServiceEntity, Long> {

    Optional<UserServiceEntity> findByCode(String code);

    boolean existsByCode(String code);

    List<UserServiceEntity> findByActiveTrue();

    List<UserServiceEntity> findByActiveFalse();

    @Query("SELECT s FROM UserServiceEntity s WHERE s.name LIKE %:name%")
    List<UserServiceEntity> findByNameContaining(@Param("name") String name);

    @Query("SELECT s FROM UserServiceEntity s WHERE s.active = true ORDER BY s.name")
    List<UserServiceEntity> findActiveServicesOrderByName();

    @Query("SELECT COUNT(s) FROM UserServiceEntity s WHERE s.active = true")
    long countActiveServices();
}
