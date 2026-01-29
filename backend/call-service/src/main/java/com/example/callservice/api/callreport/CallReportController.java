package com.example.callservice.api.callreport;

import com.example.callservice.dto.callreport.CallReportRequest;
import com.example.callservice.dto.callreport.CallReportResponse;
import com.example.callservice.dto.callreport.CallReportSummaryResponse;
import com.example.callservice.entity.callreport.CallReport;
import com.example.callservice.service.callreport.CallReportService;
import com.example.callservice.api.base.BaseController;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.format.annotation.DateTimeFormat;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/calls/reports")
public class CallReportController extends BaseController {

    private static final Logger logger = LoggerFactory.getLogger(CallReportController.class);

    private final CallReportService callReportService;

    public CallReportController(CallReportService callReportService) {
        this.callReportService = callReportService;
    }

    @GetMapping
    public ResponseEntity<List<CallReportResponse>> listReports(HttpServletRequest request) {
        ResponseEntity<List<CallReportResponse>> permissionCheck = checkPermissionAndReturn(request, "menu.3.view");
        if (permissionCheck != null) {
            return permissionCheck;
        }

        Long userId = getCurrentUserId(request);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<CallReport> reports = callReportService.listReportsForUser(userId, isRootUser(userId));
        Map<String, String> creatorNames = resolveCreatorNames(reports);

        List<CallReportResponse> response = reports.stream()
                .map(report -> toResponse(report, creatorNames))
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/summary")
    public ResponseEntity<List<CallReportSummaryResponse>> summarizeReports(
            HttpServletRequest request,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) List<Long> branchIds,
            @RequestParam(required = false) List<Long> areaIds,
            @RequestParam(required = false) List<Long> subareaIds,
            @RequestParam(required = false) List<String> statusKeys) {
        ResponseEntity<List<CallReportSummaryResponse>> permissionCheck = checkPermissionAndReturn(request,
                "menu.3.view");
        if (permissionCheck != null) {
            return permissionCheck;
        }

        Long userId = getCurrentUserId(request);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        boolean isRootUser = isRootUser(userId);
        List<Long> effectiveBranchIds = null;

        if (!isRootUser) {
            List<Long> accessibleBranchIds = callReportService.findAccessibleBranchIdsForUser(userId);
            // If user has no branch assignments, allow them to see all data they request
            if (accessibleBranchIds.isEmpty()) {
                // User has no assignments - allow access to any branch they request
                effectiveBranchIds = branchIds; // Pass through the user's selection
            } else {
                // User has assignments - restrict to their assigned branches
                if (branchIds != null && !branchIds.isEmpty()) {
                    effectiveBranchIds = branchIds.stream()
                            .filter(accessibleBranchIds::contains)
                            .collect(Collectors.toList());
                    if (effectiveBranchIds.isEmpty()) {
                        return ResponseEntity.ok(List.of());
                    }
                } else {
                    effectiveBranchIds = accessibleBranchIds;
                }
            }
        } else if (branchIds != null && !branchIds.isEmpty()) {
            effectiveBranchIds = branchIds;
        }

        List<String> effectiveStatusKeys = (statusKeys == null || statusKeys.isEmpty()) ? null : statusKeys;

        List<CallReportSummaryResponse> summaries = callReportService.summarizeReports(
                startDate,
                endDate,
                effectiveBranchIds,
                areaIds,
                subareaIds,
                effectiveStatusKeys);

        return ResponseEntity.ok(summaries);
    }

    @PostMapping
    public ResponseEntity<CallReportResponse> createReport(@Valid @RequestBody CallReportRequest request,
            HttpServletRequest httpRequest) {
        ResponseEntity<CallReportResponse> permissionCheck = checkPermissionAndReturn(httpRequest, "menu.3.view");
        if (permissionCheck != null) {
            return permissionCheck;
        }

        Long userId = getCurrentUserId(httpRequest);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        CallReport saved = callReportService.saveReport(request, String.valueOf(userId));
        Map<String, String> creatorNames = resolveCreatorNames(List.of(saved));
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(saved, creatorNames));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CallReportResponse> updateReport(@PathVariable Long id,
            @Valid @RequestBody CallReportRequest request, HttpServletRequest httpRequest) {
        ResponseEntity<CallReportResponse> permissionCheck = checkPermissionAndReturn(httpRequest, "menu.3.view");
        if (permissionCheck != null) {
            return permissionCheck;
        }

        try {
            CallReport updated = callReportService.updateReport(id, request);
            Map<String, String> creatorNames = resolveCreatorNames(List.of(updated));
            return ResponseEntity.ok(toResponse(updated, creatorNames));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReport(@PathVariable Long id, HttpServletRequest request) {
        ResponseEntity<Void> permissionCheck = checkPermissionAndReturn(request, "menu.3.view");
        if (permissionCheck != null) {
            return permissionCheck;
        }

        try {
            callReportService.deleteReport(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private CallReportResponse toResponse(CallReport callReport, Map<String, String> creatorNames) {
        return new CallReportResponse(
                callReport.getId(),
                callReport.getCalledAt(),
                callReport.getArrivedAt(),
                callReport.getBranch() != null ? callReport.getBranch().getId() : null,
                callReport.getBranch() != null ? callReport.getBranch().getName() : "No Branch",
                creatorNames.getOrDefault(callReport.getCreatedBy(), callReport.getCreatedBy()),
                callReport.getCreatedAt(),
                callReport.getEntriesAsMap(),
                callReport.getRemarksAsMap(),
                callReport.getRemark());
    }

    private Map<String, String> resolveCreatorNames(List<CallReport> reports) {
        Map<String, String> names = new HashMap<>();
        for (CallReport report : reports) {
            String creatorId = report.getCreatedBy();
            if (creatorId == null || creatorId.isBlank() || names.containsKey(creatorId)) {
                continue;
            }
            names.put(creatorId, fetchUsernameForCreator(creatorId));
        }
        return names;
    }

    private String fetchUsernameForCreator(String creatorId) {
        if (creatorId == null || creatorId.isBlank()) {
            return "Unknown";
        }
        try {
            Long userId = Long.valueOf(creatorId);
            String url = userServiceUrl + "/api/users/" + userId + "/username";
            String username = restTemplate.getForObject(url, String.class);
            if (username != null && !username.isBlank()) {
                return username;
            }
        } catch (Exception ex) {
            logger.warn("Failed to resolve username for creator {}: {}", creatorId, ex.getMessage());
        }
        return creatorId;
    }
}
