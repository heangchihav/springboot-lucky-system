package com.example.marketingservice.controller.member;

import com.example.marketingservice.controller.base.BaseController;
import com.example.marketingservice.dto.member.VipMemberRequest;
import com.example.marketingservice.dto.member.VipMemberResponse;
import com.example.marketingservice.service.member.VipMemberService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
    public ResponseEntity<VipMemberResponse> create(@Valid @RequestBody VipMemberRequest request,
            HttpServletRequest httpRequest) {
        checkPermission(httpRequest, "member.create");
        Long creatorId = requireUserId(httpRequest);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(VipMemberResponse.fromEntity(vipMemberService.create(request, creatorId)));
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
}
