"use client";

import React, { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "@/config/env";

const defaultStatuses = [
  { key: "not-called-yet", label: "មិនទាន់តេ" },
  { key: "called", label: "តេរួច" },
  { key: "no-answer", label: "តេមិនលើក" },
  { key: "call-not-connected", label: "តេមិនចូល" },
  { key: "delivered-to-customer", label: "ដឹកដល់ផ្អះ" },
];

type CallStatusResponse = {
  key: string;
  label: string;
  createdBy: string;
  createdAt: string;
};

type BranchResponse = {
  id: number;
  name: string;
  code?: string;
  address?: string;
  phone?: string;
  email?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

type UserBranchResponse = {
  id: number;
  userId: number;
  branchId: number;
  branchName: string;
  active: boolean;
  assignedAt: string;
  updatedAt: string;
};

type CallReportResponse = {
  id: number;
  reportDate: string;
  branchId: number;
  branchName: string;
  createdBy: string;
  createdAt: string;
  entries: Record<string, number>;
};

type ReportRecord = {
  id: number;
  date: string;
  createdAt: string;
  createdBy: string;
  branchId: number;
  branchName: string;
  entries: Record<string, number>;
};

const getStoredUserId = (): number | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const userStr = window.localStorage.getItem("user");
  if (!userStr) {
    return null;
  }

  try {
    const parsed = JSON.parse(userStr);
    return parsed?.id ?? null;
  } catch {
    return null;
  }
};

const fetchAndCacheUserId = async (): Promise<number | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      credentials: "include",
    });

    if (!response.ok) {
      return null;
    }

    const user = await response.json();
    if (user?.id && typeof window !== "undefined") {
      window.localStorage.setItem("user", JSON.stringify(user));
      return user.id;
    }
    return user?.id ?? null;
  } catch (error) {
    console.error("Failed to fetch current user info", error);
    return null;
  }
};

const buildAuthHeaders = () => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const userId = getStoredUserId();
  if (userId) {
    headers["X-User-Id"] = String(userId);
  }
  return headers;
};

