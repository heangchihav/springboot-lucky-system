"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { MarketingServiceGuard } from "@/components/marketing-service/MarketingServiceGuard";
import { PermissionGuard } from "@/components/layout/PermissionGuard";
import {
  marketingHierarchyService,
  MarketingArea,
  MarketingBranch,
  MarketingSubArea,
} from "@/services/marketing-service/marketingHierarchyService";
import {
  vipMemberService,
  VipMember,
  VipMemberPayload,
} from "@/services/marketing-service/vipMemberService";

type FilterValue = number | "all";
type SubAreaSelection = number | "all";

type MemberFormState = {
  name: string;
  phone: string;
  areaId?: number;
  subAreaId: SubAreaSelection;
  branchId?: number;
  memberCreatedAt: string;
  memberDeletedAt?: string;
  createRemark?: string;
  deleteRemark?: string;
};

type ToastState = { message: string; tone: "success" | "error" };

const today = new Date().toISOString().split("T")[0];

const defaultForm: MemberFormState = {
  name: "",
  phone: "",
  areaId: undefined,
  subAreaId: "all",
  branchId: undefined,
  memberCreatedAt: today,
  memberDeletedAt: "",
  createRemark: "",
  deleteRemark: "",
};

export default function MarketingVipManageUserPage() {
  const [areas, setAreas] = useState<MarketingArea[]>([]);
  const [subAreas, setSubAreas] = useState<MarketingSubArea[]>([]);
  const [branches, setBranches] = useState<MarketingBranch[]>([]);
  const [members, setMembers] = useState<VipMember[]>([]);

  const [filters, setFilters] = useState<{
    areaId: FilterValue;
    subAreaId: FilterValue;
    branchId: FilterValue;
  }>({
    areaId: "all",
    subAreaId: "all",
    branchId: "all",
  });

  const [form, setForm] = useState<MemberFormState>(defaultForm);
  const [editingMember, setEditingMember] = useState<VipMember | null>(null);

  const [lookupLoading, setLookupLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (
    message: string,
    tone: "success" | "error" = "success",
  ) => {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 3500);
  };

  const loadLookups = async () => {
    setLookupLoading(true);
    try {
      const [areaData, subAreaData, branchData] = await Promise.all([
        marketingHierarchyService.listAreas(),
        marketingHierarchyService.listSubAreas(),
        marketingHierarchyService.listBranches(),
      ]);
      setAreas(areaData);
      setSubAreas(subAreaData);
      setBranches(branchData);
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Failed to load hierarchy data",
        "error",
      );
    } finally {
      setLookupLoading(false);
    }
  };

  useEffect(() => {
    void loadLookups();
  }, []);

  useEffect(() => {
    let active = true;
    const loadMembers = async () => {
      setMembersLoading(true);
      try {
        const params: {
          areaId?: number;
          subAreaId?: number;
          branchId?: number;
        } = {};
        if (filters.areaId !== "all") {
          params.areaId = filters.areaId;
        }
        if (filters.subAreaId !== "all") {
          params.subAreaId = filters.subAreaId;
        }
        if (filters.branchId !== "all") {
          params.branchId = filters.branchId;
        }
        const data = await vipMemberService.listMembers(params);
        if (active) {
          setMembers(data);
        }
      } catch (error) {
        if (active) {
          showToast(
            error instanceof Error
              ? error.message
              : "Failed to load VIP members",
            "error",
          );
        }
      } finally {
        if (active) {
          setMembersLoading(false);
        }
      }
    };

    void loadMembers();
    return () => {
      active = false;
    };
  }, [filters]);

  const filteredSubAreasForForm = useMemo(() => {
    if (!form.areaId) return [];
    return subAreas.filter((subArea) => subArea.areaId === form.areaId);
  }, [form.areaId, subAreas]);

  const filteredBranchesForForm = useMemo(() => {
    if (!form.areaId) return [];
    return branches.filter((branch) => {
      if (branch.areaId !== form.areaId) {
        return false;
      }
      if (form.subAreaId === "all") {
        return true;
      }
      return branch.subAreaId === form.subAreaId;
    });
  }, [branches, form.areaId, form.subAreaId]);

  const filterSubAreas = useMemo(() => {
    if (filters.areaId === "all") {
      return [];
    }
    return subAreas.filter((subArea) => subArea.areaId === filters.areaId);
  }, [filters.areaId, subAreas]);

  const filterBranches = useMemo(() => {
    if (filters.areaId === "all") {
      return [];
    }
    return branches.filter((branch) => {
      if (branch.areaId !== filters.areaId) {
        return false;
      }
      if (filters.subAreaId === "all") {
        return true;
      }
      return branch.subAreaId === filters.subAreaId;
    });
  }, [branches, filters.areaId, filters.subAreaId]);

  useEffect(() => {
    if (
      form.branchId &&
      !filteredBranchesForForm.some((branch) => branch.id === form.branchId)
    ) {
      setForm((prev) => ({ ...prev, branchId: undefined }));
    }
  }, [filteredBranchesForForm, form.branchId]);

  const resetForm = (keepLocation = false) => {
    if (keepLocation && form.areaId && form.branchId) {
      // Keep location data for new member creation
      setForm({
        ...defaultForm,
        memberCreatedAt: new Date().toISOString().split("T")[0],
        areaId: form.areaId,
        subAreaId: form.subAreaId,
        branchId: form.branchId,
      });
    } else {
      // Full reset for editing or manual reset
      setForm({
        ...defaultForm,
        memberCreatedAt: new Date().toISOString().split("T")[0],
      });
    }
    setEditingMember(null);
  };

  const handleFilterAreaChange = (value: string) => {
    const nextValue: FilterValue = value === "all" ? "all" : Number(value);
    setFilters({
      areaId: nextValue,
      subAreaId: "all",
      branchId: "all",
    });
  };

  const handleFilterSubAreaChange = (value: string) => {
    const nextValue: FilterValue = value === "all" ? "all" : Number(value);
    setFilters((prev) => ({
      ...prev,
      subAreaId: nextValue,
      branchId: "all",
    }));
  };

  const handleFilterBranchChange = (value: string) => {
    const nextValue: FilterValue = value === "all" ? "all" : Number(value);
    setFilters((prev) => ({
      ...prev,
      branchId: nextValue,
    }));
  };

  const handleFormAreaChange = (value: string) => {
    if (!value) {
      setForm((prev) => ({
        ...prev,
        areaId: undefined,
        subAreaId: "all",
        branchId: undefined,
      }));
      return;
    }
    const nextAreaId = Number(value);
    setForm((prev) => ({
      ...prev,
      areaId: nextAreaId,
      subAreaId: "all",
      branchId: undefined,
    }));
  };

  const handleFormSubAreaChange = (value: string) => {
    const nextValue: SubAreaSelection = value === "all" ? "all" : Number(value);
    setForm((prev) => ({
      ...prev,
      subAreaId: nextValue,
      branchId: undefined,
    }));
  };

  const handleFormBranchChange = (value: string) => {
    if (!value) {
      setForm((prev) => ({ ...prev, branchId: undefined }));
      return;
    }
    setForm((prev) => ({ ...prev, branchId: Number(value) }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) {
      showToast("Member name is required", "error");
      return;
    }
    if (!form.phone.trim()) {
      showToast("Phone number is required", "error");
      return;
    }
    if (!form.areaId) {
      showToast("Please select an area", "error");
      return;
    }
    if (!form.branchId) {
      showToast("Please select a branch", "error");
      return;
    }
    setFormSubmitting(true);
    try {
      const payload: VipMemberPayload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        branchId: form.branchId,
        memberCreatedAt: form.memberCreatedAt,
        memberDeletedAt: form.memberDeletedAt
          ? form.memberDeletedAt
          : undefined,
        createRemark: form.createRemark?.trim()
          ? form.createRemark.trim()
          : undefined,
        deleteRemark: form.deleteRemark?.trim()
          ? form.deleteRemark.trim()
          : undefined,
      };

      if (editingMember) {
        await vipMemberService.updateMember(editingMember.id, payload);
        showToast("VIP member updated");
        resetForm(false); // Full reset after editing
      } else {
        await vipMemberService.createMember(payload);
        showToast("VIP member created");
        resetForm(true); // Keep location for new member creation
      }
      setFilters((prev) => ({ ...prev }));
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to save member",
        "error",
      );
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEdit = (member: VipMember) => {
    const branch = branches.find((b) => b.id === member.branchId);
    const derivedAreaId = member.areaId ?? branch?.areaId;
    if (!derivedAreaId) {
      showToast("Unable to resolve area for this member", "error");
      return;
    }
    const derivedSubArea: SubAreaSelection =
      member.subAreaId ?? branch?.subAreaId ?? "all";
    setForm({
      name: member.name,
      phone: member.phone,
      areaId: derivedAreaId,
      subAreaId: derivedSubArea ?? "all",
      branchId: member.branchId,
      memberCreatedAt: member.memberCreatedAt,
      memberDeletedAt: member.memberDeletedAt ?? "",
      createRemark: member.createRemark ?? "",
      deleteRemark: member.deleteRemark ?? "",
    });
    setEditingMember(member);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (member: VipMember) => {
    const confirmation = window.confirm(`Delete VIP member "${member.name}"?`);
    if (!confirmation) return;
    try {
      await vipMemberService.deleteMember(member.id);
      showToast("VIP member removed");
      setFilters((prev) => ({ ...prev }));
      if (editingMember?.id === member.id) {
        resetForm();
      }
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to delete member",
        "error",
      );
    }
  };

  const totalActiveMembers = useMemo(
    () => members.filter((member) => !member.memberDeletedAt).length,
    [members],
  );

  const totalArchivedMembers = members.length - totalActiveMembers;

  return (
    <MarketingServiceGuard>
      <div className="space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-amber-300/70">
            Marketing ◦ VIP members
          </p>
          <h1 className="text-3xl font-semibold text-white">
            Manage VIP member roster
          </h1>
          <p className="text-sm text-slate-300">
            Create, update, or archive members across areas, sub-areas, and
            branches. Data is live with the marketing-service backend.
          </p>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-amber-200/80">
                <span>Filters</span>
                <button
                  className="rounded-full border border-white/10 px-3 py-1 text-[0.6rem] text-white/70 hover:text-white"
                  onClick={() =>
                    setFilters({
                      areaId: "all",
                      subAreaId: "all",
                      branchId: "all",
                    })
                  }
                >
                  Reset
                </button>
              </div>
              <div className="mt-3 space-y-3 text-xs text-slate-300">
                <div className="flex flex-col">
                  <label className="text-[0.6rem] uppercase tracking-[0.25em] text-slate-400">
                    Area
                  </label>
                  <select
                    className="mt-1 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-amber-400/60 focus:outline-none"
                    value={filters.areaId}
                    onChange={(event) =>
                      handleFilterAreaChange(event.target.value)
                    }
                  >
                    <option value="all">All areas</option>
                    {areas.map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.name}
                      </option>
                    ))}
                  </select>
                </div>

                {filters.areaId !== "all" && (
                  <div className="flex flex-col">
                    <label className="text-[0.6rem] uppercase tracking-[0.25em] text-slate-400">
                      Sub area
                    </label>
                    <select
                      className="mt-1 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-amber-400/60 focus:outline-none"
                      value={filters.subAreaId}
                      onChange={(event) =>
                        handleFilterSubAreaChange(event.target.value)
                      }
                    >
                      <option value="all">All sub areas</option>
                      {filterSubAreas.map((subArea) => (
                        <option key={subArea.id} value={subArea.id}>
                          {subArea.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {filters.areaId !== "all" && (
                  <div className="flex flex-col">
                    <label className="text-[0.6rem] uppercase tracking-[0.25em] text-slate-400">
                      Branch
                    </label>
                    <select
                      className="mt-1 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-amber-400/60 focus:outline-none"
                      value={filters.branchId}
                      onChange={(event) =>
                        handleFilterBranchChange(event.target.value)
                      }
                    >
                      <option value="all">All branches</option>
                      {filterBranches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-emerald-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/80">
                Active
              </p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {totalActiveMembers}
              </p>
              <p className="text-sm text-emerald-100/80">
                Members currently active
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-rose-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-rose-200/80">
                Archived
              </p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {totalArchivedMembers}
              </p>
              <p className="text-sm text-rose-100/80">
                Members removed or inactive
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
            <form className="flex-1 space-y-4" onSubmit={handleSubmit}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-amber-300/70">
                    {editingMember ? "Edit member" : "Add new member"}
                  </p>
                  <h2 className="text-xl font-semibold text-white">
                    {editingMember ? editingMember.name : "Create VIP member"}
                  </h2>
                </div>
                {editingMember && (
                  <button
                    type="button"
                    className="rounded-full border border-white/10 px-4 py-2 text-xs text-white hover:bg-white/10"
                    onClick={() => resetForm(false)}
                  >
                    Cancel edit
                  </button>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col text-xs text-slate-300">
                  <label className="text-[0.6rem] uppercase tracking-[0.25em] text-slate-400">
                    Full name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, name: event.target.value }))
                    }
                    className="mt-1 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-amber-400/60 focus:outline-none"
                    placeholder="Enter full name"
                  />
                </div>

                <div className="flex flex-col text-xs text-slate-300">
                  <label className="text-[0.6rem] uppercase tracking-[0.25em] text-slate-400">
                    Phone number
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        phone: event.target.value,
                      }))
                    }
                    className="mt-1 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-amber-400/60 focus:outline-none"
                    placeholder="0x-xxx-xxx"
                  />
                </div>

                <div className="flex flex-col text-xs text-slate-300 md:col-span-2">
                  <label className="text-[0.6rem] uppercase tracking-[0.25em] text-slate-400">
                    Area
                  </label>
                  <select
                    value={form.areaId ?? ""}
                    onChange={(event) =>
                      handleFormAreaChange(event.target.value)
                    }
                    className="mt-1 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-amber-400/60 focus:outline-none"
                  >
                    <option value="">Select area</option>
                    {areas.map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.name}
                      </option>
                    ))}
                  </select>
                </div>

                {filteredSubAreasForForm.length > 0 && (
                  <div className="flex flex-col text-xs text-slate-300">
                    <label className="text-[0.6rem] uppercase tracking-[0.25em] text-slate-400">
                      Sub area
                    </label>
                    <select
                      value={form.subAreaId}
                      onChange={(event) =>
                        handleFormSubAreaChange(event.target.value)
                      }
                      className="mt-1 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-amber-400/60 focus:outline-none"
                    >
                      <option value="all">All sub areas</option>
                      {filteredSubAreasForForm.map((subArea) => (
                        <option key={subArea.id} value={subArea.id}>
                          {subArea.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex flex-col text-xs text-slate-300">
                  <label className="text-[0.6rem] uppercase tracking-[0.25em] text-slate-400">
                    Branch
                  </label>
                  <select
                    value={form.branchId ?? ""}
                    onChange={(event) =>
                      handleFormBranchChange(event.target.value)
                    }
                    disabled={!form.areaId}
                    className="mt-1 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-40 focus:border-amber-400/60 focus:outline-none"
                  >
                    <option value="">Select branch</option>
                    {filteredBranchesForForm.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col text-xs text-slate-300">
                  <label className="text-[0.6rem] uppercase tracking-[0.25em] text-slate-400">
                    Join date
                  </label>
                  <input
                    type="date"
                    value={form.memberCreatedAt}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        memberCreatedAt: event.target.value,
                      }))
                    }
                    className="mt-1 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-amber-400/60 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col text-xs text-slate-300">
                  <label className="text-[0.6rem] uppercase tracking-[0.25em] text-slate-400">
                    Removal date (optional)
                  </label>
                  <input
                    type="date"
                    value={form.memberDeletedAt ?? ""}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        memberDeletedAt: event.target.value,
                      }))
                    }
                    className="mt-1 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-amber-400/60 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col text-xs text-slate-300 md:col-span-2">
                  <label className="text-[0.6rem] uppercase tracking-[0.25em] text-slate-400">
                    Registration remark
                  </label>
                  <textarea
                    rows={3}
                    value={form.createRemark ?? ""}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        createRemark: event.target.value,
                      }))
                    }
                    className="mt-1 rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-amber-400/60 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col text-xs text-slate-300 md:col-span-2">
                  <label className="text-[0.6rem] uppercase tracking-[0.25em] text-slate-400">
                    Removal remark
                  </label>
                  <textarea
                    rows={3}
                    value={form.deleteRemark ?? ""}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        deleteRemark: event.target.value,
                      }))
                    }
                    className="mt-1 rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-amber-400/60 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={formSubmitting}
                className="w-full rounded-2xl bg-linear-to-r from-amber-400/80 to-rose-500/80 px-6 py-3 text-center text-sm font-semibold uppercase tracking-[0.35em] text-white shadow-lg shadow-rose-900/30 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {formSubmitting
                  ? "Saving…"
                  : editingMember
                    ? "Update member"
                    : "Create member"}
              </button>
            </form>

            <div className="min-h-full flex-1 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-amber-200/70">
                <span>Directory</span>
                <span className="text-[0.6rem] text-white/60">
                  {membersLoading ? "Refreshing…" : `${members.length} records`}
                </span>
              </div>
              <div className="mt-3 max-h-120 overflow-auto rounded-2xl border border-white/10 bg-slate-900/40">
                <table className="min-w-full divide-y divide-white/5 text-sm text-slate-100">
                  <thead className="bg-white/5 text-xs uppercase tracking-[0.25em] text-slate-400">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">
                        Member
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Location
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Timeline
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.length === 0 ? (
                      <tr>
                        <td
                          className="px-4 py-6 text-center text-slate-400"
                          colSpan={4}
                        >
                          {membersLoading
                            ? "Loading members…"
                            : "No members match the current filters."}
                        </td>
                      </tr>
                    ) : (
                      members.map((member) => (
                        <tr
                          key={member.id}
                          className="border-b border-white/5 last:border-transparent"
                        >
                          <td className="px-4 py-4">
                            <p className="font-semibold text-white">
                              {member.name}
                            </p>
                            <p className="text-xs text-slate-300">
                              {member.phone}
                            </p>
                            {member.createRemark && (
                              <p className="mt-1 text-xs text-amber-200/80">
                                {member.createRemark}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-200">
                            <p>{member.areaName ?? "—"} </p>
                            <p className="text-xs text-slate-400">
                              {member.subAreaName
                                ? `${member.subAreaName} · `
                                : ""}
                              {member.branchName ?? "—"}
                            </p>
                          </td>
                          <td className="px-4 py-4 text-xs text-slate-300">
                            <p>
                              Joined{" "}
                              <span className="text-white">
                                {member.memberCreatedAt}
                              </span>
                            </p>
                            {member.memberDeletedAt ? (
                              <p className="text-rose-300">
                                Removed {member.memberDeletedAt}
                              </p>
                            ) : (
                              <p className="text-emerald-300">Active</p>
                            )}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex flex-col gap-2 text-xs">
                              <PermissionGuard
                                permission="member.edit"
                                serviceContext="marketing-service"
                                fallback={
                                  <button
                                    type="button"
                                    disabled
                                    className="rounded-full border border-white/20 px-3 py-1 text-slate-500 cursor-not-allowed"
                                  >
                                    Edit
                                  </button>
                                }
                              >
                                <button
                                  type="button"
                                  onClick={() => handleEdit(member)}
                                  className="rounded-full border border-white/10 px-3 py-1 text-slate-200 hover:bg-white/10"
                                >
                                  Edit
                                </button>
                              </PermissionGuard>
                              <PermissionGuard
                                permission="member.delete"
                                serviceContext="marketing-service"
                                fallback={
                                  <button
                                    type="button"
                                    disabled
                                    className="rounded-full border border-white/20 px-3 py-1 text-slate-500 cursor-not-allowed"
                                  >
                                    Delete
                                  </button>
                                }
                              >
                                <button
                                  type="button"
                                  onClick={() => handleDelete(member)}
                                  className="rounded-full border border-rose-400/40 px-3 py-1 text-rose-200 hover:bg-rose-500/20"
                                >
                                  Delete
                                </button>
                              </PermissionGuard>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {toast && (
          <div
            className={`fixed bottom-6 right-6 z-50 rounded-2xl px-4 py-3 text-sm shadow-lg ${toast.tone === "success"
              ? "bg-emerald-500/90 text-white"
              : "bg-rose-500/90 text-white"
              }`}
          >
            {toast.message}
          </div>
        )}
        {lookupLoading && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/60 text-sm uppercase tracking-[0.4em] text-white">
            Loading marketing hierarchy…
          </div>
        )}
      </div>
    </MarketingServiceGuard>
  );
}
