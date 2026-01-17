"use client";

import React, { useMemo } from "react";
import { MarketingArea, MarketingSubArea, MarketingBranch } from "@/services/marketing-service/marketingHierarchyService";
import { MarketingUserAssignment } from "@/services/marketingUserAssignmentService";

// Common types
type FilterValue = number | "all";

// Base interfaces
export interface HierarchyDropdownProps {
    areas: MarketingArea[];
    subAreas: MarketingSubArea[];
    branches: MarketingBranch[];
    currentUserAssignments: MarketingUserAssignment[];
    disabled?: boolean;
    className?: string;
}

// Multi-select checkbox component props
export interface MultiSelectHierarchyProps extends HierarchyDropdownProps {
    selectedAreaIds: number[];
    selectedSubAreaIds: number[];
    selectedBranchIds: number[];
    onAreaChange: (areaIds: number[]) => void;
    onSubAreaChange: (subAreaIds: number[]) => void;
    onBranchChange: (branchIds: number[]) => void;
    showAreas?: boolean;
    showSubAreas?: boolean;
    showBranches?: boolean;
}

// Single-select dropdown component props
export interface SingleSelectHierarchyProps extends HierarchyDropdownProps {
    selectedAreaId?: number;
    selectedSubAreaId?: number | "all";
    selectedBranchId?: number;
    onAreaChange: (areaId?: number) => void;
    onSubAreaChange: (subAreaId?: number | "all") => void;
    onBranchChange: (branchId?: number) => void;
    showAreas?: boolean;
    showSubAreas?: boolean;
    showBranches?: boolean;
    allowAll?: boolean; // For "all" option in filters
}

// Filter dropdown component props
export interface FilterHierarchyProps extends HierarchyDropdownProps {
    areaFilter: FilterValue;
    subAreaFilter: FilterValue;
    branchFilter: FilterValue;
    onAreaFilterChange: (value: FilterValue) => void;
    onSubAreaFilterChange: (value: FilterValue) => void;
    onBranchFilterChange: (value: FilterValue) => void;
    showAreas?: boolean;
    showSubAreas?: boolean;
    showBranches?: boolean;
}

// Utility function to toggle selection
export const toggleSelection = (prev: number[], value: number): number[] => {
    return prev.includes(value)
        ? prev.filter((id) => id !== value)
        : [...prev, value];
};

// Utility to filter by user assignments
export const filterByAssignments = {
    area: (areas: MarketingArea[], assignments: MarketingUserAssignment[]) =>
        areas.filter(area => assignments.some(a => a.areaId === area.id)),

    subArea: (subAreas: MarketingSubArea[], assignments: MarketingUserAssignment[]) =>
        subAreas.filter(subArea => assignments.some(a => a.subAreaId === subArea.id)),

    branch: (branches: MarketingBranch[], assignments: MarketingUserAssignment[]) =>
        branches.filter(branch => assignments.some(a => a.branchId === branch.id)),
};

