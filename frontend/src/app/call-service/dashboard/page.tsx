"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Activity, RefreshCw, TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PieLabelRenderProps } from "recharts";
import { apiFetch } from "@/services/httpClient";
import { areaBranchService, type Area as AreaType, type Subarea, type Branch } from "@/services/areaBranchService";

const STATUS_COLORS = [
  "#f97316", // orange (primary)
  "#22d3ee", // cyan 
  "#34d399", // green
  "#fb923c", // amber
  "#facc15", // yellow
  "#06b6d4", // blue
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#f87171", // red
  "#a78bfa", // indigo
  "#60a5fa", // light blue
  "#34d399", // emerald
];

const DEFAULT_STATUS_LABELS: Record<string, string> = {
  "not-called-yet": "មិនទាន់តេ",
  called: "តេរួច",
  "no-answer": "តេមិនលើក",
  "call-not-connected": "តេមិនចូល",
  "delivered-to-customer": "ដឹកដល់ផ្ទះ",
};

type ChartGranularity = "daily" | "weekly" | "monthly";

const GRANULARITY_ORDER: ChartGranularity[] = ["daily", "weekly", "monthly"];
const GRANULARITY_LABELS: Record<ChartGranularity, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

const toUTCDate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
};

const getISOWeekInfo = (date: Date) => {
  const temp = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const dayNumber = temp.getUTCDay() || 7;
  temp.setUTCDate(temp.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(temp.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil(
    ((temp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return {
    year: temp.getUTCFullYear(),
    week: weekNumber,
  };
};

type CallStatusResponse = {
  key: string;
  label: string;
};

type CallReportSummaryResponse = {
  calledAt: string;
  branchId: number | null;
  branchName: string;
  statusTotals: Record<string, number>;
  arrivedAt?: string;
};

type ArrivalType = "all" | "new-arrival" | "recall";

const ARRIVAL_TYPE_LABELS: Record<ArrivalType, string> = {
  "all": "ទាំងអស់",
  "new-arrival": "អីវ៉ាន់ចូលថ្មី (New Arrival)",
  "recall": "Re-Call",
};

const normalizeDateForArrival = (value?: string | null) => {
  if (!value) return null;

  // Support formats like yyyy-mm-dd, dd/mm/yyyy, and ISO timestamps
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

const formatDateInput = (date: Date) => date.toISOString().slice(0, 10);
const LOOKBACK_DAYS = 6;
const defaultStartDate = () =>
  formatDateInput(new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000));
const defaultEndDate = () => formatDateInput(new Date());

const getStoredUserId = (): number | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem("user");
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    return parsed?.id ?? null;
  } catch {
    return null;
  }
};

const fetchAndCacheUserId = async (): Promise<number | null> => {
  try {
    const response = await apiFetch("/api/auth/me", { method: "GET" });

    if (!response.ok) {
      return null;
    }

    const user = await response.json();
    if (user?.id && typeof window !== "undefined") {
      window.localStorage.setItem("user", JSON.stringify(user));
    }
    return user?.id ?? null;
  } catch {
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

function CallDashboard() {
  const [summaryData, setSummaryData] = useState<CallReportSummaryResponse[]>(
    [],
  );
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [areasData, setAreasData] = useState<AreaType[]>([]);
  const [areasLoading, setAreasLoading] = useState(false);
  const [subareasData, setSubareasData] = useState<Subarea[]>([]);
  const [subareasLoading, setSubareasLoading] = useState(false);

  const [statusOptions, setStatusOptions] = useState<CallStatusResponse[]>([]);
  const [statusesLoading, setStatusesLoading] = useState(false);

  const [selectedBranchId, setSelectedBranchId] = useState<string>("all");
  const [selectedArea, setSelectedArea] = useState<string>("all");
  const [selectedSubArea, setSelectedSubArea] = useState<string>("all");
  const [selectedStatusKeys, setSelectedStatusKeys] = useState<string[]>([]);
  const [selectedArrivalType, setSelectedArrivalType] = useState<ArrivalType>("all");
  const [statusDragging, setStatusDragging] = useState(false);
  const [startDate, setStartDate] = useState<string>(() => defaultStartDate());
  const [endDate, setEndDate] = useState<string>(() => defaultEndDate());
  const [chartGranularity, setChartGranularity] =
    useState<ChartGranularity>("daily");
  const [chartViewMode, setChartViewMode] = useState<"total" | "byStatus">("byStatus");

  const statusLabelMap = useMemo(() => {
    const map: Record<string, string> = { ...DEFAULT_STATUS_LABELS };
    statusOptions.forEach(({ key, label }) => {
      map[key] = label;
    });
    return map;
  }, [statusOptions]);

  // Get unique areas from areas data
  const areaOptions = useMemo(() => {
    return areasData.filter((area: AreaType) => area.active).sort((a: AreaType, b: AreaType) => a.name.localeCompare(b.name));
  }, [areasData]);

  // Get unique sub-areas from subareas data
  const subareaOptions = useMemo(() => {
    if (selectedArea === "all") {
      // When no area selected, show all subareas
      return subareasData
        .filter((subarea: Subarea) => subarea.active)
        .sort((a: Subarea, b: Subarea) => a.name.localeCompare(b.name));
    }
    // When area is selected, show only subareas within that area
    return subareasData
      .filter((subarea: Subarea) => {
        return subarea.areaId === Number(selectedArea) && subarea.active;
      })
      .sort((a: Subarea, b: Subarea) => a.name.localeCompare(b.name));
  }, [subareasData, selectedArea]);

  // Filter branches based on selected area and sub-area
  const filteredBranches = useMemo(() => {
    if (selectedSubArea === "all") {
      // When no subarea selected, show all active branches
      return branches.filter((branch: Branch) => branch.active)
        .sort((a: Branch, b: Branch) => a.name.localeCompare(b.name));
    }
    // When subarea is selected, show only branches within that subarea
    return branches.filter((branch: Branch) => {
      if (!branch.active) return false;
      return branch.subareaId === Number(selectedSubArea);
    }).sort((a: Branch, b: Branch) => a.name.localeCompare(b.name));
  }, [branches, selectedSubArea]);

  const loadStatuses = useCallback(async () => {
    setStatusesLoading(true);
    try {
      const response = await apiFetch("/api/calls/statuses", {
        headers: buildAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error("Unable to load statuses");
      }
      const serverStatuses: CallStatusResponse[] = await response.json();
      setStatusOptions(serverStatuses);
    } catch (error) {
      console.error("Failed to fetch statuses", error);
      setStatusOptions([]);
    } finally {
      setStatusesLoading(false);
    }
  }, []);

  const loadAreas = useCallback(async () => {
    setAreasLoading(true);
    try {
      const data = await areaBranchService.getAreas();
      setAreasData(data);
    } catch (error) {
      console.error("Failed to fetch areas", error);
      setAreasData([]);
    } finally {
      setAreasLoading(false);
    }
  }, []);

  const loadSubareas = useCallback(async () => {
    setSubareasLoading(true);
    try {
      const data = await areaBranchService.getSubareas();
      setSubareasData(data);
    } catch (error) {
      console.error("Failed to fetch subareas", error);
      setSubareasData([]);
    } finally {
      setSubareasLoading(false);
    }
  }, []);

  const loadFallbackBranches = useCallback(async () => {
    const response = await apiFetch("/api/calls/branches/active", {
      headers: buildAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to load fallback branches");
    }

    const allBranches: Branch[] = await response.json();
    const activeBranches = allBranches.filter((branch) => branch.active);
    setBranches(activeBranches);
  }, []);

  const loadBranches = useCallback(async () => {
    setBranchesLoading(true);
    try {
      const data = await areaBranchService.getBranches();
      setBranches(data);
    } catch (error) {
      console.error("Failed to fetch branches", error);
      await loadFallbackBranches();
    } finally {
      setBranchesLoading(false);
    }
  }, [loadFallbackBranches]);

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    setSummaryError(null);

    try {
      const params = new URLSearchParams();
      if (startDate) {
        params.append("startDate", startDate);
      }
      if (endDate) {
        params.append("endDate", endDate);
      }
      if (selectedBranchId !== "all") {
        params.append("branchIds", selectedBranchId);
      }
      if (selectedArea !== "all") {
        params.append("areaIds", selectedArea);
      }
      if (selectedSubArea !== "all") {
        params.append("subareaIds", selectedSubArea);
      }
      selectedStatusKeys.forEach((key) => params.append("statusKeys", key));

      const query = params.toString();
      const response = await apiFetch(
        `/api/calls/reports/summary${query ? `?${query}` : ""}`,
        {
          headers: buildAuthHeaders(),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to load summary data");
      }

      const summaries: CallReportSummaryResponse[] = await response.json();
      setSummaryData(summaries);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch call report summary", error);
      setSummaryError("Unable to load dashboard data. Please try again.");
    } finally {
      setSummaryLoading(false);
    }
  }, [endDate, selectedBranchId, selectedArea, selectedSubArea, selectedStatusKeys, selectedArrivalType, startDate]);

  useEffect(() => {
    loadStatuses();
    loadAreas();
    loadSubareas();
    loadBranches();
  }, [loadStatuses, loadAreas, loadSubareas, loadBranches]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const statusColorMap = useMemo(() => {
    const mapping: Record<string, string> = {};
    statusOptions.forEach((status, index) => {
      mapping[status.key] = STATUS_COLORS[index % STATUS_COLORS.length];
    });
    return mapping;
  }, [statusOptions]);

  const getStatusLabel = useCallback(
    (key: string) => statusLabelMap[key] ?? key,
    [statusLabelMap],
  );

  const statusKeysInData = useMemo(() => {
    const keys = new Set<string>();
    summaryData.forEach((summary) => {
      Object.keys(summary.statusTotals).forEach((statusKey) =>
        keys.add(statusKey),
      );
    });
    return Array.from(keys);
  }, [summaryData]);

  const statusDisplayOrder = useMemo(() => {
    const ordered = statusOptions.map((status) => status.key);
    const seen = new Set(ordered);
    statusKeysInData.forEach((key) => {
      if (!seen.has(key)) {
        ordered.push(key);
        seen.add(key);
      }
    });
    return ordered;
  }, [statusOptions, statusKeysInData]);

  const chartStatusKeys = useMemo(() => {
    if (chartViewMode === "total") {
      return ["total"];
    }
    if (selectedStatusKeys.length > 0) {
      return selectedStatusKeys;
    }
    if (statusKeysInData.length > 0) {
      return statusKeysInData;
    }
    return statusOptions.map((status) => status.key);
  }, [selectedStatusKeys, statusKeysInData, statusOptions, chartViewMode]);

  const statusScrollRef = useRef<HTMLDivElement | null>(null);
  const statusDragState = useRef({
    isDragging: false,
    startX: 0,
    scrollLeft: 0,
  });

  const handleStatusWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
        return;
      }
      event.preventDefault();
      event.currentTarget.scrollLeft += event.deltaY;
    },
    [],
  );

  const handleStatusMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!statusScrollRef.current) {
        return;
      }
      statusDragState.current.isDragging = true;
      statusDragState.current.startX =
        event.pageX - statusScrollRef.current.offsetLeft;
      statusDragState.current.scrollLeft = statusScrollRef.current.scrollLeft;
      setStatusDragging(true);
    },
    [],
  );

  const endStatusDrag = useCallback(() => {
    statusDragState.current.isDragging = false;
    setStatusDragging(false);
  }, []);

  const handleStatusMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!statusDragState.current.isDragging || !statusScrollRef.current) {
        return;
      }
      event.preventDefault();
      const x = event.pageX - statusScrollRef.current.offsetLeft;
      const walk = x - statusDragState.current.startX;
      statusScrollRef.current.scrollLeft =
        statusDragState.current.scrollLeft - walk;
    },
    [],
  );

  const classifyArrivalType = (summary: CallReportSummaryResponse): ArrivalType => {
    const normalizedArrived = normalizeDateForArrival(summary.arrivedAt);
    const normalizedCalled = normalizeDateForArrival(summary.calledAt);

    if (normalizedArrived && normalizedCalled && normalizedArrived === normalizedCalled) {
      return "new-arrival";
    }

    return "recall";
  };

  const filteredSummaryData = useMemo(() => {
    if (selectedArrivalType === "all") {
      return summaryData;
    }
    return summaryData.filter(summary => classifyArrivalType(summary) === selectedArrivalType);
  }, [summaryData, selectedArrivalType]);

  const totalsByStatus = useMemo(() => {
    const totals: Record<string, number> = {};
    filteredSummaryData.forEach((summary) => {
      Object.entries(summary.statusTotals).forEach(([statusKey, value]) => {
        totals[statusKey] = (totals[statusKey] ?? 0) + value;
      });
    });
    return totals;
  }, [filteredSummaryData]);

  const grandTotal = useMemo(() => {
    return Object.values(totalsByStatus).reduce((sum, value) => sum + value, 0);
  }, [totalsByStatus]);

  const distinctBranchCount = useMemo(() => {
    const identifiers = new Set(
      summaryData.map((summary) => summary.branchId ?? summary.branchName),
    );
    return identifiers.size;
  }, [summaryData]);

  const topStatus = useMemo(() => {
    let maxKey = "";
    let maxValue = 0;
    Object.entries(totalsByStatus).forEach(([statusKey, value]) => {
      if (value > maxValue) {
        maxValue = value;
        maxKey = statusKey;
      }
    });
    return maxKey
      ? `${getStatusLabel(maxKey)} • ${maxValue.toLocaleString()}`
      : "—";
  }, [getStatusLabel, totalsByStatus]);

  const dateSeries = useMemo(() => {
    const map = new Map<string, Record<string, string | number>>();
    filteredSummaryData.forEach((summary) => {
      const entry = map.get(summary.calledAt) ?? { date: summary.calledAt };
      Object.entries(summary.statusTotals).forEach(([statusKey, value]) => {
        const current =
          typeof entry[statusKey] === "number"
            ? (entry[statusKey] as number)
            : 0;
        entry[statusKey] = current + value;
      });
      map.set(summary.calledAt, entry);
    });
    return Array.from(map.values()).sort((a, b) =>
      String(a.date).localeCompare(String(b.date)),
    );
  }, [filteredSummaryData]);

  const chartSeries = useMemo(() => {
    if (dateSeries.length === 0) {
      return [];
    }

    // Get all possible status keys to ensure consistent data structure
    const allStatusKeys = statusOptions.map((status) => status.key);

    if (chartGranularity === "daily") {
      return dateSeries.map((entry) => {
        const completeEntry: Record<string, any> = {
          ...entry,
          label: String(entry.date),
        };

        if (chartViewMode === "total") {
          // Calculate total for this entry
          let total = 0;
          allStatusKeys.forEach((statusKey) => {
            const value = typeof entry[statusKey] === "number" ? entry[statusKey] : Number(entry[statusKey]) || 0;
            total += value;
          });
          completeEntry.total = total;
        } else {
          // Ensure all status keys exist with zero values if missing
          allStatusKeys.forEach((statusKey) => {
            if (!(statusKey in completeEntry)) {
              completeEntry[statusKey] = 0;
            }
          });
        }

        return completeEntry;
      });
    }

    const grouped = new Map<string, Record<string, string | number>>();

    dateSeries.forEach((entry) => {
      const baseDate = toUTCDate(String(entry.date));
      let groupKey = "";
      let displayLabel = "";

      if (chartGranularity === "weekly") {
        const { year, week } = getISOWeekInfo(baseDate);
        const paddedWeek = String(week).padStart(2, "0");
        groupKey = `${year}-W${paddedWeek}`;
        displayLabel = `Week ${paddedWeek} · ${year}`;
      } else {
        const monthIndex = baseDate.getUTCMonth();
        const paddedMonth = String(monthIndex + 1).padStart(2, "0");
        groupKey = `${baseDate.getUTCFullYear()}-${paddedMonth}`;
        displayLabel = `${baseDate.toLocaleString("en-US", { month: "short" })} ${baseDate.getUTCFullYear()}`;
      }

      const existing = grouped.get(groupKey) ?? {
        label: displayLabel,
        sortKey: groupKey,
      };

      Object.entries(entry).forEach(([key, value]) => {
        if (key === "date" || key === "label" || key === "sortKey") {
          return;
        }
        const numericValue = typeof value === "number" ? value : Number(value);
        const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
        existing[key] =
          (typeof existing[key] === "number" ? (existing[key] as number) : 0) +
          safeValue;
      });

      grouped.set(groupKey, existing);
    });

    // Ensure all grouped entries have all status keys or calculate total
    const result = Array.from(grouped.values()).map((entry) => {
      const completeEntry = { ...entry };

      if (chartViewMode === "total") {
        // Calculate total for this grouped entry
        let total = 0;
        allStatusKeys.forEach((statusKey) => {
          const value = typeof entry[statusKey] === "number" ? entry[statusKey] : Number(entry[statusKey]) || 0;
          total += value;
        });
        completeEntry.total = total;
      } else {
        // Ensure all status keys exist with zero values if missing
        allStatusKeys.forEach((statusKey) => {
          if (!(statusKey in completeEntry)) {
            completeEntry[statusKey] = 0;
          }
        });
      }

      return completeEntry;
    });

    return result.sort((a, b) =>
      String(a.sortKey).localeCompare(String(b.sortKey)),
    );
  }, [chartGranularity, dateSeries, statusOptions, chartViewMode]);

  const branchSeries = useMemo(() => {
    const map = new Map<string, { branch: string; total: number }>();
    filteredSummaryData.forEach((summary) => {
      const branchName = summary.branchName || "Unassigned";
      const total = Object.values(summary.statusTotals).reduce(
        (sum, value) => sum + value,
        0,
      );
      const entry = map.get(branchName) ?? { branch: branchName, total: 0 };
      entry.total += total;
      map.set(branchName, entry);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filteredSummaryData]);

  const branchStatusSeries = useMemo(() => {
    const map = new Map<string, Record<string, string | number>>();
    filteredSummaryData.forEach((summary) => {
      const branchName = summary.branchName || "Unassigned";
      const entry = map.get(branchName) ?? {
        branch: branchName,
        total: 0,
      };

      Object.entries(summary.statusTotals).forEach(([statusKey, value]) => {
        const current =
          typeof entry[statusKey] === "number"
            ? (entry[statusKey] as number)
            : 0;
        entry[statusKey] = current + value;
        entry.total =
          (typeof entry.total === "number" ? (entry.total as number) : 0) +
          value;
      });

      map.set(branchName, entry);
    });

    return Array.from(map.values()).sort(
      (a, b) =>
        (typeof b.total === "number" ? (b.total as number) : 0) -
        (typeof a.total === "number" ? (a.total as number) : 0),
    );
  }, [filteredSummaryData]);

  const statusDistribution = useMemo(
    () =>
      Object.entries(totalsByStatus).map(([statusKey, value]) => ({
        statusKey,
        label: getStatusLabel(statusKey),
        value,
      })),
    [getStatusLabel, totalsByStatus],
  );

  const detailRows = useMemo(() => {
    return filteredSummaryData
      .map((summary, index) => {
        const total = Object.values(summary.statusTotals).reduce(
          (sum, value) => sum + value,
          0,
        );
        return {
          id: `${summary.calledAt}-${summary.branchId ?? summary.branchName}-${index}`,
          calledAt: summary.calledAt,
          arrivedAt: summary.arrivedAt ?? null,
          branchName: summary.branchName || "Unassigned",
          statusTotals: summary.statusTotals,
          total,
        };
      })
      .sort((a, b) => b.calledAt.localeCompare(a.calledAt));
  }, [filteredSummaryData]);

  const detailAggregates = useMemo(() => {
    const statusTotals: Record<string, number> = {};
    let grand = 0;
    detailRows.forEach((row) => {
      grand += row.total;
      statusDisplayOrder.forEach((key) => {
        const value = row.statusTotals[key] ?? 0;
        statusTotals[key] = (statusTotals[key] ?? 0) + value;
      });
    });
    return { statusTotals, grand };
  }, [detailRows, statusDisplayOrder]);

  const renderStatusPieLabel = useCallback(
    (
      props: PieLabelRenderProps & {
        payload?: { statusKey?: string; name?: string };
      },
    ) => {
      const { cx, cy, index, midAngle, outerRadius, percent, payload } = props;
      if (
        typeof cx !== "number" ||
        typeof cy !== "number" ||
        typeof midAngle !== "number" ||
        typeof outerRadius !== "number" ||
        typeof percent !== "number" ||
        !payload
      ) {
        return null;
      }

      const statusKey = (payload.statusKey ?? payload.name ?? "") as string;

      const RADIAN = Math.PI / 180;
      const baseOffset = percent < 0.07 ? 26 : 20;
      const elbowRadius = outerRadius + baseOffset;
      const horizontalArm = percent < 0.07 ? 70 : 55;
      const sx = cx + (outerRadius + 4) * Math.cos(-midAngle * RADIAN);
      const sy = cy + (outerRadius + 4) * Math.sin(-midAngle * RADIAN);
      const mx = cx + elbowRadius * Math.cos(-midAngle * RADIAN);
      const my = cy + elbowRadius * Math.sin(-midAngle * RADIAN);
      const textAnchor = mx > cx ? "start" : "end";
      const ex = mx + (textAnchor === "start" ? horizontalArm : -horizontalArm);
      const ey = my;
      const textX = ex + (textAnchor === "start" ? 8 : -8);
      const lineColor = "rgba(148,163,184,0.6)";
      const percentLabel = `${(percent * 100).toFixed(1)}%`;
      const primaryLabel = getStatusLabel(statusKey);
      const compactLayout = percent < 0.1;

      return (
        <g key={`label-${payload.statusKey ?? statusKey}-${index}`}>
          <path
            d={`M${sx},${sy} L${mx},${my} L${ex},${ey}`}
            stroke={lineColor}
            strokeWidth={1.2}
            fill="none"
          />
          <circle cx={ex} cy={ey} r={2} fill={lineColor} />
          <text
            x={textX}
            y={ey}
            fill="#f8fafc"
            fontSize={compactLayout ? 11 : 13}
            fontWeight={600}
            textAnchor={textAnchor}
            dominantBaseline="middle"
          >
            <tspan x={textX} dy="0">
              {primaryLabel}
            </tspan>
            <tspan
              x={textX}
              dy="1.2em"
              fill="#cbd5f5"
              fontSize={compactLayout ? 10 : 11}
            >
              {percentLabel}
            </tspan>
          </text>
        </g>
      );
    },
    [getStatusLabel, statusDistribution],
  );

  const handleStatusToggle = useCallback((statusKey: string) => {
    setSelectedStatusKeys((prev) =>
      prev.includes(statusKey)
        ? prev.filter((key) => key !== statusKey)
        : [...prev, statusKey],
    );
  }, []);

  const resetFilters = () => {
    setSelectedBranchId("all");
    setSelectedArea("all");
    setSelectedSubArea("all");
    setSelectedStatusKeys([]);
    setSelectedArrivalType("all");
    setStartDate(defaultStartDate());
    setEndDate(defaultEndDate());
  };

  const formatNumber = (value?: number) => (value ?? 0).toLocaleString();

  return (
    <>
      <div className="relative min-h-screen overflow-hidden py-8">
        <div className="fixed inset-0 -z-10">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-orange-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-96 h-96 bg-blue-700 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
        <div className="relative z-10 space-y-8 px-4 sm:px-6 lg:px-8">
          <header className="">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/70">
                  Realtime Insight
                </p>
                <h1 className="mt-1 text-3xl font-semibold text-white">
                  Call Service · Performance Dashboard
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-300">
                  Slice millions of call-report rows by branch, date, and
                  outcome to reveal execution trends instantly.
                </p>
              </div>
              <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80">
                <RefreshCw
                  className={`h-4 w-4 ${summaryLoading ? "animate-spin" : ""} text-cyan-300`}
                />
                {lastUpdated ? (
                  <span>
                    Updated{" "}
                    {lastUpdated.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                ) : (
                  <span>Waiting for fresh data…</span>
                )}
              </div>
            </div>
          </header>

          <section className="rounded-2xl border border-white/5 bg-slate-950/60 p-6 shadow-inner shadow-black/30">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">
                  Filters
                </p>
                <h2 className="text-xl font-semibold text-white">
                  Focus on the signals that matter
                </h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-sm text-cyan-300 transition hover:text-white"
                >
                  Reset filters
                </button>
                <button
                  type="button"
                  onClick={fetchSummary}
                  disabled={summaryLoading}
                  className="inline-flex items-center gap-2 rounded-full bg-cyan-500/90 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${summaryLoading ? "animate-spin" : ""}`}
                  />
                  Refresh data
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {/* Left Column: Hierarchy Filters */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-px bg-gradient-to-r from-orange-500 to-cyan-500 flex-1"></div>
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Location</span>
                  <div className="h-px bg-gradient-to-r from-cyan-500 to-green-500 flex-1"></div>
                </div>

                {/* Hierarchy Level 1: Area */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                    <label className="text-sm font-medium text-slate-300">
                      Area
                    </label>
                  </div>
                  <select
                    value={selectedArea}
                    onChange={(event) => {
                      setSelectedArea(event.target.value);
                      setSelectedSubArea("all"); // Reset sub-area when area changes
                      setSelectedBranchId("all"); // Reset branch when area changes
                    }}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition focus:border-orange-400 focus:bg-slate-900/50 pl-8"
                    disabled={areasLoading}
                  >
                    <option value="all">All areas</option>
                    {areaOptions.map((area: AreaType) => (
                      <option key={area.id} value={area.id.toString()}>
                        {area.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Hierarchy Level 2: Sub-Area - Only show when area is selected */}
                {selectedArea !== "all" && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-cyan-500"></div>
                      <label className="text-sm font-medium text-slate-300">
                        Sub-Area
                      </label>
                      <span className="text-xs text-slate-500">
                        (within {areaOptions.find(a => a.id.toString() === selectedArea)?.name || 'selected area'})
                      </span>
                    </div>
                    <select
                      value={selectedSubArea}
                      onChange={(event) => {
                        setSelectedSubArea(event.target.value);
                        setSelectedBranchId("all"); // Reset branch when sub-area changes
                      }}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition focus:border-cyan-400 focus:bg-slate-900/50 pl-8"
                      disabled={subareasLoading}
                    >
                      <option value="all">All sub-areas</option>
                      {subareaOptions.map((subarea: Subarea) => (
                        <option key={subarea.id} value={subarea.id.toString()}>
                          {subarea.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Hierarchy Level 3: Branch - Only show when sub-area is selected */}
                {selectedArea !== "all" && selectedSubArea !== "all" && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <label className="text-sm font-medium text-slate-300">
                        Branch
                      </label>
                      <span className="text-xs text-slate-500">
                        (within {subareaOptions.find(s => s.id.toString() === selectedSubArea)?.name || 'selected sub-area'})
                      </span>
                    </div>
                    <select
                      value={selectedBranchId}
                      onChange={(event) => setSelectedBranchId(event.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition focus:border-green-400 focus:bg-slate-900/50 pl-8"
                      disabled={branchesLoading}
                    >
                      <option value="all">All branches</option>
                      {filteredBranches.map((branch: Branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Right Column: Date and View By Filters */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-px bg-gradient-to-r from-blue-500 to-purple-500 flex-1"></div>
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Filters</span>
                  <div className="h-px bg-gradient-to-r from-purple-500 to-pink-500 flex-1"></div>
                </div>

                {/* Date Range Section */}
                <div className="space-y-4">
                  <div className="grid gap-4">
                    <label className="space-y-2 text-sm text-slate-300">
                      Start date
                      <input
                        type="date"
                        value={startDate}
                        max={endDate}
                        onChange={(event) => setStartDate(event.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition focus:border-cyan-400 focus:bg-slate-900/50"
                      />
                    </label>
                    <label className="space-y-2 text-sm text-slate-300">
                      End date
                      <input
                        type="date"
                        value={endDate}
                        min={startDate}
                        onChange={(event) => setEndDate(event.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition focus:border-cyan-400 focus:bg-slate-900/50"
                      />
                    </label>
                  </div>
                </div>

                {/* View By Section */}
                <div className="space-y-2">
                  <label className="text-sm text-slate-300">
                    View By
                  </label>
                  <div className="flex gap-2 flex-nowrap">
                    {(Object.keys(ARRIVAL_TYPE_LABELS) as ArrivalType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setSelectedArrivalType(type)}
                        className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition whitespace-nowrap ${selectedArrivalType === type
                          ? "border-cyan-400 bg-cyan-400/20 text-cyan-300"
                          : "border-white/10 bg-white/5 text-white hover:border-white/20 hover:bg-white/10"
                          }`}
                      >
                        {ARRIVAL_TYPE_LABELS[type]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>


          {summaryError && (
            <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-red-100">
              {summaryError}
            </div>
          )}

          {!summaryError && summaryData.length === 0 && !summaryLoading && (
            <div className="rounded-2xl border border-white/5 bg-slate-950/70 p-8 text-center text-slate-300">
              No call report summaries match the selected filters.
            </div>
          )}

          <section className="space-y-6">
            <div className="rounded-2xl border border-white/5 bg-slate-950/70 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-300">
                    Status trend
                  </p>
                  <p className="text-xs text-slate-400">
                    {chartViewMode === "total" ? "Total" : "By status"} {GRANULARITY_LABELS[chartGranularity].toLowerCase()} volumes
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="flex rounded-lg border border-white/10 bg-white/5 p-1">
                    <button
                      onClick={() => setChartViewMode("byStatus")}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${chartViewMode === "byStatus"
                        ? "bg-orange-500 text-white shadow-sm"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                        }`}
                    >
                      By Status
                    </button>
                    <button
                      onClick={() => setChartViewMode("total")}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${chartViewMode === "total"
                        ? "bg-orange-500 text-white shadow-sm"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                        }`}
                    >
                      Total
                    </button>
                  </div>
                  {GRANULARITY_ORDER.map((option) => (
                    <button
                      key={option}
                      onClick={() => setChartGranularity(option)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${chartGranularity === option
                        ? "bg-orange-500 text-white shadow-sm"
                        : "border-white/10 bg-white/5 text-white/70 hover:border-white/40"
                        }`}
                    >
                      {GRANULARITY_LABELS[option]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-6 h-104 w-full">
                {chartStatusKeys.length === 0 || chartSeries.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">
                    No status data for the current filters.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartSeries}
                      margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                      key={`area-chart-${selectedArrivalType}-${selectedBranchId}-${selectedArea}-${selectedSubArea}-${chartSeries.length}`}
                    >
                      <defs>
                        {chartStatusKeys.map((statusKey, index) => {
                          const color = chartViewMode === "total"
                            ? "#f97316" // Orange for total
                            : statusColorMap[statusKey] ??
                            STATUS_COLORS[index % STATUS_COLORS.length];
                          return (
                            <linearGradient
                              key={statusKey}
                              id={`gradient-${statusKey}`}
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                              gradientUnits="userSpaceOnUse"
                            >
                              <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                              <stop offset="95%" stopColor={color} stopOpacity={0.1} />
                            </linearGradient>
                          );
                        })}
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.06)"
                      />
                      <XAxis
                        dataKey="date"
                        stroke="#64748b"
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      />
                      <YAxis
                        stroke="#64748b"
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(15, 23, 42, 0.95)",
                          borderColor: "rgba(251, 146, 60, 0.3)",
                          borderWidth: 1,
                          borderRadius: 12,
                          backdropFilter: "blur(12px)",
                          boxShadow: "0 10px 40px rgba(0,0,0,0.3)"
                        }}
                        labelStyle={{ color: "#f8fafc", fontWeight: 600 }}
                        formatter={(value, name) => [
                          formatNumber(value as number),
                          getStatusLabel(name as string),
                        ]}
                        labelFormatter={(label) => String(label)}
                      />
                      <Legend
                        wrapperStyle={{ color: "#cbd5f5", paddingTop: "20px" }}
                        formatter={(value) => chartViewMode === "total" ? "Total Calls" : getStatusLabel(value as string)}
                      />
                      {chartStatusKeys.map((statusKey, index) => {
                        const color = chartViewMode === "total"
                          ? "#f97316" // Orange for total
                          : statusColorMap[statusKey] ??
                          STATUS_COLORS[index % STATUS_COLORS.length];
                        return (
                          <Area
                            key={statusKey}
                            type="monotone"
                            dataKey={statusKey}
                            stroke={color}
                            fill={`url(#gradient-${statusKey})`}
                            strokeWidth={3}
                            activeDot={{
                              r: 6,
                              fill: color,
                              stroke: '#fff',
                              strokeWidth: 2
                            }}
                            animationBegin={index * 100}
                            animationDuration={1400}
                            animationEasing="ease-out"
                          />
                        );
                      })}
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-slate-950/70 p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-300">
                    Status mix
                  </p>
                  <p className="text-xs text-slate-400">
                    3D pie · total calls across every branch and status
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">
                    Total
                  </p>
                  <p className="text-3xl font-semibold text-white">
                    {grandTotal.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="mt-6 grid gap-6 grid-cols-1 lg:grid-cols-2">
                <div className="h-90">
                  {statusDistribution.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-slate-400">
                      No status distribution to chart.
                    </div>
                  ) : (
                    <div className="relative h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart
                          margin={{
                            top: 40,
                            right: 120,
                            bottom: 40,
                            left: 120,
                          }}
                        >
                          <defs>
                            <filter
                              id="pieShadow"
                              x="-50%"
                              y="-50%"
                              width="200%"
                              height="200%"
                            >
                              <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                              <feOffset dx="0" dy="4" result="offsetblur" />
                              <feFlood floodColor="#000000" floodOpacity="0.2" />
                              <feComposite in2="offsetblur" operator="in" />
                              <feMerge>
                                <feMergeNode />
                                <feMergeNode in="SourceGraphic" />
                              </feMerge>
                            </filter>
                            <filter
                              id="pieGlow"
                              x="-50%"
                              y="-50%"
                              width="200%"
                              height="200%"
                            >
                              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                              <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                              </feMerge>
                            </filter>
                            {statusDistribution.map((entry, index) => {
                              const color =
                                statusColorMap[entry.statusKey] ??
                                STATUS_COLORS[index % STATUS_COLORS.length];
                              return (
                                <radialGradient
                                  key={`radial-${entry.statusKey}`}
                                  id={`radial-${entry.statusKey}`}
                                  cx="50%"
                                  cy="40%"
                                  r="60%"
                                  gradientUnits="userSpaceOnUse"
                                >
                                  <stop
                                    offset="0%"
                                    stopColor="#ffffff"
                                    stopOpacity={0.4}
                                  />
                                  <stop
                                    offset="30%"
                                    stopColor={color}
                                    stopOpacity={0.9}
                                  />
                                  <stop
                                    offset="100%"
                                    stopColor={color}
                                    stopOpacity={1}
                                  />
                                </radialGradient>
                              );
                            })}
                          </defs>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "rgba(15, 23, 42, 0.98)",
                              borderColor: "rgba(251, 146, 60, 0.4)",
                              borderWidth: 1.5,
                              borderRadius: 16,
                              backdropFilter: "blur(16px)",
                              boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
                              padding: "12px 16px"
                            }}
                            labelStyle={{
                              color: "#f8fafc",
                              fontWeight: 700,
                              fontSize: "13px",
                              marginBottom: "4px"
                            }}
                            itemStyle={{
                              color: "#cbd5e1",
                              fontSize: "12px",
                              lineHeight: "1.4"
                            }}
                            formatter={(value: number, name: any, props: any) => {
                              const percentage = grandTotal > 0
                                ? ((value / grandTotal) * 100).toFixed(1)
                                : "0.0";
                              return [
                                `${getStatusLabel(name as string)}`,
                                `${formatNumber(value)} calls (${percentage}%)`
                              ];
                            }}
                          />
                          <Pie
                            key={`pie-${selectedArrivalType}-${selectedBranchId}-${selectedArea}-${selectedSubArea}-${statusDistribution.length}`}
                            data={statusDistribution}
                            dataKey="value"
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={110}
                            animationBegin={300}
                            animationDuration={1400}
                            animationEasing="ease-in-out"
                            startAngle={90}
                            endAngle={-270}
                            paddingAngle={4}
                            cornerRadius={16}
                            stroke="rgba(15,23,42,0.9)"
                            strokeWidth={4}
                            labelLine={false}
                            label={renderStatusPieLabel}
                            filter="url(#pieShadow)"
                          >
                            {statusDistribution.map((entry) => (
                              <Cell
                                key={entry.statusKey}
                                fill={`url(#radial-${entry.statusKey})`}
                              />
                            ))}
                          </Pie>
                          <Pie
                            data={statusDistribution}
                            dataKey="value"
                            innerRadius={60}
                            outerRadius={65}
                            fill="rgba(255,255,255,0.05)"
                            stroke="none"
                            isAnimationActive={false}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">
                            Total
                          </p>
                          <p className="text-3xl font-semibold text-white drop-shadow-lg">
                            {grandTotal.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  {statusDistribution.map((entry, index) => {
                    const color =
                      statusColorMap[entry.statusKey] ??
                      STATUS_COLORS[index % STATUS_COLORS.length];
                    return (
                      <div
                        key={`status-legend-${entry.statusKey}`}
                        className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-2"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{ background: color }}
                          />
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {getStatusLabel(entry.statusKey)}
                            </p>
                            <p className="text-[11px] text-slate-400 uppercase tracking-[0.25em]">
                              {(grandTotal > 0
                                ? ((entry.value / grandTotal) * 100).toFixed(1)
                                : "0.0") + "%"}
                            </p>
                          </div>
                        </div>
                        <span className="text-base font-semibold text-white">
                          {formatNumber(entry.value)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-slate-950/70 p-5 space-y-8">
              <div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-300">
                      Branch composition
                    </p>
                    <p className="text-xs text-slate-400">
                      Stacked totals per branch with status breakdown
                    </p>
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
                    {branchStatusSeries.length} branches
                  </span>
                </div>
                <div className="mt-4 h-72">
                  {branchStatusSeries.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-slate-400">
                      No branch data available.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={branchStatusSeries}
                        margin={{ top: 20, right: 30, left: 10, bottom: 30 }}
                        key={`bar-chart-${selectedArrivalType}-${selectedBranchId}-${selectedArea}-${selectedSubArea}-${branchStatusSeries.length}`}
                      >
                        <defs>
                          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.9} />
                            <stop offset="95%" stopColor="#fb923c" stopOpacity={0.7} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.06)"
                        />
                        <XAxis
                          dataKey="branch"
                          stroke="#64748b"
                          tick={{ fill: '#94a3b8', fontSize: 11 }}
                          interval={0}
                          angle={-25}
                          textAnchor="end"
                          height={70}
                          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                        />
                        <YAxis
                          stroke="#64748b"
                          tick={{ fill: '#94a3b8', fontSize: 11 }}
                          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                        />
                        <Tooltip
                          cursor={{ fill: "rgba(255,255,255,0.05)" }}
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            borderRadius: 12,
                            border: "1px solid rgba(255,255,255,0.15)",
                          }}
                          labelStyle={{
                            color: "#f8fafc",
                            fontSize: 12,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase"
                          }}
                          itemStyle={{
                            color: "#e2e8f0",
                          }}
                          formatter={(value: number, name: any, props: any) => {
                            const data = props.payload;
                            const total = data.total || 0;

                            // Build detailed breakdown
                            const details = [
                              `Total: ${formatNumber(total)}`,
                              ...chartStatusKeys
                                .filter(key => (data[key] as number) > 0)
                                .map(key => `${getStatusLabel(key)}: ${formatNumber(data[key] as number)}`)
                            ];

                            return [details.join("\n"), data.branch || name];
                          }}
                        />
                        <Legend
                          wrapperStyle={{ color: "#cbd5f5" }}
                          formatter={() => "Total Calls"}
                        />
                        <Bar
                          dataKey="total"
                          fill="url(#barGradient)"
                          barSize={45}
                          radius={[8, 8, 0, 0]}
                          animationBegin={100}
                          animationDuration={1500}
                          animationEasing="ease-out"
                          maxBarSize={60}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>



            </div>
          </section>

          <section className="rounded-2xl border border-white/5 bg-slate-950/70 p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">Detailed call records</p>
                <p className="text-xs text-slate-400">
                  Showing per-branch status totals for each report day. Filters above apply here as well.
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-[0.35em] text-slate-500">Total Calls</p>
                <p className="text-2xl font-semibold text-white">{formatNumber(detailAggregates.grand)}</p>
              </div>
            </div>

            {summaryLoading ? (
              <div className="rounded-xl border border-white/5 bg-white/5 p-4 text-center text-sm text-slate-400">
                Loading detailed rows…
              </div>
            ) : detailRows.length === 0 ? (
              <div className="rounded-xl border border-white/5 bg-white/5 p-6 text-center text-slate-300">
                No detailed call reports for the current filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[900px]">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-[0.25em] text-slate-400">
                        <th className="px-3 py-3">Called At</th>
                        <th className="px-3 py-3">Arrived At</th>
                        <th className="px-3 py-3">Branch</th>
                        {statusDisplayOrder.map((statusKey) => (
                          <th key={`header-${statusKey}`} className="px-3 py-3">
                            {getStatusLabel(statusKey)}
                          </th>
                        ))}
                        <th className="px-3 py-3">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {detailRows.map((row) => (
                        <tr key={row.id} className="hover:bg-white/5 transition">
                          <td className="px-3 py-3 text-white font-semibold">
                            {row.calledAt}
                          </td>
                          <td className="px-3 py-3 text-slate-300">
                            {row.arrivedAt ?? "—"}
                          </td>
                          <td className="px-3 py-3 text-slate-200">
                            {row.branchName}
                          </td>
                          {statusDisplayOrder.map((statusKey) => (
                            <td key={`${row.id}-${statusKey}`} className="px-3 py-3 text-right text-white/80">
                              {formatNumber(row.statusTotals[statusKey] ?? 0)}
                            </td>
                          ))}
                          <td className="px-3 py-3 text-right font-semibold text-white">
                            {formatNumber(row.total)}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-white/5 font-semibold text-white">
                        <td className="px-3 py-3" colSpan={3}>
                          Grand Total
                        </td>
                        {statusDisplayOrder.map((statusKey) => (
                          <td key={`agg-${statusKey}`} className="px-3 py-3 text-right">
                            {formatNumber(detailAggregates.statusTotals[statusKey] ?? 0)}
                          </td>
                        ))}
                        <td className="px-3 py-3 text-right">
                          {formatNumber(detailAggregates.grand)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          {summaryLoading && (
            <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-6 text-center text-sm text-slate-300">
              Processing millions of rows… preparing visualization.
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default CallDashboard;
