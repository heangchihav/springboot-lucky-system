package com.example.callservice.repository;

import com.example.callservice.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByUsername(String username);
    
    Optional<User> findByEmail(String email);
    
    List<User> findByActive(Boolean active);
    
    @Query("SELECT u FROM User u WHERE u.active = true ORDER BY u.firstName, u.lastName")
    List<User> findActiveUsersOrderByFullName();
    
    @Query("SELECT u FROM User u WHERE LOWER(u.firstName) LIKE LOWER(CONCAT('%', :name, '%')) OR LOWER(u.lastName) LIKE LOWER(CONCAT('%', :name, '%')) AND u.active = true")
    List<User> findActiveUsersByNameContaining(@Param("name") String name);
    
    @Query("SELECT u FROM User u WHERE LOWER(u.username) LIKE LOWER(CONCAT('%', :username, '%')) AND u.active = true")
    List<User> findActiveUsersByUsernameContaining(@Param("username") String username);
    
    @Query("SELECT u FROM User u JOIN u.userBranches ub WHERE ub.branch.id = :branchId AND ub.active = true AND u.active = true")
    List<User> findActiveUsersByBranch(@Param("branchId") Long branchId);
    
    @Query("SELECT u FROM User u JOIN u.userBranches ub WHERE ub.branch.area.id = :areaId AND ub.active = true AND u.active = true")
    List<User> findActiveUsersByArea(@Param("areaId") Long areaId);
    
    boolean existsByUsername(String username);
    
    boolean existsByEmail(String email);
}
