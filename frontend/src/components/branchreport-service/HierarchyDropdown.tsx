import React, { useMemo } from "react";

export interface Area {
  id: string;
  name: string;
  description?: string;
  areaId?: string;
  subAreaId?: string;
}

export interface SubArea {
  id: string;
  name: string;
  description?: string;
  areaId: string;
  subAreaId?: string;
}

export interface Branch {
  id: string;
  name: string;
  description?: string;
  areaId: string;
  subAreaId: string;
}

export interface BranchreportUserAssignment {
  id: number;
  userId: string;
  areaId?: string;
  areaName?: string;
  subAreaId?: string;
  subAreaName?: string;
  branchId?: string;
  branchName?: string;
  active: boolean;
  assignedAt: string;
  updatedAt: string;
  assignmentType: "AREA" | "SUB_AREA" | "BRANCH";
}

// Utility to toggle selection
export const toggleSelection = (selected: string[], id: string): string[] => {
  return selected.includes(id)
    ? selected.filter((s) => s !== id)
    : [...selected, id];
};

// Utility to filter by user assignments - shows all data for users without assignments
export const filterByAssignments = {
  area: (areas: Area[], assignments: BranchreportUserAssignment[]) => {
    // If no assignments, or only dummy assignments (userId is empty), show all areas (admin user)
    if (assignments.length === 0 || assignments.every(a => !a.userId)) return areas;
    return areas.filter(area => assignments.some(a => a.areaId === area.id && a.userId));
  },

  subArea: (subAreas: SubArea[], assignments: BranchreportUserAssignment[]) => {
    // If no assignments, or only dummy assignments (userId is empty), show all sub-areas (admin user)
    if (assignments.length === 0 || assignments.every(a => !a.userId)) return subAreas;
    return subAreas.filter(subArea => assignments.some(a => a.subAreaId === subArea.id && a.userId));
  },

  branch: (branches: Branch[], assignments: BranchreportUserAssignment[]) => {
    // If no assignments, or only dummy assignments (userId is empty), show all branches (admin user)
    if (assignments.length === 0 || assignments.every(a => !a.userId)) return branches;
    return branches.filter(branch => assignments.some(a => a.branchId === branch.id && a.userId));
  },
};

export interface SimpleHierarchyDropdownProps {
  type: "area" | "subarea" | "branch";
  value?: string;
  onChange: (value?: string) => void;
  areas: Area[];
  subAreas: SubArea[];
  branches: Branch[];
  placeholder?: string;
  className?: string;
}

export function SimpleHierarchyDropdown({
  type,
  value,
  onChange,
  areas,
  subAreas,
  branches,
  placeholder = "Select...",
  className = "",
}: SimpleHierarchyDropdownProps) {
  const baseClassName = "w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-100 placeholder-slate-400";

  const getOptions = () => {
    switch (type) {
      case "area":
        return areas.map((area) => ({
          value: area.id,
          label: area.name,
          parentArea: undefined,
          parentSubArea: undefined
        }));
      case "subarea":
        return subAreas.map((subArea) => ({
          value: subArea.id,
          label: subArea.name,
          parentArea: areas.find((a) => a.id === subArea.areaId)?.name,
          parentSubArea: undefined
        }));
      case "branch":
        return branches.map((branch) => ({
          value: branch.id,
          label: branch.name,
          parentArea: areas.find((a) => a.id === branch.areaId)?.name,
          parentSubArea: subAreas.find((s) => s.id === branch.subAreaId)?.name
        }));
      default:
        return [];
    }
  };

  const options = getOptions();

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value === "all" ? "all" : e.target.value)}
      className={`${baseClassName} ${className}`}
    >
      <option value="all">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
          {option.parentArea && ` (${option.parentArea}`}
          {option.parentSubArea && ` / ${option.parentSubArea}`}
          {option.parentArea && ")"}
        </option>
      ))}
    </select>
  );
}

export interface MultiSelectHierarchyProps {
  areas: Area[];
  subAreas: SubArea[];
  branches: Branch[];
  currentUserAssignments: BranchreportUserAssignment[];
  selectedAreaIds: string[];
  selectedSubAreaIds: string[];
  selectedBranchIds: string[];
  onAreaChange: (ids: string[]) => void;
  onSubAreaChange: (ids: string[]) => void;
  onBranchChange: (ids: string[]) => void;
  showAreas?: boolean;
  showSubAreas?: boolean;
  showBranches?: boolean;
  disabled?: boolean;
  className?: string;
}

