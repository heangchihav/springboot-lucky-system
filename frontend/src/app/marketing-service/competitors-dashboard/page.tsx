"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MarketingServiceGuard } from "@/components/marketing-service/MarketingServiceGuard";
import {
  competitorAssignmentService,
  type MarketingCompetitorAssignment,
} from "@/services/marketing-service/competitorAssignmentService";
import {
  competitorService,
  type MarketingCompetitor,
} from "@/services/marketing-service/competitorService";

type DashboardArea = {
  id: number;
  name: string;
  provinces: {
    name: string;
    companies: Record<number, number>;
  }[];
};

type CompanyListItem = {
  id: number;
  name: string;
};

type CompanyDetailRow = {
  id: number;
  name: string;
  lowestPrice: number;
  highestPrice: number;
  strengths: string[];
  weaknesses: string[];
  remark: string;
};

const colorPalette = [
  "#f97316",
  "#4f46e5",
  "#10b981",
  "#ec4899",
  "#a855f7",
  "#06b6d4",
  "#f59e0b",
  "#22d3ee",
  "#be123c",
];

const formatPrice = (value: number) =>
  new Intl.NumberFormat("km-KH", {
    style: "currency",
    currency: "KHR",
    maximumFractionDigits: 0,
  }).format(value);

export default function CompetitorsDashboardPage() {
  const [assignments, setAssignments] = useState<MarketingCompetitorAssignment[]>([]);
  const [competitors, setCompetitors] = useState<MarketingCompetitor[]>([]);
  const [selectedArea, setSelectedArea] = useState<number | "all">("all");
  const [selectedProvince, setSelectedProvince] = useState<string | "all">("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [assignmentData, competitorData] = await Promise.all([
          competitorAssignmentService.listAssignments(),
          competitorService.listCompetitors(),
        ]);
        if (!active) return;
        setAssignments(assignmentData);
        setCompetitors(competitorData);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load dashboard data");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const competitorLookup = useMemo(() => {
    const map: Record<number, MarketingCompetitor> = {};
    competitors.forEach((competitor) => {
      map[competitor.id] = competitor;
    });
    return map;
  }, [competitors]);

  const { dashboardAreas, companyList } = useMemo(() => {
    const areaMap = new Map<
      number,
      {
        id: number;
        name: string;
        provinces: Map<string, Map<number, number>>;
      }
    >();
    const competitorIdSet = new Set<number>();

    assignments.forEach((assignment) => {
      const areaEntry =
        areaMap.get(assignment.areaId) ??
        {
          id: assignment.areaId,
          name: assignment.areaName,
          provinces: new Map<string, Map<number, number>>(),
        };
      areaMap.set(assignment.areaId, areaEntry);

      const provinceName = assignment.subAreaName || assignment.areaName;
      const provinceEntry =
        areaEntry.provinces.get(provinceName) ?? new Map<number, number>();
      areaEntry.provinces.set(provinceName, provinceEntry);

      Object.entries(assignment.competitorProfiles).forEach(([competitorId, profile]) => {
        const id = Number(competitorId);
        competitorIdSet.add(id);
        const current = provinceEntry.get(id) ?? 0;
        provinceEntry.set(id, current + (profile.branchCount ?? 0));
      });
    });

    const sortedCompanyList: CompanyListItem[] = Array.from(competitorIdSet)
      .map((id) => ({
        id,
        name: competitorLookup[id]?.name ?? `Competitor ${id}`,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const areas: DashboardArea[] = Array.from(areaMap.values())
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((area) => ({
        id: area.id,
        name: area.name,
        provinces: Array.from(area.provinces.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([provinceName, companiesMap]) => {
            const companies: Record<number, number> = {};
            sortedCompanyList.forEach((company) => {
              companies[company.id] = companiesMap.get(company.id) ?? 0;
            });
            return {
              name: provinceName,
              companies,
            };
          }),
      }));

    return {
      dashboardAreas: areas,
      companyList: sortedCompanyList,
    };
  }, [assignments, competitorLookup]);

  useEffect(() => {
    if (selectedArea !== "all" && !dashboardAreas.some((area) => area.id === selectedArea)) {
      setSelectedArea("all");
    }
  }, [dashboardAreas, selectedArea]);

  const availableProvinces = useMemo(() => {
    if (dashboardAreas.length === 0) return [];
    if (selectedArea === "all") {
      return Array.from(
        new Set(
          dashboardAreas.flatMap((area) => area.provinces.map((province) => province.name)),
        ),
      );
    }
    const targetArea = dashboardAreas.find((area) => area.id === selectedArea);
    return targetArea ? targetArea.provinces.map((province) => province.name) : [];
  }, [dashboardAreas, selectedArea]);

  useEffect(() => {
    if (
      selectedProvince !== "all" &&
      !availableProvinces.includes(selectedProvince)
    ) {
      setSelectedProvince("all");
    }
  }, [availableProvinces, selectedProvince]);

  const companyColorMap = useMemo(() => {
    const map = new Map<number, string>();
    companyList.forEach((company, index) => {
      map.set(company.id, colorPalette[index % colorPalette.length]);
    });
    return map;
  }, [companyList]);

  const filteredAreas = useMemo(() => {
    if (selectedArea === "all") {
      return dashboardAreas;
    }
    return dashboardAreas.filter((area) => area.id === selectedArea);
  }, [dashboardAreas, selectedArea]);

  const chartData = useMemo(() => {
    const totals = new Map<number, number>();
    companyList.forEach((company) => totals.set(company.id, 0));

    filteredAreas.forEach((area) => {
      area.provinces.forEach((province) => {
        if (selectedProvince !== "all" && province.name !== selectedProvince) {
          return;
        }
        companyList.forEach((company) => {
          const nextValue =
            (totals.get(company.id) ?? 0) + (province.companies[company.id] ?? 0);
          totals.set(company.id, nextValue);
        });
      });
    });

    const sum = Array.from(totals.values()).reduce((acc, value) => acc + value, 0);

    return companyList.map((company) => {
      const total = totals.get(company.id) ?? 0;
      return {
        competitorId: company.id,
        company: company.name,
        total,
        percent: sum === 0 ? 0 : Math.round((total / sum) * 100),
      };
    });
  }, [companyList, filteredAreas, selectedProvince]);

  const detailRows = useMemo(() => {
    const rows: {
      area: string;
      province: string;
      companies: Record<number, number>;
      total: number;
    }[] = [];

    filteredAreas.forEach((area) => {
      area.provinces.forEach((province) => {
        if (selectedProvince !== "all" && province.name !== selectedProvince) {
          return;
        }

        const companies: Record<number, number> = {};
        let total = 0;
        companyList.forEach((company) => {
          const value = province.companies[company.id] ?? 0;
          companies[company.id] = value;
          total += value;
        });

        rows.push({
          area: area.name,
          province: province.name,
          companies,
          total,
        });
      });
    });

    return rows;
  }, [companyList, filteredAreas, selectedProvince]);

  const companyDetails = useMemo<CompanyDetailRow[]>(() => {
    const detailMap = new Map<
      number,
      {
        id: number;
        name: string;
        lowestPrice: number;
        highestPrice: number;
        strengths: Set<string>;
        weaknesses: Set<string>;
        remark?: string;
      }
    >();

    assignments.forEach((assignment) => {
      Object.entries(assignment.competitorProfiles).forEach(([competitorId, profile]) => {
        const id = Number(competitorId);
        const existing =
          detailMap.get(id) ??
          {
            id,
            name: competitorLookup[id]?.name ?? `Competitor ${id}`,
            lowestPrice: profile.priceRange.lowestPrice,
            highestPrice: profile.priceRange.highestPrice,
            strengths: new Set<string>(),
            weaknesses: new Set<string>(),
            remark: profile.remarks,
          };

        existing.lowestPrice = Math.min(existing.lowestPrice, profile.priceRange.lowestPrice);
        existing.highestPrice = Math.max(existing.highestPrice, profile.priceRange.highestPrice);
        profile.strengths?.forEach((item) => existing.strengths.add(item));
        profile.weaknesses?.forEach((item) => existing.weaknesses.add(item));
        if (!existing.remark && profile.remarks) {
          existing.remark = profile.remarks;
        }
        detailMap.set(id, existing);
      });
    });

    return Array.from(detailMap.values())
      .map((detail) => ({
        id: detail.id,
        name: detail.name,
        lowestPrice: detail.lowestPrice,
        highestPrice: detail.highestPrice,
        strengths: Array.from(detail.strengths),
        weaknesses: Array.from(detail.weaknesses),
        remark: detail.remark ?? "No remarks provided",
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [assignments, competitorLookup]);

  const totalBranches = chartData.reduce((sum, entry) => sum + entry.total, 0);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center text-slate-300">
          Loading competitor intelligence...
        </div>
      );
    }

    if (error) {
      return (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      );
    }

    if (assignments.length === 0) {
      return (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-12 text-center text-slate-300">
          No competitor assignments found. Create assignments in the Competitor Management
          page to unlock this dashboard.
        </div>
      );
    }

    return (
      <>
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 text-white">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Total branches
              </p>
              <p className="mt-3 text-4xl font-semibold">{totalBranches}</p>
              <p className="text-sm text-slate-300">
                Based on filter selection across all companies
              </p>
            </div>
            <div className="flex flex-col gap-4 text-sm lg:flex-row lg:items-center lg:gap-6">
              <div className="flex flex-col">
                <label className="text-[0.6rem] uppercase tracking-[0.3em] text-slate-300">
                  Area
                </label>
                <select
                  className="mt-2 w-44 rounded-2xl border border-white/20 bg-slate-900/60 px-4 py-2 text-sm text-white focus:border-amber-400/60 focus:outline-none"
                  value={selectedArea}
                  onChange={(event) => {
                    const value =
                      event.target.value === "all" ? "all" : Number(event.target.value);
                    setSelectedArea(value);
                    setSelectedProvince("all");
                  }}
                  disabled={dashboardAreas.length === 0}
                >
                  <option value="all">All areas</option>
                  {dashboardAreas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-[0.6rem] uppercase tracking-[0.3em] text-slate-300">
                  Province
                </label>
                <select
                  className="mt-2 w-44 rounded-2xl border border-white/20 bg-slate-900/60 px-4 py-2 text-sm text-white focus:border-amber-400/60 focus:outline-none"
                  value={selectedProvince}
                  onChange={(event) =>
                    setSelectedProvince(event.target.value as string | "all")
                  }
                  disabled={availableProvinces.length === 0}
                >
                  <option value="all">All provinces</option>
                  {availableProvinces.map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-amber-300/70">
                Company density
              </p>
              <h2 className="text-xl font-semibold text-white">
                Company comparison
              </h2>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-slate-300">
              {companyList.length === 0 && <span>No competitors to display</span>}
              {companyList.map((company) => (
                <span
                  key={company.id}
                  className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: companyColorMap.get(company.id) }}
                  />
                  {company.name}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-6 h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 32, left: 16, right: 16, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#475569"
                  opacity={0.2}
                />
                <XAxis dataKey="company" stroke="#94a3b8" />
                <YAxis
                  stroke="#94a3b8"
                  domain={[
                    0,
                    (dataMax: number) => (dataMax === 0 ? 10 : dataMax * 1.2),
                  ]}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.05)" }}
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                  formatter={(value: number) => [value, "total branch"]}
                />
                <Bar dataKey="total" barSize={70} radius={[12, 12, 0, 0]}>
                  <LabelList
                    dataKey="percent"
                    position="top"
                    formatter={(value: number) => `${value}%`}
                    fill="#e2e8f0"
                    fontSize={12}
                    offset={12}
                  />
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.competitorId}
                      fill={companyColorMap.get(entry.competitorId) ?? colorPalette[0]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-amber-300/70">
                Detail breakdown
              </p>
              <h2 className="text-xl font-semibold text-white">
                All branches by company
              </h2>
            </div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200">
              {detailRows.length} rows
            </span>
          </div>
          <div className="mt-6 overflow-x-auto">
            {detailRows.length === 0 ? (
              <div className="py-6 text-center text-slate-300">
                No records for the selected filters
              </div>
            ) : (
              <table className="min-w-full text-left text-sm text-slate-200">
                <thead>
                  <tr className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    <th className="pb-3 pr-6">Area</th>
                    <th className="pb-3 pr-6">Province</th>
                    {companyList.map((company) => (
                      <th key={company.id} className="pb-3 pr-6">
                        {company.name}
                      </th>
                    ))}
                    <th className="pb-3">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {detailRows.map((row) => (
                    <tr key={`${row.area}-${row.province}`}>
                      <td className="py-3 pr-6">{row.area}</td>
                      <td className="py-3 pr-6 text-slate-300">{row.province}</td>
                      {companyList.map((company) => (
                        <td
                          key={company.id}
                          className="py-3 pr-6 font-semibold text-white"
                          style={{ color: companyColorMap.get(company.id) }}
                        >
                          {row.companies[company.id] ?? 0}
                        </td>
                      ))}
                      <td className="py-3 font-semibold text-white">{row.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-amber-300/70">
                Company intel
              </p>
              <h2 className="text-xl font-semibold text-white">
                Competitive pricing
              </h2>
            </div>
            <p className="text-sm text-slate-300">
              Hover for long remarks to understand when each partner is strongest.
            </p>
          </div>
          <div className="mt-6 overflow-x-auto">
            {companyDetails.length === 0 ? (
              <div className="py-6 text-center text-slate-300">
                No competitor profiles available yet.
              </div>
            ) : (
              <table className="min-w-full text-left text-sm text-slate-200">
                <thead>
                  <tr className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    <th className="pb-3 pr-6">Company</th>
                    <th className="pb-3 pr-6">Price range</th>
                    <th className="pb-3 pr-6">Strengths</th>
                    <th className="pb-3 pr-6">Weaknesses</th>
                    <th className="pb-3">Remark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {companyDetails.map((detail) => (
                    <tr key={detail.id}>
                      <td className="py-3 pr-6">
                        <div className="flex items-center gap-3">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: companyColorMap.get(detail.id) }}
                          />
                          <span className="font-semibold">{detail.name}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-6">
                        <div className="min-w-48 whitespace-nowrap">
                          <span className="font-semibold text-white">
                            {formatPrice(detail.lowestPrice)}
                          </span>
                          <span className="mx-2 text-slate-400">–</span>
                          <span className="font-semibold text-white">
                            {formatPrice(detail.highestPrice)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-6 text-slate-300">
                        {detail.strengths.length === 0 ? (
                          <span className="text-slate-500">No strengths provided</span>
                        ) : (
                          <ul className="list-disc space-y-1 pl-4">
                            {detail.strengths.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td className="py-3 pr-6 text-slate-300">
                        {detail.weaknesses.length === 0 ? (
                          <span className="text-slate-500">No weaknesses provided</span>
                        ) : (
                          <ul className="list-disc space-y-1 pl-4">
                            {detail.weaknesses.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td className="py-3 text-slate-200">{detail.remark}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </>
    );
  };

  return (
    <MarketingServiceGuard>
      <div className="space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-amber-300/70">
            Marketing ◦ Company landscape
          </p>
          <h1 className="text-3xl font-semibold text-white">
            Competitors dashboard
          </h1>
          <p className="text-sm text-slate-300">
            Filter by area/province to explore company presence and total branch
            density across Cambodia.
          </p>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 text-white">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Total branches
              </p>
              <p className="mt-3 text-4xl font-semibold">{totalBranches}</p>
              <p className="text-sm text-slate-300">
                Based on filter selection across all companies
              </p>
            </div>
            <div className="flex flex-col gap-4 text-sm lg:flex-row lg:items-center lg:gap-6">
              <div className="flex flex-col">
                <label className="text-[0.6rem] uppercase tracking-[0.3em] text-slate-300">
                  Area
                </label>
                <select
                  className="mt-2 w-44 rounded-2xl border border-white/20 bg-slate-900/60 px-4 py-2 text-sm text-white focus:border-amber-400/60 focus:outline-none"
                  value={selectedArea}
                  onChange={(event) => {
                    const value =
                      event.target.value === "all"
                        ? "all"
                        : Number(event.target.value);
                    setSelectedArea(value);
                    setSelectedProvince("all");
                  }}
                >
                  <option value="all">All areas</option>
                  {dashboardAreas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-[0.6rem] uppercase tracking-[0.3em] text-slate-300">
                  Province
                </label>
                <select
                  className="mt-2 w-44 rounded-2xl border border-white/20 bg-slate-900/60 px-4 py-2 text-sm text-white focus:border-amber-400/60 focus:outline-none"
                  value={selectedProvince}
                  onChange={(event) =>
                    setSelectedProvince(event.target.value as string | "all")
                  }
                  disabled={availableProvinces.length === 0}
                >
                  <option value="all">All provinces</option>
                  {availableProvinces.map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-amber-300/70">
                Company density
              </p>
              <h2 className="text-xl font-semibold text-white">
                Company comparison
              </h2>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-slate-300">
              {companyList.length === 0 && <span>No competitors to display</span>}
              {companyList.map((company) => (
                <span
                  key={company.id}
                  className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: companyColorMap.get(company.id) }}
                  />
                  {company.name}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-6 h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 32, left: 16, right: 16, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#475569"
                  opacity={0.2}
                />
                <XAxis dataKey="company" stroke="#94a3b8" />
                <YAxis
                  stroke="#94a3b8"
                  domain={[
                    0,
                    (dataMax: number) => (dataMax === 0 ? 10 : dataMax * 1.2),
                  ]}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.05)" }}
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                  formatter={(value: number) => [value, "total branch"]}
                />
                <Bar dataKey="total" barSize={70} radius={[12, 12, 0, 0]}>
                  <LabelList
                    dataKey="percent"
                    position="top"
                    formatter={(value: number) => `${value}%`}
                    fill="#e2e8f0"
                    fontSize={12}
                    offset={12}
                  />
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.competitorId}
                      fill={companyColorMap.get(entry.competitorId) ?? colorPalette[0]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-amber-300/70">
                Detail breakdown
              </p>
              <h2 className="text-xl font-semibold text-white">
                All branches by company
              </h2>
            </div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200">
              {detailRows.length} rows
            </span>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead>
                <tr className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  <th className="pb-3 pr-6">Area</th>
                  <th className="pb-3 pr-6">Province</th>
                  {companyList.map((company) => (
                    <th key={company.id} className="pb-3 pr-6">
                      {company.name}
                    </th>
                  ))}
                  <th className="pb-3">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {detailRows.map((row) => (
                  <tr key={`${row.area}-${row.province}`}>
                    <td className="py-3 pr-6">{row.area}</td>
                    <td className="py-3 pr-6 text-slate-300">{row.province}</td>
                    {companyList.map((company) => (
                      <td
                        key={company.id}
                        className="py-3 pr-6 font-semibold text-white"
                        style={{ color: companyColorMap.get(company.id) }}
                      >
                        {row.companies[company.id] ?? 0}
                      </td>
                    ))}
                    <td className="py-3 font-semibold text-white">
                      {row.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-amber-300/70">
                Company intel
              </p>
              <h2 className="text-xl font-semibold text-white">
                Competitive pricing
              </h2>
            </div>
            <p className="text-sm text-slate-300">
              Hover for long remarks to understand when each partner is
              strongest.
            </p>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead>
                <tr className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  <th className="pb-3 pr-6">Company</th>
                  <th className="pb-3 pr-6">Price range</th>
                  <th className="pb-3 pr-6">Strengths</th>
                  <th className="pb-3 pr-6">Weaknesses</th>
                  <th className="pb-3">Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {companyDetails.length === 0 ? (
                  <tr>
                    <td className="py-3 text-center text-slate-400" colSpan={5}>
                      No competitor profiles available yet.
                    </td>
                  </tr>
                ) : (
                  companyDetails.map((detail) => (
                    <tr key={detail.id}>
                      <td className="py-3 pr-6">
                        <div className="flex items-center gap-3">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: companyColorMap.get(detail.id) }}
                          />
                          <span className="font-semibold">{detail.name}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-6">
                        <div className="min-w-48 whitespace-nowrap">
                          <span className="font-semibold text-white">
                            {formatPrice(detail.lowestPrice)}
                          </span>
                          <span className="mx-2 text-slate-400">–</span>
                          <span className="font-semibold text-white">
                            {formatPrice(detail.highestPrice)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-6 text-slate-300">
                        {detail.strengths.length === 0 ? (
                          <span className="text-slate-500">No strengths provided</span>
                        ) : (
                          <ul className="list-disc space-y-1 pl-4">
                            {detail.strengths.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td className="py-3 pr-6 text-slate-300">
                        {detail.weaknesses.length === 0 ? (
                          <span className="text-slate-500">No weaknesses provided</span>
                        ) : (
                          <ul className="list-disc space-y-1 pl-4">
                            {detail.weaknesses.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td className="py-3 text-slate-200">{detail.remark}</td>
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
