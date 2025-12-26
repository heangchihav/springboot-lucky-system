package com.example.callservice.service;

import com.example.callservice.dto.CallStatusRequest;
import com.example.callservice.entity.CallStatus;
import com.example.callservice.repository.CallStatusRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CallStatusService {

    private final CallStatusRepository callStatusRepository;

    public CallStatusService(CallStatusRepository callStatusRepository) {
        this.callStatusRepository = callStatusRepository;
    }

    public List<CallStatus> getAllStatuses() {
        return callStatusRepository.findAll();
    }

    public CallStatus createStatus(CallStatusRequest request, String createdBy) {
        if (callStatusRepository.existsByKey(request.getKey())) {
            throw new IllegalArgumentException("Status with key already exists");
        }

        CallStatus callStatus = new CallStatus(request.getKey(), request.getLabel(), createdBy);
        return callStatusRepository.save(callStatus);
    }

    @Transactional
    public CallStatus updateStatus(String key, CallStatusRequest request) {
        CallStatus status = callStatusRepository.findByKey(key)
            .orElseThrow(() -> new IllegalArgumentException("Status not found"));

        status.setLabel(request.getLabel());
        return callStatusRepository.save(status);
    }

    @Transactional
    public void deleteStatus(String key) {
        if (!callStatusRepository.existsByKey(key)) {
            throw new IllegalArgumentException("Status not found");
        }
        callStatusRepository.deleteByKey(key);
    }
}