export function MultiSelectHierarchyDropdown({
  areas,
  subAreas,
  branches,
  currentUserAssignments,
  selectedAreaIds,
  selectedSubAreaIds,
  selectedBranchIds,
  onAreaChange,
  onSubAreaChange,
  onBranchChange,
  showAreas = true,
  showSubAreas = true,
  showBranches = true,
  disabled = false,
  className = "",
}: MultiSelectHierarchyProps) {

  // Filter hierarchy based on current user's assignments
  const filteredAreas = useMemo(() => {
    return filterByAssignments.area(areas, currentUserAssignments);
  }, [areas, currentUserAssignments]);

  const filteredSubAreas = useMemo(() => {
    return filterByAssignments.subArea(subAreas, currentUserAssignments);
  }, [subAreas, currentUserAssignments]);

  const filteredBranches = useMemo(() => {
    return filterByAssignments.branch(branches, currentUserAssignments);
  }, [branches, currentUserAssignments]);

  const handleAreaToggle = (areaId: string) => {
    const newSelected = toggleSelection(selectedAreaIds, areaId);
    onAreaChange(newSelected);

    // If deselecting area, also deselect all its sub-areas and branches
    if (!newSelected.includes(areaId)) {
      // Deselect all sub-areas in this area
      const areaSubAreas = subAreas.filter(sa => sa.areaId === areaId);
      const areaSubAreaIds = areaSubAreas.map(sa => sa.id);
      const newSubAreaSelected = selectedSubAreaIds.filter(id => !areaSubAreaIds.includes(id));
      onSubAreaChange(newSubAreaSelected);

      // Deselect all branches in this area
      const areaBranches = branches.filter(b => b.areaId === areaId);
      const areaBranchIds = areaBranches.map(b => b.id);
      const newBranchSelected = selectedBranchIds.filter(id => !areaBranchIds.includes(id));
      onBranchChange(newBranchSelected);
    }
  };

  const handleSubAreaToggle = (subAreaId: string) => {
    const newSelected = toggleSelection(selectedSubAreaIds, subAreaId);
    onSubAreaChange(newSelected);

    // Auto-select parent area when sub-area is selected
    const subArea = subAreas.find(sa => sa.id === subAreaId);
    if (subArea && newSelected.includes(subAreaId) && !selectedAreaIds.includes(subArea.areaId)) {
      const newAreaSelected = toggleSelection(selectedAreaIds, subArea.areaId);
      onAreaChange(newAreaSelected);
    }

    // If deselecting sub-area, also deselect all its branches
    if (!newSelected.includes(subAreaId)) {
      const subAreaBranches = branches.filter(b => b.subAreaId === subAreaId);
      const subAreaBranchIds = subAreaBranches.map(b => b.id);
      const newBranchSelected = selectedBranchIds.filter(id => !subAreaBranchIds.includes(id));
      onBranchChange(newBranchSelected);
    }
  };

  const handleBranchToggle = (branchId: string) => {
    const newSelected = toggleSelection(selectedBranchIds, branchId);
    onBranchChange(newSelected);

    // Auto-select parent sub-area and area when branch is selected
    const branch = branches.find(b => b.id === branchId);
    if (branch && newSelected.includes(branchId)) {
      // Auto-select parent sub-area
      if (branch.subAreaId && !selectedSubAreaIds.includes(branch.subAreaId)) {
        const newSubAreaSelected = toggleSelection(selectedSubAreaIds, branch.subAreaId);
        onSubAreaChange(newSubAreaSelected);

        // Auto-select parent area (when sub-area is selected)
        if (branch.areaId && !selectedAreaIds.includes(branch.areaId)) {
          const newAreaSelected = toggleSelection(selectedAreaIds, branch.areaId);
          onAreaChange(newAreaSelected);
        }
      }
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {showAreas && filteredAreas.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-slate-200 mb-2">Areas</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto border border-slate-600 rounded p-3 bg-slate-700/40">
            {filteredAreas.map((area) => (
              <label key={area.id} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedAreaIds.includes(area.id)}
                  onChange={() => handleAreaToggle(area.id)}
                  disabled={disabled}
                  className="rounded border-slate-500 text-blue-500 focus:ring-blue-400"
                />
                <span className="text-sm text-slate-100">{area.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {showSubAreas && filteredSubAreas.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-slate-200 mb-2">Sub-Areas</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto border border-slate-600 rounded p-3 bg-slate-700/40">
            {filteredSubAreas.map((subArea) => (
              <label key={subArea.id} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedSubAreaIds.includes(subArea.id)}
                  onChange={() => handleSubAreaToggle(subArea.id)}
                  disabled={disabled}
                  className="rounded border-slate-500 text-blue-500 focus:ring-blue-400"
                />
                <span className="text-sm text-slate-100">{subArea.name}</span>
                <span className="text-xs text-slate-400">
                  ({areas.find(a => a.id === subArea.areaId)?.name})
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {showBranches && filteredBranches.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-slate-200 mb-2">Branches</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto border border-slate-600 rounded p-3 bg-slate-700/40">
            {filteredBranches.map((branch) => (
              <label key={branch.id} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedBranchIds.includes(branch.id)}
                  onChange={() => handleBranchToggle(branch.id)}
                  disabled={disabled}
                  className="rounded border-slate-500 text-blue-500 focus:ring-blue-400"
                />
                <span className="text-sm text-slate-100">{branch.name}</span>
                <span className="text-xs text-slate-400">
                  ({areas.find(a => a.id === branch.areaId)?.name} / {subAreas.find(s => s.id === branch.subAreaId)?.name})
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
