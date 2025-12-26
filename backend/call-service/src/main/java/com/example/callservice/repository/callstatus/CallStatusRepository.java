package com.example.callservice.repository.callstatus;

import com.example.callservice.entity.callstatus.CallStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Repository
public interface CallStatusRepository extends JpaRepository<CallStatus, Long> {

    Optional<CallStatus> findByKey(String key);

    boolean existsByKey(String key);

    @Modifying
    @Transactional
    void deleteByKey(String key);
}
