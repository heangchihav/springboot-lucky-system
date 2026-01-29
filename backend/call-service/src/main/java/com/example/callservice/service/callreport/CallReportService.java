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
    private static final List<Long> NO_FILTER_LONG_SENTINEL = List.of(-1L);
    private static final List<String> NO_FILTER_STRING_SENTINEL = List.of("__NO_STATUS__");

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

        CallReport report = new CallReport();
        report.setCalledAt(request.getCalledAt());
        report.setBranch(branch);
        report.setCreatedBy(createdBy);

        // Set arrivedAt if provided
        if (request.getArrivedAt() != null) {
            report.setArrivedAt(request.getArrivedAt());
        }

        // Set entries and remarks
        report.setEntriesFromMap(request.getEntries(), request.getRemarks());

        // Set record-level remark
        report.setRemark(request.getRemark());

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
        report.setEntriesFromMap(request.getEntries(), request.getRemarks());
        report.setRemark(request.getRemark());

        return callReportRepository.save(report);
    }

    public List<CallReportSummaryResponse> summarizeReports(
            LocalDate startDate,
            LocalDate endDate,
            List<Long> branchIds,
            List<Long> areaIds,
            List<Long> subareaIds,
            List<String> statusKeys) {

        List<Long> safeBranchIds = (branchIds == null || branchIds.isEmpty()) ? null : branchIds;
        List<Long> safeAreaIds = (areaIds == null || areaIds.isEmpty()) ? null : areaIds;
        List<Long> safeSubareaIds = (subareaIds == null || subareaIds.isEmpty()) ? null : subareaIds;
        List<String> safeStatusKeys = (statusKeys == null || statusKeys.isEmpty()) ? null : statusKeys;

        boolean filterByBranch = safeBranchIds != null;
        boolean filterByArea = safeAreaIds != null;
        boolean filterBySubarea = safeSubareaIds != null;
        boolean filterByStatus = safeStatusKeys != null;
        boolean filterByStartDate = startDate != null;
        boolean filterByEndDate = endDate != null;

        List<CallReportSummaryProjection> rows = callReportRepository.summarizeReportsWithFilters(
                startDate,
                endDate,
                filterByStartDate,
                filterByEndDate,
                filterByBranch,
                filterByBranch ? safeBranchIds : NO_FILTER_LONG_SENTINEL,
                filterByArea,
                filterByArea ? safeAreaIds : NO_FILTER_LONG_SENTINEL,
                filterBySubarea,
                filterBySubarea ? safeSubareaIds : NO_FILTER_LONG_SENTINEL,
                filterByStatus,
                filterByStatus ? safeStatusKeys : NO_FILTER_STRING_SENTINEL);

        Map<String, CallReportSummaryResponse> grouped = new HashMap<>();
        for (CallReportSummaryProjection row : rows) {
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

}
