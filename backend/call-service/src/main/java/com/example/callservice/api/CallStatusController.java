package com.example.callservice.api;

import com.example.callservice.dto.CallStatusRequest;
import com.example.callservice.dto.CallStatusResponse;
import com.example.callservice.entity.CallStatus;
import com.example.callservice.service.CallStatusService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/calls/statuses")
public class CallStatusController extends BaseController {

    private final CallStatusService callStatusService;

    public CallStatusController(CallStatusService callStatusService) {
        this.callStatusService = callStatusService;
    }

    @GetMapping
    public ResponseEntity<List<CallStatusResponse>> listStatuses(HttpServletRequest request) {
        ResponseEntity<List<CallStatusResponse>> permissionCheck = checkPermissionAndReturn(request, "menu.3.view");
        if (permissionCheck != null) {
            return permissionCheck;
        }

        List<CallStatusResponse> response = callStatusService.getAllStatuses().stream()
            .map(this::valueToResponse)
            .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<CallStatusResponse> createStatus(@Valid @RequestBody CallStatusRequest requestBody, HttpServletRequest request) {
        ResponseEntity<CallStatusResponse> permissionCheck = checkPermissionAndReturn(request, "menu.3.view");
        if (permissionCheck != null) {
            return permissionCheck;
        }

        Long userId = getCurrentUserId(request);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            CallStatus status = callStatusService.createStatus(requestBody, String.valueOf(userId));
            return ResponseEntity.status(HttpStatus.CREATED).body(valueToResponse(status));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{key}")
    public ResponseEntity<CallStatusResponse> updateStatus(@PathVariable String key, @Valid @RequestBody CallStatusRequest requestBody, HttpServletRequest request) {
        ResponseEntity<CallStatusResponse> permissionCheck = checkPermissionAndReturn(request, "menu.3.view");
        if (permissionCheck != null) {
            return permissionCheck;
        }

        try {
            CallStatus updated = callStatusService.updateStatus(key, requestBody);
            return ResponseEntity.ok(valueToResponse(updated));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{key}")
    public ResponseEntity<Void> deleteStatus(@PathVariable String key, HttpServletRequest request) {
        ResponseEntity<Void> permissionCheck = checkPermissionAndReturn(request, "menu.3.view");
        if (permissionCheck != null) {
            return permissionCheck;
        }

        try {
            callStatusService.deleteStatus(key);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.notFound().build();
        }
    }

    private CallStatusResponse valueToResponse(CallStatus status) {
        return new CallStatusResponse(
            status.getKey(),
            status.getLabel(),
            status.getCreatedBy(),
            status.getCreatedAt()
        );
    }
}
