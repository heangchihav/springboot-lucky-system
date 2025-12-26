package com.example.callservice.service.callreport;

import com.example.callservice.dto.callreport.CallReportRequest;
import com.example.callservice.entity.callreport.CallReport;
import com.example.callservice.entity.branch.Branch;
import com.example.callservice.repository.callreport.CallReportRepository;
import com.example.callservice.repository.branch.BranchRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;

@Service
public class CallReportService {

    private final CallReportRepository callReportRepository;
    private final BranchRepository branchRepository;

    public CallReportService(CallReportRepository callReportRepository, BranchRepository branchRepository) {
        this.callReportRepository = callReportRepository;
        this.branchRepository = branchRepository;
    }

    public CallReport saveReport(CallReportRequest request, String createdBy) {
        Branch branch = null;
        if (request.getBranchId() != null) {
            branch = branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new RuntimeException("Branch not found with id: " + request.getBranchId()));
        }
        
        CallReport report = new CallReport(
            request.getReportDate(),
            branch,
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
        
        if (request.getBranchId() != null) {
            Branch branch = branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new RuntimeException("Branch not found with id: " + request.getBranchId()));
            report.setBranch(branch);
        }
        
        report.setReportDate(request.getReportDate());
        report.setEntries(new HashMap<>(request.getEntries()));
        
        return callReportRepository.save(report);
    }
}
