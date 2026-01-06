"use client";

import { useMemo, useState } from "react";
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

type CompanyKey = "J&T" | "ZTO" | "DRSB" | "Capitol";

type CompanyDetail = {
  name: string;
  highestPrice: number;
  lowestPrice: number;
  strengths: string[];
  weaknesses: string[];
  remark: string;
};

type Province = {
  name: string;
  companies: Record<CompanyKey, number>;
};

type Area = {
  id: number;
  name: string;
  provinces: Province[];
};

const AREAS: Area[] = [
  {
    id: 1,
    name: "Area 1",
    provinces: [
      {
        name: "Banteay Meanchey",
        companies: {
          "J&T": 40,
          ZTO: 12,
          DRSB: 32,
          Capitol: 7,
        },
      },
      {
        name: "Siem Reap",
        companies: {
          "J&T": 25,
          ZTO: 18,
          DRSB: 20,
          Capitol: 10,
        },
      },
    ],
  },
  {
    id: 2,
    name: "Area 2",
    provinces: [
      {
        name: "Phnom Penh",
        companies: {
          "J&T": 80,
          ZTO: 45,
          DRSB: 60,
          Capitol: 30,
        },
      },
      {
        name: "Kandal",
        companies: {
          "J&T": 35,
          ZTO: 20,
          DRSB: 25,
          Capitol: 15,
        },
      },
    ],
  },
  {
    id: 3,
    name: "Area 3",
    provinces: [
      {
        name: "Battambang",
        companies: {
          "J&T": 28,
          ZTO: 14,
          DRSB: 19,
          Capitol: 9,
        },
      },
    ],
  },
];

const COMPANY_DETAILS: Record<CompanyKey, CompanyDetail> = {
  "J&T": {
    name: "J&T",
    highestPrice: 180000,
    lowestPrice: 4000,
    strengths: [
      "Fast delivery nationwide",
      "Strong tracking system",
      "Wide branch coverage",
    ],
    weaknesses: [
      "Customer service response can be slow",
      "Occasional parcel delays during peak time",
    ],
    remark: "Best for high-volume shipments and nationwide coverage.",
  },
  ZTO: {
    name: "ZTO",
    highestPrice: 160000,
    lowestPrice: 3500,
    strengths: ["Affordable pricing", "Good performance in urban areas"],
    weaknesses: ["Limited rural coverage", "Less flexible delivery schedules"],
    remark: "Good choice for cost-sensitive deliveries.",
  },
  DRSB: {
    name: "DRSB",
    highestPrice: 152000,
    lowestPrice: 4000,
    strengths: ["Reliable delivery time", "Good customer support"],
    weaknesses: ["Smaller network", "Limited tracking features"],
    remark: "Stable service with good reliability.",
  },
  Capitol: {
    name: "Capitol",
    highestPrice: 120000,
    lowestPrice: 5000,
    strengths: ["Cheap pricing", "Simple delivery process"],
    weaknesses: ["Slow delivery speed", "Limited customer support"],
    remark: "Best for low-cost and non-urgent deliveries.",
  },
};

const formatPrice = (value: number) =>
  new Intl.NumberFormat("km-KH", {
    style: "currency",
    currency: "KHR",
    maximumFractionDigits: 0,
  }).format(value);

const companyPalette: Record<CompanyKey, string> = {
  "J&T": "#f97316",
  ZTO: "#4f46e5",
  DRSB: "#10b981",
  Capitol: "#ec4899",
};

const companyKeys: CompanyKey[] = ["J&T", "ZTO", "DRSB", "Capitol"];

const buildChartData = (
  areaId: number | "all",
  provinceName: string | "all",
) => {
  const selectedAreas =
    areaId === "all" ? AREAS : AREAS.filter((area) => area.id === areaId);

  const totals: Record<CompanyKey, number> = {
    "J&T": 0,
    ZTO: 0,
    DRSB: 0,
    Capitol: 0,
  };

  selectedAreas.forEach((area) => {
    area.provinces.forEach((province) => {
      if (provinceName !== "all" && province.name !== provinceName) {
        return;
      }
      companyKeys.forEach((company) => {
        totals[company] += province.companies[company];
      });
    });
  });

  return companyKeys.map((company) => ({
    company,
    total: totals[company],
  }));
};

const buildDetails = (areaId: number | "all", provinceName: string | "all") => {
  const selectedAreas =
    areaId === "all" ? AREAS : AREAS.filter((area) => area.id === areaId);

  const items: {
    area: string;
    province: string;
    companies: Record<CompanyKey, number>;
    total: number;
  }[] = [];

  selectedAreas.forEach((area) => {
    area.provinces.forEach((province) => {
      if (provinceName !== "all" && province.name !== provinceName) {
        return;
      }
      const companyValues = companyKeys.reduce(
        (acc, company) => ({
          ...acc,
          [company]: province.companies[company],
        }),
        {} as Record<CompanyKey, number>,
      );
      const total = companyKeys.reduce(
        (sum, company) => sum + province.companies[company],
        0,
      );

      items.push({
        area: area.name,
        province: province.name,
        companies: companyValues,
        total,
      });
    });
  });

  return items;
};

export default function CompetitorsDashboardPage() {
  const [selectedArea, setSelectedArea] = useState<number | "all">("all");
  const [selectedProvince, setSelectedProvince] = useState<string | "all">(
    "all",
  );

  const availableProvinces = useMemo(() => {
    if (selectedArea === "all") {
      return AREAS.flatMap((area) =>
        area.provinces.map((province) => province.name),
      );
    }
    const area = AREAS.find((item) => item.id === selectedArea);
    return area ? area.provinces.map((province) => province.name) : [];
  }, [selectedArea]);

  const chartData = useMemo(() => {
    const data = buildChartData(selectedArea, selectedProvince);
    const total = data.reduce((sum, entry) => sum + entry.total, 0);
    return data.map((entry) => ({
      ...entry,
      percent: total === 0 ? 0 : Math.round((entry.total / total) * 100),
    }));
  }, [selectedArea, selectedProvince]);
  const detailRows = useMemo(
    () => buildDetails(selectedArea, selectedProvince),
    [selectedArea, selectedProvince],
  );
  const totalBranches = chartData.reduce((sum, entry) => sum + entry.total, 0);

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
                  {AREAS.map((area) => (
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
              {companyKeys.map((company) => (
                <span
                  key={company}
                  className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: companyPalette[company] }}
                  />
                  {company}
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
                      key={entry.company}
                      fill={companyPalette[entry.company as CompanyKey]}
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
                  {companyKeys.map((company) => (
                    <th key={company} className="pb-3 pr-6">
                      {company}
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
                    {companyKeys.map((company) => (
                      <td
                        key={company}
                        className="py-3 pr-6 font-semibold text-white"
                        style={{ color: companyPalette[company] }}
                      >
                        {row.companies[company]}
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
                {companyKeys.map((company) => {
                  const detail = COMPANY_DETAILS[company];
                  return (
                    <tr key={company}>
                      <td className="py-3 pr-6">
                        <div className="flex items-center gap-3">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: companyPalette[company] }}
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
                        <ul className="list-disc space-y-1 pl-4">
                          {detail.strengths.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </td>
                      <td className="py-3 pr-6 text-slate-300">
                        <ul className="list-disc space-y-1 pl-4">
                          {detail.weaknesses.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </td>
                      <td className="py-3 text-slate-200">{detail.remark}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </MarketingServiceGuard>
  );
}
