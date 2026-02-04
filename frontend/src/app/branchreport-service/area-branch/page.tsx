"use client";

import { useEffect, useMemo, useState } from "react";
import { BranchreportServiceGuard } from "@/components/branchreport-service/BranchreportServiceGuard";
import { useToast } from "@/components/ui/Toast";
import {
  branchreportHierarchyService,
  Area,
  SubArea,
  Branch,
  AreaPayload,
  SubAreaPayload,
  BranchPayload,
} from "@/services/branchreport-service/branchreportHierarchyService";
import { HierarchyDropdown, FilterHierarchyDropdown } from "@/components/branchreport-service/HierarchyDropdown";

type FormState<T> = Partial<T>;

const defaultAreaForm: FormState<AreaPayload> = {
  name: "",
  description: "",
};

const defaultSubAreaForm: FormState<SubAreaPayload> = {
  name: "",
  description: "",
  areaId: undefined,
};

const defaultBranchForm: FormState<BranchPayload> = {
  name: "",
  description: "",
  areaId: undefined,
  subAreaId: undefined,
};

export default function BranchreportAreaBranchPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [subAreas, setSubAreas] = useState<SubArea[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  const [areaForm, setAreaForm] = useState(defaultAreaForm);
  const [editingArea, setEditingArea] = useState<Area | null>(null);

  const [subAreaForm, setSubAreaForm] = useState(defaultSubAreaForm);
  const [editingSubArea, setEditingSubArea] = useState<SubArea | null>(null);

  const [branchForm, setBranchForm] = useState(defaultBranchForm);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  // Filter states - completely independent for each section
  const [areaFilter, setAreaFilter] = useState("");

  // Sub-Areas filters (independent)
  const [subAreaFilter, setSubAreaFilter] = useState("");
  const [subAreaAreaFilter, setSubAreaAreaFilter] = useState("");

  // Branches filters (independent)
  const [branchFilter, setBranchFilter] = useState("");
  const [branchAreaFilter, setBranchAreaFilter] = useState("");
  const [branchSubAreaFilter, setBranchSubAreaFilter] = useState("");

  const filteredSubAreas = useMemo(() => {
    if (!branchForm.areaId) return [];
    return subAreas.filter((subArea) => subArea.areaId === branchForm.areaId);
  }, [branchForm.areaId, subAreas]);

  const filteredBranchesDisplay = useMemo(() => {
    return branches.filter(branch => {
      const matchesSearch = !branchFilter ||
        branch.name.toLowerCase().includes(branchFilter.toLowerCase());
      const matchesArea = !branchAreaFilter || branch.areaId === branchAreaFilter;
      const matchesSubArea = !branchSubAreaFilter || branch.subAreaId === branchSubAreaFilter;
      return matchesSearch && matchesArea && matchesSubArea;
    });
  }, [branches, branchFilter, branchAreaFilter, branchSubAreaFilter]);

  // Filtered data for display
  const filteredAreasDisplay = useMemo(() => {
    return areas.filter(area =>
      area.name.toLowerCase().includes(areaFilter.toLowerCase())
    );
  }, [areas, areaFilter]);

  const filteredSubAreasDisplay = useMemo(() => {
    return subAreas.filter(subArea => {
      const matchesSearch = !subAreaFilter ||
        subArea.name.toLowerCase().includes(subAreaFilter.toLowerCase());
      const matchesArea = !subAreaAreaFilter || subArea.areaId === subAreaAreaFilter;
      return matchesSearch && matchesArea;
    });
  }, [subAreas, subAreaFilter, subAreaAreaFilter]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [areaData, subAreaData, branchData] = await Promise.all([
        branchreportHierarchyService.listAreas(),
        branchreportHierarchyService.listSubAreas(),
        branchreportHierarchyService.listBranches(),
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
  }, []);

  const upsertArea = async () => {
    if (!areaForm.name) {
      showToast("Area name is required", "error");
      return;
    }
    setLoading(true);
    try {
      const payload: AreaPayload = {
        name: areaForm.name,
        description: areaForm.description,
      };
      if (editingArea) {
        await branchreportHierarchyService.updateArea(editingArea.id, payload);
        showToast("Area updated");
      } else {
        await branchreportHierarchyService.createArea(payload);
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
      showToast("Sub area name and parent area are required", "error");
      return;
    }
    setLoading(true);
    try {
      const payload: SubAreaPayload = {
        name: subAreaForm.name,
        description: subAreaForm.description,
        areaId: subAreaForm.areaId,
      };
      if (editingSubArea) {
        await branchreportHierarchyService.updateSubArea(editingSubArea.id, payload);
        showToast("Sub area updated");
      } else {
        await branchreportHierarchyService.createSubArea(payload);
        showToast("Sub area created");
      }
      setSubAreaForm(defaultSubAreaForm);
      setEditingSubArea(null);
      await loadAll();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to save sub area",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const upsertBranch = async () => {
    if (!branchForm.name || !branchForm.areaId || !branchForm.subAreaId) {
      showToast("Branch name, area, and sub area are required", "error");
      return;
    }
    setLoading(true);
    try {
      const payload: BranchPayload = {
        name: branchForm.name,
        description: branchForm.description,
        areaId: branchForm.areaId,
        subAreaId: branchForm.subAreaId,
      };
      if (editingBranch) {
        await branchreportHierarchyService.updateBranch(editingBranch.id, payload);
        showToast("Branch updated");
      } else {
        await branchreportHierarchyService.createBranch(payload);
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

  const deleteArea = async (id: string) => {
    if (!confirm("Are you sure you want to delete this area? This will also delete all sub-areas and branches under it.")) {
      return;
    }
    setLoading(true);
    try {
      await branchreportHierarchyService.deleteArea(id);
      showToast("Area deleted");
      await loadAll();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to delete area",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteSubArea = async (id: string) => {
    if (!confirm("Are you sure you want to delete this sub-area? This will also delete all branches under it.")) {
      return;
    }
    setLoading(true);
    try {
      await branchreportHierarchyService.deleteSubArea(id);
      showToast("Sub area deleted");
      await loadAll();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to delete sub area",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteBranch = async (id: string) => {
    if (!confirm("Are you sure you want to delete this branch?")) {
      return;
    }
    setLoading(true);
    try {
      await branchreportHierarchyService.deleteBranch(id);
      showToast("Branch deleted");
      await loadAll();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to delete branch",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const editArea = (area: Area) => {
    setEditingArea(area);
    setAreaForm({
      name: area.name,
      description: area.description,
    });
  };

  const editSubArea = (subArea: SubArea) => {
    setEditingSubArea(subArea);
    setSubAreaForm({
      name: subArea.name,
      description: subArea.description,
      areaId: subArea.areaId,
    });
  };

  const editBranch = (branch: Branch) => {
    setEditingBranch(branch);
    setBranchForm({
      name: branch.name,
      description: branch.description,
      areaId: branch.areaId,
      subAreaId: branch.subAreaId,
    });
  };

  const cancelAreaEdit = () => {
    setEditingArea(null);
    setAreaForm(defaultAreaForm);
  };

  const cancelSubAreaEdit = () => {
    setEditingSubArea(null);
    setSubAreaForm(defaultSubAreaForm);
  };

  const cancelBranchEdit = () => {
    setEditingBranch(null);
    setBranchForm(defaultBranchForm);
  };

  return (
    <BranchreportServiceGuard>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-8">Branch Report Hierarchy Management</h1>

              {/* Areas Section */}
              <div className="mb-12">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Areas</h2>
                
                {/* Area Form */}
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h3 className="text-lg font-medium text-gray-700 mb-3">
                    {editingArea ? "Edit Area" : "Create New Area"}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Area Name *
                      </label>
                      <input
                        type="text"
                        value={areaForm.name || ""}
                        onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter area name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={areaForm.description || ""}
                        onChange={(e) => setAreaForm({ ...areaForm, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter description"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={upsertArea}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {editingArea ? "Update Area" : "Create Area"}
                    </button>
                    {editingArea && (
                      <button
                        onClick={cancelAreaEdit}
                        disabled={loading}
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                {/* Area Filter */}
                <div className="mb-4">
                  <input
                    type="text"
                    value={areaFilter}
                    onChange={(e) => setAreaFilter(e.target.value)}
                    className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Search areas..."
                  />
                </div>

                {/* Areas List */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created At
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredAreasDisplay.map((area) => (
                        <tr key={area.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {area.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {area.description || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(area.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => editArea(area)}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteArea(area.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sub-Areas Section */}
              <div className="mb-12">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Sub-Areas</h2>
                
                {/* Sub-Area Form */}
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h3 className="text-lg font-medium text-gray-700 mb-3">
                    {editingSubArea ? "Edit Sub-Area" : "Create New Sub-Area"}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sub-Area Name *
                      </label>
                      <input
                        type="text"
                        value={subAreaForm.name || ""}
                        onChange={(e) => setSubAreaForm({ ...subAreaForm, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter sub-area name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Parent Area *
                      </label>
                      <HierarchyDropdown
                        type="area"
                        value={subAreaForm.areaId}
                        onChange={(value) => setSubAreaForm({ ...subAreaForm, areaId: value })}
                        areas={areas}
                        subAreas={subAreas}
                        branches={branches}
                        placeholder="Select parent area"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={subAreaForm.description || ""}
                        onChange={(e) => setSubAreaForm({ ...subAreaForm, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter description"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={upsertSubArea}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {editingSubArea ? "Update Sub-Area" : "Create Sub-Area"}
                    </button>
                    {editingSubArea && (
                      <button
                        onClick={cancelSubAreaEdit}
                        disabled={loading}
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub-Area Filters */}
                <div className="mb-4 flex gap-4">
                  <input
                    type="text"
                    value={subAreaFilter}
                    onChange={(e) => setSubAreaFilter(e.target.value)}
                    className="flex-1 md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Search sub-areas..."
                  />
                  <FilterHierarchyDropdown
                    type="area"
                    value={subAreaAreaFilter}
                    onChange={setSubAreaAreaFilter}
                    areas={areas}
                    subAreas={subAreas}
                    branches={branches}
                    placeholder="All areas"
                    className="w-48"
                  />
                </div>

                {/* Sub-Areas List */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Parent Area
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created At
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredSubAreasDisplay.map((subArea) => {
                        const parentArea = areas.find(a => a.id === subArea.areaId);
                        return (
                          <tr key={subArea.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {subArea.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {parentArea?.name || "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {subArea.description || "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(subArea.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => editSubArea(subArea)}
                                className="text-indigo-600 hover:text-indigo-900 mr-3"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteSubArea(subArea.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Branches Section */}
              <div className="mb-12">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Branches</h2>
                
                {/* Branch Form */}
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h3 className="text-lg font-medium text-gray-700 mb-3">
                    {editingBranch ? "Edit Branch" : "Create New Branch"}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Branch Name *
                      </label>
                      <input
                        type="text"
                        value={branchForm.name || ""}
                        onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter branch name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Area *
                      </label>
                      <HierarchyDropdown
                        type="area"
                        value={branchForm.areaId}
                        onChange={(value) => setBranchForm({ ...branchForm, areaId: value, subAreaId: undefined })}
                        areas={areas}
                        subAreas={subAreas}
                        branches={branches}
                        placeholder="Select area"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sub-Area *
                      </label>
                      <HierarchyDropdown
                        type="subarea"
                        value={branchForm.subAreaId}
                        onChange={(value) => setBranchForm({ ...branchForm, subAreaId: value })}
                        areas={areas}
                        subAreas={subAreas}
                        branches={branches}
                        placeholder="Select sub-area"
                        disabled={!branchForm.areaId}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={branchForm.description || ""}
                        onChange={(e) => setBranchForm({ ...branchForm, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter description"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={upsertBranch}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {editingBranch ? "Update Branch" : "Create Branch"}
                    </button>
                    {editingBranch && (
                      <button
                        onClick={cancelBranchEdit}
                        disabled={loading}
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                {/* Branch Filters */}
                <div className="mb-4 flex gap-4">
                  <input
                    type="text"
                    value={branchFilter}
                    onChange={(e) => setBranchFilter(e.target.value)}
                    className="flex-1 md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Search branches..."
                  />
                  <FilterHierarchyDropdown
                    type="area"
                    value={branchAreaFilter}
                    onChange={(value) => setBranchAreaFilter(value)}
                    areas={areas}
                    subAreas={subAreas}
                    branches={branches}
                    placeholder="All areas"
                    className="w-48"
                  />
                  <FilterHierarchyDropdown
                    type="subarea"
                    value={branchSubAreaFilter}
                    onChange={(value) => setBranchSubAreaFilter(value)}
                    areas={areas}
                    subAreas={subAreas}
                    branches={branches}
                    placeholder="All sub-areas"
                    className="w-48"
                  />
                </div>

                {/* Branches List */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Area
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sub-Area
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created At
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredBranchesDisplay.map((branch) => {
                        const parentArea = areas.find(a => a.id === branch.areaId);
                        const parentSubArea = subAreas.find(s => s.id === branch.subAreaId);
                        return (
                          <tr key={branch.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {branch.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {parentArea?.name || "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {parentSubArea?.name || "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {branch.description || "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(branch.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => editBranch(branch)}
                                className="text-indigo-600 hover:text-indigo-900 mr-3"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteBranch(branch.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BranchreportServiceGuard>
  );
}
