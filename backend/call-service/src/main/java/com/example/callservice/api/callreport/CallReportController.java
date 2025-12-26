package com.example.callservice.api.callreport;

import com.example.callservice.dto.callreport.CallReportRequest;
import com.example.callservice.dto.callreport.CallReportResponse;
import com.example.callservice.entity.callreport.CallReport;
import com.example.callservice.service.callreport.CallReportService;
import com.example.callservice.api.base.BaseController;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/calls/reports")
public class CallReportController extends BaseController {

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

        List<CallReportResponse> response = callReportService.listReports().stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<CallReportResponse> createReport(@Valid @RequestBody CallReportRequest request, HttpServletRequest httpRequest) {
        ResponseEntity<CallReportResponse> permissionCheck = checkPermissionAndReturn(httpRequest, "menu.3.view");
        if (permissionCheck != null) {
            return permissionCheck;
        }

        Long userId = getCurrentUserId(httpRequest);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        CallReport saved = callReportService.saveReport(request, String.valueOf(userId));
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CallReportResponse> updateReport(@PathVariable Long id, @Valid @RequestBody CallReportRequest request, HttpServletRequest httpRequest) {
        ResponseEntity<CallReportResponse> permissionCheck = checkPermissionAndReturn(httpRequest, "menu.3.view");
        if (permissionCheck != null) {
            return permissionCheck;
        }

        try {
            CallReport updated = callReportService.updateReport(id, request);
            return ResponseEntity.ok(toResponse(updated));
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

    private CallReportResponse toResponse(CallReport callReport) {
        return new CallReportResponse(
            callReport.getId(),
            callReport.getReportDate(),
            callReport.getBranch() != null ? callReport.getBranch().getId() : null,
            callReport.getBranch() != null ? callReport.getBranch().getName() : "No Branch",
            callReport.getCreatedBy(),
            callReport.getCreatedAt(),
            callReport.getEntries()
        );
    }
}