function Page() {
  const [statuses, setStatuses] = useState(defaultStatuses);
  const [selectedStatus, setSelectedStatus] = useState(defaultStatuses[0].key);
  const [branches, setBranches] = useState<BranchResponse[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [entries, setEntries] = useState<Record<string, number>>(
    Object.fromEntries(defaultStatuses.map((s) => [s.key, 0])),
  );
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [editingReportId, setEditingReportId] = useState<number | null>(null);
  const [reportSearch, setReportSearch] = useState("");
  const [showAddStatusForm, setShowAddStatusForm] = useState(false);
  const [newStatusName, setNewStatusName] = useState("");
  const [newStatusCode, setNewStatusCode] = useState("");
  const [loadingStatuses, setLoadingStatuses] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [hasBranchAssignment, setHasBranchAssignment] = useState(false);

  // New state for popup menu
  const [showManagePopup, setShowManagePopup] = useState(false);
  const [managingStatusKey, setManagingStatusKey] = useState<string | null>(
    null,
  );
  const [editingLabel, setEditingLabel] = useState("");

  const totalCount = useMemo(
    () => Object.values(entries).reduce((sum, value) => sum + value, 0),
    [entries],
  );

  const handleEntryChange = (statusKey: string, value: string) => {
    const parsed = Number(value);
    setEntries((prev) => ({
      ...prev,
      [statusKey]: Number.isNaN(parsed) ? 0 : parsed,
    }));
  };

  const handleAddStatus = () => {
    setNewStatusName("");
    setNewStatusCode("");
    setShowAddStatusForm(true);
  };

  const handleSaveNewStatus = async () => {
    const trimmedName = newStatusName.trim();
    const trimmedCode = newStatusCode.trim();

    if (!trimmedName || !trimmedCode) {
      return;
    }

    const normalizedKey = trimmedCode.toLowerCase().replace(/\s+/g, "-");
    if (statuses.some((item) => item.key === normalizedKey)) {
      return;
    }

    setApiError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/calls/statuses`, {
        method: "POST",
        headers: buildAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({
          key: normalizedKey,
          label: trimmedName,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Unable to save status");
      }

      const createdStatus: CallStatusResponse = await response.json();
      setStatuses((prev) => [
        ...prev,
        { key: createdStatus.key, label: createdStatus.label },
      ]);
      setEntries((prev) => ({
        ...prev,
        [createdStatus.key]: prev[createdStatus.key] ?? 0,
      }));
      setSelectedStatus(createdStatus.key);
      setShowAddStatusForm(false);
      setNewStatusName("");
      setNewStatusCode("");
    } catch (error) {
      console.error("Failed to create status", error);
      setApiError("Unable to create the new status.");
    }
  };

  const handleCancelAddStatus = () => {
    setShowAddStatusForm(false);
    setNewStatusName("");
    setNewStatusCode("");
  };

  const openManagePopup = (statusKey: string) => {
    const status = statuses.find((s) => s.key === statusKey);
    if (status) {
      setManagingStatusKey(statusKey);
      setEditingLabel(status.label);
      setShowManagePopup(true);
    }
  };

  const closeManagePopup = () => {
    setShowManagePopup(false);
    setManagingStatusKey(null);
    setEditingLabel("");
  };

  const handleUpdateStatus = async () => {
    if (!managingStatusKey) {
      return;
    }

    const trimmedLabel = editingLabel.trim();
    if (!trimmedLabel) {
      return;
    }

    setApiError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/calls/statuses/${managingStatusKey}`,
        {
          method: "PUT",
          headers: buildAuthHeaders(),
          credentials: "include",
          body: JSON.stringify({
            key: managingStatusKey,
            label: trimmedLabel,
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Unable to update status");
      }

      const updated: CallStatusResponse = await response.json();
      setStatuses((prev) =>
        prev.map((status) =>
          status.key === updated.key
            ? { ...status, label: updated.label }
            : status,
        ),
      );
      closeManagePopup();
    } catch (error) {
      console.error("Failed to update status", error);
      setApiError("Unable to update the status label.");
    }
  };

  const handleDeleteStatus = async () => {
    if (!managingStatusKey) {
      return;
    }

    if (!confirm("Are you sure you want to delete this status?")) {
      return;
    }

    setApiError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/calls/statuses/${managingStatusKey}`,
        {
          method: "DELETE",
          headers: buildAuthHeaders(),
          credentials: "include",
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Unable to delete status");
      }

      setStatuses((prev) =>
        prev.filter((status) => status.key !== managingStatusKey),
      );
      setEntries((prev) => {
        const cloned = { ...prev };
        delete cloned[managingStatusKey];
        return cloned;
      });
      if (selectedStatus === managingStatusKey) {
        setSelectedStatus(
          statuses.find((status) => status.key !== managingStatusKey)?.key ??
            "",
        );
      }
      closeManagePopup();
    } catch (error) {
      console.error("Failed to delete status", error);
      setApiError("Unable to delete the status.");
    }
  };

  const loadReports = async () => {
    setLoadingReports(true);
    setApiError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/calls/reports`, {
        headers: buildAuthHeaders(),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to load reports");
      }

      const serverReports: CallReportResponse[] = await response.json();
      const mappedReports: ReportRecord[] = serverReports.map((report) => ({
        id: report.id,
        date: report.reportDate,
        createdAt: report.createdAt,
        createdBy: report.createdBy,
        branchId: report.branchId,
        branchName: report.branchName,
        entries: report.entries,
      }));

      setReports(mappedReports);
    } catch (error) {
      console.error("Failed to fetch reports", error);
      setApiError("Unable to load call reports from backend");
    } finally {
      setLoadingReports(false);
    }
  };

  const loadStatuses = async () => {
    setLoadingStatuses(true);
    setApiError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/calls/statuses`, {
        headers: buildAuthHeaders(),
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to load statuses");
      }

      const serverStatuses: CallStatusResponse[] = await response.json();
      if (serverStatuses.length === 0) {
        return;
      }

      const mapped = serverStatuses.map(({ key, label }) => ({ key, label }));
      setStatuses((prev) => {
        return mapped;
      });

      setEntries((prev) =>
        Object.fromEntries(
          mapped.map((status) => [status.key, prev[status.key] ?? 0]),
        ),
      );

      setSelectedStatus((prev) =>
        mapped.some((status) => status.key === prev)
          ? prev
          : (mapped[0]?.key ?? prev),
      );
    } catch (error) {
      console.error("Failed to fetch statuses", error);
      setApiError("Unable to load statuses from backend");
    } finally {
      setLoadingStatuses(false);
    }
  };

  const loadFallbackBranches = async () => {
    const fallbackResponse = await fetch(
      `${API_BASE_URL}/api/calls/branches/active`,
      {
        headers: buildAuthHeaders(),
        credentials: "include",
      },
    );

    if (!fallbackResponse.ok) {
      throw new Error("Failed to load branches for selection");
    }

    const allBranches: BranchResponse[] = await fallbackResponse.json();
    const activeBranches = allBranches.filter((branch) => branch.active);

    setHasBranchAssignment(false);
    setBranches(activeBranches);
    setSelectedBranchId(activeBranches[0]?.id ?? null);
  };

  const loadBranches = async () => {
    setLoadingBranches(true);
    setApiError(null);
    setHasBranchAssignment(false);

    const fetchedUserId = await fetchAndCacheUserId();
    let userId = fetchedUserId ?? getStoredUserId();
    if (!userId) {
      try {
        await loadFallbackBranches();
      } catch (error) {
        console.error("Failed to load fallback branches without user", error);
        setApiError("Unable to load branch list.");
        setBranches([]);
        setSelectedBranchId(null);
      } finally {
        setLoadingBranches(false);
      }
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/calls/user-branches/user/${userId}`,
        {
          headers: buildAuthHeaders(),
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to load user branches");
      }

      const assignments: UserBranchResponse[] = await response.json();
      const activeAssignments = assignments.filter(
        (assignment) => assignment.active,
      );

      if (activeAssignments.length > 0) {
        const mappedBranches = activeAssignments.map<BranchResponse>(
          (assignment) => ({
            id: assignment.branchId,
            name: assignment.branchName,
            active: assignment.active,
            createdAt: assignment.assignedAt,
            updatedAt: assignment.updatedAt,
          }),
        );

        setHasBranchAssignment(true);
        setBranches(mappedBranches);
        setSelectedBranchId(mappedBranches[0].id);
      } else {
        setHasBranchAssignment(false);
        await loadFallbackBranches();
      }
    } catch (error) {
      console.error("Failed to fetch user branches", error);
      setApiError(
        "Unable to load user branches from backend. Showing all active branches instead.",
      );
      try {
        await loadFallbackBranches();
      } catch (fallbackError) {
        console.error("Failed to fetch fallback branches", fallbackError);
        setBranches([]);
        setSelectedBranchId(null);
      }
    } finally {
      setLoadingBranches(false);
    }
  };

  useEffect(() => {
    loadStatuses();
    loadBranches();
    loadReports();
  }, []);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setApiError(null);

    try {
      const isUpdate = editingReportId !== null;
      const url = isUpdate
        ? `${API_BASE_URL}/api/calls/reports/${editingReportId}`
        : `${API_BASE_URL}/api/calls/reports`;
      const method = isUpdate ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: buildAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({
          reportDate: date,
          branchId: selectedBranchId,
          entries,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          errorText || `Failed to ${isUpdate ? "update" : "submit"} report`,
        );
      }

      await loadReports();
      setEntries(Object.fromEntries(statuses.map((status) => [status.key, 0])));
      setEditingReportId(null);
    } catch (error) {
      console.error(
        `Failed ${editingReportId ? "updating" : "submitting"} report`,
        error,
      );
      setApiError(
        `Unable to ${editingReportId ? "update" : "submit"} the report.`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReport = async (id: number) => {
    if (!confirm("Are you sure you want to delete this report?")) {
      return;
    }

    setApiError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/calls/reports/${id}`, {
        method: "DELETE",
        headers: buildAuthHeaders(),
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Unable to delete report");
      }

      setReports((prev) => prev.filter((report) => report.id !== id));
    } catch (error) {
      console.error("Failed to delete report", error);
      setApiError("Unable to delete the report.");
    }
  };

  const handleLoadReport = (report: ReportRecord) => {
    setDate(report.date);
    setEntries({ ...report.entries });
    setSelectedBranchId(report.branchId);
    setEditingReportId(report.id);
  };

  const handleBranchChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setSelectedBranchId(value ? Number(value) : null);
  };

  const filteredReports = reports.filter((report) => {
    if (!reportSearch.trim()) {
      return true;
    }
    const normalized = reportSearch.trim().toLowerCase();
    return (
      report.date.toLowerCase().includes(normalized) ||
      report.createdBy.toLowerCase().includes(normalized) ||
      (report.branchName?.toLowerCase() ?? "").includes(normalized)
    );
  });

  return (
    <>
      <div className="min-h-screen px-4 py-8 relative overflow-hidden">
        {/* Animated Background Gradients */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-orange-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-96 h-96 bg-blue-700 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
          {/* <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950"></div> */}
        </div>

        <div className="mx-auto flex max-w-6xl flex-col gap-8 relative z-10">
          {/* Status Management Section */}
          <section className="hidden glass-card animate-fade-in-up">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                  Status Management
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Manage your call statuses with ease
                </p>
              </div>
              <button
                onClick={handleAddStatus}
                className="glass-button px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-glow hover:scale-105 transition-all duration-300"
              >
                <span className="flex items-center gap-1.5">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add Status
                </span>
              </button>
            </div>

            {/* Status Grid */}
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {statuses.map((status, index) => (
                <div
                  key={status.key}
                  className="status-card group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-white group-hover:text-transparent group-hover:bg-linear-to-r group-hover:from-orange-400 group-hover:to-orange-600 group-hover:bg-clip-text transition-all duration-300">
                        {status.label}
                      </h3>
                      <p className="mt-0.5 text-[10px] text-slate-500 font-mono">
                        {status.key}
                      </p>
                    </div>
                    <button
                      onClick={() => openManagePopup(status.key)}
                      className="menu-button"
                      title="Manage status"
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-500/0 via-orange-500/0 to-orange-600/0 group-hover:from-orange-500/5 group-hover:via-orange-500/5 group-hover:to-orange-600/5 transition-all duration-500"></div>
                </div>
              ))}
            </div>

            {/* Add Status Form */}
            {showAddStatusForm && (
              <div className="mt-4 glass-card-inner animate-slide-down">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></div>
                  <p className="text-sm font-semibold text-white">
                    Add New Status
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-2 mb-4">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-slate-300">
                      Display Name
                    </span>
                    <input
                      type="text"
                      value={newStatusName}
                      onChange={(event) => setNewStatusName(event.target.value)}
                      placeholder="e.g., Called Back"
                      className="glass-input text-sm"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-slate-300">
                      Status Key
                    </span>
                    <input
                      type="text"
                      value={newStatusCode}
                      onChange={(event) => setNewStatusCode(event.target.value)}
                      placeholder="e.g., called-back"
                      className="glass-input text-sm"
                    />
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleSaveNewStatus}
                    disabled={!newStatusName.trim() || !newStatusCode.trim()}
                    className="glass-button px-4 py-1.5 text-xs font-semibold bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    Create Status
                  </button>
                  <button
                    onClick={handleCancelAddStatus}
                    className="glass-button-secondary px-4 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-all duration-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {apiError && (
              <div className="mt-4 glass-card-inner border-l-4 border-red-500 animate-shake">
                <div className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-sm text-red-400">{apiError}</p>
                </div>
              </div>
            )}
          </section>

          {/* Report Entry Section */}
          <section
            className="glass-card animate-fade-in-up"
            style={{ animationDelay: "200ms" }}
          >
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1 h-6 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                Submit Daily Report
              </h2>
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                  Report Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="glass-input w-full text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                  Branch
                </label>
                {hasBranchAssignment ? (
                  <div className="glass-input w-full text-sm text-slate-300 flex items-center justify-between">
                    <span>
                      {branches.find((branch) => branch.id === selectedBranchId)
                        ?.name ?? "Assigned branch"}
                    </span>
                    <span className="text-[11px] text-emerald-300">
                      Auto-selected
                    </span>
                  </div>
                ) : (
                  <select
                    value={
                      selectedBranchId !== null ? String(selectedBranchId) : ""
                    }
                    onChange={handleBranchChange}
                    className="glass-input w-full text-sm"
                    disabled={loadingBranches || branches.length === 0}
                  >
                    <option value="">Select a branch</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={String(branch.id)}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                  Total Count
                </p>
                <div className="text-2xl font-bold bg-linear-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                  {totalCount.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 mb-2">
              {statuses.map((status, index) => (
                <div
                  key={status.key}
                  className="entry-card"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                    {status.label}
                  </label>
                  <input
                    value={entries[status.key]}
                    type="number"
                    onChange={(event) =>
                      handleEntryChange(status.key, event.target.value)
                    }
                    className="number-input glass-input w-full text-right text-lg font-bold"
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
              <button
                onClick={() =>
                  setEntries(
                    Object.fromEntries(
                      statuses.map((status) => [status.key, 0]),
                    ),
                  )
                }
                className="glass-button-secondary px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-all duration-300"
              >
                Reset All
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !selectedBranchId}
                className="glass-button px-5 py-2 text-xs font-semibold bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-glow-strong hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  "Submit Report"
                )}
              </button>
            </div>
          </section>

          {/* Reports Table */}
          {reports.length > 0 && (
            <section
              className="glass-card animate-fade-in-up"
              style={{ animationDelay: "400ms" }}
            >
              <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                    Submitted Reports
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-slate-400">
                    Search
                  </label>
                  <input
                    value={reportSearch}
                    onChange={(event) => setReportSearch(event.target.value)}
                    placeholder="Filter reports..."
                    className="glass-input w-48 text-sm"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <div className="min-w-[1200px]">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="px-3 py-3 text-left text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                          Created At
                        </th>
                        <th className="px-3 py-3 text-left text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                          Date
                        </th>
                        <th className="px-3 py-3 text-left text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                          Created By
                        </th>
                        <th className="px-3 py-3 text-left text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                          Branch
                        </th>
                        {statuses.map((status) => (
                          <th
                            key={status.key}
                            className="px-3 py-3 text-left text-[10px] uppercase tracking-wider text-slate-400 font-semibold"
                          >
                            {status.label}
                          </th>
                        ))}
                        <th className="px-3 py-3 text-left text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredReports.map((report, index) => (
                        <tr
                          key={report.id}
                          className="table-row hover:bg-white/5 transition-colors duration-200"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <td className="px-3 py-3 text-slate-300 text-xs">
                            {new Date(report.createdAt).toLocaleString()}
                          </td>
                          <td className="px-3 py-3 text-white font-medium text-xs">
                            {report.date}
                          </td>
                          <td className="px-3 py-3 text-slate-300 text-xs">
                            {report.createdBy}
                          </td>
                          <td className="px-3 py-3 text-slate-300 text-xs">
                            {report.branchName}
                          </td>
                          {statuses.map((status) => (
                            <td
                              key={`${report.id}-${status.key}`}
                              className="px-3 py-3 text-slate-300 font-medium text-xs"
                            >
                              {report.entries[status.key]?.toLocaleString() ??
                                0}
                            </td>
                          ))}
                          <td className="px-3 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleLoadReport(report)}
                                className="table-action-button bg-gradient-to-r from-blue-600 to-blue-800 text-white hover:shadow-glow-blue"
                              >
                                Update
                              </button>
                              <button
                                onClick={() => handleDeleteReport(report.id)}
                                className="table-action-button bg-gradient-to-r from-red-600 to-red-800 text-white hover:shadow-glow-red"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Manage Status Popup */}
      {showManagePopup && managingStatusKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={closeManagePopup}
          ></div>
          <div className="popup-card w-full max-w-md animate-scale-in">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                  Manage Status
                </h3>
                <p className="text-[10px] text-slate-500 font-mono mt-1">
                  {managingStatusKey}
                </p>
              </div>
              <button
                onClick={closeManagePopup}
                className="menu-button hover:rotate-90"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Display Name
                </span>
                <input
                  type="text"
                  value={editingLabel}
                  onChange={(event) => setEditingLabel(event.target.value)}
                  className="glass-input text-sm"
                />
              </label>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={handleUpdateStatus}
                  disabled={!editingLabel.trim()}
                  className="glass-button w-full px-4 py-2 text-xs font-semibold bg-gradient-to-r from-blue-600 to-blue-800 text-white hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  Save Changes
                </button>
                <button
                  onClick={handleDeleteStatus}
                  className="glass-button w-full px-4 py-2 text-xs font-semibold bg-gradient-to-r from-red-600 to-red-800 text-white hover:shadow-glow-red transition-all duration-300"
                >
                  Delete Status
                </button>
                <button
                  onClick={closeManagePopup}
                  className="glass-button-secondary w-full px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-all duration-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }

        .animate-slide-down {
          animation: slide-down 0.4s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }

        .animate-shake {
          animation: shake 0.4s ease-out;
        }

        .glass-card {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 2rem;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3),
                      inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .glass-card-inner {
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 1.5rem;
        }

        .status-card {
          position: relative;
          background: rgba(15, 23, 42, 0.5);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 1rem;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          animation: fade-in-up 0.6s ease-out backwards;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        }

        .status-card:hover {
          transform: translateY(-4px);
          border-color: rgba(249, 115, 22, 0.3);
          box-shadow: 0 12px 32px rgba(249, 115, 22, 0.2),
                      inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .entry-card {
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 14px;
          padding: 1rem;
          transition: all 0.3s ease;
          animation: fade-in-up 0.5s ease-out backwards;
        }

        .entry-card:hover {
          border-color: rgba(30, 58, 138, 0.3);
          background: rgba(15, 23, 42, 0.6);
        }

        .total-count-card {
          background: linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(249, 115, 22, 0.15) 100%);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(249, 115, 22, 0.2);
          border-radius: 16px;
          padding: 1rem 1.5rem;
          box-shadow: 0 8px 24px rgba(249, 115, 22, 0.15),
                      inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .popup-card {
          position: relative;
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 24px;
          padding: 2rem;
          box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5),
                      inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }

        .glass-input {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 0.5rem 1rem;
          color: white;
          transition: all 0.3s ease;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .glass-input:focus {
          outline: none;
          border-color: rgba(249, 115, 22, 0.5);
          box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1),
                      inset 0 2px 4px rgba(0, 0, 0, 0.2);
          background: rgba(15, 23, 42, 0.8);
        }

        .glass-button {
          position: relative;
          border-radius: 12px;
          border: none;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .glass-button::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 12px;
          padding: 1px;
          background: linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
        }

        .glass-button:hover {
          transform: translateY(-2px);
        }

        .glass-button-secondary {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .glass-button-secondary:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }

        .menu-button {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 0.5rem;
          color: rgba(255, 255, 255, 0.6);
          transition: all 0.3s ease;
        }

        .menu-button:hover {
          background: rgba(249, 115, 22, 0.2);
          border-color: rgba(249, 115, 22, 0.4);
          color: rgb(251, 146, 60);
          transform: scale(1.1);
        }

        .table-row {
          animation: fade-in-up 0.4s ease-out backwards;
        }

        .table-action-button {
          padding: 0.375rem 0.75rem;
          border-radius: 8px;
          font-size: 0.625rem;
          font-weight: 600;
          border: none;
          transition: all 0.3s ease;
        }

        .table-action-button:hover {
          transform: translateY(-2px);
        }

        .shadow-glow {
          box-shadow: 0 0 20px rgba(249, 115, 22, 0.5),
                      0 0 40px rgba(249, 115, 22, 0.3);
        }

        .shadow-glow-strong {
          box-shadow: 0 0 30px rgba(249, 115, 22, 0.6),
                      0 0 60px rgba(249, 115, 22, 0.4);
        }

        .shadow-glow-blue {
          box-shadow: 0 4px 20px rgba(30, 58, 138, 0.5);
        }

        .shadow-glow-red {
          box-shadow: 0 4px 20px rgba(153, 27, 27, 0.5);
        }

        .number-input::-webkit-outer-spin-button,
        .number-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        .number-input {
          -moz-appearance: textfield;
        }
      `}</style>
    </>
  );
}

export default Page;
