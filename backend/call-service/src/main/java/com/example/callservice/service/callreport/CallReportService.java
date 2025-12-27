package com.example.callservice.service.callreport;

import com.example.callservice.dto.callreport.CallReportRequest;
import com.example.callservice.dto.callreport.CallReportSummaryResponse;
import com.example.callservice.entity.callreport.CallReport;
import com.example.callservice.entity.branch.Branch;
import com.example.callservice.repository.callreport.CallReportRepository;
import com.example.callservice.repository.callreport.CallReportSummaryProjection;
import com.example.callservice.repository.branch.BranchRepository;
import com.example.callservice.repository.userbranch.UserBranchRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CallReportService {

    private final CallReportRepository callReportRepository;
    private final BranchRepository branchRepository;
    private final UserBranchRepository userBranchRepository;

    public CallReportService(CallReportRepository callReportRepository, BranchRepository branchRepository, UserBranchRepository userBranchRepository) {
        this.callReportRepository = callReportRepository;
        this.branchRepository = branchRepository;
        this.userBranchRepository = userBranchRepository;
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

    public List<CallReport> listReportsForUser(Long userId, boolean isRootUser) {
        if (isRootUser) {
            return listReports();
        }

        if (userId == null) {
            throw new IllegalArgumentException("User id is required to list reports");
        }

        List<Long> branchIds = userBranchRepository.findActiveUserBranchesByUserId(userId).stream()
            .map(userBranch -> userBranch.getBranch().getId())
            .collect(Collectors.toList());

        if (branchIds.isEmpty()) {
            return callReportRepository.findByCreatedByOrderByCreatedAtDesc(String.valueOf(userId));
        }

        return callReportRepository.findByBranch_IdInOrderByCreatedAtDesc(branchIds);
    }

    public List<Long> findAccessibleBranchIdsForUser(Long userId) {
        if (userId == null) {
            return List.of();
        }

        return userBranchRepository.findActiveUserBranchesByUserId(userId).stream()
            .map(userBranch -> userBranch.getBranch().getId())
            .collect(Collectors.toList());
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

    public List<CallReportSummaryResponse> summarizeReports(
        LocalDate startDate,
        LocalDate endDate,
        List<Long> branchIds,
        List<String> statusKeys
    ) {
        List<CallReportSummaryProjection> rows = callReportRepository.summarizeReports();

        Map<String, CallReportSummaryResponse> grouped = new HashMap<>();
        for (CallReportSummaryProjection row : rows) {
            if (!isWithinDateRange(row.getReportDate(), startDate, endDate)) {
                continue;
            }

            if (!matchesBranch(row.getBranchId(), branchIds)) {
                continue;
            }

            if (!matchesStatus(row.getStatusKey(), statusKeys)) {
                continue;
            }

            String key = row.getReportDate() + "|" + row.getBranchId();
            CallReportSummaryResponse summary = grouped.computeIfAbsent(key, ignored -> new CallReportSummaryResponse(
                row.getReportDate(),
                row.getBranchId(),
                row.getBranchName(),
                new HashMap<>()
            ));
            summary.getStatusTotals().put(row.getStatusKey(), row.getTotal());
        }
        return new ArrayList<>(grouped.values());
    }

    private boolean isWithinDateRange(LocalDate date, LocalDate startDate, LocalDate endDate) {
        if (date == null) {
            return false;
        }
        if (startDate != null && date.isBefore(startDate)) {
            return false;
        }
        if (endDate != null && date.isAfter(endDate)) {
            return false;
        }
        return true;
    }

    private boolean matchesBranch(Long branchId, List<Long> branchIds) {
        if (branchIds == null || branchIds.isEmpty()) {
            return true;
        }
        if (branchId == null) {
            return false;
        }
        return branchIds.contains(branchId);
    }

    private boolean matchesStatus(String statusKey, List<String> statusKeys) {
        if (statusKeys == null || statusKeys.isEmpty()) {
            return true;
        }
        return statusKeys.contains(statusKey);
    }
}
