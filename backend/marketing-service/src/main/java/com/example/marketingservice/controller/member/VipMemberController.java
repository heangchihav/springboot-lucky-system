package com.example.marketingservice.controller.member;

import com.example.marketingservice.controller.base.BaseController;
import com.example.marketingservice.dto.member.VipMemberDashboardResponse;
import com.example.marketingservice.dto.member.VipMemberPaginatedResponse;
import com.example.marketingservice.dto.member.PaginatedVipMemberResponse;
import com.example.marketingservice.dto.member.VipMemberRequest;
import com.example.marketingservice.dto.member.VipMemberResponse;
import com.example.marketingservice.entity.member.VipMember;
import com.example.marketingservice.service.member.VipMemberService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/marketing/vip-members")
public class VipMemberController extends BaseController {

    private final VipMemberService vipMemberService;

    public VipMemberController(VipMemberService vipMemberService) {
        this.vipMemberService = vipMemberService;
    }

    @GetMapping
    public List<VipMemberResponse> list(@RequestParam(required = false) Long areaId,
            @RequestParam(required = false) Long subAreaId,
            @RequestParam(required = false) Long branchId,
            HttpServletRequest httpRequest) {
        checkPermission(httpRequest, "member.view");
        Long userId = requireUserId(httpRequest);
        return vipMemberService.findAllForUser(userId, areaId, subAreaId, branchId)
                .stream()
                .map(VipMemberResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public VipMemberResponse get(@PathVariable Long id, HttpServletRequest httpRequest) {
        checkPermission(httpRequest, "member.view");
        return VipMemberResponse.fromEntity(vipMemberService.getById(id));
    }

    @PostMapping
    public ResponseEntity<List<VipMemberResponse>> create(@Valid @RequestBody List<VipMemberRequest> requests,
            HttpServletRequest httpRequest) {
        checkPermission(httpRequest, "member.create");
        Long creatorId = requireUserId(httpRequest);
        List<VipMember> createdMembers = vipMemberService.createBatch(requests, creatorId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(createdMembers.stream()
                        .map(VipMemberResponse::fromEntity)
                        .collect(Collectors.toList()));
    }

    @PutMapping("/{id}")
    public VipMemberResponse update(@PathVariable Long id,
            @Valid @RequestBody VipMemberRequest request,
            HttpServletRequest httpRequest) {
        checkPermission(httpRequest, "member.edit");
        Long userId = requireUserId(httpRequest);
        return VipMemberResponse.fromEntity(vipMemberService.update(id, request, userId));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, HttpServletRequest httpRequest) {
        checkPermission(httpRequest, "member.delete");
        Long userId = requireUserId(httpRequest);
        vipMemberService.delete(id, userId);
    }

    @GetMapping("/dashboard")
    public VipMemberDashboardResponse getDashboard(
            @RequestParam(required = false) Long areaId,
            @RequestParam(required = false) Long subAreaId,
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            HttpServletRequest httpRequest) {
        checkPermission(httpRequest, "member.view");
        Long userId = requireUserId(httpRequest);
        return vipMemberService.getDashboardData(userId, areaId, subAreaId, branchId, startDate, endDate);
    }

    @GetMapping("/paginated")
    public Page<VipMember> getPaginatedMembers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Long areaId,
            @RequestParam(required = false) Long subAreaId,
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            HttpServletRequest httpRequest) {
        checkPermission(httpRequest, "member.view");
        Long userId = requireUserId(httpRequest);
        return vipMemberService.getPaginatedMembers(userId, page, size, areaId, subAreaId, branchId, startDate,
                endDate);
    }

    @GetMapping("/all-members-optimized")
    public ResponseEntity<List<VipMemberPaginatedResponse>> getAllMembersOptimized(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) Long areaId,
            @RequestParam(required = false) Long subAreaId,
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            HttpServletRequest httpRequest) {
        checkPermission(httpRequest, "member.view");
        Long userId = requireUserId(httpRequest);

        List<VipMember> members = vipMemberService.getAllMembersOptimized(userId, page, size, areaId, subAreaId,
                branchId, startDate, endDate);
        List<VipMemberPaginatedResponse> response = members.stream()
                .map(VipMemberPaginatedResponse::fromEntity)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/all-members")
    public Page<VipMember> getAllMembers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) Long areaId,
            @RequestParam(required = false) Long subAreaId,
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            HttpServletRequest httpRequest) {
        checkPermission(httpRequest, "member.view");
        Long userId = requireUserId(httpRequest);
        return vipMemberService.getAllMembers(userId, page, size, areaId, subAreaId, branchId, startDate, endDate);
    }

    @GetMapping("/all-members-paginated")
    public PaginatedVipMemberResponse getAllMembersPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) Long areaId,
            @RequestParam(required = false) Long subAreaId,
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            HttpServletRequest httpRequest) {
        checkPermission(httpRequest, "member.view");
        Long userId = requireUserId(httpRequest);
        return vipMemberService.getAllMembersPaginated(userId, page, size, areaId, subAreaId, branchId, startDate,
                endDate);
    }

    @GetMapping("/active-members-paginated")
    public PaginatedVipMemberResponse getActiveMembersPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) Long areaId,
            @RequestParam(required = false) Long subAreaId,
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            HttpServletRequest httpRequest) {
        checkPermission(httpRequest, "member.view");
        Long userId = requireUserId(httpRequest);
        return vipMemberService.getActiveMembersPaginated(userId, page, size, areaId, subAreaId, branchId, startDate,
                endDate);
    }

    @GetMapping("/removed-members-paginated")
    public PaginatedVipMemberResponse getRemovedMembersPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) Long areaId,
            @RequestParam(required = false) Long subAreaId,
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            HttpServletRequest httpRequest) {
        checkPermission(httpRequest, "member.view");
        Long userId = requireUserId(httpRequest);
        return vipMemberService.getRemovedMembersPaginated(userId, page, size, areaId, subAreaId, branchId, startDate,
                endDate);
    }
}
