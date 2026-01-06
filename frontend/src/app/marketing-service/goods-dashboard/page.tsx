"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { TooltipProps } from "recharts";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  LabelList,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MarketingServiceGuard } from "@/components/marketing-service/MarketingServiceGuard";
import {
  marketingHierarchyService,
  MarketingArea,
  MarketingBranch,
  MarketingSubArea,
} from "@/services/marketing-service/marketingHierarchyService";
import {
  goodsShipmentService,
  MarketingGoodsShipmentRecord,
} from "@/services/marketing-service/goodsShipmentService";
import {
  vipMemberService,
  VipMember,
} from "@/services/marketing-service/vipMemberService";

const STATUS_META = {
  shipping: { label: "Shipping", color: "#facc15" },
  arrived: { label: "Arrived", color: "#fb923c" },
  completed: { label: "Completed", color: "#34d399" },
} as const;

type StatusKey = keyof typeof STATUS_META;
const STATUS_KEYS: StatusKey[] = ["shipping", "arrived", "completed"];
const GOODS_TYPE_COLORS = {
  ALL: "#f97316",
  COD: "#22d3ee",
} as const;

const TOOLTIP_STYLES = {
  content: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.15)",
  },
  label: {
    color: "#f8fafc",
    fontSize: 12,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
  },
  item: {
    color: "#e2e8f0",
  },
};

const TREND_VIEW_OPTIONS = [
  { key: "day", label: "Daily" },
  { key: "week", label: "Weekly" },
  { key: "month", label: "Monthly" },
] as const;

type TrendView = (typeof TREND_VIEW_OPTIONS)[number]["key"];

type GoodsTypeLabel = keyof typeof GOODS_TYPE_COLORS;
type SplitDatum = {
  key: string;
  label: string;
  value: number;
  color: string;
};

type TotalsLabelProps = {
  x?: number | string;
  y?: number | string;
  width?: number | string;
  height?: number | string;
  value?: number | string;
  payload?: {
    total?: number;
  };
  segment?: StatusKey;
};

const SegmentPercentLabel = ({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  value = 0,
  payload,
  segment,
}: TotalsLabelProps) => {
  const numericValue = typeof value === "string" ? Number(value) : value;
  if (!payload?.total || !segment || !numericValue) {
    return null;
  }
  const percent = Math.round((numericValue / payload.total) * 100);
  const numericHeight = typeof height === "string" ? Number(height) : height;
  const numericX = typeof x === "string" ? Number(x) : x;
  const numericWidth = typeof width === "string" ? Number(width) : width;
  const numericY = typeof y === "string" ? Number(y) : y;
  if (percent < 8 || numericHeight < 18) {
    return null;
  }
  return (
    <text
      x={numericX + numericWidth / 2}
      y={numericY + numericHeight / 2 + 4}
      textAnchor="middle"
      fill="#0f172a"
      fontSize={11}
      fontWeight={700}
      pointerEvents="none"
    >
      {percent}%
    </text>
  );
};

const TotalsTopLabel = ({
  x = 0,
  y = 0,
  width = 0,
  value = 0,
}: TotalsLabelProps) => {
  const numericValue = typeof value === "string" ? Number(value) : value;
  if (!numericValue) {
    return null;
  }
  const numericX = typeof x === "string" ? Number(x) : x;
  const numericWidth = typeof width === "string" ? Number(width) : width;
  const numericY = typeof y === "string" ? Number(y) : y;
  return (
    <text
      x={numericX + numericWidth / 2}
      y={numericY - 8}
      textAnchor="middle"
      fill="#fefce8"
      fontSize={12}
      fontWeight={600}
      pointerEvents="none"
    >
      {numericValue.toLocaleString()} goods
    </text>
  );
};

