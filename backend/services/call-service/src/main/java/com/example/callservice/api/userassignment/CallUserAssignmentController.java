package com.example.callservice.api.userassignment;

import com.example.callservice.entity.userassignment.CallUserAssignment;
import com.example.callservice.service.userassignment.CallUserAssignmentService;
import com.example.callservice.api.base.BaseController;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/calls/user-assignments")
public class CallUserAssignmentController extends BaseController {

    @Autowired
    private CallUserAssignmentService assignmentService;

    @GetMapping
    public ResponseEntity<List<CallUserAssignment>> getAllAssignments(HttpServletRequest request) {
        ResponseEntity<List<CallUserAssignment>> permissionCheck = checkPermissionAndReturn(request,
                "user.branch.view");
        if (permissionCheck != null) {
            return permissionCheck;
        }

        List<CallUserAssignment> assignments = assignmentService.getAllAssignments();
        return ResponseEntity.ok(assignments);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<CallUserAssignment>> getAssignmentsByUserId(
            @PathVariable Long userId,
            HttpServletRequest request) {
        ResponseEntity<List<CallUserAssignment>> permissionCheck = checkPermissionAndReturn(request,
                "user.branch.view");
        if (permissionCheck != null) {
            return permissionCheck;
        }

        List<CallUserAssignment> assignments = assignmentService.getAssignmentsByUserId(userId);
        return ResponseEntity.ok(assignments);
    }

    @GetMapping("/user/{userId}/active")
    public ResponseEntity<List<CallUserAssignment>> getActiveAssignmentsByUserId(
            @PathVariable Long userId,
            HttpServletRequest request) {
        ResponseEntity<List<CallUserAssignment>> permissionCheck = checkPermissionAndReturn(request,
                "user.branch.view");
        if (permissionCheck != null) {
            return permissionCheck;
        }

        List<CallUserAssignment> assignments = assignmentService.getActiveAssignmentsByUserId(userId);
        return ResponseEntity.ok(assignments);
    }

    @GetMapping("/area/{areaId}")
    public ResponseEntity<List<CallUserAssignment>> getActiveAssignmentsByAreaId(
            @PathVariable Long areaId,
            HttpServletRequest request) {
        ResponseEntity<List<CallUserAssignment>> permissionCheck = checkPermissionAndReturn(request, "area.view");
        if (permissionCheck != null) {
            return permissionCheck;
        }

        List<CallUserAssignment> assignments = assignmentService.getActiveAssignmentsByAreaId(areaId);
        return ResponseEntity.ok(assignments);
    }

    @GetMapping("/subarea/{subAreaId}")
    public ResponseEntity<List<CallUserAssignment>> getActiveAssignmentsBySubAreaId(
            @PathVariable Long subAreaId,
            HttpServletRequest request) {
        ResponseEntity<List<CallUserAssignment>> permissionCheck = checkPermissionAndReturn(request, "subarea.view");
        if (permissionCheck != null) {
            return permissionCheck;
        }

        List<CallUserAssignment> assignments = assignmentService.getActiveAssignmentsBySubAreaId(subAreaId);
        return ResponseEntity.ok(assignments);
    }

    @GetMapping("/branch/{branchId}")
    public ResponseEntity<List<CallUserAssignment>> getActiveAssignmentsByBranchId(
            @PathVariable Long branchId,
            HttpServletRequest request) {
        ResponseEntity<List<CallUserAssignment>> permissionCheck = checkPermissionAndReturn(request, "branch.view");
        if (permissionCheck != null) {
            return permissionCheck;
        }

        List<CallUserAssignment> assignments = assignmentService.getActiveAssignmentsByBranchId(branchId);
        return ResponseEntity.ok(assignments);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CallUserAssignment> getAssignmentById(
            @PathVariable Long id,
            HttpServletRequest request) {
        ResponseEntity<CallUserAssignment> permissionCheck = checkPermissionAndReturn(request, "user.branch.view");
        if (permissionCheck != null) {
            return permissionCheck;
        }

        return assignmentService.getAssignmentById(id)
                .map(assignment -> ResponseEntity.ok(assignment))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/area")
    public ResponseEntity<CallUserAssignment> assignUserToArea(
            @RequestParam Long userId,
            @RequestParam Long areaId,
            HttpServletRequest request) {
        ResponseEntity<CallUserAssignment> permissionCheck = checkPermissionAndReturn(request, "user.branch.assign");
        if (permissionCheck != null) {
            return permissionCheck;
        }

        try {
            CallUserAssignment assignment = assignmentService.assignUserToArea(userId, areaId);
            return ResponseEntity.status(HttpStatus.CREATED).body(assignment);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/subarea")
    public ResponseEntity<CallUserAssignment> assignUserToSubArea(
            @RequestParam Long userId,
            @RequestParam Long subAreaId,
            HttpServletRequest request) {
        ResponseEntity<CallUserAssignment> permissionCheck = checkPermissionAndReturn(request, "user.branch.assign");
        if (permissionCheck != null) {
            return permissionCheck;
        }

        try {
            CallUserAssignment assignment = assignmentService.assignUserToSubArea(userId, subAreaId);
            return ResponseEntity.status(HttpStatus.CREATED).body(assignment);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/branch")
    public ResponseEntity<CallUserAssignment> assignUserToBranch(
            @RequestParam Long userId,
            @RequestParam Long branchId,
            HttpServletRequest request) {
        ResponseEntity<CallUserAssignment> permissionCheck = checkPermissionAndReturn(request, "user.branch.assign");
        if (permissionCheck != null) {
            return permissionCheck;
        }

        try {
            CallUserAssignment assignment = assignmentService.assignUserToBranch(userId, branchId);
            return ResponseEntity.status(HttpStatus.CREATED).body(assignment);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/areas/bulk")
    public ResponseEntity<List<CallUserAssignment>> assignUserToMultipleAreas(
            @RequestParam Long userId,
            @RequestBody List<Long> areaIds,
            HttpServletRequest request) {
        ResponseEntity<List<CallUserAssignment>> permissionCheck = checkPermissionAndReturn(request,
                "user.branch.assign");
        if (permissionCheck != null) {
            return permissionCheck;
        }

        try {
            List<CallUserAssignment> assignments = assignmentService.assignUserToMultipleAreas(userId, areaIds);
            return ResponseEntity.status(HttpStatus.CREATED).body(assignments);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/subareas/bulk")
    public ResponseEntity<List<CallUserAssignment>> assignUserToMultipleSubAreas(
            @RequestParam Long userId,
            @RequestBody List<Long> subAreaIds,
            HttpServletRequest request) {
        ResponseEntity<List<CallUserAssignment>> permissionCheck = checkPermissionAndReturn(request,
                "user.branch.assign");
        if (permissionCheck != null) {
            return permissionCheck;
        }

        try {
            List<CallUserAssignment> assignments = assignmentService.assignUserToMultipleSubAreas(userId, subAreaIds);
            return ResponseEntity.status(HttpStatus.CREATED).body(assignments);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/branches/bulk")
    public ResponseEntity<List<CallUserAssignment>> assignUserToMultipleBranches(
            @RequestParam Long userId,
            @RequestBody List<Long> branchIds,
            HttpServletRequest request) {
        ResponseEntity<List<CallUserAssignment>> permissionCheck = checkPermissionAndReturn(request,
                "user.branch.assign");
        if (permissionCheck != null) {
            return permissionCheck;
        }

        try {
            List<CallUserAssignment> assignments = assignmentService.assignUserToMultipleBranches(userId, branchIds);
            return ResponseEntity.status(HttpStatus.CREATED).body(assignments);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<CallUserAssignment> deactivateAssignment(
            @PathVariable Long id,
            @RequestParam Long userId,
            HttpServletRequest request) {
        ResponseEntity<CallUserAssignment> permissionCheck = checkPermissionAndReturn(request, "user.branch.assign");
        if (permissionCheck != null) {
            return permissionCheck;
        }

        try {
            CallUserAssignment assignment = assignmentService.removeUserAssignment(userId, id);
            return ResponseEntity.ok(assignment);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAssignment(
            @PathVariable Long id,
            HttpServletRequest request) {
        ResponseEntity<Void> permissionCheck = checkPermissionAndReturn(request, "user.branch.delete");
        if (permissionCheck != null) {
            return permissionCheck;
        }

        try {
            assignmentService.deleteAssignment(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/user/{userId}/all")
    public ResponseEntity<List<CallUserAssignment>> removeAllAssignmentsForUser(
            @PathVariable Long userId,
            HttpServletRequest request) {
        ResponseEntity<List<CallUserAssignment>> permissionCheck = checkPermissionAndReturn(request,
                "user.branch.assign");
        if (permissionCheck != null) {
            return permissionCheck;
        }

        List<CallUserAssignment> deactivatedAssignments = assignmentService.removeAllAssignmentsForUser(userId);
        return ResponseEntity.ok(deactivatedAssignments);
    }

    @GetMapping("/count/user/{userId}")
    public ResponseEntity<Long> countActiveAssignmentsByUserId(
            @PathVariable Long userId,
            HttpServletRequest request) {
        ResponseEntity<Long> permissionCheck = checkPermissionAndReturn(request, "user.branch.view");
        if (permissionCheck != null) {
            return permissionCheck;
        }

        long count = assignmentService.countActiveAssignmentsByUserId(userId);
        return ResponseEntity.ok(count);
    }

    @GetMapping("/count/area/{areaId}")
    public ResponseEntity<Long> countActiveAssignmentsByAreaId(
            @PathVariable Long areaId,
            HttpServletRequest request) {
        ResponseEntity<Long> permissionCheck = checkPermissionAndReturn(request, "area.view");
        if (permissionCheck != null) {
            return permissionCheck;
        }

        long count = assignmentService.countActiveAssignmentsByAreaId(areaId);
        return ResponseEntity.ok(count);
    }

    @GetMapping("/count/subarea/{subAreaId}")
    public ResponseEntity<Long> countActiveAssignmentsBySubAreaId(
            @PathVariable Long subAreaId,
            HttpServletRequest request) {
        ResponseEntity<Long> permissionCheck = checkPermissionAndReturn(request, "subarea.view");
        if (permissionCheck != null) {
            return permissionCheck;
        }

        long count = assignmentService.countActiveAssignmentsBySubAreaId(subAreaId);
        return ResponseEntity.ok(count);
    }

    @GetMapping("/count/branch/{branchId}")
    public ResponseEntity<Long> countActiveAssignmentsByBranchId(
            @PathVariable Long branchId,
            HttpServletRequest request) {
        ResponseEntity<Long> permissionCheck = checkPermissionAndReturn(request, "branch.view");
        if (permissionCheck != null) {
            return permissionCheck;
        }

        long count = assignmentService.countActiveAssignmentsByBranchId(branchId);
        return ResponseEntity.ok(count);
    }
}
