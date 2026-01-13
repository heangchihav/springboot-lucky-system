"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { MarketingServiceGuard } from "@/components/marketing-service/MarketingServiceGuard";
import { useToast } from "@/components/ui/Toast";
import { PermissionGuard } from "@/components/layout/PermissionGuard";
import { useAuth } from "@/contexts/AuthContext";
import {
  marketingHierarchyService,
  MarketingArea,
  MarketingBranch,
  MarketingSubArea,
} from "@/services/marketing-service/marketingHierarchyService";
import {
  vipMemberService,
  VipMember,
} from "@/services/marketing-service/vipMemberService";
import {
  goodsShipmentService,
  MarketingGoodsShipmentRecord,
  UserGoodsRecord,
} from "@/services/marketing-service/goodsShipmentService";

type FilterValue = number | "all";

type EntryFormState = {
  goodsDate: string;
  totalGoods: string;
};

type PendingEntry = {
  id: string;
  memberId: number;
  memberName: string;
  branchId: number;
  branchName: string;
  goodsDate: string;
  totalGoods: number;
};

const today = new Date().toISOString().split("T")[0];
const EDIT_MODAL_TITLE_ID = "goods-shipment-edit-title";

const defaultEntryForm: EntryFormState = {
  goodsDate: today,
  totalGoods: "",
};

const countIsValid = (value: string) =>
  value === "" || (/^\d+$/.test(value) && Number(value) >= 0);

const mapRecordToForm = (
  record: MarketingGoodsShipmentRecord,
): EntryFormState => ({
  goodsDate: record.sendDate,
  totalGoods: String(record.totalGoods || 0),
});