// Multi-select checkbox component
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
    // Filter data by user assignments
    const availableAreas = useMemo(() =>
        filterByAssignments.area(areas, currentUserAssignments),
        [areas, currentUserAssignments]
    );

    const availableSubAreas = useMemo(() =>
        filterByAssignments.subArea(subAreas, currentUserAssignments),
        [subAreas, currentUserAssignments]
    );

    const availableBranches = useMemo(() =>
        filterByAssignments.branch(branches, currentUserAssignments),
        [branches, currentUserAssignments]
    );

    // Group branches by area/sub-area for display
    const groupedBranches = useMemo(() => {
        const groups: { id: string; label: string; branches: MarketingBranch[] }[] = [];
        const seenKeys = new Set<string>();

        if (selectedSubAreaIds.length > 0) {
            selectedSubAreaIds.forEach((subAreaId) => {
                const label = subAreas.find((sub) => sub.id === subAreaId)?.name || `Sub-Area ${subAreaId}`;
                const relatedBranches = availableBranches.filter((branch) => branch.subAreaId === subAreaId);

                if (relatedBranches.length > 0) {
                    const key = `subarea-${subAreaId}`;
                    if (!seenKeys.has(key)) {
                        groups.push({ id: key, label, branches: relatedBranches });
                        seenKeys.add(key);
                    }
                }
            });
        } else if (selectedAreaIds.length > 0) {
            selectedAreaIds.forEach((areaId) => {
                const label = areas.find((area) => area.id === areaId)?.name || `Area ${areaId}`;
                const relatedBranches = availableBranches.filter((branch) => branch.areaId === areaId);

                if (relatedBranches.length > 0) {
                    const key = `area-${areaId}`;
                    if (!seenKeys.has(key)) {
                        groups.push({ id: key, label, branches: relatedBranches });
                        seenKeys.add(key);
                    }
                }
            });
        }

        return groups;
    }, [selectedAreaIds, selectedSubAreaIds, availableBranches, areas, subAreas]);

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Areas Section */}
            {showAreas && (
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-slate-300">
                            Area(s)
                        </label>
                        <span className="text-xs text-slate-400">
                            {selectedAreaIds.length} selected
                        </span>
                    </div>
                    <div className="max-h-48 overflow-y-auto rounded-md border border-slate-600 bg-slate-800/40 divide-y divide-slate-700">
                        {availableAreas.length === 0 ? (
                            <p className="px-3 py-2 text-sm text-slate-400">
                                No areas available
                            </p>
                        ) : (
                            availableAreas.map((area) => {
                                const checked = selectedAreaIds.includes(area.id);
                                return (
                                    <label
                                        key={area.id}
                                        className="flex items-center gap-3 px-3 py-2 cursor-pointer transition hover:bg-slate-700/60 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            disabled={disabled}
                                            onChange={() => onAreaChange(toggleSelection(selectedAreaIds, area.id))}
                                            className="h-4 w-4 rounded border-slate-500 text-blue-500 focus:ring-blue-400 disabled:opacity-50"
                                        />
                                        <span className="text-sm text-white">{area.name}</span>
                                        {area.code && (
                                            <span className="ml-2 text-xs text-slate-400">({area.code})</span>
                                        )}
                                    </label>
                                );
                            })
                        )}
                    </div>
                    {showSubAreas && (
                        <p className="text-xs text-slate-400 mt-1">
                            Selecting areas only will assign to ALL sub-areas and branches within those areas.
                        </p>
                    )}
                </div>
            )}

            {/* Sub-Areas Section */}
            {showSubAreas && (
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-slate-300">
                            Sub-Area(s) {showAreas && "(Optional)"}
                        </label>
                        <span className="text-xs text-slate-400">
                            {selectedSubAreaIds.length} selected
                        </span>
                    </div>
                    <div className="max-h-48 overflow-y-auto rounded-md border border-slate-600 bg-slate-800/40 divide-y divide-slate-700">
                        {availableSubAreas.length === 0 ? (
                            <p className="px-3 py-2 text-sm text-slate-400">
                                {showAreas ? "Select an area to view available sub-areas." : "No sub-areas available"}
                            </p>
                        ) : (
                            availableSubAreas.map((subArea) => {
                                const checked = selectedSubAreaIds.includes(subArea.id);
                                return (
                                    <label
                                        key={subArea.id}
                                        className="flex items-center gap-3 px-3 py-2 cursor-pointer transition hover:bg-slate-700/60 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            disabled={disabled}
                                            onChange={() => onSubAreaChange(toggleSelection(selectedSubAreaIds, subArea.id))}
                                            className="h-4 w-4 rounded border-slate-500 text-blue-500 focus:ring-blue-400 disabled:opacity-50"
                                        />
                                        <span className="text-sm text-white">{subArea.name}</span>
                                        {subArea.code && (
                                            <span className="ml-2 text-xs text-slate-400">({subArea.code})</span>
                                        )}
                                    </label>
                                );
                            })
                        )}
                    </div>
                    {showBranches && (
                        <p className="text-xs text-slate-400 mt-1">
                            Selecting sub-areas only will assign to ALL branches within those sub-areas.
                        </p>
                    )}
                </div>
            )}

            {/* Branches Section */}
            {showBranches && (
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-slate-300">
                            Branch(es)
                        </label>
                        <span className="text-xs text-slate-400">
                            {selectedBranchIds.length} selected
                        </span>
                    </div>
                    <div className="max-h-64 overflow-y-auto rounded-md border border-slate-600 bg-slate-800/40 divide-y divide-slate-700">
                        {groupedBranches.length === 0 ? (
                            <p className="px-3 py-2 text-sm text-slate-400">
                                Select at least one area or sub-area to view available branches.
                            </p>
                        ) : (
                            groupedBranches.map((group) => (
                                <div key={group.id}>
                                    <p className="px-3 py-1 text-xs font-medium text-slate-400 bg-slate-800/60">
                                        {group.label}
                                    </p>
                                    <div className="space-y-1">
                                        {group.branches.map((branch) => {
                                            const checked = selectedBranchIds.includes(branch.id);
                                            return (
                                                <label
                                                    key={branch.id}
                                                    className="flex items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-slate-700/60 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        disabled={disabled}
                                                        onChange={() => onBranchChange(toggleSelection(selectedBranchIds, branch.id))}
                                                        className="h-4 w-4 rounded border-slate-500 text-blue-500 focus:ring-blue-400 disabled:opacity-50"
                                                    />
                                                    <div className="flex-1">
                                                        <p className="text-sm text-white">{branch.name}</p>
                                                        <p className="text-xs text-slate-400">
                                                            Code: {branch.code || "N/A"}
                                                        </p>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// Single-select dropdown component
export function SingleSelectHierarchyDropdown({
    areas,
    subAreas,
    branches,
    currentUserAssignments,
    selectedAreaId,
    selectedSubAreaId,
    selectedBranchId,
    onAreaChange,
    onSubAreaChange,
    onBranchChange,
    showAreas = true,
    showSubAreas = true,
    showBranches = true,
    allowAll = false,
    disabled = false,
    className = "",
}: SingleSelectHierarchyProps) {
    // Filter data by user assignments
    const availableAreas = useMemo(() =>
        filterByAssignments.area(areas, currentUserAssignments),
        [areas, currentUserAssignments]
    );

    // Filter sub-areas based on selected area
    const availableSubAreas = useMemo(() => {
        let filtered = filterByAssignments.subArea(subAreas, currentUserAssignments);
        if (selectedAreaId) {
            filtered = filtered.filter((subArea) => subArea.areaId === selectedAreaId);
        }
        return filtered;
    }, [subAreas, currentUserAssignments, selectedAreaId]);

    // Filter branches based on selected area and sub-area
    const availableBranches = useMemo(() => {
        let filtered = filterByAssignments.branch(branches, currentUserAssignments);
        if (selectedAreaId) {
            filtered = filtered.filter((branch) => branch.areaId === selectedAreaId);
        }
        if (selectedSubAreaId && selectedSubAreaId !== "all") {
            filtered = filtered.filter((branch) => branch.subAreaId === selectedSubAreaId);
        }
        return filtered;
    }, [branches, currentUserAssignments, selectedAreaId, selectedSubAreaId]);

    const baseClassName = "mt-1 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-amber-400/60 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Area Dropdown */}
            {showAreas && (
                <div className="flex flex-col text-xs text-slate-300">
                    <label className="text-[0.6rem] uppercase tracking-[0.25em] text-slate-400">
                        Area
                    </label>
                    <select
                        value={selectedAreaId ?? (allowAll ? "all" : "")}
                        onChange={(e) => {
                            const value = e.target.value;
                            onAreaChange(value === "all" || value === "" ? undefined : Number(value));
                        }}
                        disabled={disabled}
                        className={baseClassName}
                    >
                        {allowAll && <option value="all">All areas</option>}
                        <option value="">Select area</option>
                        {availableAreas.map((area) => (
                            <option key={area.id} value={area.id}>
                                {area.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Sub-Area Dropdown */}
            {showSubAreas && (
                <div className="flex flex-col text-xs text-slate-300">
                    <label className="text-[0.6rem] uppercase tracking-[0.25em] text-slate-400">
                        Sub area
                    </label>
                    <select
                        value={selectedSubAreaId ?? (allowAll ? "all" : "")}
                        onChange={(e) => {
                            const value = e.target.value;
                            onSubAreaChange(value === "all" || value === "" ? (allowAll ? "all" : undefined) : Number(value));
                        }}
                        disabled={disabled}
                        className={baseClassName}
                    >
                        {allowAll && <option value="all">All sub areas</option>}
                        <option value="">Select sub area</option>
                        {availableSubAreas.map((subArea) => (
                            <option key={subArea.id} value={subArea.id}>
                                {subArea.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Branch Dropdown */}
            {showBranches && (
                <div className="flex flex-col text-xs text-slate-300">
                    <label className="text-[0.6rem] uppercase tracking-[0.25em] text-slate-400">
                        Branch
                    </label>
                    <select
                        value={selectedBranchId ?? (allowAll ? "all" : "")}
                        onChange={(e) => {
                            const value = e.target.value;
                            onBranchChange(value === "all" || value === "" ? undefined : Number(value));
                        }}
                        disabled={disabled}
                        className={baseClassName}
                    >
                        {allowAll && <option value="all">All branches</option>}
                        <option value="">Select branch</option>
                        {availableBranches.map((branch) => (
                            <option key={branch.id} value={branch.id}>
                                {branch.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    );
}

// Filter dropdown component
export function FilterHierarchyDropdown({
    areas,
    subAreas,
    branches,
    currentUserAssignments,
    areaFilter,
    subAreaFilter,
    branchFilter,
    onAreaFilterChange,
    onSubAreaFilterChange,
    onBranchFilterChange,
    showAreas = true,
    showSubAreas = true,
    showBranches = true,
    className = "",
}: FilterHierarchyProps) {
    // Filter data by user assignments
    const availableAreas = useMemo(() =>
        filterByAssignments.area(areas, currentUserAssignments),
        [areas, currentUserAssignments]
    );

    // Filter sub-areas based on area filter
    const availableSubAreas = useMemo(() => {
        let filtered = filterByAssignments.subArea(subAreas, currentUserAssignments);
        if (areaFilter !== "all") {
            filtered = filtered.filter((subArea) => subArea.areaId === areaFilter);
        }
        return filtered;
    }, [subAreas, currentUserAssignments, areaFilter]);

    // Filter branches based on area and sub-area filters
    const availableBranches = useMemo(() => {
        let filtered = filterByAssignments.branch(branches, currentUserAssignments);
        if (areaFilter !== "all") {
            filtered = filtered.filter((branch) => branch.areaId === areaFilter);
        }
        if (subAreaFilter !== "all") {
            filtered = filtered.filter((branch) => (branch.subAreaId ?? null) === subAreaFilter);
        }
        return filtered;
    }, [branches, currentUserAssignments, areaFilter, subAreaFilter]);

    const baseClassName = "rounded-lg border border-white/20 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-amber-400/60 focus:outline-none";

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Area Filter */}
            {showAreas && (
                <div>
                    <select
                        value={areaFilter}
                        onChange={(e) => onAreaFilterChange(e.target.value === "all" ? "all" : Number(e.target.value))}
                        className={`${baseClassName} w-full`}
                    >
                        <option value="all">All Areas</option>
                        {availableAreas.map((area) => (
                            <option key={area.id} value={area.id}>
                                {area.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Sub-Area Filter */}
            {showSubAreas && (
                <div>
                    <select
                        value={subAreaFilter}
                        onChange={(e) => onSubAreaFilterChange(e.target.value === "all" ? "all" : Number(e.target.value))}
                        className={`${baseClassName} w-full`}
                    >
                        <option value="all">All Sub-Areas</option>
                        {availableSubAreas.map((subArea) => (
                            <option key={subArea.id} value={subArea.id}>
                                {subArea.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Branch Filter */}
            {showBranches && (
                <div>
                    <select
                        value={branchFilter}
                        onChange={(e) => onBranchFilterChange(e.target.value === "all" ? "all" : Number(e.target.value))}
                        className={`${baseClassName} w-full`}
                    >
                        <option value="all">All Branches</option>
                        {availableBranches.map((branch) => (
                            <option key={branch.id} value={branch.id}>
                                {branch.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    );
}
