package com.example.callservice.service.callreport;

import com.example.callservice.dto.callreport.CallReportRequest;
import com.example.callservice.dto.callreport.CallReportSummaryResponse;
import com.example.callservice.entity.callreport.CallReport;
import com.example.callservice.entity.branch.Branch;
import com.example.callservice.repository.callreport.CallReportRepository;
import com.example.callservice.repository.callreport.CallReportSummaryProjection;
import com.example.callservice.repository.branch.BranchRepository;
import com.example.callservice.repository.userbranch.UserBranchRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger logger = LoggerFactory.getLogger(CallReportService.class);

    private final CallReportRepository callReportRepository;
    private final BranchRepository branchRepository;
    private final UserBranchRepository userBranchRepository;

    public CallReportService(CallReportRepository callReportRepository, BranchRepository branchRepository,
            UserBranchRepository userBranchRepository) {
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
                request.getCalledAt(),
                branch,
                createdBy,
                new HashMap<>(request.getEntries()));

        // Set arrivedAt if provided
        if (request.getArrivedAt() != null) {
            report.setArrivedAt(request.getArrivedAt());
        }

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
            // User has no branch assignments - allow them to see all data
            return listReports();
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

        report.setCalledAt(request.getCalledAt());
        report.setArrivedAt(request.getArrivedAt());
        report.setEntries(new HashMap<>(request.getEntries()));

        return callReportRepository.save(report);
    }

    public List<CallReportSummaryResponse> summarizeReports(
            LocalDate startDate,
            LocalDate endDate,
            List<Long> branchIds,
            List<Long> areaIds,
            List<Long> subareaIds,
            List<String> statusKeys) {

        // Use the original query that gets all data
        List<CallReportSummaryProjection> rows = callReportRepository.summarizeReports();

        // Apply filters in memory with corrected logic
        Map<String, CallReportSummaryResponse> grouped = new HashMap<>();
        for (CallReportSummaryProjection row : rows) {
            // Apply date filter
            if (startDate != null && row.getCalledAt().isBefore(startDate)) {
                continue;
            }
            if (endDate != null && row.getCalledAt().isAfter(endDate)) {
                continue;
            }

            // Apply branch filter - FIXED: Check for null and containment properly
            if (branchIds != null && !branchIds.isEmpty()) {
                if (row.getBranchId() == null || !branchIds.contains(row.getBranchId())) {
                    continue;
                }
            }

            // Apply area and sub-area filters by checking branch information
            if (areaIds != null && !areaIds.isEmpty() || subareaIds != null && !subareaIds.isEmpty()) {
                // Get branch information from database to check area/sub-area
                if (row.getBranchId() != null) {
                    Long branchAreaId = getBranchAreaId(row.getBranchId());
                    Long branchSubareaId = getBranchSubareaId(row.getBranchId());

                    // Apply area filter
                    if (areaIds != null && !areaIds.isEmpty()) {
                        if (branchAreaId == null || !areaIds.contains(branchAreaId)) {
                            continue;
                        }
                    }

                    // Apply sub-area filter
                    if (subareaIds != null && !subareaIds.isEmpty()) {
                        if (branchSubareaId == null || !subareaIds.contains(branchSubareaId)) {
                            continue;
                        }
                    }
                } else {
                    // If no branch ID and area/sub-area filters are applied, skip
                    continue;
                }
            }

            // Apply status filter
            if (statusKeys != null && !statusKeys.isEmpty()) {
                if (!statusKeys.contains(row.getStatusKey())) {
                    continue;
                }
            }

            String key = row.getCalledAt() + "|" + row.getBranchId();
            CallReportSummaryResponse summary = grouped.computeIfAbsent(key, ignored -> new CallReportSummaryResponse(
                    row.getCalledAt(),
                    row.getArrivedAt(),
                    row.getBranchId(),
                    row.getBranchName(),
                    new HashMap<>()));
            summary.getStatusTotals().put(row.getStatusKey(), row.getTotal());
        }

        return new ArrayList<>(grouped.values());
    }

    private Long getBranchAreaId(Long branchId) {
        try {
            return branchRepository.findAreaIdById(branchId);
        } catch (Exception e) {
            return null;
        }
    }

    private Long getBranchSubareaId(Long branchId) {
        try {
            return branchRepository.findSubareaIdById(branchId);
        } catch (Exception e) {
            return null;
        }
    }

}
