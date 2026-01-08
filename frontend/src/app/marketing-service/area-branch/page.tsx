"use client";

import { useEffect, useMemo, useState } from "react";
import { MarketingServiceGuard } from "@/components/marketing-service/MarketingServiceGuard";
import { PermissionGuard } from "@/components/layout/PermissionGuard";
import {
  marketingHierarchyService,
  MarketingArea,
  MarketingSubArea,
  MarketingBranch,
  AreaPayload,
  SubAreaPayload,
  BranchPayload,
} from "@/services/marketing-service/marketingHierarchyService";
import { marketingUserAssignmentService, MarketingUserAssignment } from "@/services/marketingUserAssignmentService";
import { API_BASE_URL } from "@/config/env";

type FormState<T> = Partial<T> & { active?: boolean };

const defaultAreaForm: FormState<AreaPayload> = {
  name: "",
  code: "",
  description: "",
  active: true,
};

const defaultSubAreaForm: FormState<SubAreaPayload> = {
  name: "",
  code: "",
  description: "",
  active: true,
  areaId: undefined,
};

const defaultBranchForm: FormState<BranchPayload> = {
  name: "",
  code: "",
  description: "",
  active: true,
  areaId: undefined,
  subAreaId: undefined,
};

export default function MarketingAreaBranchPage() {
  const [areas, setAreas] = useState<MarketingArea[]>([]);
  const [subAreas, setSubAreas] = useState<MarketingSubArea[]>([]);
  const [branches, setBranches] = useState<MarketingBranch[]>([]);
  const [currentUserAssignment, setCurrentUserAssignment] = useState<MarketingUserAssignment | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const [areaForm, setAreaForm] = useState(defaultAreaForm);
  const [editingArea, setEditingArea] = useState<MarketingArea | null>(null);

  const [subAreaForm, setSubAreaForm] = useState(defaultSubAreaForm);
  const [editingSubArea, setEditingSubArea] = useState<MarketingSubArea | null>(
    null,
  );

  const [branchForm, setBranchForm] = useState(defaultBranchForm);
  const [editingBranch, setEditingBranch] = useState<MarketingBranch | null>(
    null,
  );

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    tone: "success" | "error";
  } | null>(null);

  // Filter areas based on user assignment
  const accessibleAreas = useMemo(() => {
    if (!currentUserAssignment) return areas;
    if (currentUserAssignment.assignmentType === "AREA" && currentUserAssignment.areaId) {
      return areas.filter(area => area.id === currentUserAssignment.areaId);
    }
    if (currentUserAssignment.assignmentType === "SUB_AREA" && currentUserAssignment.areaId) {
      return areas.filter(area => area.id === currentUserAssignment.areaId);
    }
    return areas;
  }, [areas, currentUserAssignment]);

  // Filter sub-areas based on user assignment
  const accessibleSubAreas = useMemo(() => {
    if (!currentUserAssignment) return subAreas;
    if (currentUserAssignment.assignmentType === "SUB_AREA" && currentUserAssignment.subAreaId) {
      return subAreas.filter(subArea => subArea.id === currentUserAssignment.subAreaId);
    }
    if (currentUserAssignment.assignmentType === "AREA" && currentUserAssignment.areaId) {
      return subAreas.filter(subArea => subArea.areaId === currentUserAssignment.areaId);
    }
    return subAreas;
  }, [subAreas, currentUserAssignment]);

  const filteredSubAreas = useMemo(() => {
    if (!branchForm.areaId) return [];
    return accessibleSubAreas.filter((subArea) => subArea.areaId === branchForm.areaId);
  }, [branchForm.areaId, accessibleSubAreas]);

  // Permission checks based on assignment type
  const canCreateArea = useMemo(() => {
    // Only users without assignment can create areas (admin level)
    return !currentUserAssignment;
  }, [currentUserAssignment]);

  const canCreateSubArea = useMemo(() => {
    // Users without assignment (admin) or area-assigned users can create sub-areas
    if (!currentUserAssignment) return true;
    return currentUserAssignment.assignmentType === "AREA";
  }, [currentUserAssignment]);

  const canCreateBranch = useMemo(() => {
    // Users without assignment (admin), area-assigned, or sub-area-assigned can create branches
    if (!currentUserAssignment) return true;
    return currentUserAssignment.assignmentType === "AREA" || currentUserAssignment.assignmentType === "SUB_AREA";
  }, [currentUserAssignment]);

  const showToast = (
    message: string,
    tone: "success" | "error" = "success",
  ) => {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 3000);
  };

  const loadAll = async () => {
    setLoading(true);
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
        error instanceof Error ? error.message : "Failed to load hierarchy",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
    void fetchCurrentUserAssignment();
  }, []);

  const fetchCurrentUserAssignment = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        credentials: "include",
      });

      if (!response.ok) {
        return;
      }

      const user = await response.json();
      if (user?.id) {
        setCurrentUserId(user.id);
        const assignments = await marketingUserAssignmentService.getUserAssignments(user.id);
        if (assignments && assignments.length > 0) {
          setCurrentUserAssignment(assignments[0]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch user assignment:", error);
    }
  };

  const upsertArea = async () => {
    if (!areaForm.name) {
      showToast("Area name is required", "error");
      return;
    }
    setLoading(true);
    try {
      const payload: AreaPayload = {
        name: areaForm.name,
        code: areaForm.code,
        description: areaForm.description,
        active: areaForm.active ?? true,
      };
      if (editingArea) {
        await marketingHierarchyService.updateArea(editingArea.id, payload);
        showToast("Area updated");
      } else {
        await marketingHierarchyService.createArea(payload);
        showToast("Area created");
      }
      setAreaForm(defaultAreaForm);
      setEditingArea(null);
      await loadAll();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to save area",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const upsertSubArea = async () => {
    if (!subAreaForm.name || !subAreaForm.areaId) {
      showToast("Sub area/Province name and parent area are required", "error");
      return;
    }
    setLoading(true);
    try {
      const payload: SubAreaPayload = {
        name: subAreaForm.name,
        code: subAreaForm.code,
        description: subAreaForm.description,
        active: subAreaForm.active ?? true,
        areaId: subAreaForm.areaId,
      };
      if (editingSubArea) {
        await marketingHierarchyService.updateSubArea(
          editingSubArea.id,
          payload,
        );
        showToast("Sub area/Province updated");
      } else {
        await marketingHierarchyService.createSubArea(payload);
        showToast("Sub area/Province created");
      }
      setSubAreaForm(defaultSubAreaForm);
      setEditingSubArea(null);
      await loadAll();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to save sub area/Province",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const upsertBranch = async () => {
    if (!branchForm.name || !branchForm.areaId) {
      showToast("Branch name and area are required", "error");
      return;
    }
    setLoading(true);
    try {
      const payload: BranchPayload = {
        name: branchForm.name,
        code: branchForm.code,
        description: branchForm.description,
        active: branchForm.active ?? true,
        areaId: branchForm.areaId,
        subAreaId: branchForm.subAreaId || null,
      };
      if (editingBranch) {
        await marketingHierarchyService.updateBranch(editingBranch.id, payload);
        showToast("Branch updated");
      } else {
        await marketingHierarchyService.createBranch(payload);
        showToast("Branch created");
      }
      setBranchForm(defaultBranchForm);
      setEditingBranch(null);
      await loadAll();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to save branch",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (
    entity: "area" | "subArea" | "branch",
    id: number,
  ) => {
    if (!confirm("This action is permanent. Continue?")) {
      return;
    }
    setLoading(true);
    try {
      if (entity === "area") await marketingHierarchyService.deleteArea(id);
      if (entity === "subArea")
        await marketingHierarchyService.deleteSubArea(id);
      if (entity === "branch") await marketingHierarchyService.deleteBranch(id);
      showToast(
        `${entity === "branch" ? "Branch" : entity === "subArea" ? "Sub area/Province" : "Area"} removed`,
      );
      await loadAll();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to delete",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (value?: string) =>
    value ? new Date(value).toLocaleString() : "—";

  return (
    <MarketingServiceGuard>
      <div className="space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-amber-300/70">
            Marketing · Coverage
          </p>
          <h1 className="text-3xl font-semibold text-white">
            Region Management
          </h1>
          <p className="text-sm text-slate-300">
            Create your marketing footprint. Sub area/Province are scoped inside areas,
            while branches can link to either the parent area or a specific sub
            area for more granular routing.
          </p>
        </header>

        {toast && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${toast.tone === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              : "border-red-500/30 bg-red-500/10 text-red-200"
              }`}
          >
            {toast.message}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Area
                </p>
                <h2 className="text-xl font-semibold text-white">
                  {editingArea ? "Edit area" : "Create area"}
                </h2>
              </div>
              {editingArea && (
                <button
                  className="text-xs text-slate-400 hover:text-white"
                  onClick={() => {
                    setAreaForm(defaultAreaForm);
                    setEditingArea(null);
                  }}
                >
                  Clear
                </button>
              )}
            </div>
            {!canCreateArea && (
              <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                You don't have permission to create areas. Only administrators can create areas.
              </div>
            )}
            <div className="mt-4 space-y-4">
              <label className="text-sm text-slate-300">
                Name
                <input
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-white focus:border-amber-400/60 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  value={areaForm.name ?? ""}
                  onChange={(event) =>
                    setAreaForm((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  disabled={!canCreateArea}
                />
              </label>
              <label className="text-sm text-slate-300">
                Code
                <input
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-white focus:border-amber-400/60 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  value={areaForm.code ?? ""}
                  onChange={(event) =>
                    setAreaForm((prev) => ({
                      ...prev,
                      code: event.target.value,
                    }))
                  }
                  disabled={!canCreateArea}
                />
              </label>
              <label className="text-sm text-slate-300">
                Description
                <textarea
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-white focus:border-amber-400/60 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  rows={3}
                  value={areaForm.description ?? ""}
                  onChange={(event) =>
                    setAreaForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  disabled={!canCreateArea}
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={areaForm.active ?? true}
                  onChange={(event) =>
                    setAreaForm((prev) => ({
                      ...prev,
                      active: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-white/20 bg-slate-900/60 text-amber-400 focus:ring-amber-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!canCreateArea}
                />
                Active
              </label>
              <button
                className="w-full rounded-2xl bg-linear-to-r from-amber-500/90 to-orange-500/90 px-4 py-2 text-sm font-semibold text-white hover:from-amber-400 hover:to-orange-400 disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={upsertArea}
                disabled={loading || !canCreateArea}
              >
                {loading
                  ? "Saving..."
                  : editingArea
                    ? "Update area"
                    : "Add area"}
              </button>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Sub area/Province
                </p>
                <h2 className="text-xl font-semibold text-white">
                  {editingSubArea ? "Edit sub area/Province" : "Create sub area/Province"}
                </h2>
              </div>
              {editingSubArea && (
                <button
                  className="text-xs text-slate-400 hover:text-white"
                  onClick={() => {
                    setSubAreaForm(defaultSubAreaForm);
                    setEditingSubArea(null);
                  }}
                >
                  Clear
                </button>
              )}
            </div>
            {!canCreateSubArea && (
              <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                You don't have permission to create sub-areas. Only area-assigned users or administrators can create sub-areas.
              </div>
            )}
            <div className="mt-4 space-y-4">
              <label className="text-sm text-slate-300">
                Parent area
                <select
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-white focus:border-amber-400/60 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  value={subAreaForm.areaId ?? ""}
                  onChange={(event) =>
                    setSubAreaForm((prev) => ({
                      ...prev,
                      areaId: Number(event.target.value) || undefined,
                    }))
                  }
                  disabled={!canCreateSubArea}
                >
                  <option value="">Select area</option>
                  {accessibleAreas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-slate-300">
                Name
                <input
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-white focus:border-amber-400/60 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  value={subAreaForm.name ?? ""}
                  onChange={(event) =>
                    setSubAreaForm((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  disabled={!canCreateSubArea}
                />
              </label>
              <label className="text-sm text-slate-300">
                Code
                <input
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-white focus:border-amber-400/60 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  value={subAreaForm.code ?? ""}
                  onChange={(event) =>
                    setSubAreaForm((prev) => ({
                      ...prev,
                      code: event.target.value,
                    }))
                  }
                  disabled={!canCreateSubArea}
                />
              </label>
              <label className="text-sm text-slate-300">
                Description
                <textarea
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-white focus:border-amber-400/60 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  rows={3}
                  value={subAreaForm.description ?? ""}
                  onChange={(event) =>
                    setSubAreaForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  disabled={!canCreateSubArea}
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={subAreaForm.active ?? true}
                  onChange={(event) =>
                    setSubAreaForm((prev) => ({
                      ...prev,
                      active: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-white/20 bg-slate-900/60 text-amber-400 focus:ring-amber-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!canCreateSubArea}
                />
                Active
              </label>
              <button
                className="w-full rounded-2xl bg-linear-to-r from-blue-500/90 to-indigo-500/90 px-4 py-2 text-sm font-semibold text-white hover:from-blue-400 hover:to-indigo-400 disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={upsertSubArea}
                disabled={loading || !canCreateSubArea}
              >
                {loading
                  ? "Saving..."
                  : editingSubArea
                    ? "Update sub area/Province"
                    : "Add sub area/Province"}
              </button>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Branch
                </p>
                <h2 className="text-xl font-semibold text-white">
                  {editingBranch ? "Edit branch" : "Create branch"}
                </h2>
              </div>
              {editingBranch && (
                <button
                  className="text-xs text-slate-400 hover:text-white"
                  onClick={() => {
                    setBranchForm(defaultBranchForm);
                    setEditingBranch(null);
                  }}
                >
                  Clear
                </button>
              )}
            </div>
            {!canCreateBranch && (
              <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                You don't have permission to create branches. Only area-assigned, sub-area-assigned users, or administrators can create branches.
              </div>
            )}
            <div className="mt-4 space-y-4">
              <label className="text-sm text-slate-300">
                Area
                <select
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-white focus:border-amber-400/60 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  value={branchForm.areaId ?? ""}
                  onChange={(event) => {
                    const nextAreaId = Number(event.target.value) || undefined;
                    setBranchForm((prev) => ({
                      ...prev,
                      areaId: nextAreaId,
                      subAreaId: undefined,
                    }));
                  }}
                  disabled={!canCreateBranch}
                >
                  <option value="">Select area</option>
                  {accessibleAreas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-slate-300">
                Sub area/Province (optional)
                <select
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-white focus:border-amber-400/60 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  value={branchForm.subAreaId ?? ""}
                  onChange={(event) => {
                    const next = Number(event.target.value) || undefined;
                    setBranchForm((prev) => ({ ...prev, subAreaId: next }));
                  }}
                  disabled={!canCreateBranch || !branchForm.areaId || filteredSubAreas.length === 0}
                >
                  <option value="">No sub area/Province</option>
                  {filteredSubAreas.map((subArea) => (
                    <option key={subArea.id} value={subArea.id}>
                      {subArea.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-slate-300">
                Name
                <input
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-white focus:border-amber-400/60 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  value={branchForm.name ?? ""}
                  onChange={(event) =>
                    setBranchForm((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  disabled={!canCreateBranch}
                />
              </label>
              <label className="text-sm text-slate-300">
                Code
                <input
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-white focus:border-amber-400/60 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  value={branchForm.code ?? ""}
                  onChange={(event) =>
                    setBranchForm((prev) => ({
                      ...prev,
                      code: event.target.value,
                    }))
                  }
                  disabled={!canCreateBranch}
                />
              </label>
              <label className="text-sm text-slate-300">
                Description
                <textarea
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-white focus:border-amber-400/60 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  rows={3}
                  value={branchForm.description ?? ""}
                  onChange={(event) =>
                    setBranchForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  disabled={!canCreateBranch}
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={branchForm.active ?? true}
                  onChange={(event) =>
                    setBranchForm((prev) => ({
                      ...prev,
                      active: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-white/20 bg-slate-900/60 text-amber-400 focus:ring-amber-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!canCreateBranch}
                />
                Active
              </label>
              <button
                className="w-full rounded-2xl bg-linear-to-r from-emerald-500/90 to-teal-500/90 px-4 py-2 text-sm font-semibold text-white hover:from-emerald-400 hover:to-teal-400 disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={upsertBranch}
                disabled={loading || !canCreateBranch}
              >
                {loading
                  ? "Saving..."
                  : editingBranch
                    ? "Update branch"
                    : "Add branch"}
              </button>
            </div>
          </section>
        </div>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Directory
              </p>
              <h2 className="text-xl font-semibold text-white">
                Current structure
              </h2>
            </div>
            <button
              className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:border-white/40"
              onClick={loadAll}
              disabled={loading}
            >
              Refresh
            </button>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/40">
              <header className="flex items-center justify-between border-b border-white/5 px-4 py-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    Areas
                  </p>
                  <p className="text-2xl font-semibold text-white">
                    {areas.length}
                  </p>
                </div>
              </header>
              <div className="max-h-105 space-y-2 overflow-auto p-4 text-sm text-slate-200">
                {areas.map((area) => (
                  <article
                    key={area.id}
                    className="rounded-2xl border border-white/5 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-base font-semibold text-white">
                          {area.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {area.code ?? "—"}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${area.active
                          ? "bg-emerald-500/20 text-emerald-200"
                          : "bg-slate-600/40 text-slate-300"
                          }`}
                      >
                        {area.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      {area.description || "No description"}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                      <span>Updated {formatDate(area.updatedAt)}</span>
                      <span className="text-slate-600">•</span>
                      <PermissionGuard
                        permission="area.edit"
                        serviceContext="marketing-service"
                        fallback={
                          <button
                            disabled
                            className="text-slate-500 cursor-not-allowed"
                            title="No permission to edit"
                          >
                            Edit
                          </button>
                        }
                      >
                        <button
                          className="text-amber-300 hover:text-amber-200"
                          onClick={() => {
                            setAreaForm({
                              name: area.name,
                              code: area.code,
                              description: area.description,
                              active: area.active,
                            });
                            setEditingArea(area);
                          }}
                        >
                          Edit
                        </button>
                      </PermissionGuard>
                      <span className="text-slate-600">•</span>
                      <PermissionGuard
                        permission="area.delete"
                        serviceContext="marketing-service"
                        fallback={
                          <button
                            disabled
                            className="text-slate-500 cursor-not-allowed"
                            title="No permission to delete"
                          >
                            Delete
                          </button>
                        }
                      >
                        <button
                          className="text-red-300 hover:text-red-200"
                          onClick={() => void handleDelete("area", area.id)}
                        >
                          Delete
                        </button>
                      </PermissionGuard>
                    </div>
                  </article>
                ))}
                {areas.length === 0 && (
                  <p className="text-center text-slate-500">No areas yet.</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/40">
              <header className="flex items-center justify-between border-b border-white/5 px-4 py-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    Sub area/Province
                  </p>
                  <p className="text-2xl font-semibold text-white">
                    {subAreas.length}
                  </p>
                </div>
              </header>
              <div className="max-h-105 space-y-2 overflow-auto p-4 text-sm text-slate-200">
                {subAreas.map((subArea) => {
                  const parent = areas.find(
                    (area) => area.id === subArea.areaId,
                  );
                  return (
                    <article
                      key={subArea.id}
                      className="rounded-2xl border border-white/5 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-base font-semibold text-white">
                            {subArea.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {parent?.name ?? "Unmapped"} · {subArea.code ?? "—"}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${subArea.active
                            ? "bg-emerald-500/20 text-emerald-200"
                            : "bg-slate-600/40 text-slate-300"
                            }`}
                        >
                          {subArea.active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-400">
                        {subArea.description || "No description"}
                      </p>
                      <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                        <span>Updated {formatDate(subArea.updatedAt)}</span>
                        <span className="text-slate-600">•</span>
                        <PermissionGuard
                          permission="subarea.edit"
                          serviceContext="marketing-service"
                          fallback={
                            <button
                              disabled
                              className="text-slate-500 cursor-not-allowed"
                              title="No permission to edit"
                            >
                              Edit
                            </button>
                          }
                        >
                          <button
                            className="text-amber-300 hover:text-amber-200"
                            onClick={() => {
                              setSubAreaForm({
                                name: subArea.name,
                                code: subArea.code,
                                description: subArea.description,
                                active: subArea.active,
                                areaId: subArea.areaId,
                              });
                              setEditingSubArea(subArea);
                            }}
                          >
                            Edit
                          </button>
                        </PermissionGuard>
                        <span className="text-slate-600">•</span>
                        <PermissionGuard
                          permission="subarea.delete"
                          serviceContext="marketing-service"
                          fallback={
                            <button
                              disabled
                              className="text-slate-500 cursor-not-allowed"
                              title="No permission to delete"
                            >
                              Delete
                            </button>
                          }
                        >
                          <button
                            className="text-red-300 hover:text-red-200"
                            onClick={() =>
                              void handleDelete("subArea", subArea.id)
                            }
                          >
                            Delete
                          </button>
                        </PermissionGuard>
                      </div>
                    </article>
                  );
                })}
                {subAreas.length === 0 && (
                  <p className="text-center text-slate-500">
                    No sub area/Province yet.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/40">
              <header className="flex items-center justify-between border-b border-white/5 px-4 py-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    Branches
                  </p>
                  <p className="text-2xl font-semibold text-white">
                    {branches.length}
                  </p>
                </div>
              </header>
              <div className="max-h-105 space-y-2 overflow-auto p-4 text-sm text-slate-200">
                {branches.map((branch) => {
                  const parentArea = areas.find(
                    (area) => area.id === branch.areaId,
                  );
                  const parentSubArea = branch.subAreaId
                    ? subAreas.find(
                      (subArea) => subArea.id === branch.subAreaId,
                    )
                    : undefined;
                  return (
                    <article
                      key={branch.id}
                      className="rounded-2xl border border-white/5 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-base font-semibold text-white">
                            {branch.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {parentArea?.name ?? "—"}{" "}
                            {parentSubArea ? `· ${parentSubArea.name}` : ""}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${branch.active
                            ? "bg-emerald-500/20 text-emerald-200"
                            : "bg-slate-600/40 text-slate-300"
                            }`}
                        >
                          {branch.active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-400">
                        {branch.description || "No description"}
                      </p>
                      <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                        <span>Updated {formatDate(branch.updatedAt)}</span>
                        <span className="text-slate-600">•</span>
                        <PermissionGuard
                          permission="branch.edit"
                          serviceContext="marketing-service"
                          fallback={
                            <button
                              disabled
                              className="text-slate-500 cursor-not-allowed"
                              title="No permission to edit"
                            >
                              Edit
                            </button>
                          }
                        >
                          <button
                            className="text-amber-300 hover:text-amber-200"
                            onClick={() => {
                              setBranchForm({
                                name: branch.name,
                                code: branch.code ?? undefined,
                                description: branch.description,
                                active: branch.active,
                                areaId: branch.areaId,
                                subAreaId: branch.subAreaId,
                              });
                              setEditingBranch(branch);
                            }}
                          >
                            Edit
                          </button>
                        </PermissionGuard>
                        <span className="text-slate-600">•</span>
                        <PermissionGuard
                          permission="branch.delete"
                          serviceContext="marketing-service"
                          fallback={
                            <button
                              disabled
                              className="text-slate-500 cursor-not-allowed"
                              title="No permission to delete"
                            >
                              Delete
                            </button>
                          }
                        >
                          <button
                            className="text-red-300 hover:text-red-200"
                            onClick={() => void handleDelete("branch", branch.id)}
                          >
                            Delete
                          </button>
                        </PermissionGuard>
                      </div>
                    </article>
                  );
                })}
                {branches.length === 0 && (
                  <p className="text-center text-slate-500">No branches yet.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </MarketingServiceGuard>
  );
}
