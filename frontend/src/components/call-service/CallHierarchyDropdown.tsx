"use client";

import React, { useMemo } from "react";
import { Area, Subarea, Branch } from "@/services/areaBranchService";

// Common types
type FilterValue = number | "all";

// Call-service specific multi-select checkbox component props
export interface CallMultiSelectHierarchyProps {
    areas: Area[];
    subAreas: Subarea[];
    branches: Branch[];
    currentUserAssignments?: any[];
    selectedAreaIds: number[];
    selectedSubAreaIds: number[];
    selectedBranchIds: number[];
    onAreaChange: (areaIds: number[]) => void;
    onSubAreaChange: (subAreaIds: number[]) => void;
    onBranchChange: (branchIds: number[]) => void;
    showAreas?: boolean;
    showSubAreas?: boolean;
    showBranches?: boolean;
    disabled?: boolean;
    className?: string;
}

// Utility function to toggle selection
export const toggleSelection = (prev: number[], value: number): number[] => {
    return prev.includes(value)
        ? prev.filter((id) => id !== value)
        : [...prev, value];
};

// Multi-select checkbox component for call-service
export function CallMultiSelectHierarchyDropdown({
    areas,
    subAreas,
    branches,
    currentUserAssignments = [],
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
}: CallMultiSelectHierarchyProps) {

    // Filter data based on selected areas and sub-areas (no automatic selection)
    const availableSubAreas = useMemo(() => {
        if (selectedAreaIds.length === 0) {
            return subAreas; // Show all sub-areas if no areas selected
        }
        return subAreas.filter(subArea => selectedAreaIds.includes(subArea.areaId));
    }, [subAreas, selectedAreaIds]);

    const availableBranches = useMemo(() => {
        let filtered = branches;

        if (selectedSubAreaIds.length > 0) {
            // If sub-areas are selected, only show branches in those sub-areas
            filtered = filtered.filter(branch => selectedSubAreaIds.includes(branch.subareaId));
        } else if (selectedAreaIds.length > 0) {
            // If only areas are selected, show branches directly in those areas OR in sub-areas within those areas
            filtered = filtered.filter(branch => {
                // Include branches directly in the area
                if (selectedAreaIds.includes(branch.areaId)) {
                    return true;
                }
                // Include branches in sub-areas within the selected areas
                const subArea = subAreas.find(s => s.id === branch.subareaId);
                return subArea && selectedAreaIds.includes(subArea.areaId);
            });
        }

        return filtered;
    }, [branches, selectedAreaIds, selectedSubAreaIds, subAreas]);

    // Group branches by area/sub-area for display
    const groupedBranches = useMemo(() => {
        const groups: { id: string; label: string; branches: Branch[] }[] = [];
        const seenKeys = new Set<string>();

        if (selectedSubAreaIds.length > 0) {
            selectedSubAreaIds.forEach((subAreaId) => {
                const label = subAreas.find((sub) => sub.id === subAreaId)?.name || `Sub-Area ${subAreaId}`;
                const relatedBranches = availableBranches.filter((branch) => branch.subareaId === subAreaId);

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
                        {areas.length === 0 ? (
                            <p className="px-3 py-2 text-sm text-slate-400">
                                No areas available
                            </p>
                        ) : (
                            areas.map((area) => {
                                // Only show as checked if directly selected
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
                                        {/* Show indicator if area has selected children but isn't directly selected */}
                                        {!checked && (
                                            (() => {
                                                const hasSelectedSubAreas = subAreas.some(sa =>
                                                    sa.areaId === area.id && selectedSubAreaIds.includes(sa.id)
                                                );
                                                const hasSelectedBranches = branches.some(b =>
                                                    b.areaId === area.id && selectedBranchIds.includes(b.id)
                                                );
                                                const hasBranchesInSelectedSubAreas = subAreas.some(sa =>
                                                    sa.areaId === area.id && selectedSubAreaIds.includes(sa.id) &&
                                                    branches.some(b => b.subareaId === sa.id && selectedBranchIds.includes(b.id))
                                                );

                                                if (hasSelectedSubAreas || hasSelectedBranches || hasBranchesInSelectedSubAreas) {
                                                    return (
                                                        <span className="ml-auto text-xs text-blue-400">has selections</span>
                                                    );
                                                }
                                                return null;
                                            })()
                                        )}
                                    </label>
                                );
                            })
                        )}
                    </div>
                    {showSubAreas && (
                        <p className="text-xs text-slate-400 mt-1">
                            Selecting areas will show sub-areas and branches within those areas.
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
                                // Only show as checked if directly selected
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
                                        {/* Show indicator if sub-area has selected branches but isn't directly selected */}
                                        {!checked && branches.some(b =>
                                            b.subareaId === subArea.id && selectedBranchIds.includes(b.id)
                                        ) && (
                                                <span className="ml-auto text-xs text-blue-400">has branches</span>
                                            )}
                                    </label>
                                );
                            })
                        )}
                    </div>
                    {showBranches && (
                        <p className="text-xs text-slate-400 mt-1">
                            Selecting sub-areas will show branches within those sub-areas.
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
