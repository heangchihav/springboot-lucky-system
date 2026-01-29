"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { apiFetch } from "@/services/httpClient";

type CallReportSummaryResponse = {
  calledAt: string;
  arrivedAt?: string;
  branchId: number | null;
  branchName: string;
  statusTotals: Record<string, number>;
};

type CallStatusResponse = {
  key: string;
  label: string;
};

type ArrivalType = "new-arrival" | "recall";

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
  const arrived = normalizeDateForArrival(summary.arrivedAt);
  const called = normalizeDateForArrival(summary.calledAt);
  if (arrived && called && arrived === called) {
    return "new-arrival";
  }
  return "recall";
};

const formatKhDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("km-KH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
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

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.append("startDate", defaultStartDate());
        params.append("endDate", defaultEndDate());
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
    };

    fetchReports();
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
      type === "new-arrival"
        ? "អីវ៉ាន់ចូលថ្មី (New Arrival)"
        : "Re-Call";
    const dateRange = formatArrivalDateRange(data.dates);
    const statusLines = statusDisplayOrder.filter((key) => (data.statuses[key] ?? 0) > 0)
      .map((key) => `- ${statusLabelMap[key] ?? key} : ${formatNumber(data.statuses[key])} កញ្ចប់`);

    return [
      `${heading}${dateRange ? ` (${dateRange})` : ""} : ${formatNumber(data.total)} កញ្ចប់`,
      ...statusLines,
    ];
  }, [statusDisplayOrder, statusLabelMap]);

  const groupedReports = useMemo<GroupedReport[]>(() => {
    const byDate = new Map<string, { branches: Set<string>; entries: CallReportSummaryResponse[] }>();

    summaries.forEach((summary) => {
      const entry = byDate.get(summary.calledAt) ?? { branches: new Set<string>(), entries: [] };
      entry.branches.add(summary.branchName || "Unassigned");
      entry.entries.push(summary);
      byDate.set(summary.calledAt, entry);
    });

    return Array.from(byDate.entries())
      .map<GroupedReport>(([calledAt, { branches, entries }]) => {
        const totalsByStatus: Record<string, number> = {};
        const arrivalBuckets: Record<ArrivalType, { total: number; statuses: Record<string, number>; dates: Set<string> }> = {
          "new-arrival": { total: 0, statuses: {}, dates: new Set<string>() },
          "recall": { total: 0, statuses: {}, dates: new Set<string>() },
        };

        entries.forEach((entry) => {
          Object.entries(entry.statusTotals).forEach(([status, value]) => {
            totalsByStatus[status] = (totalsByStatus[status] ?? 0) + value;
          });

          const arrivalType = classifyArrivalType(entry);
          const bucket = arrivalBuckets[arrivalType];
          const normalizedArrivalDate =
            normalizeDateForArrival(entry.arrivedAt) ??
            normalizeDateForArrival(entry.calledAt) ??
            entry.calledAt;
          if (normalizedArrivalDate) {
            bucket.dates.add(normalizedArrivalDate);
          }
          Object.entries(entry.statusTotals).forEach(([status, value]) => {
            bucket.statuses[status] = (bucket.statuses[status] ?? 0) + value;
            bucket.total += value;
          });
        });

        const totalCalls = Object.values(totalsByStatus).reduce((sum, value) => sum + value, 0);

        const arrivalBreakdown: GroupedReport["arrivalBreakdown"] = {
          "new-arrival": {
            total: arrivalBuckets["new-arrival"].total,
            statuses: arrivalBuckets["new-arrival"].statuses,
            dates: Array.from(arrivalBuckets["new-arrival"].dates).sort(),
          },
          "recall": {
            total: arrivalBuckets["recall"].total,
            statuses: arrivalBuckets["recall"].statuses,
            dates: Array.from(arrivalBuckets["recall"].dates).sort(),
          },
        };

        return {
          calledAt,
          branches: Array.from(branches).sort(),
          totalsByStatus,
          totalCalls,
          arrivalBreakdown,
        };
      })
      .sort((a, b) => new Date(b.calledAt).getTime() - new Date(a.calledAt).getTime());
  }, [summaries]);

  const renderModalContent = (report: GroupedReport) => {
    const totalPlanned = report.totalCalls;
    const notCalled = report.totalsByStatus["not-called-yet"] ?? 0;
    const completed = totalPlanned - notCalled;

    const newArrivalText = buildArrivalText("new-arrival", report.arrivalBreakdown["new-arrival"]);
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

      {!loading && !error && groupedReports.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-white/70">
          មិនមានទិន្នន័យរបាយការណ៍ក្នុងកាលបរិច្ឆេទនេះទេ។
        </div>
      )}

      {!loading && !error && groupedReports.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-white/5 bg-slate-950/70">
          <table className="min-w-full divide-y divide-white/5 text-sm">
            <thead>
              <tr className="bg-white/5 text-left text-xs font-semibold uppercase tracking-wider text-slate-300">
                <th className="px-4 py-3">No</th>
                <th className="px-4 py-3">Called at</th>
                <th className="px-4 py-3">Branch</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white/90">
              {groupedReports.map((report, index) => (
                <tr
                  key={report.calledAt}
                  className="cursor-pointer transition hover:bg-white/5"
                  onClick={() => setSelectedReport(report)}
                >
                  <td className="px-4 py-3 text-sm font-semibold text-slate-300">{index + 1}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-white">{formatKhDate(report.calledAt)}</div>
                    <p className="text-xs text-slate-400">{report.calledAt}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold">
                      {report.branches.length > 3
                        ? `${report.branches.length} branches`
                        : report.branches.join(", ")}
                    </div>
                    <p className="text-xs text-slate-400">សរុប {formatNumber(report.totalCalls)} កញ្ចប់</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-semibold text-white">
                      {formatNumber(report.totalCalls - (report.totalsByStatus["not-called-yet"] ?? 0))} កញ្ចប់បានតេ
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">{buildStatusSummary(report.totalsByStatus)}</p>
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
            <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-slate-950/95 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.65)] animate-slide-down">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.35em] text-cyan-300">Call Center Report</p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">{formatKhDate(selectedReport.calledAt)}</h3>
                </div>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="text-white/60 transition hover:text-white text-2xl leading-none"
                >
                  ✕
                </button>
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
