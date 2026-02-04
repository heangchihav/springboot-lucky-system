"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import html2canvas from "html2canvas";
import { apiFetch } from "@/services/httpClient";
import { useToast } from "@/components/ui/Toast";
import { areaBranchService, Area, Subarea, Branch } from "@/services/areaBranchService";

type CallReportSummaryResponse = {
  calledAt: string;
  arrivedAt?: string;
  type: "new-call" | "recall";
  branchId: number | null;
  branchName: string;
  statusTotals: Record<string, number>;
};

const cloneArrivalBreakdown = (breakdown: GroupedReport["arrivalBreakdown"]): GroupedReport["arrivalBreakdown"] => {
  const cloneType = (type: ArrivalType) => ({
    total: breakdown[type].total,
    statuses: { ...breakdown[type].statuses },
    dates: [...breakdown[type].dates],
  });
  return {
    "new-call": cloneType("new-call"),
    recall: cloneType("recall"),
  };
};

const mergeArrivalBreakdowns = (
  current: GroupedReport["arrivalBreakdown"],
  next: GroupedReport["arrivalBreakdown"]
): GroupedReport["arrivalBreakdown"] => {
  const mergeType = (type: ArrivalType) => {
    const statuses: Record<string, number> = { ...current[type].statuses };
    Object.entries(next[type].statuses).forEach(([status, value]) => {
      statuses[status] = (statuses[status] ?? 0) + value;
    });
    const dates = Array.from(new Set([...current[type].dates, ...next[type].dates])).sort();
    return {
      total: current[type].total + next[type].total,
      statuses,
      dates,
    };
  };

  return {
    "new-call": mergeType("new-call"),
    recall: mergeType("recall"),
  };
};

const getBranchLabel = (branchName?: string | null) => branchName?.trim() || "Unassigned";
const normalizeName = (value?: string | null) => value?.trim().toLowerCase() || "";

const KHMER_MONTHS = [
  "មករា",
  "កុម្ភៈ",
  "មីនា",
  "មេសា",
  "ឧសភា",
  "មិថុនា",
  "កក្កដា",
  "សីហា",
  "កញ្ញា",
  "តុលា",
  "វិច្ឆិកា",
  "ធ្នូ",
];

const formatKhFullDateLabel = (dateString: string) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  const dayFormatter = new Intl.NumberFormat("km-KH", { minimumIntegerDigits: 1 });
  const day = dayFormatter.format(date.getUTCDate());
  const monthName = KHMER_MONTHS[date.getUTCMonth()] ?? "";
  const yearLabel = date.toLocaleDateString("km-KH", { year: "numeric" });

  return `ថ្ងៃទី ${day.padStart(2, "០")} ខែ${monthName} ឆ្នាំ ${yearLabel}`;
};

type CallStatusResponse = {
  key: string;
  label: string;
};

type ArrivalType = "new-call" | "recall";

type GroupedReport = {
  calledAt: string;
  branches: string[];
  totalsByStatus: Record<string, number>;
  totalCalls: number;
  arrivalBreakdown: Record<ArrivalType, {
    total: number;
    statuses: Record<string, number>;
    dates: string[];
  }>;
};

type ReportRow = {
  id: string;
  calledAt: string;
  branchId: number | null;
  branchName: string;
  areaId?: number;
  areaName?: string;
  subareaId?: number;
  subareaName?: string;
  totalsByStatus: Record<string, number>;
  totalCalls: number;
  arrivalBreakdown: GroupedReport["arrivalBreakdown"];
};

const LOOKBACK_DAYS = 6;

const defaultStartDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - LOOKBACK_DAYS);
  return date.toISOString().slice(0, 10);
};

const defaultEndDate = () => new Date().toISOString().slice(0, 10);

