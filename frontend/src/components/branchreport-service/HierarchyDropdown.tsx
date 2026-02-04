"use client";

import { useMemo } from "react";
import { Area, SubArea, Branch } from "@/services/branchreport-service/branchreportHierarchyService";

interface HierarchyDropdownProps {
  type: "area" | "subarea" | "branch";
  value?: string;
  onChange: (value: string) => void;
  areas: Area[];
  subAreas: SubArea[];
  branches: Branch[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function HierarchyDropdown({
  type,
  value,
  onChange,
  areas,
  subAreas,
  branches,
  placeholder,
  disabled = false,
  className = "",
}: HierarchyDropdownProps) {
  const options = useMemo(() => {
    switch (type) {
      case "area":
        return areas.map(area => ({
          value: area.id,
          label: area.name,
        }));
      case "subarea":
        return subAreas.map(subArea => ({
          value: subArea.id,
          label: subArea.name,
        }));
      case "branch":
        return branches.map(branch => ({
          value: branch.id,
          label: branch.name,
        }));
      default:
        return [];
    }
  }, [type, areas, subAreas, branches]);

  return (
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
    >
      <option value="">{placeholder || `Select ${type}`}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

interface FilterHierarchyDropdownProps {
  type: "area" | "subarea" | "branch";
  value?: string;
  onChange: (value: string) => void;
  areas: Area[];
  subAreas: SubArea[];
  branches: Branch[];
  placeholder?: string;
  className?: string;
}

export function FilterHierarchyDropdown({
  type,
  value,
  onChange,
  areas,
  subAreas,
  branches,
  placeholder,
  className = "",
}: FilterHierarchyDropdownProps) {
  const options = useMemo(() => {
    switch (type) {
      case "area":
        return areas.map(area => ({
          value: area.id,
          label: area.name,
        }));
      case "subarea":
        return subAreas.map(subArea => ({
          value: subArea.id,
          label: subArea.name,
        }));
      case "branch":
        return branches.map(branch => ({
          value: branch.id,
          label: branch.name,
        }));
      default:
        return [];
    }
  }, [type, areas, subAreas, branches]);

  return (
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
    >
      <option value="">{placeholder || `All ${type}s`}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