const TotalsTooltip = ({
  active,
  payload,
  label,
}: TooltipProps<number, string>) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }
  const data = payload[0].payload as {
    total: number;
    shipping: number;
    arrived: number;
    completed: number;
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-3 text-xs text-slate-200 shadow-lg shadow-slate-900/40 backdrop-blur">
      <p className="text-sm font-semibold text-white">{label}</p>
      <p className="text-xs text-amber-300">
        Total: {data.total.toLocaleString()} goods
      </p>
      <div className="mt-3 space-y-1.5">
        {STATUS_KEYS.map((key) => {
          const value = data[key] ?? 0;
          const percent = data.total
            ? Math.round((value / data.total) * 100)
            : 0;
          return (
            <div key={key} className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: STATUS_META[key].color }}
                />
                {STATUS_META[key].label}
              </span>
              <span className="font-semibold text-white">
                {value.toLocaleString()}{" "}
                <span className="text-slate-400">({percent}%)</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

type CountStats = {
  shipping: number;
  arrived: number;
  completed: number;
};

type MemberShipmentSummary = {
  memberId: number;
  memberName: string;
  phone?: string | null;
  branchId: number;
  branchName: string;
  areaId?: number;
  areaName?: string;
  subAreaId?: number | null;
  subAreaName?: string | null;
  all: CountStats;
  cod: CountStats;
  nonCod: CountStats;
  lastDate: string;
};

const SHIPMENT_FETCH_LIMIT = 200;
const compareIsoDatesDesc = (a: string, b: string) =>
  a === b ? 0 : a > b ? -1 : 1;
const getCreatedAtTime = (value?: string) => {
  const time = value ? Date.parse(value) : Number.NaN;
  return Number.isNaN(time) ? 0 : time;
};

const formatDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString();
};

const getTodayIsoDate = () => new Date().toISOString().split("T")[0];
const getDaysAgoIsoDate = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split("T")[0];
};

const parseIsoDate = (value: string) => new Date(`${value}T00:00:00`);

const getIsoWeekNumber = (date: Date) => {
  const temp = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const dayNum = temp.getUTCDay() || 7;
  temp.setUTCDate(temp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(temp.getUTCFullYear(), 0, 1));
  return Math.ceil(((temp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

const formatMonthLabel = (date: Date) =>
  date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

export default function GoodsDashboardPage() {
  const [areas, setAreas] = useState<MarketingArea[]>([]);
  const [subAreas, setSubAreas] = useState<MarketingSubArea[]>([]);
  const [branches, setBranches] = useState<MarketingBranch[]>([]);
  const [members, setMembers] = useState<VipMember[]>([]);
  const [shipments, setShipments] = useState<MarketingGoodsShipmentRecord[]>(
    [],
  );

  const [selectedAreaId, setSelectedAreaId] = useState<number | "all">("all");
  const [selectedSubAreaId, setSelectedSubAreaId] = useState<number | "all">(
    "all",
  );
  const [selectedBranchId, setSelectedBranchId] = useState<number | "all">(
    "all",
  );
  const [selectedMemberId, setSelectedMemberId] = useState<number | "all">(
    "all",
  );
  const [totalsView, setTotalsView] = useState<"area" | "branch" | "member">(
    "area",
  );
  const [shipmentViewMode, setShipmentViewMode] = useState<
    "goods-type" | "goods-status"
  >("goods-type");
  const [startDate, setStartDate] = useState(getDaysAgoIsoDate(14));
  const [endDate, setEndDate] = useState(getTodayIsoDate());
  const [trendView, setTrendView] = useState<TrendView>("day");

  const [hierarchyLoading, setHierarchyLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [shipmentsLoading, setShipmentsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const filtersDisabled = hierarchyLoading || membersLoading;

  const handleStartDateChange = (value: string) => {
    if (!value) {
      return;
    }
    setStartDate(value);
    if (value > endDate) {
      setEndDate(value);
    }
  };

  const handleEndDateChange = (value: string) => {
    if (!value) {
      return;
    }
    setEndDate(value < startDate ? startDate : value);
  };

  const applyRecentRange = (days: number) => {
    setEndDate(getTodayIsoDate());
    setStartDate(getDaysAgoIsoDate(days));
  };

  useEffect(() => {
    const loadHierarchy = async () => {
      setHierarchyLoading(true);
      setError(null);
      try {
        const [areaData, subAreaData, branchData] = await Promise.all([
          marketingHierarchyService.listAreas(),
          marketingHierarchyService.listSubAreas(),
          marketingHierarchyService.listBranches(),
        ]);
        setAreas(areaData);
        setSubAreas(subAreaData);
        setBranches(branchData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load hierarchy data.",
        );
      } finally {
        setHierarchyLoading(false);
      }
    };

    void loadHierarchy();
  }, []);

  useEffect(() => {
    const loadMembers = async () => {
      setMembersLoading(true);
      try {
        const roster = await vipMemberService.listMembers();
        setMembers(roster);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load VIP members.",
        );
      } finally {
        setMembersLoading(false);
      }
    };

    void loadMembers();
  }, []);

  const refreshShipments = useCallback(async () => {
    setShipmentsLoading(true);
    setError(null);
    try {
      const params: {
        areaId?: number;
        subAreaId?: number;
        branchId?: number;
        memberId?: number;
        limit?: number;
        myOnly?: boolean;
        startDate?: string;
        endDate?: string;
      } = {
        limit: SHIPMENT_FETCH_LIMIT,
        myOnly: false,
        startDate,
        endDate,
      };

      if (selectedAreaId !== "all") {
        params.areaId = selectedAreaId;
      }
      if (selectedSubAreaId !== "all") {
        params.subAreaId = selectedSubAreaId;
      }
      if (selectedBranchId !== "all") {
        params.branchId = selectedBranchId;
      }
      if (selectedMemberId !== "all") {
        params.memberId = selectedMemberId;
      }

      const records = await goodsShipmentService.listRecent(params);

      const filteredByDate = records.filter((record) => {
        const matchesStart = !startDate || record.sendDate >= startDate;
        const matchesEnd = !endDate || record.sendDate <= endDate;
        return matchesStart && matchesEnd;
      });

      const latestPerMemberPerDay = Array.from(
        filteredByDate
          .reduce((map, record) => {
            const key = `${record.memberId}-${record.sendDate}`;
            const existing = map.get(key);
            if (!existing) {
              map.set(key, record);
              return map;
            }
            const existingTime = getCreatedAtTime(existing.createdAt);
            const currentTime = getCreatedAtTime(record.createdAt);
            if (
              currentTime > existingTime ||
              (currentTime === existingTime && record.id > existing.id)
            ) {
              map.set(key, record);
            }
            return map;
          }, new Map<string, MarketingGoodsShipmentRecord>())
          .values(),
      ).sort((a, b) => {
        const dateComparison = compareIsoDatesDesc(a.sendDate, b.sendDate);
        if (dateComparison !== 0) {
          return dateComparison;
        }
        return getCreatedAtTime(b.createdAt) - getCreatedAtTime(a.createdAt);
      });

      setShipments(latestPerMemberPerDay);
    } catch (err) {
      setShipments([]);
      setError(
        err instanceof Error ? err.message : "Failed to load shipments.",
      );
    } finally {
      setShipmentsLoading(false);
    }
  }, [
    selectedAreaId,
    selectedSubAreaId,
    selectedBranchId,
    selectedMemberId,
    startDate,
    endDate,
  ]);

  useEffect(() => {
    void refreshShipments();
  }, [refreshShipments]);

  const availableSubAreas = useMemo(() => {
    if (selectedAreaId === "all") {
      return subAreas;
    }
    return subAreas.filter((subArea) => subArea.areaId === selectedAreaId);
  }, [subAreas, selectedAreaId]);

  const availableBranches = useMemo(() => {
    return branches.filter((branch) => {
      if (selectedAreaId !== "all" && branch.areaId !== selectedAreaId) {
        return false;
      }
      if (
        selectedSubAreaId !== "all" &&
        (branch.subAreaId ?? null) !== selectedSubAreaId
      ) {
        return false;
      }
      return true;
    });
  }, [branches, selectedAreaId, selectedSubAreaId]);

  const availableMembers = useMemo(() => {
    return members.filter((member) => {
      if (selectedAreaId !== "all" && member.areaId !== selectedAreaId) {
        return false;
      }
      if (
        selectedSubAreaId !== "all" &&
        member.subAreaId !== selectedSubAreaId
      ) {
        return false;
      }
      if (selectedBranchId !== "all" && member.branchId !== selectedBranchId) {
        return false;
      }
      return true;
    });
  }, [members, selectedAreaId, selectedSubAreaId, selectedBranchId]);

  const resolvedMember = useMemo(() => {
    if (selectedMemberId === "all") {
      return null;
    }
    return (
      availableMembers.find((member) => member.id === selectedMemberId) ?? null
    );
  }, [availableMembers, selectedMemberId]);

  useEffect(() => {
    if (
      selectedMemberId !== "all" &&
      !availableMembers.some((member) => member.id === selectedMemberId)
    ) {
      setSelectedMemberId("all");
    }
  }, [availableMembers, selectedMemberId]);

  const memberMap = useMemo(
    () => new Map(members.map((member) => [member.id, member])),
    [members],
  );
  const branchMap = useMemo(
    () => new Map(branches.map((branch) => [branch.id, branch])),
    [branches],
  );
  const areaMap = useMemo(
    () => new Map(areas.map((area) => [area.id, area])),
    [areas],
  );
  const subAreaMap = useMemo(
    () => new Map(subAreas.map((subArea) => [subArea.id, subArea])),
    [subAreas],
  );

  const memberSummaries = useMemo(() => {
    const summaryMap = new Map<number, MemberShipmentSummary>();

    shipments.forEach((shipment) => {
      const existing = summaryMap.get(shipment.memberId);
      const memberInfo = memberMap.get(shipment.memberId);
      const branch = branchMap.get(shipment.branchId);
      const areaId = branch?.areaId ?? memberInfo?.areaId ?? undefined;
      const subAreaId = branch?.subAreaId ?? memberInfo?.subAreaId ?? null;
      const area = areaId ? areaMap.get(areaId) : undefined;
      const subArea = subAreaId ? subAreaMap.get(subAreaId) : undefined;

      const summary = existing ?? {
        memberId: shipment.memberId,
        memberName: shipment.memberName,
        phone: memberInfo?.phone ?? null,
        branchId: shipment.branchId,
        branchName: shipment.branchName,
        areaId,
        areaName: area?.name ?? memberInfo?.areaName ?? "Unassigned area",
        subAreaId,
        subAreaName:
          subArea?.name ??
          memberInfo?.subAreaName ??
          (subAreaId ? "Unassigned sub-area" : null),
        all: { shipping: 0, arrived: 0, completed: 0 },
        cod: { shipping: 0, arrived: 0, completed: 0 },
        nonCod: { shipping: 0, arrived: 0, completed: 0 },
        lastDate: "",
      };

      summary.cod.shipping += shipment.codGoods.shipping;
      summary.cod.arrived += shipment.codGoods.arrived;
      summary.cod.completed += shipment.codGoods.complete;

      summary.nonCod.shipping += shipment.nonCodGoods.shipping;
      summary.nonCod.arrived += shipment.nonCodGoods.arrived;
      summary.nonCod.completed += shipment.nonCodGoods.complete;

      summary.all.shipping +=
        shipment.codGoods.shipping + shipment.nonCodGoods.shipping;
      summary.all.arrived +=
        shipment.codGoods.arrived + shipment.nonCodGoods.arrived;
      summary.all.completed +=
        shipment.codGoods.complete + shipment.nonCodGoods.complete;

      const shipmentDate = new Date(shipment.sendDate).getTime();
      const recordedDate = summary.lastDate
        ? new Date(summary.lastDate).getTime()
        : 0;
      if (shipmentDate > recordedDate) {
        summary.lastDate = shipment.sendDate;
      }

      summaryMap.set(shipment.memberId, summary);
    });

    return Array.from(summaryMap.values());
  }, [shipments, memberMap, branchMap, areaMap, subAreaMap]);

  const filteredSummaries = useMemo(() => {
    let summaries = memberSummaries;
    if (selectedAreaId !== "all") {
      summaries = summaries.filter(
        (summary) => summary.areaId === selectedAreaId,
      );
    }
    if (selectedSubAreaId !== "all") {
      summaries = summaries.filter(
        (summary) => summary.subAreaId === selectedSubAreaId,
      );
    }
    if (selectedBranchId !== "all") {
      summaries = summaries.filter(
        (summary) => summary.branchId === selectedBranchId,
      );
    }
    if (resolvedMember) {
      summaries = summaries.filter(
        (summary) => summary.memberId === resolvedMember.id,
      );
    }
    return summaries;
  }, [
    memberSummaries,
    selectedAreaId,
    selectedSubAreaId,
    selectedBranchId,
    resolvedMember,
  ]);

  const displayedMemberCount = filteredSummaries.length;

  const chartData = useMemo(() => {
    if (filteredSummaries.length === 0) {
      return [];
    }

    const totals = filteredSummaries.reduce(
      (acc, summary) => {
        acc.ALL.shipping += summary.all.shipping;
        acc.ALL.arrived += summary.all.arrived;
        acc.ALL.completed += summary.all.completed;

        acc.COD.shipping += summary.cod.shipping;
        acc.COD.arrived += summary.cod.arrived;
        acc.COD.completed += summary.cod.completed;

        return acc;
      },
      {
        ALL: { shipping: 0, arrived: 0, completed: 0 },
        COD: { shipping: 0, arrived: 0, completed: 0 },
      },
    );

    return [
      {
        metric: STATUS_META.shipping.label,
        statusKey: "shipping" as StatusKey,
        ALL: totals.ALL.shipping,
        COD: totals.COD.shipping,
      },
      {
        metric: STATUS_META.arrived.label,
        statusKey: "arrived" as StatusKey,
        ALL: totals.ALL.arrived,
        COD: totals.COD.arrived,
      },
      {
        metric: STATUS_META.completed.label,
        statusKey: "completed" as StatusKey,
        ALL: totals.ALL.completed,
        COD: totals.COD.completed,
      },
    ];
  }, [filteredSummaries]);

  const goodsTypeTotals = useMemo(() => {
    if (chartData.length === 0) {
      return { ALL: 0, COD: 0 };
    }
    return chartData.reduce(
      (acc, row) => {
        acc.ALL += row.ALL;
        acc.COD += row.COD;
        return acc;
      },
      { ALL: 0, COD: 0 },
    );
  }, [chartData]);

  const goodsTypeChartData = useMemo(
    () =>
      (["ALL", "COD"] as GoodsTypeLabel[]).map((type) => ({
        key: type,
        label: type === "ALL" ? "ALL goods" : "COD goods",
        value: goodsTypeTotals[type],
        color: GOODS_TYPE_COLORS[type],
      })),
    [goodsTypeTotals],
  );

  const goodsTypeDonutData = useMemo(() => {
    const totalAll = goodsTypeTotals.ALL;
    const totalCod = goodsTypeTotals.COD;
    const nonCod = Math.max(totalAll - totalCod, 0);

    return [
      {
        key: "non-cod",
        label: "Non-COD goods",
        value: nonCod,
        color: GOODS_TYPE_COLORS.ALL,
      },
      {
        key: "cod",
        label: "COD goods",
        value: totalCod,
        color: GOODS_TYPE_COLORS.COD,
      },
    ];
  }, [goodsTypeTotals]);

  const statusTotalsData = useMemo(
    () =>
      chartData.map((row) => ({
        key: row.statusKey,
        label: row.metric,
        value: row.ALL,
        color: STATUS_META[row.statusKey].color,
      })),
    [chartData],
  );

  const comparativeData: SplitDatum[] = useMemo(
    () =>
      shipmentViewMode === "goods-type" ? goodsTypeDonutData : statusTotalsData,
    [shipmentViewMode, goodsTypeDonutData, statusTotalsData],
  );

  const statusComparisonData = useMemo(
    () =>
      chartData.map((row) => ({
        metric: row.metric,
        allGoods: row.ALL,
        codGoods: row.COD,
      })),
    [chartData],
  );

  const totalsChartData = useMemo(() => {
    if (filteredSummaries.length === 0) {
      return [];
    }

    const grouped = new Map<
      string,
      {
        label: string;
        shipping: number;
        arrived: number;
        completed: number;
        total: number;
      }
    >();

    filteredSummaries.forEach((summary) => {
      const key =
        totalsView === "area"
          ? `area-${summary.areaId ?? "none"}`
          : totalsView === "branch"
            ? `branch-${summary.branchId}`
            : `member-${summary.memberId}`;
      const label =
        totalsView === "area"
          ? (summary.areaName ?? "Unassigned area")
          : totalsView === "branch"
            ? summary.branchName
            : summary.memberName;

      if (!grouped.has(key)) {
        grouped.set(key, {
          label,
          shipping: 0,
          arrived: 0,
          completed: 0,
          total: 0,
        });
      }

      const bucket = grouped.get(key)!;
      bucket.shipping += summary.all.shipping;
      bucket.arrived += summary.all.arrived;
      bucket.completed += summary.all.completed;
      bucket.total = bucket.shipping + bucket.arrived + bucket.completed;
    });

    return Array.from(grouped.values()).sort((a, b) => b.total - a.total);
  }, [filteredSummaries, totalsView]);

  const dailyGoodsTrend = useMemo(() => {
    if (shipments.length === 0) {
      return [];
    }

    const totalsByDate = shipments.reduce((map, record) => {
      const totalGoods =
        record.codGoods.shipping +
        record.codGoods.arrived +
        record.codGoods.complete +
        record.nonCodGoods.shipping +
        record.nonCodGoods.arrived +
        record.nonCodGoods.complete;
      map.set(record.sendDate, (map.get(record.sendDate) ?? 0) + totalGoods);
      return map;
    }, new Map<string, number>());

    const baseSeries = Array.from(totalsByDate.entries())
      .sort(([a], [b]) => (a === b ? 0 : a < b ? -1 : 1))
      .map(([date, total]) => ({
        date,
        label: formatDate(date),
        total,
      }));

    if (trendView === "day") {
      return baseSeries;
    }

    if (trendView === "week") {
      const grouped = new Map<
        string,
        { total: number; count: number; label: string }
      >();
      baseSeries.forEach((item) => {
        const parsed = parseIsoDate(item.date);
        const year = parsed.getUTCFullYear();
        const week = getIsoWeekNumber(parsed);
        const key = `${year}-W${week}`;
        const label = `W${week} ${year}`;
        const bucket = grouped.get(key) ?? { total: 0, count: 0, label };
        bucket.total += item.total;
        bucket.count += 1;
        grouped.set(key, bucket);
      });
      return Array.from(grouped.entries())
        .sort(([a], [b]) => (a === b ? 0 : a < b ? -1 : 1))
        .map(([key, bucket]) => ({
          date: key,
          label: bucket.label,
          total: bucket.total,
        }));
    }

    // trendView === 'month'
    const grouped = new Map<string, { total: number; label: string }>();
    baseSeries.forEach((item) => {
      const parsed = parseIsoDate(item.date);
      const key = `${parsed.getUTCFullYear()}-${parsed.getUTCMonth()}`;
      const bucket = grouped.get(key) ?? {
        total: 0,
        label: formatMonthLabel(parsed),
      };
      bucket.total += item.total;
      grouped.set(key, bucket);
    });
    return Array.from(grouped.entries())
      .sort(([a], [b]) => (a === b ? 0 : a < b ? -1 : 1))
      .map(([key, bucket]) => ({
        date: key,
        label: bucket.label,
        total: bucket.total,
      }));
  }, [shipments, trendView]);

  const shipmentRows = useMemo(
    () =>
      shipments.map((record) => {
        const memberInfo = memberMap.get(record.memberId);
        const all = {
          shipping: record.codGoods.shipping + record.nonCodGoods.shipping,
          arrived: record.codGoods.arrived + record.nonCodGoods.arrived,
          completed: record.codGoods.complete + record.nonCodGoods.complete,
        };
        return {
          id: record.id,
          member: record.memberName,
          phone: memberInfo?.phone ?? "—",
          date: formatDate(record.sendDate),
          all,
          cod: {
            shipping: record.codGoods.shipping,
            arrived: record.codGoods.arrived,
            completed: record.codGoods.complete,
          },
          totalGoods: all.shipping + all.arrived + all.completed,
        };
      }),
    [shipments, memberMap],
  );

  const handleAreaChange = (value: string) => {
    const next = value === "all" ? "all" : Number(value);
    setSelectedAreaId(next);
    setSelectedSubAreaId("all");
    setSelectedBranchId("all");
    setSelectedMemberId("all");
  };

  const handleSubAreaChange = (value: string) => {
    const next = value === "all" ? "all" : Number(value);
    setSelectedSubAreaId(next);
    setSelectedBranchId("all");
    setSelectedMemberId("all");
  };

  const handleBranchChange = (value: string) => {
    const next = value === "all" ? "all" : Number(value);
    setSelectedBranchId(next);
    setSelectedMemberId("all");
  };

  const handleMemberChange = (value: string) => {
    const next = value === "all" ? "all" : Number(value);
    setSelectedMemberId(next);
  };

  return (
    <MarketingServiceGuard>
      <div className="space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-amber-300/70">
            Marketing ◦ VIP logistics
          </p>
          <h1 className="text-3xl font-semibold text-white">
            VIP member shipments
          </h1>
          <p className="text-sm text-slate-300">
            Filter by area → branch → member to understand how premium
            deliveries are performing for ALL vs COD goods.
          </p>
        </header>

        {error && (
          <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        )}

        <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
            <div className="flex-1 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-amber-200/80">
                <span>Locations</span>
                <button
                  className="rounded-full border border-white/10 px-3 py-1 text-[0.6rem] text-white/70 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => {
                    setSelectedAreaId("all");
                    setSelectedSubAreaId("all");
                    setSelectedBranchId("all");
                    setSelectedMemberId("all");
                  }}
                  disabled={filtersDisabled}
                >
                  Reset
                </button>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="flex flex-col text-xs text-slate-300">
                  <label className="text-[0.6rem] uppercase tracking-[0.25em] text-slate-400">
                    Area
                  </label>
                  <select
                    className="mt-1 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-amber-400/60 focus:outline-none"
                    value={selectedAreaId}
                    onChange={(event) => handleAreaChange(event.target.value)}
                    disabled={filtersDisabled}
                  >
                    <option value="all">All areas</option>
                    {areas.map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.name}
                      </option>
                    ))}
                  </select>
                </div>

                {availableSubAreas.length > 0 && (
                  <div className="flex flex-col text-xs text-slate-300">
                    <label className="text-[0.6rem] uppercase tracking-[0.25em] text-slate-400">
                      Sub area
                    </label>
                    <select
                      className="mt-1 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-amber-400/60 focus:outline-none"
                      value={selectedSubAreaId}
                      onChange={(event) =>
                        handleSubAreaChange(event.target.value)
                      }
                      disabled={filtersDisabled}
                    >
                      <option value="all">All sub areas</option>
                      {availableSubAreas.map((subArea) => (
                        <option key={subArea.id} value={subArea.id}>
                          {subArea.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex flex-col text-xs text-slate-300">
                  <label className="text-[0.6rem] uppercase tracking-[0.25em] text-slate-400">
                    Branch
                  </label>
                  <select
                    className="mt-1 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-amber-400/60 focus:outline-none"
                    value={selectedBranchId}
                    onChange={(event) => handleBranchChange(event.target.value)}
                    disabled={filtersDisabled}
                  >
                    <option value="all">All branches</option>
                    {availableBranches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col text-xs text-slate-300">
                  <label className="text-[0.6rem] uppercase tracking-[0.25em] text-slate-400">
                    Member
                  </label>
                  <select
                    className="mt-1 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-amber-400/60 focus:outline-none"
                    value={selectedMemberId}
                    onChange={(event) => handleMemberChange(event.target.value)}
                    disabled={filtersDisabled}
                  >
                    <option value="all">All members</option>
                    {availableMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-white lg:w-80">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-amber-200/80">
                <span>Date range</span>
                <div className="flex gap-2">
                  {[7, 14, 30].map((days) => (
                    <button
                      key={days}
                      className="rounded-full border border-white/10 px-3 py-1 text-[0.6rem] text-white/70 hover:text-white"
                      onClick={() => applyRecentRange(days)}
                    >
                      {days}d
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-3 space-y-3 text-xs">
                <div className="flex flex-col">
                  <label className="text-[0.6rem] uppercase tracking-[0.25em] text-slate-400">
                    Start date
                  </label>
                  <input
                    type="date"
                    className="mt-1 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-amber-400/60 focus:outline-none"
                    value={startDate}
                    max={endDate}
                    onChange={(event) =>
                      handleStartDateChange(event.target.value)
                    }
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-[0.6rem] uppercase tracking-[0.25em] text-slate-400">
                    End date
                  </label>
                  <input
                    type="date"
                    className="mt-1 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-amber-400/60 focus:outline-none"
                    value={endDate}
                    min={startDate}
                    max={getTodayIsoDate()}
                    onChange={(event) =>
                      handleEndDateChange(event.target.value)
                    }
                  />
                </div>
                <div className="flex flex-wrap gap-2 text-[0.6rem] uppercase tracking-[0.25em] text-slate-400">
                  <button
                    className="rounded-full border border-white/10 px-3 py-1 text-white/70 hover:text-white"
                    onClick={() => {
                      setStartDate(getTodayIsoDate());
                      setEndDate(getTodayIsoDate());
                    }}
                  >
                    Today
                  </button>
                  <button
                    className="rounded-full border border-white/10 px-3 py-1 text-white/70 hover:text-white"
                    onClick={() => {
                      setStartDate(getDaysAgoIsoDate(90));
                      setEndDate(getTodayIsoDate());
                    }}
                  >
                    90d
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-amber-300/70">
                Shipment status
              </p>
              <h2 className="text-xl font-semibold text-white">
                {shipmentViewMode === "goods-type"
                  ? "All vs COD performance"
                  : "Goods status totals"}
              </h2>
              <p className="text-sm text-slate-300">
                {resolvedMember
                  ? `Tracking ${resolvedMember.name} (${resolvedMember.phone ?? "no phone"})`
                  : `Aggregated across ${displayedMemberCount} VIP member(s)`}
              </p>
            </div>
            <div className="flex flex-col items-start gap-2 text-sm text-slate-300 lg:items-end">
              {shipmentsLoading && (
                <span className="text-[0.6rem] uppercase tracking-[0.3em] text-slate-500">
                  Refreshing shipments…
                </span>
              )}
              <div className="flex items-center gap-3">
                <span className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-500">
                  View by
                </span>
                <div className="rounded-full border border-white/10 bg-slate-900/60 p-1">
                  {(
                    [
                      { key: "goods-type", label: "Goods type" },
                      { key: "goods-status", label: "Goods status" },
                    ] as const
                  ).map((mode) => (
                    <button
                      key={mode.key}
                      className={`rounded-full px-4 py-1 text-xs uppercase tracking-[0.2em] ${
                        shipmentViewMode === mode.key
                          ? "bg-amber-400/20 text-white"
                          : "text-slate-400 hover:text-white"
                      }`}
                      onClick={() => setShipmentViewMode(mode.key)}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="h-80 w-full">
              {chartData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">
                  No shipments match your filters.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  {shipmentViewMode === "goods-type" ? (
                    <BarChart
                      data={goodsTypeChartData}
                      margin={{ top: 40, left: 16, right: 16, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#475569"
                        opacity={0.2}
                      />
                      <XAxis dataKey="label" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" allowDecimals={false} />
                      <Tooltip
                        cursor={{ fill: "rgba(255,255,255,0.05)" }}
                        contentStyle={TOOLTIP_STYLES.content}
                        labelStyle={TOOLTIP_STYLES.label}
                        itemStyle={TOOLTIP_STYLES.item}
                      />
                      <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={56}>
                        {goodsTypeChartData.map((entry) => (
                          <Cell key={entry.key} fill={entry.color} />
                        ))}
                        <LabelList
                          dataKey="value"
                          position="top"
                          fill="#f1f5f9"
                          fontSize={12}
                          offset={10}
                        />
                      </Bar>
                    </BarChart>
                  ) : (
                    <BarChart
                      data={statusComparisonData}
                      margin={{ top: 40, left: 16, right: 16, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#475569"
                        opacity={0.2}
                      />
                      <XAxis dataKey="metric" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" allowDecimals={false} />
                      <Tooltip
                        cursor={{ fill: "rgba(255,255,255,0.05)" }}
                        contentStyle={TOOLTIP_STYLES.content}
                        labelStyle={TOOLTIP_STYLES.label}
                        itemStyle={TOOLTIP_STYLES.item}
                        formatter={(value: number, name) => [
                          `${value.toLocaleString()} goods`,
                          name ?? "Goods",
                        ]}
                      />
                      <Bar
                        dataKey="allGoods"
                        radius={[12, 12, 0, 0]}
                        barSize={56}
                        fill={GOODS_TYPE_COLORS.ALL}
                        name="ALL goods"
                      >
                        <LabelList
                          dataKey="allGoods"
                          position="top"
                          fill="#f1f5f9"
                          fontSize={12}
                          offset={10}
                        />
                      </Bar>
                      <Bar
                        dataKey="codGoods"
                        radius={[12, 12, 0, 0]}
                        barSize={56}
                        fill={GOODS_TYPE_COLORS.COD}
                        name="COD goods"
                      >
                        <LabelList
                          dataKey="codGoods"
                          position="top"
                          fill="#e0f2fe"
                          fontSize={12}
                          offset={10}
                        />
                      </Bar>
                    </BarChart>
                  )}
                </ResponsiveContainer>
              )}
            </div>
            <div className="flex h-80 w-full flex-col">
              <div className="flex items-center justify-between text-sm text-slate-300">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-amber-300/70">
                    Donut view
                  </p>
                  <h3 className="text-lg font-semibold text-white">
                    {shipmentViewMode === "goods-type"
                      ? "ALL vs COD share"
                      : "Status mix"}
                  </h3>
                </div>
              </div>
              <div className="mt-4 flex-1">
                {comparativeData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">
                    No summary available.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip
                        contentStyle={TOOLTIP_STYLES.content}
                        labelStyle={TOOLTIP_STYLES.label}
                        itemStyle={TOOLTIP_STYLES.item}
                        formatter={(value: number, name: string) => [
                          `${value.toLocaleString()} goods`,
                          name,
                        ]}
                      />
                      <Pie
                        data={comparativeData}
                        dataKey="value"
                        nameKey="label"
                        innerRadius={70}
                        outerRadius={110}
                        paddingAngle={4}
                      >
                        {comparativeData.map((entry) => (
                          <Cell key={entry.key} fill={entry.color} />
                        ))}
                        <Label
                          position="center"
                          content={({ viewBox }) => {
                            if (
                              !viewBox ||
                              !("cx" in viewBox) ||
                              !("cy" in viewBox)
                            ) {
                              return null;
                            }
                            const total = comparativeData.reduce(
                              (sum, item) => sum + item.value,
                              0,
                            );
                            return (
                              <text
                                x={viewBox.cx}
                                y={viewBox.cy}
                                textAnchor="middle"
                                fill="#fefce8"
                              >
                                <tspan
                                  x={viewBox.cx}
                                  dy="-0.4em"
                                  className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400"
                                >
                                  Total
                                </tspan>
                                <tspan
                                  x={viewBox.cx}
                                  dy="1.4em"
                                  className="text-2xl font-bold text-white"
                                >
                                  {total.toLocaleString()}
                                </tspan>
                                <tspan
                                  x={viewBox.cx}
                                  dy="1.2em"
                                  className="text-xs text-slate-400"
                                >
                                  goods
                                </tspan>
                              </text>
                            );
                          }}
                        />
                      </Pie>
                      <Legend
                        verticalAlign="bottom"
                        align="center"
                        iconType="circle"
                        formatter={(value) => (
                          <span className="text-xs uppercase tracking-[0.25em] text-slate-200">
                            {value}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-2 pb-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-amber-300/70">
                Totals overview
              </p>
              <h2 className="text-xl font-semibold text-white">
                ALL goods volume by segment
              </h2>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <span className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-500">
                View by
              </span>
              <div className="rounded-full border border-white/10 bg-slate-900/60 p-1">
                {(["area", "branch", "member"] as const).map((view) => (
                  <button
                    key={view}
                    className={`rounded-full px-4 py-1 text-xs uppercase tracking-[0.2em] ${
                      totalsView === view
                        ? "bg-amber-400/20 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                    onClick={() => setTotalsView(view)}
                  >
                    {view}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-2 h-80 w-full">
            {totalsChartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                No total goods data to display.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={totalsChartData}
                  margin={{ top: 20, left: 16, right: 16, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#475569"
                    opacity={0.2}
                  />
                  <XAxis
                    dataKey="label"
                    stroke="#94a3b8"
                    angle={-10}
                    height={60}
                    tickMargin={12}
                  />
                  <YAxis stroke="#94a3b8" allowDecimals={false} />
                  <Legend
                    wrapperStyle={{ color: "#cbd5f5" }}
                    formatter={(value) => (
                      <span className="text-xs uppercase tracking-[0.25em] text-slate-200">
                        {value}
                      </span>
                    )}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.05)" }}
                    content={<TotalsTooltip />}
                  />
                  <Bar
                    dataKey="shipping"
                    stackId="totals"
                    barSize={56}
                    fill={STATUS_META.shipping.color}
                    name={STATUS_META.shipping.label}
                    radius={[0, 0, 0, 0]}
                  >
                    <LabelList
                      dataKey="shipping"
                      content={(props) => (
                        <SegmentPercentLabel {...props} segment="shipping" />
                      )}
                    />
                  </Bar>
                  <Bar
                    dataKey="arrived"
                    stackId="totals"
                    barSize={56}
                    fill={STATUS_META.arrived.color}
                    name={STATUS_META.arrived.label}
                    radius={[0, 0, 0, 0]}
                  >
                    <LabelList
                      dataKey="arrived"
                      content={(props) => (
                        <SegmentPercentLabel {...props} segment="arrived" />
                      )}
                    />
                  </Bar>
                  <Bar
                    dataKey="completed"
                    stackId="totals"
                    barSize={56}
                    fill={STATUS_META.completed.color}
                    name={STATUS_META.completed.label}
                    radius={[12, 12, 0, 0]}
                  >
                    <LabelList
                      dataKey="total"
                      content={(props) => <TotalsTopLabel {...props} />}
                    />
                    <LabelList
                      dataKey="completed"
                      content={(props) => (
                        <SegmentPercentLabel {...props} segment="completed" />
                      )}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {dailyGoodsTrend.length > 0 && (
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-amber-300/70">
                  Trend
                </p>
                <h2 className="text-xl font-semibold text-white">
                  Total goods per day
                </h2>
                <p className="text-sm text-slate-300">
                  Visualize how combined COD and non-COD goods fluctuate inside
                  your selected date range.
                </p>
              </div>
              <div className="rounded-full border border-white/10 bg-slate-900/60 p-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                {TREND_VIEW_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    className={`rounded-full px-4 py-1 ${
                      trendView === option.key
                        ? "bg-amber-400/30 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                    onClick={() => setTrendView(option.key)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-6 h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={dailyGoodsTrend}
                  margin={{ top: 16, left: 8, right: 16, bottom: 8 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#475569"
                    opacity={0.2}
                  />
                  <XAxis dataKey="label" stroke="#94a3b8" tickMargin={12} />
                  <YAxis stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip
                    cursor={{ stroke: "#f97316", strokeWidth: 2 }}
                    contentStyle={TOOLTIP_STYLES.content}
                    labelStyle={TOOLTIP_STYLES.label}
                    itemStyle={TOOLTIP_STYLES.item}
                    formatter={(value: number) => [
                      `${value.toLocaleString()} goods`,
                      "Total goods",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#fb923c"
                    strokeWidth={3}
                    dot={{ stroke: "#fed7aa", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-amber-300/70">
                Shipment log
              </p>
              <h2 className="text-xl font-semibold text-white">
                VIP member manifest
              </h2>
            </div>
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-slate-400">
              {shipmentsLoading && <span>Refreshing…</span>}
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200">
                {shipmentRows.length} rows
              </span>
            </div>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead>
                <tr className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  <th className="pb-3 pr-6 whitespace-nowrap">Member</th>
                  <th className="pb-3 pr-6 whitespace-nowrap">Phone</th>
                  <th className="pb-3 pr-6 whitespace-nowrap">Date</th>
                  <th className="pb-3 pr-6 whitespace-nowrap">Shipping</th>
                  <th className="pb-3 pr-6 whitespace-nowrap">Arrived</th>
                  <th className="pb-3 pr-6 whitespace-nowrap">Completed</th>
                  <th className="pb-3 pr-6 whitespace-nowrap">Shipping</th>
                  <th className="pb-3 pr-6 whitespace-nowrap">Arrived</th>
                  <th className="pb-3 pr-6 whitespace-nowrap">Completed</th>
                  <th className="pb-3 whitespace-nowrap">Total goods</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {shipmentRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-6 text-center text-slate-400">
                      No shipment details for the current filters.
                    </td>
                  </tr>
                ) : (
                  shipmentRows.map((row, index) => (
                    <tr key={`${row.member}-${row.phone}-${index}`}>
                      <td className="py-3 pr-6 whitespace-nowrap">
                        {row.member}
                      </td>
                      <td className="py-3 pr-6 whitespace-nowrap text-slate-300">
                        {row.phone}
                      </td>
                      <td className="py-3 pr-6 whitespace-nowrap">
                        {row.date}
                      </td>
                      <td className="py-3 pr-1 whitespace-nowrap">
                        <div className="rounded-l-2xl border border-white/10 bg-white/5 px-4 py-2 text-white">
                          {row.all.shipping}
                        </div>
                      </td>
                      <td className="py-3 px-1 whitespace-nowrap">
                        <div className="border-y border-white/10 bg-white/5 px-4 py-2 text-amber-200">
                          {row.all.arrived}
                        </div>
                      </td>
                      <td className="py-3 pl-1 pr-1 whitespace-nowrap">
                        <div className="rounded-r-2xl border border-white/10 bg-white/5 px-4 py-2 text-emerald-200">
                          {row.all.completed}
                        </div>
                      </td>

                      <td className="py-3 pr-1 pl-1 whitespace-nowrap">
                        <div className="rounded-l-2xl border border-sky-300/30 bg-sky-500/10 px-4 py-2 text-white">
                          {row.cod.shipping}
                        </div>
                      </td>
                      <td className="py-3 px-1 whitespace-nowrap">
                        <div className="border-y border-sky-300/30 bg-sky-500/10 px-4 py-2 text-amber-200">
                          {row.cod.arrived}
                        </div>
                      </td>
                      <td className="py-3 pl-1 whitespace-nowrap">
                        <div className="rounded-r-2xl border border-sky-300/30 bg-sky-500/10 px-4 py-2 text-emerald-200">
                          {row.cod.completed}
                        </div>
                      </td>
                      <td className="py-3 pl-1 whitespace-nowrap">
                        <div className="rounded-2xl border border-amber-300/30 bg-amber-500/10 px-4 py-2 text-white">
                          {row.totalGoods}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </MarketingServiceGuard>
  );
}
