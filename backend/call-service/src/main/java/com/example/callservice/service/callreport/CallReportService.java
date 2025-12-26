package com.example.callservice.service.callreport;

import com.example.callservice.dto.callreport.CallReportRequest;
import com.example.callservice.entity.callreport.CallReport;
import com.example.callservice.repository.callreport.CallReportRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;

@Service
public class CallReportService {

    private final CallReportRepository callReportRepository;

    public CallReportService(CallReportRepository callReportRepository) {
        this.callReportRepository = callReportRepository;
    }

    public CallReport saveReport(CallReportRequest request, String createdBy) {
        CallReport report = new CallReport(
            request.getReportDate(),
            createdBy,
            new HashMap<>(request.getEntries())
        );
        return callReportRepository.save(report);
    }

    public List<CallReport> listReports() {
        return callReportRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    public void deleteReport(Long id) {
        if (!callReportRepository.existsById(id)) {
            throw new RuntimeException("Report not found with id: " + id);
        }
        callReportRepository.deleteById(id);
    }

    public CallReport updateReport(Long id, CallReportRequest request) {
        CallReport report = callReportRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Report not found with id: " + id));
        
        report.setReportDate(request.getReportDate());
        report.setEntries(new HashMap<>(request.getEntries()));
        
        return callReportRepository.save(report);
    }
}