const normalizeDateForArrival = (value?: string | null) => {
  if (!value) return null;
  const isoMatch = value.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${year}-${month}-${day}`;
  }
  const slashMatch = value.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return `${year}-${month}-${day}`;
  }
  return value;
};

const classifyArrivalType = (summary: CallReportSummaryResponse): ArrivalType => {
  return summary.type || "new-call";
};

const buildArrivalBreakdownFromSummary = (summary: CallReportSummaryResponse): GroupedReport["arrivalBreakdown"] => {
  const buckets: Record<ArrivalType, { total: number; statuses: Record<string, number>; dates: Set<string> }> = {
    "new-call": { total: 0, statuses: {}, dates: new Set<string>() },
    recall: { total: 0, statuses: {}, dates: new Set<string>() },
  };

  const arrivalType = classifyArrivalType(summary);
  const bucket = buckets[arrivalType];
  const normalizedArrivalDate =
    normalizeDateForArrival(summary.arrivedAt) ??
    normalizeDateForArrival(summary.calledAt) ??
    summary.calledAt;

  if (normalizedArrivalDate) {
    bucket.dates.add(normalizedArrivalDate);
  }

  Object.entries(summary.statusTotals).forEach(([status, value]) => {
    bucket.statuses[status] = (bucket.statuses[status] ?? 0) + value;
    bucket.total += value;
  });

  return {
    "new-call": {
      total: buckets["new-call"].total,
      statuses: buckets["new-call"].statuses,
      dates: Array.from(buckets["new-call"].dates).sort(),
    },
    recall: {
      total: buckets.recall.total,
      statuses: buckets.recall.statuses,
      dates: Array.from(buckets.recall.dates).sort(),
    },
  };
};

const formatKhDate = (dateString: string) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  const dayFormatter = new Intl.NumberFormat("km-KH", { minimumIntegerDigits: 1 });
  const day = dayFormatter.format(date.getUTCDate());
  const monthName = KHMER_MONTHS[date.getUTCMonth()] ?? "";
  const yearLabel = date.toLocaleDateString("km-KH", { year: "numeric" });

  return `${day.padStart(2, "០")} ខែ${monthName} ឆ្នាំ ${yearLabel}`;
};

const formatNumber = (value?: number) => (value ?? 0).toLocaleString("km-KH");

const formatArrivalDateRange = (dates?: string[]) => {
  if (!dates || dates.length === 0) {
    return null;
  }

  const uniqueSorted = Array.from(new Set(dates)).sort();
  const parse = (value: string) => new Date(value);
  const first = parse(uniqueSorted[0]);
  const last = parse(uniqueSorted[uniqueSorted.length - 1]);

  if (Number.isNaN(first.getTime()) || Number.isNaN(last.getTime())) {
    return null;
  }

  const sameMonthAndYear =
    first.getUTCFullYear() === last.getUTCFullYear() &&
    first.getUTCMonth() === last.getUTCMonth();

  const formatDay = (date: Date) => date.getUTCDate().toString().padStart(2, "0");
  const monthName = first.toLocaleDateString("km-KH", { month: "long" });
  const yearLabel = first.toLocaleDateString("km-KH", { year: "numeric" });

  if (sameMonthAndYear) {
    if (first.getUTCDate() === last.getUTCDate()) {
      return `ថ្ងៃទី ${formatDay(first)} ខែ${monthName} ឆ្នាំ ${yearLabel}`;
    }
    return `ថ្ងៃទី ${formatDay(first)}-${formatDay(last)} ខែ${monthName} ឆ្នាំ ${yearLabel}`;
  }

  return `${formatKhDate(uniqueSorted[0])} ដល់ ${formatKhDate(uniqueSorted[uniqueSorted.length - 1])}`;
};

export default function CallReports() {
  const [summaries, setSummaries] = useState<CallReportSummaryResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<GroupedReport | null>(null);
  const [statuses, setStatuses] = useState<CallStatusResponse[]>([]);
  const [statusesError, setStatusesError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [copyingText, setCopyingText] = useState(false);
  const [copyingImage, setCopyingImage] = useState(false);
  const [startDate, setStartDate] = useState(() => defaultStartDate());
  const [endDate, setEndDate] = useState(() => defaultEndDate());
  const [areas, setAreas] = useState<Area[]>([]);
  const [subareas, setSubareas] = useState<Subarea[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);
  const [selectedSubareaId, setSelectedSubareaId] = useState<number | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const modalContentRef = useRef<HTMLDivElement | null>(null);
  const { showToast } = useToast();

  const fetchReports = useCallback(async () => {
    if (!startDate || !endDate) return;
    if (new Date(startDate) > new Date(endDate)) {
      showToast("កែប្រែកាលបរិច្ឆេទឱ្យត្រឹមត្រូវសិន", "error");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append("startDate", startDate);
      params.append("endDate", endDate);
      const response = await apiFetch(`/api/calls/reports/summary?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Unable to load reports");
      }
      const data: CallReportSummaryResponse[] = await response.json();
      setSummaries(data);
    } catch (err) {
      console.error(err);
      setError("ពុំអាចទាញយកទិន្នន័យបានទេ។ សូមព្យាយាមម្តងទៀត។");
    } finally {
      setLoading(false);
    }
  }, [endDate, showToast, startDate]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleResetFilters = useCallback(() => {
    const defaultStart = defaultStartDate();
    const defaultEnd = defaultEndDate();
    setStartDate(defaultStart);
    setEndDate(defaultEnd);
    setSelectedAreaId(null);
    setSelectedSubareaId(null);
    setSelectedBranchId(null);
    setSearchTerm("");
  }, []);

  useEffect(() => {
    const fetchStatuses = async () => {
      setStatusesError(null);
      try {
        const response = await apiFetch("/api/calls/statuses");
        if (!response.ok) {
          throw new Error("Unable to load statuses");
        }
        const data: CallStatusResponse[] = await response.json();
        setStatuses(data);
      } catch (err) {
        console.error(err);
        setStatusesError("ពុំអាចទាញយកប្រភេទស្ថានភាពបានទេ");
      }
    };

    fetchStatuses();
  }, []);

  useEffect(() => {
    const loadAreaHierarchy = async () => {
      try {
        const [allAreas, allSubareas, allBranches] = await Promise.all([
          areaBranchService.getAreas(),
          areaBranchService.getSubareas(),
          areaBranchService.getBranches(),
        ]);
        setAreas(allAreas);
        setSubareas(allSubareas);
        setBranches(allBranches);
      } catch (err) {
        console.error("Failed to load area hierarchy", err);
        showToast("ពុំអាចទាញយកទិន្នន័យសាខាបានទេ", "error");
      }
    };

    loadAreaHierarchy();
  }, [showToast]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (selectedReport) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [selectedReport]);

  const statusLabelMap = useMemo(() => {
    const map: Record<string, string> = {};
    statuses.forEach((status) => {
      map[status.key] = status.label;
    });
    return map;
  }, [statuses]);

  const statusKeysFromData = useMemo(() => {
    const set = new Set<string>();
    summaries.forEach((summary) => {
      Object.keys(summary.statusTotals).forEach((key) => set.add(key));
    });
    return Array.from(set);
  }, [summaries]);

  const statusDisplayOrder = useMemo(() => {
    const orderedKeys = statuses.map((status) => status.key);
    const existing = new Set(orderedKeys);
    statusKeysFromData.forEach((key) => {
      if (!existing.has(key)) {
        orderedKeys.push(key);
        existing.add(key);
      }
    });
    return orderedKeys;
  }, [statuses, statusKeysFromData]);

  const buildStatusSummary = useCallback((totals: Record<string, number>) => {
    const meaningful = statusDisplayOrder.filter((key) => (totals[key] ?? 0) > 0);
    if (meaningful.length === 0) return "—";
    return meaningful
      .map((key) => `${statusLabelMap[key] ?? key}: ${formatNumber(totals[key])}`)
      .join(" · ");
  }, [statusDisplayOrder, statusLabelMap]);

  const buildArrivalText = useCallback((type: ArrivalType, data: { total: number; statuses: Record<string, number>; dates?: string[] }) => {
    if (!data || data.total === 0) return null;
    const heading =
      type === "new-call"
        ? "អីវ៉ាន់ចូលថ្មី (New Call)"
        : "Re-Call";
    const dateRange = formatArrivalDateRange(data.dates);
    const statusLines = statusDisplayOrder.filter((key) => (data.statuses[key] ?? 0) > 0)
      .map((key) => `- ${statusLabelMap[key] ?? key} : ${formatNumber(data.statuses[key])} កញ្ចប់`);

    return [
      `${heading}${dateRange ? ` (${dateRange})` : ""} : ${formatNumber(data.total)} កញ្ចប់`,
      ...statusLines,
    ];
  }, [statusDisplayOrder, statusLabelMap]);

  const buildReportTextContent = useCallback((report: GroupedReport) => {
    const totalPlanned = report.totalCalls;
    const notCalled = report.totalsByStatus["not-called-yet"] ?? 0;
    const completed = totalPlanned - notCalled;

    const newArrivalText = buildArrivalText("new-call", report.arrivalBreakdown["new-call"]);
    const recallText = buildArrivalText("recall", report.arrivalBreakdown["recall"]);

    const lines: string[] = [
      "ជំរាបសួរបង",
      `សូមអនុញ្ញាតរាយការណ៍លទ្ធផលការតេរបស់ផ្នែក Call Center ថ្ងៃទី ${formatKhDate(report.calledAt)}${report.branches.length > 0 ? ` សម្រាប់ ${report.branches.join(", ")}` : ""} ។`,
      `👉 ចំនួនត្រូវតេសរុប ${formatNumber(totalPlanned)} កញ្ចប់`,
      `👉 មិនទាន់បានតេ : ${formatNumber(notCalled)} កញ្ចប់`,
      `👉 ចំនួនតេរួចសរុប ${formatNumber(completed)} កញ្ចប់ បែងចែកជា ៖`
    ];

    if (newArrivalText) {
      lines.push(...newArrivalText.map((line) => `• ${line}`));
    }

    if (recallText) {
      lines.push(...recallText.map((line) => `• ${line}`));
    }

    lines.push("សូមអរគុណបង!");
    return lines.join("\n");
  }, [buildArrivalText]);

  const handleCopyText = useCallback(async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!selectedReport) return;

    setCopyingText(true);
    try {
      await navigator.clipboard.writeText(buildReportTextContent(selectedReport));
      showToast("បានចម្លងអត្ថបទរបាយការណ៍", "success");
    } catch (copyError) {
      console.error(copyError);
      showToast("ពុំអាចចម្លងអត្ថបទបានទេ", "error");
    } finally {
      setCopyingText(false);
    }
  }, [buildReportTextContent, selectedReport, showToast]);

  const handleCopyImage = useCallback(async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!selectedReport) {
      showToast("រកមិនឃើញខ្លឹមសារឱ្យចម្លង", "error");
      return;
    }

    setCopyingImage(true);
    try {
      const tempWrapper = document.createElement("div");
      tempWrapper.style.position = "fixed";
      tempWrapper.style.left = "-9999px";
      tempWrapper.style.top = "0";
      tempWrapper.style.pointerEvents = "none";

      const exportContainer = document.createElement("div");
      exportContainer.style.width = "900px";
      exportContainer.style.background = "#ffffff";
      exportContainer.style.color = "#0f172a";
      exportContainer.style.fontFamily = "'Khmer OS', 'Noto Sans Khmer', 'Battambang', sans-serif";
      exportContainer.style.padding = "40px";
      exportContainer.style.boxSizing = "border-box";
      exportContainer.style.border = "1px solid #e2e8f0";
      exportContainer.style.borderRadius = "24px";
      exportContainer.style.display = "flex";
      exportContainer.style.flexDirection = "column";
      exportContainer.style.gap = "16px";
      exportContainer.style.boxShadow = "0 20px 60px rgba(15,23,42,0.15)";

      const addParagraph = (text: string, opts: { bold?: boolean; size?: string } = {}) => {
        const p = document.createElement("p");
        p.textContent = text;
        p.style.margin = "0";
        p.style.fontSize = opts.size ?? "16px";
        if (opts.bold) {
          p.style.fontWeight = "600";
        }
        exportContainer.appendChild(p);
      };

      const addSection = (title: string, lines: string[]) => {
        if (!lines || lines.length === 0) return;
        const section = document.createElement("div");
        section.style.border = "1px solid #e2e8f0";
        section.style.borderRadius = "16px";
        section.style.padding = "16px";
        section.style.background = "#f8fafc";

        const heading = document.createElement("p");
        heading.textContent = title;
        heading.style.fontWeight = "600";
        heading.style.margin = "0 0 8px";
        heading.style.fontSize = "15px";
        section.appendChild(heading);

        lines.forEach((line) => {
          const item = document.createElement("p");
          item.textContent = line.replace(/^[-•]\s*/, "• ");
          item.style.margin = "0 0 6px";
          item.style.fontSize = "14px";
          section.appendChild(item);
        });

        exportContainer.appendChild(section);
      };

      const header = document.createElement("div");
      header.style.display = "flex";
      header.style.flexDirection = "column";
      header.style.gap = "8px";
      header.style.alignItems = "center";
      header.style.textAlign = "center";

      const headerTopRow = document.createElement("div");
      headerTopRow.style.display = "flex";
      headerTopRow.style.alignItems = "center";
      headerTopRow.style.justifyContent = "center";
      headerTopRow.style.gap = "12px";

      const logo = document.createElement("img");
      logo.src = "/Logo.png";
      logo.alt = "VVB Logo";
      logo.style.width = "48px";
      logo.style.height = "48px";
      logo.style.objectFit = "contain";
      logo.style.borderRadius = "12px";
      logo.style.border = "1px solid #e2e8f0";
      logo.style.background = "#ffffff";
      headerTopRow.appendChild(logo);

      const headerTitle = document.createElement("p");
      headerTitle.textContent = "របាយការណ៍ផ្នែក Call Center";
      headerTitle.style.margin = "0";
      headerTitle.style.fontFamily = "'Khmer OS Muol', 'Khmer OS', 'Battambang', sans-serif";
      headerTitle.style.fontSize = "22px";
      headerTopRow.appendChild(headerTitle);

      header.appendChild(headerTopRow);

      const headerSub = document.createElement("p");
      headerSub.textContent = formatKhFullDateLabel(selectedReport.calledAt);
      headerSub.style.margin = "0";
      headerSub.style.fontSize = "16px";
      headerSub.style.color = "#475569";
      header.appendChild(headerSub);

      if (selectedReport.branches.length > 0) {
        const branchLine = document.createElement("p");
        branchLine.textContent = `សម្រាប់សាខាៈ ${selectedReport.branches.join(", ")}`;
        branchLine.style.margin = "0";
        branchLine.style.fontSize = "15px";
        branchLine.style.fontFamily = "'Khmer OS Muol', 'Khmer OS', 'Battambang', sans-serif";
        header.appendChild(branchLine);
      }

      exportContainer.appendChild(header);

      addParagraph("ជំរាបសួរបង", { size: "16px" });

      const introLine = document.createElement("p");
      introLine.textContent = `សូមអនុញ្ញាតរាយការណ៍លទ្ធផលការតេរបស់ផ្នែក Call Center ${formatKhFullDateLabel(selectedReport.calledAt)}${selectedReport.branches.length > 0 ? ` សម្រាប់ ${selectedReport.branches.join(", ")}` : ""} ។`;
      introLine.style.margin = "0";
      introLine.style.fontSize = "16px";
      exportContainer.appendChild(introLine);

      const totalPlanned = selectedReport.totalCalls;
      const notCalled = selectedReport.totalsByStatus["not-called-yet"] ?? 0;
      const completed = totalPlanned - notCalled;

      const infoBlock = document.createElement("div");
      infoBlock.style.display = "flex";
      infoBlock.style.flexDirection = "column";
      infoBlock.style.gap = "4px";

      [
        `👉 ចំនួនត្រូវតេសរុប ${formatNumber(totalPlanned)} កញ្ចប់`,
        `👉 មិនទាន់បានតេ : ${formatNumber(notCalled)} កញ្ចប់`,
        `👉 ចំនួនតេរួចសរុប ${formatNumber(completed)} កញ្ចប់ បែងចែកជា ៖`,
      ].forEach((line) => {
        const p = document.createElement("p");
        p.textContent = line;
        p.style.margin = "0";
        p.style.fontSize = "15px";
        infoBlock.appendChild(p);
      });

      exportContainer.appendChild(infoBlock);

      const newArrivalText = buildArrivalText("new-call", selectedReport.arrivalBreakdown["new-call"]);
      const recallText = buildArrivalText("recall", selectedReport.arrivalBreakdown["recall"]);

      addSection("អីវ៉ាន់ចូលថ្មី (New Call)", newArrivalText ?? []);
      addSection("Re-Call", recallText ?? []);

      addParagraph("សូមអរគុណបង!", { bold: true, size: "16px" });

      tempWrapper.appendChild(exportContainer);
      document.body.appendChild(tempWrapper);

      type Html2CanvasOptions = Parameters<typeof html2canvas>[1];
      const canvas = await html2canvas(exportContainer, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        useCORS: true,
      } as Html2CanvasOptions);

      document.body.removeChild(tempWrapper);

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) {
        throw new Error("Failed to create image");
      }

      try {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        showToast("បានចម្លងរបាយការណ៍ជារូបភាព", "success");
      } catch (clipboardError) {
        console.warn("Clipboard write failed, downloading instead", clipboardError);
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const safeDate = selectedReport.calledAt.replace(/[^0-9-]/g, "");
        link.href = url;
        link.download = `call-report-${safeDate || "snapshot"}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast("បានទាញយករបាយការណ៍ជារូបភាព", "success");
      }
    } catch (imageError) {
      console.error(imageError);
      showToast("ពុំអាចចម្លងរបាយការណ៍ជារូបភាពបានទេ", "error");
    } finally {
      setCopyingImage(false);
    }
  }, [buildArrivalText, selectedReport, showToast]);

  const branchLookupById = useMemo(() => {
    const map = new Map<number, Branch>();
    branches.forEach((branch) => {
      map.set(branch.id, branch);
    });
    return map;
  }, [branches]);

  const branchLookupByName = useMemo(() => {
    const map = new Map<string, Branch>();
    branches.forEach((branch) => {
      map.set(normalizeName(branch.name), branch);
    });
    return map;
  }, [branches]);

  const areaLookupById = useMemo(() => {
    const map = new Map<number, Area>();
    areas.forEach((area) => {
      map.set(area.id, area);
    });
    return map;
  }, [areas]);

  const subareaAreaMap = useMemo(() => {
    const map = new Map<number, number>();
    subareas.forEach((subarea) => {
      map.set(subarea.id, subarea.areaId);
    });
    return map;
  }, [subareas]);

  const subareaLookupById = useMemo(() => {
    const map = new Map<number, Subarea>();
    subareas.forEach((subarea) => {
      map.set(subarea.id, subarea);
    });
    return map;
  }, [subareas]);

  const resolveBranch = useCallback((branchId: number | null | undefined, branchName?: string | null) => {
    if (typeof branchId === "number") {
      const match = branchLookupById.get(branchId);
      if (match) return match;
    }
    if (branchName) {
      const normalized = normalizeName(branchName);
      const direct = branchLookupByName.get(normalized);
      if (direct) return direct;
      return branches.find((branch) => {
        const branchNormalized = normalizeName(branch.name);
        return normalized.includes(branchNormalized) || branchNormalized.includes(normalized);
      });
    }
    return undefined;
  }, [branchLookupById, branchLookupByName, branches]);

  const reportRows = useMemo<ReportRow[]>(() => {
    return summaries.map((summary, index) => {
      const branchInfo = resolveBranch(summary.branchId, summary.branchName);

      const branchName = getBranchLabel(branchInfo?.name ?? summary.branchName);
      const resolvedSubareaId = branchInfo?.subareaId ?? undefined;
      const resolvedAreaId = branchInfo?.areaId ?? (resolvedSubareaId ? subareaAreaMap.get(resolvedSubareaId) : undefined);
      const resolvedAreaName = resolvedAreaId ? areaLookupById.get(resolvedAreaId)?.name ?? branchInfo?.areaName : branchInfo?.areaName;
      const resolvedSubareaName = resolvedSubareaId ? subareaLookupById.get(resolvedSubareaId)?.name ?? branchInfo?.subareaName : branchInfo?.subareaName;
      const totalCalls = Object.values(summary.statusTotals).reduce((sum, value) => sum + value, 0);

      return {
        id: `${summary.calledAt}-${summary.branchId ?? summary.branchName ?? index}`,
        calledAt: summary.calledAt,
        branchId: summary.branchId ?? null,
        branchName,
        areaId: resolvedAreaId,
        areaName: resolvedAreaName,
        subareaId: resolvedSubareaId,
        subareaName: resolvedSubareaName,
        totalsByStatus: summary.statusTotals,
        totalCalls,
        arrivalBreakdown: buildArrivalBreakdownFromSummary(summary),
      };
    });
  }, [areaLookupById, resolveBranch, subareaAreaMap, subareaLookupById, summaries]);

  const aggregatedRows = useMemo<ReportRow[]>(() => {
    const map = new Map<string, ReportRow>();

    reportRows.forEach((row) => {
      const key = `${row.branchId ?? row.branchName}-${row.calledAt}`;
      const existing = map.get(key);

      if (!existing) {
        map.set(key, {
          ...row,
          totalsByStatus: { ...row.totalsByStatus },
          arrivalBreakdown: cloneArrivalBreakdown(row.arrivalBreakdown),
        });
        return;
      }

      const mergedTotals: Record<string, number> = { ...existing.totalsByStatus };
      Object.entries(row.totalsByStatus).forEach(([status, value]) => {
        mergedTotals[status] = (mergedTotals[status] ?? 0) + value;
      });
      existing.totalsByStatus = mergedTotals;
      existing.totalCalls += row.totalCalls;
      existing.arrivalBreakdown = mergeArrivalBreakdowns(existing.arrivalBreakdown, row.arrivalBreakdown);

      if (!existing.areaId && row.areaId) {
        existing.areaId = row.areaId;
        existing.areaName = row.areaName;
      }
      if (!existing.subareaId && row.subareaId) {
        existing.subareaId = row.subareaId;
        existing.subareaName = row.subareaName;
      }
    });

    return Array.from(map.values()).sort((a, b) => new Date(b.calledAt).getTime() - new Date(a.calledAt).getTime());
  }, [reportRows]);

  const filteredSubareas = useMemo(() => {
    return subareas.filter((subarea) => !selectedAreaId || subarea.areaId === selectedAreaId);
  }, [selectedAreaId, subareas]);

  const filteredBranches = useMemo(() => {
    return branches.filter((branch) => {
      const branchAreaId = branch.areaId ?? (branch.subareaId ? subareaAreaMap.get(branch.subareaId) : undefined);
      if (selectedAreaId && branchAreaId !== selectedAreaId) {
        return false;
      }
      if (selectedSubareaId && branch.subareaId !== selectedSubareaId) {
        return false;
      }
      return true;
    });
  }, [branches, selectedAreaId, selectedSubareaId, subareaAreaMap]);

  const filteredRows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return aggregatedRows
      .filter((row) => {
        const branchInfo = resolveBranch(row.branchId, row.branchName);
        const rowSubareaId = row.subareaId ?? branchInfo?.subareaId ?? undefined;
        const rowAreaId = row.areaId ?? branchInfo?.areaId ?? (rowSubareaId ? subareaAreaMap.get(rowSubareaId) : undefined);
        const rowBranchId = row.branchId ?? branchInfo?.id ?? undefined;

        if (selectedAreaId && rowAreaId !== selectedAreaId) {
          return false;
        }
        if (selectedSubareaId && rowSubareaId !== selectedSubareaId) {
          return false;
        }
        if (selectedBranchId && rowBranchId !== selectedBranchId) {
          return false;
        }

        if (!term) return true;
        const statusText = buildStatusSummary(row.totalsByStatus).toLowerCase();
        return [
          row.branchName,
          row.areaName,
          row.subareaName,
          row.calledAt,
          formatKhDate(row.calledAt),
          statusText,
        ]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(term));
      })
      .sort((a, b) => new Date(b.calledAt).getTime() - new Date(a.calledAt).getTime());
  }, [
    resolveBranch,
    subareaAreaMap,
    buildStatusSummary,
    aggregatedRows,
    searchTerm,
    selectedAreaId,
    selectedBranchId,
    selectedSubareaId,
  ]);

  const handleOpenRow = useCallback((row: ReportRow) => {
    setSelectedReport({
      calledAt: row.calledAt,
      branches: [row.branchName],
      totalsByStatus: row.totalsByStatus,
      totalCalls: row.totalCalls,
      arrivalBreakdown: row.arrivalBreakdown,
    });
  }, []);

  const renderModalContent = (report: GroupedReport) => {
    const totalPlanned = report.totalCalls;
    const notCalled = report.totalsByStatus["not-called-yet"] ?? 0;
    const completed = totalPlanned - notCalled;

    const newArrivalText = buildArrivalText("new-call", report.arrivalBreakdown["new-call"]);
    const recallText = buildArrivalText("recall", report.arrivalBreakdown["recall"]);

    return (
      <div className="space-y-4 text-sm text-slate-100">
        <p>ជំរាបសួរបង</p>
        <p>
          សូមអនុញ្ញាតរាយការណ៍លទ្ធផលការតេរបស់ផ្នែក Call Center ថ្ងៃទី {formatKhDate(report.calledAt)}
          {report.branches.length > 0 && ` សម្រាប់ ${report.branches.join(", ")}`} ។
        </p>
        <div className="space-y-1">
          <p>👉 ចំនួនត្រូវតេសរុប {formatNumber(totalPlanned)} កញ្ចប់</p>
          <p>👉 មិនទាន់បានតេ : {formatNumber(notCalled)} កញ្ចប់</p>
          <p>👉 ចំនួនតេរួចសរុប {formatNumber(completed)} កញ្ចប់ បែងចែកជា ៖</p>
        </div>
        <div className="space-y-4">
          {newArrivalText && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              {newArrivalText.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          )}
          {recallText && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              {recallText.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          )}
        </div>
        <p>សូមអរគុណបង!</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Call Service · Reports</h2>
        <p className="text-slate-300">របាយការណ៍លទ្ធផលតាមថ្ងៃ និងសាខា</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-white space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-wide text-slate-400">កាលបរិច្ឆេទចាប់ផ្តើម</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-white focus:border-cyan-400 focus:outline-none"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-wide text-slate-400">កាលបរិច្ឆេទបញ្ចប់</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-white focus:border-cyan-400 focus:outline-none"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-wide text-slate-400">តំបន់ (Area)</span>
            <select
              value={selectedAreaId ?? ""}
              onChange={(e) => {
                const value = e.target.value ? Number(e.target.value) : null;
                setSelectedAreaId(value);
                setSelectedSubareaId(null);
                setSelectedBranchId(null);
              }}
              className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-white focus:border-cyan-400 focus:outline-none"
            >
              <option value="">តំបន់ទាំងអស់</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>{area.name}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-wide text-slate-400">ក្រោមតំបន់ (Sub-area)</span>
            <select
              value={selectedSubareaId ?? ""}
              onChange={(e) => {
                const value = e.target.value ? Number(e.target.value) : null;
                setSelectedSubareaId(value);
                setSelectedBranchId(null);
              }}
              className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-white focus:border-cyan-400 focus:outline-none"
            >
              <option value="">ក្រោមតំបន់ទាំងអស់</option>
              {filteredSubareas.map((subarea) => (
                <option key={subarea.id} value={subarea.id}>{subarea.name}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-wide text-slate-400">សាខា</span>
            <select
              value={selectedBranchId ?? ""}
              onChange={(e) => {
                const value = e.target.value ? Number(e.target.value) : null;
                setSelectedBranchId(value);
              }}
              className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-white focus:border-cyan-400 focus:outline-none"
            >
              <option value="">សាខាទាំងអស់</option>
              {filteredBranches.map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-wide text-slate-400">ស្វែងរក</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ស្វែងរកតាមសាខា កាលបរិច្ឆេទ ឬស្ថានភាព"
              className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleResetFilters}
            className="rounded-xl bg-linear-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50"
          >
            កំណត់ឡើងវិញ
          </button>
          <span className="text-xs text-slate-400 self-center">
            បង្ហាញ​ពី {formatKhDate(startDate)} ដល់ {formatKhDate(endDate)}
          </span>
        </div>
      </div>

      {loading && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white">
          កំពុងទាញយកទិន្នន័យ...
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-100">
          {error}
        </div>
      )}

      {!loading && !error && filteredRows.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-white/70">
          មិនមានទិន្នន័យរបាយការណ៍ក្នុងកាលបរិច្ឆេទនេះទេ។
        </div>
      )}

      {!loading && !error && filteredRows.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-white/5 bg-slate-950/70">
          <table className="min-w-full divide-y divide-white/5 text-sm">
            <thead>
              <tr className="bg-white/5 text-left text-xs font-semibold uppercase tracking-wider text-slate-300">
                <th className="px-4 py-3">No</th>
                <th className="px-4 py-3">Called At</th>
                <th className="px-4 py-3">Branch</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white/90">
              {filteredRows.map((row, index) => (
                <tr
                  key={`${row.id}-${index}`}
                  className="cursor-pointer transition hover:bg-white/5"
                  onClick={() => handleOpenRow(row)}
                >
                  <td className="px-4 py-3 text-sm font-semibold text-slate-300">{index + 1}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-white">{formatKhDate(row.calledAt)}</div>
                    <p className="text-xs text-slate-400">{row.calledAt}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-white">{row.branchName}</div>
                    <p className="text-xs text-slate-400">
                      {[row.subareaName, row.areaName].filter(Boolean).join(" · ")}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-slate-300 line-clamp-2">{buildStatusSummary(row.totalsByStatus)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-semibold text-white">
                      {formatNumber(row.totalCalls)} កញ្ចប់
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="px-4 py-3 text-right text-xs text-slate-500">
            ចុចលើជួរដេកណាមួយដើម្បីមើលព័ត៌មានលម្អិត។
          </p>
        </div>
      )}

      {isClient && selectedReport && createPortal(
        <div className="fixed inset-0 z-1000">
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setSelectedReport(null)}
          ></div>
          <div className="relative z-10 flex min-h-full items-start justify-center p-4 pt-12">
            <div
              ref={modalContentRef}
              className="w-full max-w-3xl rounded-3xl border border-white/10 bg-slate-950/95 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.65)] animate-slide-down"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.35em] text-cyan-300">Call Center Report</p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">{formatKhDate(selectedReport.calledAt)}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyText}
                    disabled={copyingText}
                    className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {copyingText ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <circle className="opacity-30" cx="12" cy="12" r="10" strokeWidth="4" />
                          <path className="opacity-70" d="M4 12a8 8 0 018-8" strokeWidth="4" strokeLinecap="round" />
                        </svg>
                        កំពុងចម្លង
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round" />
                          <rect x="9" y="10" width="11" height="11" rx="2" ry="2" />
                        </svg>
                        Copy Text
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCopyImage}
                    disabled={copyingImage}
                    className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {copyingImage ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <circle className="opacity-30" cx="12" cy="12" r="10" strokeWidth="4" />
                          <path className="opacity-70" d="M4 12a8 8 0 018-8" strokeWidth="4" strokeLinecap="round" />
                        </svg>
                        Copying...
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="7" height="7" rx="1.5" />
                          <rect x="14" y="3" width="7" height="7" rx="1.5" />
                          <rect x="3" y="14" width="7" height="7" rx="1.5" />
                          <rect x="14" y="14" width="7" height="7" rx="1.5" />
                        </svg>
                        Copy Image
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="text-white/60 transition hover:text-white text-2xl leading-none"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="mt-4 max-h-[70vh] overflow-y-auto pr-2 text-sm text-white/80">
                {renderModalContent(selectedReport)}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
