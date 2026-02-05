"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  areaBranchService,
  Area,
  Subarea,
  Branch,
  CreateAreaRequest,
  CreateSubareaRequest,
  CreateBranchRequest,
} from "@/services/areaBranchService";
import { PermissionGuard } from "@/components/layout/PermissionGuard";
import { CALL_SERVICE_PERMISSIONS } from "@/constants/permissions";

export default function AreaBranchManagement() {
  const { user, isAuthenticated, hasServiceAccess } = useAuth();
  const [activeTab, setActiveTab] = useState<"areas" | "subareas" | "branches">("areas");

  // Area states
  const [areas, setAreas] = useState<Area[]>([]);
  const [areaForm, setAreaForm] = useState<Partial<Area>>({
    name: "",
    description: "",
    code: "",
    active: true,
  });
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [showAreaForm, setShowAreaForm] = useState(false);

  // Subarea states
  const [subareas, setSubareas] = useState<Subarea[]>([]);
  const [subareaForm, setSubareaForm] = useState<Partial<Subarea>>({
    name: "",
    description: "",
    code: "",
    active: true,
    areaId: undefined,
    areaName: "",
  });
  const [editingSubarea, setEditingSubarea] = useState<Subarea | null>(null);
  const [showSubareaForm, setShowSubareaForm] = useState(false);

  // Branch states
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchForm, setBranchForm] = useState<Partial<Branch>>({
    name: "",
    description: "",
    code: "",
    address: "",
    phone: "",
    email: "",
    active: true,
    subareaId: undefined,
    subareaName: "",
    areaId: undefined,
    areaName: "",
  });
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [showBranchForm, setShowBranchForm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isClient, setIsClient] = useState(false);

  const isModalOpen = showAreaForm || showSubareaForm || showBranchForm;

  // Fetch areas
  const fetchAreas = async () => {
    try {
      const data = await areaBranchService.getAreas();
      setAreas(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch areas");
    }
  };

  // Fetch subareas
  const fetchSubareas = async () => {
    try {
      const data = await areaBranchService.getSubareas();
      setSubareas(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch subareas");
    }
  };

  // Fetch branches
  const fetchBranches = async () => {
    try {
      const data = await areaBranchService.getBranches();
      setBranches(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch branches");
    }
  };

  useEffect(() => {
    // Only fetch data if user is authenticated and has access
    if (isAuthenticated && hasServiceAccess("call")) {
      fetchAreas();
      fetchSubareas();
      fetchBranches();
    }
  }, [isAuthenticated, hasServiceAccess]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isModalOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isModalOpen]);

  // Check if user has access to call service
  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-white mb-4">
            Authentication Required
          </h2>
          <p className="text-slate-300 mb-6">
            Please login to access the Area & Branch Management page.
          </p>
          <a
            href="/auth/login"
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  if (!hasServiceAccess("call")) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-white mb-4">
            Access Denied
          </h2>
          <p className="text-slate-300">
            You don't have permission to access the Call Service.
          </p>
        </div>
      </div>
    );
  }

  // Area operations
  const saveArea = async () => {
    setLoading(true);
    setError("");

    try {
      const areaData: CreateAreaRequest = {
        name: areaForm.name!,
        description: areaForm.description,
        code: areaForm.code,
        active: areaForm.active ?? true,
      };

      if (editingArea) {
        await areaBranchService.updateArea(editingArea.id, areaData);
      } else {
        await areaBranchService.createArea(areaData);
      }

      await fetchAreas();
      resetAreaForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save area");
    } finally {
      setLoading(false);
    }
  };

  const deleteArea = async (id: number) => {
    if (!confirm("Are you sure you want to delete this area?")) return;

    try {
      await areaBranchService.deleteArea(id);
      await fetchAreas();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete area");
    }
  };

  const toggleAreaStatus = async (id: number, active: boolean) => {
    try {
      if (active) {
        await areaBranchService.activateArea(id);
      } else {
        await areaBranchService.deactivateArea(id);
      }
      await fetchAreas();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update area status",
      );
    }
  };

  const editArea = (area: Area) => {
    setEditingArea(area);
    setAreaForm(area);
    setShowAreaForm(true);
  };

  const resetAreaForm = () => {
    setAreaForm({ name: "", description: "", code: "", active: true });
    setEditingArea(null);
    setShowAreaForm(false);
  };

  // Subarea operations
  const saveSubarea = async () => {
    setLoading(true);
    setError("");

    try {
      if (!subareaForm.areaId) {
        throw new Error("Area is required for subarea");
      }

      const subareaData: CreateSubareaRequest = {
        name: subareaForm.name!,
        description: subareaForm.description,
        code: subareaForm.code,
        active: subareaForm.active ?? true,
        areaId: subareaForm.areaId!,
      };

      if (editingSubarea) {
        await areaBranchService.updateSubarea(editingSubarea.id, subareaData);
      } else {
        await areaBranchService.createSubarea(subareaData);
      }

      await fetchSubareas();
      resetSubareaForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save subarea");
    } finally {
      setLoading(false);
    }
  };

  const deleteSubarea = async (id: number) => {
    if (!confirm("Are you sure you want to delete this subarea?")) return;

    try {
      await areaBranchService.deleteSubarea(id);
      await fetchSubareas();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete subarea");
    }
  };

  const toggleSubareaStatus = async (id: number, active: boolean) => {
    try {
      if (active) {
        await areaBranchService.activateSubarea(id);
      } else {
        await areaBranchService.deactivateSubarea(id);
      }
      await fetchSubareas();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update subarea status",
      );
    }
  };

  const editSubarea = (subarea: Subarea) => {
    setEditingSubarea(subarea);
    setSubareaForm(subarea);
    setShowSubareaForm(true);
  };

  const resetSubareaForm = () => {
    setSubareaForm({
      name: "",
      description: "",
      code: "",
      active: true,
      areaId: undefined,
      areaName: "",
    });
    setEditingSubarea(null);
    setShowSubareaForm(false);
  };

  // Branch operations
  const saveBranch = async () => {
    setLoading(true);
    setError("");

    try {
      if (!branchForm.subareaId) {
        throw new Error("Subarea is required for branch");
      }

      const branchData: CreateBranchRequest = {
        name: branchForm.name!,
        description: branchForm.description,
        code: branchForm.code,
        address: branchForm.address,
        phone: branchForm.phone,
        email: branchForm.email,
        active: branchForm.active ?? true,
        subareaId: branchForm.subareaId!,
      };

      if (editingBranch) {
        await areaBranchService.updateBranch(editingBranch.id, branchData);
      } else {
        await areaBranchService.createBranch(branchData);
      }

      await fetchBranches();
      resetBranchForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save branch");
    } finally {
      setLoading(false);
    }
  };

  const deleteBranch = async (id: number) => {
    if (!confirm("Are you sure you want to delete this branch?")) return;

    try {
      await areaBranchService.deleteBranch(id);
      await fetchBranches();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete branch");
    }
  };

  const toggleBranchStatus = async (id: number, active: boolean) => {
    try {
      if (active) {
        await areaBranchService.activateBranch(id);
      } else {
        await areaBranchService.deactivateBranch(id);
      }
      await fetchBranches();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update branch status",
      );
    }
  };

  const editBranch = (branch: Branch) => {
    setEditingBranch(branch);
    setBranchForm(branch);
    setShowBranchForm(true);
  };

  const resetBranchForm = () => {
    setBranchForm({
      name: "",
      description: "",
      code: "",
      address: "",
      phone: "",
      email: "",
      active: true,
      subareaId: undefined,
      subareaName: "",
      areaId: undefined,
      areaName: "",
    });
    setEditingBranch(null);
    setShowBranchForm(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">
          Call Service · Area & Branch Management
        </h2>
        <p className="text-slate-300">
          Manage areas and branches for the call service.
        </p>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-md">
          <div className="flex items-center">
            <svg
              className="h-5 w-5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-slate-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("areas")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === "areas"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-600"
              }`}
          >
            Areas
          </button>
          <button
            onClick={() => setActiveTab("subareas")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === "subareas"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-600"
              }`}
          >
            Subareas
          </button>
          <button
            onClick={() => setActiveTab("branches")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === "branches"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-600"
              }`}
          >
            Branches
          </button>
        </nav>
      </div>

      {/* Areas Section */}
      {activeTab === "areas" && (
        <div>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Areas</h2>
            <PermissionGuard
              permission={CALL_SERVICE_PERMISSIONS.AREAS.CREATE}
              fallback={
                <button
                  disabled
                  className="px-4 py-2 bg-gray-600 text-gray-400 rounded-md cursor-not-allowed"
                  title="You don't have permission to create areas"
                >
                  Add Area (No Permission)
                </button>
              }
            >
              <button
                onClick={() => setShowAreaForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                Add Area
              </button>
            </PermissionGuard>
          </div>

          {showAreaForm &&
            isClient &&
            createPortal(
              <div className="fixed inset-0 z-1000">
                <div
                  className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                  onClick={resetAreaForm}
                />
                <div className="relative z-10 flex min-h-full items-start justify-center p-4 pt-16">
                  <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-slate-950/95 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.65)] animate-slide-down">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.35em] text-cyan-300">
                          Area Management
                        </p>
                        <h3 className="mt-2 text-2xl font-semibold text-white">
                          {editingArea ? "Edit Area" : "Add New Area"}
                        </h3>
                      </div>
                      <button
                        onClick={resetAreaForm}
                        className="text-white/60 transition hover:text-white text-2xl leading-none"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                          Name *
                        </label>
                        <input
                          type="text"
                          value={areaForm.name || ""}
                          onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                          Code
                        </label>
                        <input
                          type="text"
                          value={areaForm.code || ""}
                          onChange={(e) => setAreaForm({ ...areaForm, code: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                          Description
                        </label>
                        <textarea
                          value={areaForm.description || ""}
                          onChange={(e) => setAreaForm({ ...areaForm, description: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          rows={3}
                        />
                      </div>
                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={areaForm.active || false}
                            onChange={(e) => setAreaForm({ ...areaForm, active: e.target.checked })}
                            className="mr-2 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
                          />
                          <span className="text-sm font-medium text-slate-300">
                            Active
                          </span>
                        </label>
                      </div>
                    </div>
                    <div className="mt-8 flex justify-end gap-3">
                      <button
                        onClick={resetAreaForm}
                        className="px-4 py-2 rounded-xl border border-white/10 text-slate-200 hover:bg-white/5"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveArea}
                        disabled={loading || !areaForm.name}
                        className="px-5 py-2 rounded-xl bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 disabled:opacity-50"
                      >
                        {loading ? "Saving..." : editingArea ? "Update" : "Save"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>,
              document.body
            )}

          <div className="bg-slate-800 shadow overflow-hidden rounded-lg border border-slate-700">
            <table className="min-w-full divide-y divide-slate-700">
              <thead className="bg-slate-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-slate-800 divide-y divide-slate-700">
                {areas.map((area) => (
                  <tr key={area.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      {area.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {area.code || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {area.description || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${area.active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                          }`}
                      >
                        {area.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <PermissionGuard
                        permission={CALL_SERVICE_PERMISSIONS.AREAS.EDIT}
                        fallback={
                          <button
                            disabled
                            className="text-gray-400 mr-3 cursor-not-allowed"
                            title="You don't have permission to edit areas"
                          >
                            Edit
                          </button>
                        }
                      >
                        <button
                          onClick={() => editArea(area)}
                          className="text-blue-400 hover:text-blue-300 mr-3"
                        >
                          Edit
                        </button>
                      </PermissionGuard>
                      <PermissionGuard
                        permission={CALL_SERVICE_PERMISSIONS.AREAS.EDIT}
                        fallback={
                          <button
                            disabled
                            className="text-gray-400 cursor-not-allowed"
                            title="You don't have permission to change area status"
                          >
                            {area.active ? "Deactivate" : "Activate"}
                          </button>
                        }
                      >
                        <button
                          onClick={() =>
                            toggleAreaStatus(area.id, !area.active)
                          }
                          className={`mr-3 ${area.active ? "text-yellow-400 hover:text-yellow-300" : "text-green-400 hover:text-green-300"}`}
                        >
                          {area.active ? "Deactivate" : "Activate"}
                        </button>
                      </PermissionGuard>
                      <PermissionGuard
                        permission={CALL_SERVICE_PERMISSIONS.AREAS.DELETE}
                        fallback={
                          <button
                            disabled
                            className="text-gray-400 cursor-not-allowed"
                            title="You don't have permission to delete areas"
                          >
                            Delete
                          </button>
                        }
                      >
                        <button
                          onClick={() => deleteArea(area.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          Delete
                        </button>
                      </PermissionGuard>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subareas Section */}
      {activeTab === "subareas" && (
        <div>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Subareas</h2>
            <PermissionGuard
              permission={CALL_SERVICE_PERMISSIONS.SUBAREAS.CREATE}
              fallback={
                <button
                  disabled
                  className="px-4 py-2 bg-gray-600 text-white rounded-md cursor-not-allowed"
                  title="You don't have permission to create subareas"
                >
                  Add Subarea
                </button>
              }
            >
              <button
                onClick={() => setShowSubareaForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                Add Subarea
              </button>
            </PermissionGuard>
          </div>

          {/* Subarea Form Modal */}
          {showSubareaForm &&
            isClient &&
            createPortal(
              <div className="fixed inset-0 z-[1000]">
                <div
                  className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                  onClick={resetSubareaForm}
                />
                <div className="relative z-10 flex min-h-full items-start justify-center p-4 pt-16">
                  <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-slate-950/95 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.65)] animate-slide-down">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.35em] text-cyan-300">
                          Subarea Management
                        </p>
                        <h3 className="mt-2 text-2xl font-semibold text-white">
                          {editingSubarea ? "Edit Subarea" : "Add Subarea"}
                        </h3>
                      </div>
                      <button
                        onClick={resetSubareaForm}
                        className="text-white/60 transition hover:text-white text-2xl leading-none"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="mt-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                          Area *
                        </label>
                        <select
                          value={subareaForm.areaId || ""}
                          onChange={(e) => {
                            const selectedArea = areas.find((a) => a.id === Number(e.target.value));
                            setSubareaForm({
                              ...subareaForm,
                              areaId: Number(e.target.value),
                              areaName: selectedArea?.name || "",
                            });
                          }}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          required
                        >
                          <option value="">Select Area</option>
                          {areas.map((area) => (
                            <option key={area.id} value={area.id}>
                              {area.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                          Name *
                        </label>
                        <input
                          type="text"
                          value={subareaForm.name || ""}
                          onChange={(e) => setSubareaForm({ ...subareaForm, name: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                          Code
                        </label>
                        <input
                          type="text"
                          value={subareaForm.code || ""}
                          onChange={(e) => setSubareaForm({ ...subareaForm, code: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                          Description
                        </label>
                        <textarea
                          value={subareaForm.description || ""}
                          onChange={(e) => setSubareaForm({ ...subareaForm, description: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          rows={3}
                        />
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="subarea-active"
                          checked={subareaForm.active ?? true}
                          onChange={(e) => setSubareaForm({ ...subareaForm, active: e.target.checked })}
                          className="h-4 w-4 text-cyan-500 focus:ring-cyan-500 border-slate-600 rounded bg-slate-800"
                        />
                        <label htmlFor="subarea-active" className="ml-2 block text-sm text-slate-300">
                          Active
                        </label>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-8">
                      <button
                        onClick={resetSubareaForm}
                        className="px-4 py-2 rounded-xl border border-white/10 text-slate-200 hover:bg-white/5"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveSubarea}
                        disabled={loading}
                        className="px-5 py-2 rounded-xl bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 disabled:opacity-50"
                      >
                        {loading ? "Saving..." : editingSubarea ? "Update" : "Create"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>,
              document.body
            )}

          {/* Subareas Table */}
          <div className="bg-slate-800 shadow overflow-hidden sm:rounded-md">
            <table className="min-w-full divide-y divide-slate-700">
              <thead className="bg-slate-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Area
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-slate-800 divide-y divide-slate-700">
                {subareas.map((subarea) => (
                  <tr key={subarea.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      {subarea.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {subarea.code || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {subarea.areaName}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {subarea.description || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${subarea.active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                          }`}
                      >
                        {subarea.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <PermissionGuard
                        permission={CALL_SERVICE_PERMISSIONS.SUBAREAS.EDIT}
                        fallback={
                          <button
                            disabled
                            className="text-gray-400 mr-3 cursor-not-allowed"
                            title="You don't have permission to edit subareas"
                          >
                            Edit
                          </button>
                        }
                      >
                        <button
                          onClick={() => editSubarea(subarea)}
                          className="text-blue-400 hover:text-blue-300 mr-3"
                        >
                          Edit
                        </button>
                      </PermissionGuard>
                      <PermissionGuard
                        permission={CALL_SERVICE_PERMISSIONS.SUBAREAS.DELETE}
                        fallback={
                          <button
                            disabled
                            className="text-gray-400 cursor-not-allowed"
                            title="You don't have permission to delete subareas"
                          >
                            Delete
                          </button>
                        }
                      >
                        <button
                          onClick={() => deleteSubarea(subarea.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          Delete
                        </button>
                      </PermissionGuard>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Branches Section */}
      {activeTab === "branches" && (
        <div>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Branches</h2>
            <PermissionGuard
              permission={CALL_SERVICE_PERMISSIONS.BRANCHES.CREATE}
              fallback={
                <button
                  disabled
                  className="px-4 py-2 bg-gray-600 text-gray-400 rounded-md cursor-not-allowed"
                  title="You don't have permission to create branches"
                >
                  Add Branch (No Permission)
                </button>
              }
            >
              <button
                onClick={() => setShowBranchForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                Add Branch
              </button>
            </PermissionGuard>
          </div>

          {showBranchForm &&
            isClient &&
            createPortal(
              <div className="fixed inset-0 z-[1000]">
                <div
                  className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                  onClick={resetBranchForm}
                />
                <div className="relative z-10 flex min-h-full items-start justify-center p-4 pt-16">
                  <div className="w-full max-w-4xl rounded-3xl border border-white/10 bg-slate-950/95 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.65)] animate-slide-down">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.35em] text-cyan-300">
                          Branch Management
                        </p>
                        <h3 className="mt-2 text-2xl font-semibold text-white">
                          {editingBranch ? "Edit Branch" : "Add New Branch"}
                        </h3>
                      </div>
                      <button
                        onClick={resetBranchForm}
                        className="text-white/60 transition hover:text-white text-2xl leading-none"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                          Name *
                        </label>
                        <input
                          type="text"
                          value={branchForm.name || ""}
                          onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                          Code
                        </label>
                        <input
                          type="text"
                          value={branchForm.code || ""}
                          onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                          Subarea *
                        </label>
                        <select
                          value={branchForm.subareaId ?? ""}
                          onChange={(e) => {
                            const selectedSubarea = subareas.find((s) => s.id === Number(e.target.value));
                            setBranchForm({
                              ...branchForm,
                              subareaId: selectedSubarea?.id,
                              subareaName: selectedSubarea?.name,
                              areaId: selectedSubarea?.areaId,
                              areaName: selectedSubarea?.areaName,
                            });
                          }}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          required
                        >
                          <option value="" className="bg-slate-800">
                            Select Subarea
                          </option>
                          {subareas
                            .filter((subarea) => subarea.active)
                            .map((subarea) => (
                              <option key={subarea.id} value={subarea.id} className="bg-slate-800">
                                {subarea.name} ({subarea.areaName})
                              </option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                          Phone
                        </label>
                        <input
                          type="text"
                          value={branchForm.phone || ""}
                          onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={branchForm.email || ""}
                          onChange={(e) => setBranchForm({ ...branchForm, email: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                          Address
                        </label>
                        <textarea
                          value={branchForm.address || ""}
                          onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          rows={2}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                          Description
                        </label>
                        <textarea
                          value={branchForm.description || ""}
                          onChange={(e) => setBranchForm({
                            ...branchForm,
                            description: e.target.value,
                          })}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          rows={3}
                        />
                      </div>
                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={branchForm.active || false}
                            onChange={(e) =>
                              setBranchForm({
                                ...branchForm,
                                active: e.target.checked,
                              })
                            }
                            className="mr-2 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
                          />
                          <span className="text-sm font-medium text-slate-300">
                            Active
                          </span>
                        </label>
                      </div>
                    </div>
                    <div className="mt-8 flex justify-end gap-3">
                      <button
                        onClick={resetBranchForm}
                        className="px-4 py-2 rounded-xl border border-white/10 text-slate-200 hover:bg-white/5"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveBranch}
                        disabled={loading || !branchForm.name || !branchForm.subareaId}
                        className="px-5 py-2 rounded-xl bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 disabled:opacity-50"
                      >
                        {loading ? "Saving..." : editingBranch ? "Update" : "Save"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>,
              document.body
            )}

          <div className="bg-slate-800 shadow overflow-hidden rounded-lg border border-slate-700">
            <table className="min-w-full divide-y divide-slate-700">
              <thead className="bg-slate-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Area
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Subarea
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-slate-800 divide-y divide-slate-700">
                {branches.map((branch) => (
                  <tr key={branch.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      {branch.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {branch.code || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {branch.areaName || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {branch.subareaName || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      <div>{branch.phone || "-"}</div>
                      <div className="text-xs">{branch.email || "-"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${branch.active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                          }`}
                      >
                        {branch.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <PermissionGuard
                        permission={CALL_SERVICE_PERMISSIONS.BRANCHES.UPDATE}
                        fallback={
                          <button
                            disabled
                            className="text-gray-400 mr-3 cursor-not-allowed"
                            title="You don't have permission to edit branches"
                          >
                            Edit
                          </button>
                        }
                      >
                        <button
                          onClick={() => editBranch(branch)}
                          className="text-blue-400 hover:text-blue-300 mr-3"
                        >
                          Edit
                        </button>
                      </PermissionGuard>
                      <PermissionGuard
                        permission={CALL_SERVICE_PERMISSIONS.BRANCHES.UPDATE}
                        fallback={
                          <button
                            disabled
                            className="text-gray-400 mr-3 cursor-not-allowed"
                            title="You don't have permission to change branch status"
                          >
                            {branch.active ? "Deactivate" : "Activate"}
                          </button>
                        }
                      >
                        <button
                          onClick={() =>
                            toggleBranchStatus(branch.id, !branch.active)
                          }
                          className={`mr-3 ${branch.active ? "text-yellow-400 hover:text-yellow-300" : "text-green-400 hover:text-green-300"}`}
                        >
                          {branch.active ? "Deactivate" : "Activate"}
                        </button>
                      </PermissionGuard>
                      <PermissionGuard
                        permission={CALL_SERVICE_PERMISSIONS.BRANCHES.DELETE}
                        fallback={
                          <button
                            disabled
                            className="text-gray-400 cursor-not-allowed"
                            title="You don't have permission to delete branches"
                          >
                            Delete
                          </button>
                        }
                      >
                        <button
                          onClick={() => deleteBranch(branch.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          Delete
                        </button>
                      </PermissionGuard>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