export default function GoodsInputPage() {
  const { user, isAuthenticated, isLoading, hasServiceAccess } = useAuth();
  const canAccessMarketing = isAuthenticated && hasServiceAccess("marketing");
  const currentUserId = user?.id ?? null;
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const [members, setMembers] = useState<VipMember[]>([]);
  const [areas, setAreas] = useState<MarketingArea[]>([]);
  const [subAreas, setSubAreas] = useState<MarketingSubArea[]>([]);
  const [branches, setBranches] = useState<MarketingBranch[]>([]);

  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [recentScope, setRecentScope] = useState<"mine" | "all">("mine");
  const [filterAreaId, setFilterAreaId] = useState<FilterValue>("all");
  const [filterSubAreaId, setFilterSubAreaId] = useState<FilterValue>("all");
  const [filterBranchId, setFilterBranchId] = useState<FilterValue>("all");
  const [memberQuery, setMemberQuery] = useState("");

  const [entryForm, setEntryForm] = useState<EntryFormState>(defaultEntryForm);
  const [pendingEntries, setPendingEntries] = useState<PendingEntry[]>([]);
  const [recentShipments, setRecentShipments] = useState<
    MarketingGoodsShipmentRecord[]
  >([]);
  const [editingRecord, setEditingRecord] =
    useState<MarketingGoodsShipmentRecord | null>(null);
  const [editForm, setEditForm] = useState<EntryFormState>(defaultEntryForm);

  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingHierarchy, setLoadingHierarchy] = useState(false);
  const [addingEntry, setAddingEntry] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Quick Input states
  const [showQuickInput, setShowQuickInput] = useState(false);
  const [pastedData, setPastedData] = useState("");
  const [parsedEntries, setParsedEntries] = useState<Array<{
    phone: string;
    totalGoods: number;
    member?: VipMember;
  }>>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [fileInputRef, setFileInputRef] = useState<HTMLInputElement | null>(null);


  useEffect(() => {
    if (!canAccessMarketing || isLoading) {
      return;
    }

    const loadMembers = async () => {
      setLoadingMembers(true);
      try {
        const roster = await vipMemberService.listMembers();
        setMembers(roster);
      } catch (error) {
        showToast(
          error instanceof Error ? error.message : "Failed to load VIP members",
          "error",
        );
      } finally {
        setLoadingMembers(false);
      }
    };

    void loadMembers();
  }, [canAccessMarketing, isLoading]);

  useEffect(() => {
    if (!canAccessMarketing || isLoading) {
      return;
    }

    const loadHierarchy = async () => {
      setLoadingHierarchy(true);
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
        setLoadingHierarchy(false);
      }
    };

    void loadHierarchy();
  }, [canAccessMarketing, isLoading]);

  useEffect(() => {
    if (
      selectedMemberId &&
      !members.some((member) => member.id === selectedMemberId)
    ) {
      setSelectedMemberId(null);
    }
  }, [members, selectedMemberId]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPortalRoot(document.body);
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    if (!editingRecord) {
      document.body.style.removeProperty("overflow");
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [editingRecord]);

  const availableFilterSubAreas = useMemo(() => {
    if (filterAreaId === "all") {
      return subAreas;
    }
    return subAreas.filter((subArea) => subArea.areaId === filterAreaId);
  }, [filterAreaId, subAreas]);

  const availableFilterBranches = useMemo(() => {
    return branches.filter((branch) => {
      if (filterAreaId !== "all" && branch.areaId !== filterAreaId) {
        return false;
      }
      if (filterSubAreaId !== "all") {
        return (branch.subAreaId ?? null) === filterSubAreaId;
      }
      return true;
    });
  }, [branches, filterAreaId, filterSubAreaId]);

  useEffect(() => {
    if (filterSubAreaId === "all") {
      return;
    }
    const exists = availableFilterSubAreas.some(
      (subArea) => subArea.id === filterSubAreaId,
    );
    if (!exists) {
      setFilterSubAreaId("all");
    }
  }, [availableFilterSubAreas, filterSubAreaId]);

  useEffect(() => {
    if (filterBranchId === "all") {
      return;
    }
    const exists = availableFilterBranches.some(
      (branch) => branch.id === filterBranchId,
    );
    if (!exists) {
      setFilterBranchId("all");
    }
  }, [availableFilterBranches, filterBranchId]);

  const selectedMember = useMemo(() => {
    if (!selectedMemberId) {
      return null;
    }
    return members.find((member) => member.id === selectedMemberId) ?? null;
  }, [members, selectedMemberId]);

  const refreshRecentShipments = useCallback(async () => {
    if (!canAccessMarketing || isLoading) {
      return;
    }

    setLoadingRecent(true);
    try {
      const records = await goodsShipmentService.listRecent({
        limit: 15,
        myOnly: recentScope === "mine",
        ...(recentScope === "all" && filterAreaId !== "all"
          ? { areaId: filterAreaId as number }
          : {}),
        ...(recentScope === "all" && filterSubAreaId !== "all"
          ? { subAreaId: filterSubAreaId as number }
          : {}),
        ...(recentScope === "all" && filterBranchId !== "all"
          ? { branchId: filterBranchId as number }
          : {}),
        ...(memberQuery.trim() ? { memberQuery: memberQuery.trim() } : {}),
      });
      setRecentShipments(records);
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Failed to load recent goods records",
        "error",
      );
    } finally {
      setLoadingRecent(false);
    }
  }, [
    canAccessMarketing,
    filterAreaId,
    filterBranchId,
    filterSubAreaId,
    isLoading,
    memberQuery,
    recentScope,
  ]);

  useEffect(() => {
    void refreshRecentShipments();
  }, [refreshRecentShipments]);

  const handleEntryChange = (field: keyof EntryFormState, value: string) => {
    if (field !== "goodsDate" && !countIsValid(value)) {
      return;
    }
    setEntryForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setEntryForm(defaultEntryForm);
  };

  const parseCounts = (form: EntryFormState) => {
    const totalGoods = Number(form.totalGoods || 0);

    if (totalGoods < 0) {
      showToast("Invalid goods count.", "error");
      return null;
    }

    return totalGoods;
  };

  const validateEntry = () => {
    if (!selectedMember) {
      showToast("Please select a VIP member to link the goods entry.", "error");
      return null;
    }
    if (!entryForm.goodsDate) {
      showToast("Date is required.", "error");
      return null;
    }

    return parseCounts(entryForm);
  };

  const handleAddEntry = async () => {
    const totalGoods = validateEntry();
    if (!totalGoods || !selectedMember) {
      return;
    }

    setAddingEntry(true);
    try {
      // Submit directly to API
      const payload: UserGoodsRecord = {
        userId: String(selectedMember.id),
        sendDate: entryForm.goodsDate,
        totalGoods: totalGoods
      };

      await goodsShipmentService.createBatch([payload]);

      resetForm();
      showToast("Entry submitted successfully!");
      await refreshRecentShipments();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to submit entry",
        "error"
      );
    } finally {
      setAddingEntry(false);
    }
  };

  const removeEntry = (id: string) => {
    setPendingEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  const handleEditChange = (field: keyof EntryFormState, value: string) => {
    if (field !== "goodsDate" && !countIsValid(value)) {
      return;
    }
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const beginEditRecord = (record: MarketingGoodsShipmentRecord) => {
    setEditingRecord(record);
    setEditForm(mapRecordToForm(record));
  };

  const cancelEdit = () => {
    setEditingRecord(null);
    setEditForm(defaultEntryForm);
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) {
      return;
    }
    if (!editForm.goodsDate) {
      showToast("Date is required.", "error");
      return;
    }
    const counts = parseCounts(editForm);
    if (!counts) {
      return;
    }

    setSavingEdit(true);
    try {
      await goodsShipmentService.update(editingRecord.id, {
        sendDate: editForm.goodsDate,
        totalGoods: counts,
      });
      await refreshRecentShipments();
      showToast("Shipment updated.");
      cancelEdit();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to update shipment",
        "error",
      );
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteRecord = async (record: MarketingGoodsShipmentRecord) => {
    if (currentUserId === null || record.createdBy !== currentUserId) {
      showToast("You can only delete records you created.", "error");
      return;
    }
    const confirmDelete = window.confirm(
      `Delete shipment for ${record.memberName} dated ${record.sendDate}? This cannot be undone.`,
    );
    if (!confirmDelete) {
      return;
    }
    setDeletingId(record.id);
    try {
      await goodsShipmentService.delete(record.id);
      if (editingRecord?.id === record.id) {
        cancelEdit();
      }
      await refreshRecentShipments();
      showToast("Shipment deleted.");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to delete shipment",
        "error",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async () => {
    if (pendingEntries.length === 0) {
      showToast("Add at least one entry before submitting.", "error");
      return;
    }

    const payload: UserGoodsRecord[] = pendingEntries.map((entry) => ({
      userId: String(entry.memberId),
      sendDate: entry.goodsDate,
      totalGoods: entry.totalGoods,
    }));

    setSubmitting(true);
    try {
      await goodsShipmentService.createBatch(payload);
      setPendingEntries([]);
      await refreshRecentShipments();
      showToast("Goods data submitted successfully.");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to submit goods data",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const editModal = useMemo(() => {
    if (!editingRecord || !portalRoot) {
      return null;
    }

    return createPortal(
      <div
        className="fixed inset-0 z-9999 flex items-center justify-center p-4"
        style={{ zIndex: 2147483647 }}
      >
        <div
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          aria-hidden="true"
          onClick={cancelEdit}
        />
        <div
          className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-slate-950/90 p-6 text-white shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby={EDIT_MODAL_TITLE_ID}
        >
          <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-amber-300/70">
                Editing record
              </p>
              <h3
                id={EDIT_MODAL_TITLE_ID}
                className="text-2xl font-semibold text-white"
              >
                {editingRecord.memberName} · {editingRecord.branchName}
              </h3>
              <p className="text-sm text-slate-300">
                Update counts or date, then save. Only records you created can
                be edited.
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.3em] text-slate-400">
                Logged on {new Date(editingRecord.createdAt).toLocaleString()}
              </p>
            </div>
            <button
              type="button"
              className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300 hover:border-white/40 hover:text-white"
              onClick={cancelEdit}
              disabled={savingEdit}
            >
              Close
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col text-sm text-white md:col-span-2">
              <label className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-400">
                Goods date
              </label>
              <input
                type="date"
                className="mt-2 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-white focus:border-amber-400/60 focus:outline-none"
                max={today}
                value={editForm.goodsDate}
                onChange={(event) =>
                  handleEditChange("goodsDate", event.target.value)
                }
              />
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-white/10 bg-slate-950/40 p-4 text-white">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-300">
              Total Goods
            </p>
            <h3 className="text-lg font-semibold text-white">
              Total goods shipped
            </h3>
            <p className="text-xs text-slate-400">
              Total number of goods items shipped for this date
            </p>
            <div className="mt-4">
              <div className="flex flex-col text-sm text-white">
                <label className="text-[0.6rem] uppercase tracking-[0.3em] text-slate-400">
                  Total Goods
                </label>
                <input
                  inputMode="numeric"
                  pattern="\d*"
                  className="mt-1 rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-2 text-white focus:border-amber-400/60 focus:outline-none"
                  value={editForm.totalGoods}
                  onChange={(event) =>
                    handleEditChange("totalGoods", event.target.value)
                  }
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 text-sm text-slate-200 lg:flex-row lg:items-center lg:justify-between">
            <span>
              Editing shipment dated <strong>{editingRecord.sendDate}</strong>{" "}
              for <strong>{editingRecord.memberName}</strong>
            </span>
            <div className="flex gap-3">
              <button
                type="button"
                className="rounded-full border border-white/10 px-5 py-2 text-sm font-semibold text-white hover:border-rose-400/50 hover:text-rose-100"
                onClick={cancelEdit}
                disabled={savingEdit}
              >
                Cancel
              </button>
              <PermissionGuard
                permission="goods.edit"
                serviceContext="marketing-service"
                fallback={
                  <button
                    type="button"
                    disabled
                    className="rounded-full border border-white/20 bg-transparent px-5 py-2 text-sm font-semibold text-slate-400 cursor-not-allowed"
                  >
                    Save changes (No Permission)
                  </button>
                }
              >
                <button
                  type="button"
                  className="rounded-full border border-white/10 bg-emerald-500/20 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:border-white/20 disabled:bg-transparent disabled:text-slate-400"
                  onClick={handleSaveEdit}
                  disabled={savingEdit}
                >
                  {savingEdit ? "Saving…" : "Save changes"}
                </button>
              </PermissionGuard>
            </div>
          </div>
        </div>
      </div>,
      portalRoot,
    );
  }, [
    editingRecord,
    portalRoot,
    editForm,
    savingEdit,
    cancelEdit,
    handleEditChange,
    handleSaveEdit,
  ]);

  // Quick Input functions
  const parseExcelData = (data: string) => {
    try {
      const lines = data.trim().split('\n').filter(line => line.trim());

      const parsed = lines.map((line, lineIndex) => {
        const columns = line.split('\t').map(col => col.trim());

        // Skip header rows (first 3 rows)
        if (lineIndex < 3) return null;

        // Ensure we have enough columns
        if (columns.length < 10) return null;

        // Get phone from column E (index 4) starting from row 4
        // Get goods from column J (index 9) starting from row 5
        const phone = columns[4];
        const goodsStr = columns[9]?.replace(/,/g, '') || '0';
        const totalGoods = parseInt(goodsStr, 10);

        // Skip if phone is empty
        if (!phone) return null;

        // Find member
        const cleanPhone = phone.replace(/\s/g, '');
        const member = members.find(m =>
          m.phone === phone ||
          m.phone === cleanPhone ||
          m.phone?.replace(/\s/g, '') === cleanPhone
        );

        return {
          phone: phone,
          totalGoods: isNaN(totalGoods) ? 0 : totalGoods,
          member
        };
      }).filter(entry => entry !== null) as Array<{
        phone: string;
        totalGoods: number;
        member?: VipMember;
      }>;

      setParsedEntries(parsed);
    } catch (error) {
      showToast("Failed to parse data. Please check the format.", "error");
      setParsedEntries([]);
    }
  };

  const handlePasteData = (value: string) => {
    setPastedData(value);
    if (value.trim()) {
      parseExcelData(value);
    } else {
      setParsedEntries([]);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      const text = await file.text();
      setPastedData(text);
      parseExcelData(text);
    } catch (error) {
      showToast("Failed to read file. Please try again.", "error");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const excelFile = files.find(file =>
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls') ||
      file.name.endsWith('.csv') ||
      file.type === 'text/csv' ||
      file.type === 'application/vnd.ms-excel' ||
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    if (excelFile) {
      handleFileUpload(excelFile);
    } else {
      showToast("Please upload an Excel or CSV file.", "error");
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleQuickInputSubmit = async () => {
    const validEntries = parsedEntries.filter(entry => entry.member && entry.totalGoods > 0);

    if (validEntries.length === 0) {
      showToast("No valid entries to submit.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      const batchPayload: UserGoodsRecord[] = validEntries.map(entry => ({
        userId: entry.member!.id.toString(),
        sendDate: today,
        totalGoods: entry.totalGoods
      }));

      await goodsShipmentService.createBatch(batchPayload);

      showToast(`Successfully submitted ${validEntries.length} entries.`);
      setShowQuickInput(false);
      setPastedData("");
      setParsedEntries([]);
      await refreshRecentShipments();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to submit entries",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MarketingServiceGuard>
      <div className="space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-amber-300/70">
            Marketing ◦ Goods intake
          </p>
          <h1 className="text-3xl font-semibold text-white">
            Record VIP shipment activity
          </h1>
          <p className="text-sm text-slate-300">
            Associate every goods record with a branch and VIP member. Stage
            multiple entries and submit them in one batch to keep freight
            analytics up to date.
          </p>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-2 pb-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-amber-300/70">
                Entry composer
              </p>
              <h2 className="text-xl font-semibold text-white">
                Capture shipment metrics
              </h2>
              <p className="text-sm text-slate-300">
                Counts are staged locally so you can validate before pushing
                everything live.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col text-sm text-white md:col-span-2">
              <label className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-400">
                VIP member
              </label>
              <select
                className="mt-2 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-white focus:border-amber-400/60 focus:outline-none"
                value={selectedMemberId ?? ""}
                onChange={(event) => {
                  const value = event.target.value;
                  setSelectedMemberId(value === "" ? null : Number(value));
                }}
                disabled={loadingMembers || members.length === 0}
              >
                <option value="">
                  {loadingMembers ? "Loading members…" : "Select member"}
                </option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} ·{" "}
                    {member.branchName ?? `Branch #${member.branchId}`} (
                    {member.phone})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-400">
                {loadingMembers
                  ? "Fetching roster…"
                  : selectedMember
                    ? `Linked to ${selectedMember.branchName ?? `Branch #${selectedMember.branchId}`}.`
                    : "Pick a member to unlock goods entry."}
              </p>
            </div>
            <div className="flex flex-col text-sm text-white">
              <label className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-400">
                Goods date
              </label>
              <input
                type="date"
                className="mt-2 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-white focus:border-amber-400/60 focus:outline-none"
                max={today}
                value={entryForm.goodsDate}
                onChange={(event) =>
                  handleEntryChange("goodsDate", event.target.value)
                }
              />
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-white/10 bg-slate-950/40 p-4 text-white">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-300">
              Total Goods
            </p>
            <h3 className="text-lg font-semibold text-white">
              Total goods shipped
            </h3>
            <p className="text-xs text-slate-400">
              Total number of goods items shipped for this date
            </p>
            <div className="mt-4">
              <div className="flex flex-col text-sm text-white">
                <label className="text-[0.6rem] uppercase tracking-[0.3em] text-slate-400">
                  Total Goods
                </label>
                <input
                  inputMode="numeric"
                  pattern="\d*"
                  className="mt-1 rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-2 text-white focus:border-amber-400/60 focus:outline-none"
                  value={entryForm.totalGoods}
                  onChange={(event) =>
                    handleEntryChange("totalGoods", event.target.value)
                  }
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 text-sm text-slate-200 lg:flex-row lg:items-center lg:justify-between">
            <span>
              {selectedMember
                ? `Staging goods for ${selectedMember.name} @ ${selectedMember.branchName ?? `Branch #${selectedMember.branchId}`}`
                : "Select a member to enable staging."}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-full border border-white/10 bg-amber-500/20 px-5 py-2 text-sm font-semibold text-white transition hover:bg-amber-500/30"
                onClick={() => setShowQuickInput(true)}
              >
                Quick Input
              </button>
              <button
                type="button"
                disabled={addingEntry || !selectedMember}
                className="rounded-full border border-white/10 bg-emerald-500/20 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:border-white/20 disabled:bg-transparent disabled:text-slate-400"
                onClick={handleAddEntry}
              >
                Add entry
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-2 pb-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-amber-300/70">
                Recent records
              </p>
              <h2 className="text-xl font-semibold text-white">
                Latest goods submissions
              </h2>
              <p className="text-sm text-slate-300">
                Review what you have recorded or switch to the global feed and
                slice it by geography or member lookup.
              </p>
            </div>
            {loadingRecent && (
              <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Refreshing…
              </span>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-sm text-white">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[0.6rem] uppercase tracking-[0.4em] text-slate-400">
                  Visibility
                </p>
                <p className="text-sm text-slate-300">
                  {recentScope === "mine"
                    ? "Showing entries you personally submitted."
                    : "Showing all entries. Apply filters to narrow scope."}
                </p>
              </div>
              <div className="inline-flex rounded-full border border-white/10 bg-slate-900/40 p-1 text-xs font-semibold">
                {[
                  { value: "mine" as const, label: "My records" },
                  { value: "all" as const, label: "All records" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRecentScope(option.value)}
                    className={`rounded-full px-4 py-1 transition ${recentScope === option.value
                      ? "bg-amber-400/30 text-white"
                      : "text-slate-400 hover:text-white"
                      }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col text-xs text-white">
                <label className="text-[0.6rem] uppercase tracking-[0.3em] text-slate-400">
                  Area
                </label>
                <select
                  className="mt-2 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-white focus:border-amber-400/60 focus:outline-none"
                  value={filterAreaId}
                  onChange={(event) => {
                    const next =
                      event.target.value === "all"
                        ? "all"
                        : Number(event.target.value);
                    setFilterAreaId(next);
                    setFilterSubAreaId("all");
                    setFilterBranchId("all");
                  }}
                  disabled={recentScope === "mine" || loadingHierarchy}
                >
                  <option value="all">All areas</option>
                  {areas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col text-xs text-white">
                <label className="text-[0.6rem] uppercase tracking-[0.3em] text-slate-400">
                  Sub area
                </label>
                <select
                  className="mt-2 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-white focus:border-amber-400/60 focus:outline-none"
                  value={filterSubAreaId}
                  onChange={(event) => {
                    const next =
                      event.target.value === "all"
                        ? "all"
                        : Number(event.target.value);
                    setFilterSubAreaId(next);
                    setFilterBranchId("all");
                  }}
                  disabled={
                    recentScope === "mine" ||
                    loadingHierarchy ||
                    filterAreaId === "all"
                  }
                >
                  <option value="all">All sub areas</option>
                  {availableFilterSubAreas.map((subArea) => (
                    <option key={subArea.id} value={subArea.id}>
                      {subArea.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col text-xs text-white">
                <label className="text-[0.6rem] uppercase tracking-[0.3em] text-slate-400">
                  Branch
                </label>
                <select
                  className="mt-2 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-white focus:border-amber-400/60 focus:outline-none"
                  value={filterBranchId}
                  onChange={(event) => {
                    const next =
                      event.target.value === "all"
                        ? "all"
                        : Number(event.target.value);
                    setFilterBranchId(next);
                  }}
                  disabled={recentScope === "mine" || loadingHierarchy}
                >
                  <option value="all">All branches</option>
                  {availableFilterBranches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col text-xs text-white">
                <label className="text-[0.6rem] uppercase tracking-[0.3em] text-slate-400">
                  Search VIP (name or phone)
                </label>
                <input
                  type="text"
                  className="mt-2 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-white focus:border-amber-400/60 focus:outline-none"
                  placeholder="e.g. Dara or 0123"
                  value={memberQuery}
                  onChange={(event) => setMemberQuery(event.target.value)}
                />
              </div>
            </div>
          </div>

          {recentShipments.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-slate-900/40 px-6 py-10 text-center text-sm text-slate-400">
              {recentScope === "mine"
                ? "No submissions yet. Add entries above to seed your history."
                : "No shipments found for the applied filters."}
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-left text-sm text-slate-200">
                <thead>
                  <tr className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    <th className="pb-3 pr-4">Date</th>
                    <th className="pb-3 pr-4">Member</th>
                    <th className="pb-3 pr-4">Branch</th>
                    <th className="pb-3 pr-4 text-right">Total Goods</th>
                    <th className="pb-3 pr-4 text-right">Logged</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentShipments.map((record) => (
                    <tr key={record.id}>
                      <td className="py-3 pr-4">{record.sendDate}</td>
                      <td className="py-3 pr-4">{record.memberName}</td>
                      <td className="py-3 pr-4">{record.branchName}</td>
                      <td className="py-3 pr-4 text-right text-white font-semibold">
                        {record.totalGoods?.toLocaleString() || 0}
                      </td>
                      <td className="py-3 pr-4 text-right text-xs text-slate-400">
                        {new Date(record.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 text-right">
                        {currentUserId !== null &&
                          record.createdBy === currentUserId ? (
                          <div className="inline-flex gap-2">
                            <button
                              type="button"
                              className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200 hover:border-amber-400/50 hover:text-white"
                              onClick={() => beginEditRecord(record)}
                              disabled={
                                savingEdit && editingRecord?.id === record.id
                              }
                            >
                              {savingEdit && editingRecord?.id === record.id
                                ? "Saving…"
                                : "Edit"}
                            </button>
                            <PermissionGuard
                              permission="goods.delete"
                              serviceContext="marketing-service"
                              fallback={
                                <button
                                  type="button"
                                  disabled
                                  className="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-500 cursor-not-allowed"
                                >
                                  Delete
                                </button>
                              }
                            >
                              <button
                                type="button"
                                className="rounded-full border border-white/10 px-3 py-1 text-xs text-rose-200 hover:border-rose-400/50 hover:text-rose-100"
                                onClick={() => handleDeleteRecord(record)}
                                disabled={deletingId === record.id}
                              >
                                {deletingId === record.id
                                  ? "Deleting…"
                                  : "Delete"}
                              </button>
                            </PermissionGuard>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
      {editModal}

      {/* Quick Input Modal */}
      {showQuickInput && portalRoot && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-white/10 bg-slate-900/95 p-6 shadow-2xl">
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-white">Quick Bulk Input</h2>
                  <p className="mt-1 text-sm text-slate-300">
                    Copy Excel data - Phone from E4, Goods from J5
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-white/10 p-2 text-white hover:bg-white/10"
                  onClick={() => {
                    setShowQuickInput(false);
                    setPastedData("");
                    setParsedEntries([]);
                  }}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Drag & Drop Area */}
                <div
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors ${isDragging
                    ? 'border-amber-400 bg-amber-400/10'
                    : 'border-white/20 bg-slate-800/40 hover:border-white/30'
                    }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="flex flex-col items-center gap-3">
                    <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <div>
                      <p className="text-sm text-white font-medium">
                        Drag & drop Excel file here
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        or click to browse
                      </p>
                    </div>
                    <input
                      ref={(el) => setFileInputRef(el)}
                      type="file"
                      accept=".xls,.xlsx,.csv"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      className="rounded-full border border-white/10 bg-amber-500/20 px-4 py-2 text-xs font-medium text-white transition hover:bg-amber-500/30"
                      onClick={() => fileInputRef?.click()}
                    >
                      Choose File
                    </button>
                  </div>
                </div>

                {/* OR Divider */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-white/10"></div>
                  <span className="text-xs text-slate-400 uppercase tracking-wider">OR</span>
                  <div className="flex-1 h-px bg-white/10"></div>
                </div>

                {/* Paste Area */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Copy & Paste Excel Data
                  </label>
                  <textarea
                    className="w-full h-32 rounded-2xl border border-white/10 bg-slate-800/60 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-amber-400/60 focus:outline-none"
                    placeholder="Paste Excel data here..."
                    value={pastedData}
                    onChange={(e) => handlePasteData(e.target.value)}
                  />
                  <p className="mt-2 text-xs text-slate-400">
                    Format: Phone from Column E (row 4+), Goods from Column J (row 5+)
                  </p>
                </div>
              </div>

              {parsedEntries.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-white mb-3">
                    Parsed Entries ({parsedEntries.length})
                  </h3>
                  <div className="max-h-60 overflow-y-auto rounded-2xl border border-white/10 bg-slate-800/40">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-slate-900/90 border-b border-white/20">
                        <tr className="text-left text-xs uppercase tracking-[0.3em] text-slate-300">
                          <th className="p-3 font-semibold bg-slate-800/50 text-white w-12">No</th>
                          <th className="p-3 font-semibold bg-slate-800/50 text-white">Phone</th>
                          <th className="p-3 font-semibold bg-slate-800/50 text-white">Member</th>
                          <th className="p-3 font-semibold bg-slate-800/50 text-white">Branch</th>
                          <th className="p-3 font-semibold bg-slate-800/50 text-white text-right">Total Goods</th>
                          <th className="p-3 font-semibold bg-slate-800/50 text-white text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {parsedEntries.map((entry, index) => (
                          <tr key={index} className={entry.member && entry.totalGoods > 0 ? '' : 'opacity-50'}>
                            <td className="p-3 text-white text-center font-mono text-xs">{index + 1}</td>
                            <td className="p-3 text-white">{entry.phone}</td>
                            <td className="p-3 text-white">
                              {entry.member ? entry.member.name : 'Not found'}
                            </td>
                            <td className="p-3 text-slate-300">
                              {entry.member ? entry.member.branchName : '-'}
                            </td>
                            <td className="p-3 text-right text-white font-mono">
                              {entry.totalGoods.toLocaleString()}
                            </td>
                            <td className="p-3 text-center">
                              {entry.member && entry.totalGoods > 0 ? (
                                <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2 py-1 text-xs font-medium text-emerald-300">
                                  Ready
                                </span>
                              ) : entry.member ? (
                                <span className="inline-flex items-center rounded-full bg-amber-500/20 px-2 py-1 text-xs font-medium text-amber-300">
                                  No Goods
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-red-500/20 px-2 py-1 text-xs font-medium text-red-300">
                                  Invalid User
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  className="rounded-full border border-white/10 px-6 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                  onClick={() => {
                    setShowQuickInput(false);
                    setPastedData("");
                    setParsedEntries([]);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submitting || parsedEntries.filter(e => e.member && e.totalGoods > 0).length === 0}
                  className="rounded-full border border-white/10 bg-emerald-500/20 px-6 py-2 text-sm font-medium text-white transition hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:border-white/20 disabled:bg-transparent disabled:text-slate-400"
                  onClick={handleQuickInputSubmit}
                >
                  {submitting ? 'Submitting...' : `Submit ${parsedEntries.filter(e => e.member && e.totalGoods > 0).length} Entries`}
                </button>
              </div>
            </div>
          </div>
        </div>,
        portalRoot
      )}
    </MarketingServiceGuard>
  );
}
