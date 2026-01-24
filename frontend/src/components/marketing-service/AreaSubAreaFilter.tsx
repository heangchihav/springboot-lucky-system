"use client";

import React from "react";

export interface MarketingArea {
    id: number;
    name: string;
}

export interface MarketingSubArea {
    id: number;
    name: string;
    areaId: number;
}

export interface UserAssignment {
    areaId?: number;
    subAreaId?: number;
}

interface AreaSubAreaFilterProps {
    areas: MarketingArea[];
    subAreas: MarketingSubArea[];
    currentUserAssignments: UserAssignment[];
    selectedAreaId: number | null;
    selectedSubAreaId: number | null;
    onAreaChange: (areaId: number | null) => void;
    onSubAreaChange: (subAreaId: number | null) => void;
    onClearFilters: () => void;
    disabled?: boolean;
    areaLabel?: string;
    subAreaLabel?: string;
    clearButtonText?: string;
    className?: string;
}

export function AreaSubAreaFilter({
    areas,
    subAreas,
    currentUserAssignments,
    selectedAreaId,
    selectedSubAreaId,
    onAreaChange,
    onSubAreaChange,
    onClearFilters,
    disabled = false,
    areaLabel = "Filter by Area",
    subAreaLabel = "Filter by Sub-area",
    clearButtonText = "Clear Filters",
    className = "grid grid-cols-1 gap-4 lg:grid-cols-3",
}: AreaSubAreaFilterProps) {
    // Filter areas based on user assignments
    const filteredAreas = currentUserAssignments.length === 0
        ? areas
        : areas.filter(area =>
            currentUserAssignments.some(a => a.areaId === area.id)
        );

    // Filter sub-areas based on selected area and user assignments
    const filteredSubAreas = subAreas.filter(subArea => {
        const matchesSelectedArea = !selectedAreaId || subArea.areaId === selectedAreaId;
        const hasUserAccess = currentUserAssignments.length === 0 ||
            currentUserAssignments.some(a => a.subAreaId === subArea.id);
        return matchesSelectedArea && hasUserAccess;
    });

    const handleAreaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value ? Number(e.target.value) : null;
        onAreaChange(value);
        // Reset sub-area when area changes
        if (value !== selectedAreaId) {
            onSubAreaChange(null);
        }
    };

    const handleSubAreaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value ? Number(e.target.value) : null;
        onSubAreaChange(value);
    };

    return (
        <div className={className}>
            <div className="flex flex-col">
                <label className="mb-2 text-sm text-slate-300">{areaLabel}</label>
                <select
                    className="rounded-2xl border border-white/20 bg-slate-900/60 px-4 py-2 text-sm text-white focus:border-amber-400/60 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    value={selectedAreaId ?? ""}
                    onChange={handleAreaChange}
                    disabled={disabled}
                >
                    <option value="">All areas</option>
                    {filteredAreas.map((area) => (
                        <option key={area.id} value={area.id}>
                            {area.name}
                        </option>
                    ))}
                </select>
            </div>
            <div className="flex flex-col">
                <label className="mb-2 text-sm text-slate-300">{subAreaLabel}</label>
                <select
                    className="rounded-2xl border border-white/20 bg-slate-900/60 px-4 py-2 text-sm text-white focus:border-amber-400/60 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    value={selectedSubAreaId ?? ""}
                    onChange={handleSubAreaChange}
                    disabled={!selectedAreaId || disabled}
                >
                    <option value="">All sub-areas</option>
                    {filteredSubAreas.map((subArea) => (
                        <option key={subArea.id} value={subArea.id}>
                            {subArea.name}
                        </option>
                    ))}
                </select>
            </div>
            <div className="flex items-end">
                <button
                    onClick={onClearFilters}
                    disabled={disabled}
                    className="w-full rounded-2xl border border-white/20 bg-slate-900/60 px-4 py-2 text-sm text-white hover:bg-slate-800/80 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {clearButtonText}
                </button>
            </div>
        </div>
    );
}
