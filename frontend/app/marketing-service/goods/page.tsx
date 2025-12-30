'use client'

import { useMemo, useState } from 'react'
import type { TooltipProps } from 'recharts'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  LabelList,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { MarketingServiceGuard } from '../_components/MarketingServiceGuard'

const STATUS_META = {
  shipping: { label: 'Shipping', color: '#facc15' },
  arrived: { label: 'Arrived', color: '#fb923c' },
  completed: { label: 'Completed', color: '#34d399' },
} as const

type StatusKey = keyof typeof STATUS_META
const STATUS_KEYS: StatusKey[] = ['shipping', 'arrived', 'completed']
const GOODS_TYPE_COLORS = {
  ALL: '#f97316',
  COD: '#22d3ee',
} as const

const TOOLTIP_STYLES = {
  content: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.15)',
  },
  label: {
    color: '#f8fafc',
    fontSize: 12,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
  },
  item: {
    color: '#e2e8f0',
  },
}

type GoodsTypeLabel = keyof typeof GOODS_TYPE_COLORS
type SplitDatum = {
  key: string
  label: string
  value: number
  color: string
}

type TotalsLabelProps = {
  x?: number | string
  y?: number | string
  width?: number | string
  height?: number | string
  value?: number | string
  payload?: {
    total?: number
  }
  segment?: StatusKey
}

const SegmentPercentLabel = ({ x = 0, y = 0, width = 0, height = 0, value = 0, payload, segment }: TotalsLabelProps) => {
  const numericValue = typeof value === 'string' ? Number(value) : value
  if (!payload?.total || !segment || !numericValue) {
    return null
  }
  const percent = Math.round((numericValue / payload.total) * 100)
  const numericHeight = typeof height === 'string' ? Number(height) : height
  const numericX = typeof x === 'string' ? Number(x) : x
  const numericWidth = typeof width === 'string' ? Number(width) : width
  const numericY = typeof y === 'string' ? Number(y) : y
  if (percent < 8 || numericHeight < 18) {
    return null
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
  )
}

const TotalsTopLabel = ({ x = 0, y = 0, width = 0, value = 0 }: TotalsLabelProps) => {
  const numericValue = typeof value === 'string' ? Number(value) : value
  if (!numericValue) {
    return null
  }
  const numericX = typeof x === 'string' ? Number(x) : x
  const numericWidth = typeof width === 'string' ? Number(width) : width
  const numericY = typeof y === 'string' ? Number(y) : y
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
  )
}

const TotalsTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload || payload.length === 0) {
    return null
  }
  const data = payload[0].payload as {
    total: number
    shipping: number
    arrived: number
    completed: number
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-3 text-xs text-slate-200 shadow-lg shadow-slate-900/40 backdrop-blur">
      <p className="text-sm font-semibold text-white">{label}</p>
      <p className="text-xs text-amber-300">Total: {data.total.toLocaleString()} goods</p>
      <div className="mt-3 space-y-1.5">
        {STATUS_KEYS.map((key) => {
          const value = data[key] ?? 0
          const percent = data.total ? Math.round((value / data.total) * 100) : 0
          return (
            <div key={key} className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_META[key].color }} />
                {STATUS_META[key].label}
              </span>
              <span className="font-semibold text-white">
                {value.toLocaleString()} <span className="text-slate-400">({percent}%)</span>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

type GoodsType = 'ALL' | 'COD'

type DailyShipping = {
  date: string
  total: number
  arrived: number
  completed: number
  goodsType: GoodsType
}

type VipMember = {
  id: number
  name: string
  phone: string
  shipping: DailyShipping[]
}

type Branch = {
  id: number
  name: string
  members: VipMember[]
}

type SubArea = {
  id: number
  name: string
  branches: Branch[]
}

type Area = {
  id: number
  name: string
  subAreas?: SubArea[]
  branches?: Branch[]
}

type MemberRecord = {
  areaId: number
  areaName: string
  branchId: number
  branchName: string
  member: VipMember
}

const VIP_AREAS: Area[] = [
  {
    id: 1,
    name: 'Area 1',
    subAreas: [
      {
        id: 11,
        name: 'Sub Area A',
        branches: [
          {
            id: 101,
            name: 'Branch A1',
            members: [
              {
                id: 1,
                name: 'Sok Dara',
                phone: '012345678',
                shipping: [
                  { date: '2025-01-10', goodsType: 'ALL', total: 80, arrived: 70, completed: 65 },
                  { date: '2025-01-10', goodsType: 'COD', total: 50, arrived: 45, completed: 40 },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 2,
    name: 'Area 2',
    branches: [
      {
        id: 201,
        name: 'Branch B1',
        members: [
          {
            id: 2,
            name: 'Chan Dara',
            phone: '098765432',
            shipping: [
              { date: '2025-01-10', goodsType: 'ALL', total: 60, arrived: 55, completed: 50 },
              { date: '2025-01-10', goodsType: 'COD', total: 35, arrived: 30, completed: 28 },
            ],
          },
        ],
      },
    ],
  },
]

const flattenBranches = (area: Area, subAreaId: number | 'all') => {
  const directBranches = area.branches ?? []
  const subAreaBranches =
    area.subAreas
      ?.filter((sub) => subAreaId === 'all' || sub.id === subAreaId)
      .flatMap((sub) => sub.branches) ?? []
  return [...directBranches, ...subAreaBranches]
}

export default function GoodsDashboardPage() {
  const [selectedAreaId, setSelectedAreaId] = useState<number | 'all'>('all')
  const [selectedSubAreaId, setSelectedSubAreaId] = useState<number | 'all'>('all')
  const [selectedBranchId, setSelectedBranchId] = useState<number | 'all'>('all')
  const [selectedMemberId, setSelectedMemberId] = useState<number | 'all'>('all')
  const [totalsView, setTotalsView] = useState<'area' | 'branch' | 'member'>('area')
  const [shipmentViewMode, setShipmentViewMode] = useState<'goods-type' | 'goods-status'>('goods-type')

  const selectedArea = useMemo(() => VIP_AREAS.find((area) => area.id === selectedAreaId), [selectedAreaId])

  const availableSubAreas = useMemo(() => selectedArea?.subAreas ?? [], [selectedArea])

  const availableBranches = useMemo(() => {
    if (selectedAreaId === 'all') {
      return VIP_AREAS.flatMap((area) => flattenBranches(area, 'all'))
    }
    if (!selectedArea) {
      return []
    }
    return flattenBranches(selectedArea, selectedSubAreaId)
  }, [selectedAreaId, selectedArea, selectedSubAreaId])

  const eligibleMemberRecords = useMemo(() => {
    const records: MemberRecord[] = []
    const shouldFilterSubArea = selectedAreaId !== 'all' && selectedSubAreaId !== 'all'

    const includeBranch = (area: Area, branch: Branch) => {
      if (selectedBranchId !== 'all' && branch.id !== selectedBranchId) {
        return
      }
      branch.members.forEach((member) => {
        records.push({
          areaId: area.id,
          areaName: area.name,
          branchId: branch.id,
          branchName: branch.name,
          member,
        })
      })
    }

    VIP_AREAS.forEach((area) => {
      if (selectedAreaId !== 'all' && area.id !== selectedAreaId) {
        return
      }

      ;(area.branches ?? []).forEach((branch) => includeBranch(area, branch))

      area.subAreas?.forEach((subArea) => {
        if (shouldFilterSubArea && subArea.id !== selectedSubAreaId) {
          return
        }
        subArea.branches.forEach((branch) => includeBranch(area, branch))
      })
    })

    return records
  }, [selectedAreaId, selectedSubAreaId, selectedBranchId])

  const availableMembers = useMemo(() => eligibleMemberRecords.map((record) => record.member), [eligibleMemberRecords])

  const resolvedMember = useMemo(() => {
    if (selectedMemberId === 'all') {
      return null
    }
    return availableMembers.find((member) => member.id === selectedMemberId) ?? null
  }, [availableMembers, selectedMemberId])

  const chartData = useMemo(() => {
    const sourceMembers = resolvedMember ? [resolvedMember] : availableMembers
    if (sourceMembers.length === 0) {
      return []
    }

    const totals = sourceMembers.reduce(
      (acc, member) => {
        member.shipping.forEach((entry) => {
          acc[entry.goodsType].shipping += entry.total
          acc[entry.goodsType].arrived += entry.arrived
          acc[entry.goodsType].completed += entry.completed
        })
        return acc
      },
      {
        ALL: { shipping: 0, arrived: 0, completed: 0 },
        COD: { shipping: 0, arrived: 0, completed: 0 },
      }
    )

    return [
      { metric: STATUS_META.shipping.label, statusKey: 'shipping' as StatusKey, ALL: totals.ALL.shipping, COD: totals.COD.shipping },
      { metric: STATUS_META.arrived.label, statusKey: 'arrived' as StatusKey, ALL: totals.ALL.arrived, COD: totals.COD.arrived },
      { metric: STATUS_META.completed.label, statusKey: 'completed' as StatusKey, ALL: totals.ALL.completed, COD: totals.COD.completed },
    ]
  }, [availableMembers, resolvedMember])

  const goodsTypeTotals = useMemo(() => {
    if (chartData.length === 0) {
      return { ALL: 0, COD: 0 }
    }
    return chartData.reduce(
      (acc, row) => {
        acc.ALL += row.ALL
        acc.COD += row.COD
        return acc
      },
      { ALL: 0, COD: 0 }
    )
  }, [chartData])

  const goodsTypeChartData = useMemo(
    () =>
      (['ALL', 'COD'] as GoodsTypeLabel[]).map((type) => ({
        key: type,
        label: type === 'ALL' ? 'ALL goods' : 'COD goods',
        value: goodsTypeTotals[type],
        color: GOODS_TYPE_COLORS[type],
      })),
    [goodsTypeTotals]
  )

  const goodsTypeDonutData = useMemo(() => {
    const totalAll = goodsTypeTotals.ALL
    const totalCod = goodsTypeTotals.COD
    const nonCod = Math.max(totalAll - totalCod, 0)

    return [
      {
        key: 'non-cod',
        label: 'Non-COD goods',
        value: nonCod,
        color: GOODS_TYPE_COLORS.ALL,
      },
      {
        key: 'cod',
        label: 'COD goods',
        value: totalCod,
        color: GOODS_TYPE_COLORS.COD,
      },
    ]
  }, [goodsTypeTotals])

  const statusTotalsData = useMemo(
    () =>
      chartData.map((row) => ({
        key: row.statusKey,
        label: row.metric,
        value: row.ALL,
        color: STATUS_META[row.statusKey].color,
      })),
    [chartData]
  )

  const comparativeData: SplitDatum[] = useMemo(
    () => (shipmentViewMode === 'goods-type' ? goodsTypeDonutData : statusTotalsData),
    [shipmentViewMode, goodsTypeDonutData, statusTotalsData]
  )

  const statusComparisonData = useMemo(
    () =>
      chartData.map((row) => ({
        metric: row.metric,
        allGoods: row.ALL,
        codGoods: row.COD,
      })),
    [chartData]
  )

  const totalsChartData = useMemo(() => {
    if (eligibleMemberRecords.length === 0) {
      return []
    }

    const records = resolvedMember
      ? eligibleMemberRecords.filter((record) => record.member.id === resolvedMember.id)
      : eligibleMemberRecords

    if (records.length === 0) {
      return []
    }

    const grouped = new Map<
      string,
      {
        label: string
        shipping: number
        arrived: number
        completed: number
        total: number
      }
    >()

    records.forEach((record) => {
      const memberTotals = record.member.shipping.reduce(
        (acc, entry) => {
          if (entry.goodsType !== 'ALL') {
            return acc
          }
          acc.shipping += entry.total
          acc.arrived += entry.arrived
          acc.completed += entry.completed
          return acc
        },
        { shipping: 0, arrived: 0, completed: 0 }
      )

      if (memberTotals.shipping + memberTotals.arrived + memberTotals.completed === 0) {
        return
      }

      const key =
        totalsView === 'area'
          ? `area-${record.areaId}`
          : totalsView === 'branch'
            ? `branch-${record.branchId}`
            : `member-${record.member.id}`
      const label =
        totalsView === 'area'
          ? record.areaName
          : totalsView === 'branch'
            ? record.branchName
            : record.member.name

      if (!grouped.has(key)) {
        grouped.set(key, { label, shipping: 0, arrived: 0, completed: 0, total: 0 })
      }
      const bucket = grouped.get(key)!
      bucket.shipping += memberTotals.shipping
      bucket.arrived += memberTotals.arrived
      bucket.completed += memberTotals.completed
      bucket.total = bucket.shipping + bucket.arrived + bucket.completed
    })

    return Array.from(grouped.values()).sort((a, b) => b.total - a.total)
  }, [eligibleMemberRecords, resolvedMember, totalsView])

  const shipmentRows = useMemo(() => {
    const sourceMembers = resolvedMember ? [resolvedMember] : availableMembers
    return sourceMembers.map((member) => {
      const summary = member.shipping.reduce(
        (acc, entry) => {
          if (entry.goodsType === 'ALL') {
            acc.all.shipping += entry.total
            acc.all.arrived += entry.arrived
            acc.all.completed += entry.completed
          } else {
            acc.cod.shipping += entry.total
            acc.cod.arrived += entry.arrived
            acc.cod.completed += entry.completed
          }
          acc.lastDate = entry.date
          return acc
        },
        {
          all: { shipping: 0, arrived: 0, completed: 0 },
          cod: { shipping: 0, arrived: 0, completed: 0 },
          lastDate: '',
        }
      )

      return {
        member: member.name,
        phone: member.phone,
        date: summary.lastDate,
        all: summary.all,
        cod: summary.cod,
        totalGoods: summary.all.shipping + summary.all.arrived + summary.all.completed,
      }
    })
  }, [availableMembers, resolvedMember])

  const handleAreaChange = (value: string) => {
    const next = value === 'all' ? 'all' : Number(value)
    setSelectedAreaId(next)
    setSelectedSubAreaId('all')
    setSelectedBranchId('all')
    setSelectedMemberId('all')
  }

  const handleSubAreaChange = (value: string) => {
    const next = value === 'all' ? 'all' : Number(value)
    setSelectedSubAreaId(next)
    setSelectedBranchId('all')
    setSelectedMemberId('all')
  }

  const handleBranchChange = (value: string) => {
    const next = value === 'all' ? 'all' : Number(value)
    setSelectedBranchId(next)
    setSelectedMemberId('all')
  }

  const handleMemberChange = (value: string) => {
    const next = value === 'all' ? 'all' : Number(value)
    setSelectedMemberId(next)
  }

  return (
    <MarketingServiceGuard>
      <div className="space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-amber-300/70">Marketing ◦ VIP logistics</p>
          <h1 className="text-3xl font-semibold text-white">VIP member shipments</h1>
          <p className="text-sm text-slate-300">
            Filter by area → branch → member to understand how premium deliveries are performing for ALL vs COD goods.
          </p>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col text-sm text-white">
              <label className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-400">Area</label>
              <select
                className="mt-2 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-white focus:border-amber-400/60 focus:outline-none"
                value={selectedAreaId}
                onChange={(event) => handleAreaChange(event.target.value)}
              >
                <option value="all">All areas</option>
                {VIP_AREAS.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
            </div>

            {availableSubAreas.length > 0 && (
              <div className="flex flex-col text-sm text-white">
                <label className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-400">Sub area</label>
                <select
                  className="mt-2 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-white focus:border-amber-400/60 focus:outline-none"
                  value={selectedSubAreaId}
                  onChange={(event) => handleSubAreaChange(event.target.value)}
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

            <div className="flex flex-col text-sm text-white">
              <label className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-400">Branch</label>
              <select
                className="mt-2 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-white focus:border-amber-400/60 focus:outline-none"
                value={selectedBranchId}
                onChange={(event) => handleBranchChange(event.target.value)}
              >
                <option value="all">All branches</option>
                {availableBranches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col text-sm text-white">
              <label className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-400">Member</label>
              <select
                className="mt-2 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-white focus:border-amber-400/60 focus:outline-none"
                value={selectedMemberId}
                onChange={(event) => handleMemberChange(event.target.value)}
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

        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-amber-300/70">Shipment status</p>
              <h2 className="text-xl font-semibold text-white">
                {shipmentViewMode === 'goods-type' ? 'All vs COD performance' : 'Goods status totals'}
              </h2>
              <p className="text-sm text-slate-300">
                {resolvedMember
                  ? `Tracking ${resolvedMember.name} (${resolvedMember.phone})`
                  : `Aggregated across ${availableMembers.length} VIP member(s)`}
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <span className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-500">View by</span>
              <div className="rounded-full border border-white/10 bg-slate-900/60 p-1">
                {(
                  [
                    { key: 'goods-type', label: 'Goods type' },
                    { key: 'goods-status', label: 'Goods status' },
                  ] as const
                ).map((mode) => (
                  <button
                    key={mode.key}
                    className={`rounded-full px-4 py-1 text-xs uppercase tracking-[0.2em] ${
                      shipmentViewMode === mode.key ? 'bg-amber-400/20 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                    onClick={() => setShipmentViewMode(mode.key)}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="h-80 w-full">
              {chartData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">No shipments match your filters.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  {shipmentViewMode === 'goods-type' ? (
                    <BarChart data={goodsTypeChartData} margin={{ top: 40, left: 16, right: 16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#475569" opacity={0.2} />
                      <XAxis dataKey="label" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" allowDecimals={false} />
                      <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        contentStyle={TOOLTIP_STYLES.content}
                        labelStyle={TOOLTIP_STYLES.label}
                        itemStyle={TOOLTIP_STYLES.item}
                      />
                      <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={56}>
                        {goodsTypeChartData.map((entry) => (
                          <Cell key={entry.key} fill={entry.color} />
                        ))}
                        <LabelList dataKey="value" position="top" fill="#f1f5f9" fontSize={12} offset={10} />
                      </Bar>
                    </BarChart>
                  ) : (
                    <BarChart data={statusComparisonData} margin={{ top: 40, left: 16, right: 16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#475569" opacity={0.2} />
                      <XAxis dataKey="metric" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" allowDecimals={false} />
                      <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        contentStyle={TOOLTIP_STYLES.content}
                        labelStyle={TOOLTIP_STYLES.label}
                        itemStyle={TOOLTIP_STYLES.item}
                        formatter={(value: number, name) => [`${value.toLocaleString()} goods`, name ?? 'Goods']}
                      />
                      <Bar dataKey="allGoods" radius={[12, 12, 0, 0]} barSize={56} fill={GOODS_TYPE_COLORS.ALL} name="ALL goods">
                        <LabelList dataKey="allGoods" position="top" fill="#f1f5f9" fontSize={12} offset={10} />
                      </Bar>
                      <Bar dataKey="codGoods" radius={[12, 12, 0, 0]} barSize={56} fill={GOODS_TYPE_COLORS.COD} name="COD goods">
                        <LabelList dataKey="codGoods" position="top" fill="#e0f2fe" fontSize={12} offset={10} />
                      </Bar>
                    </BarChart>
                  )}
                </ResponsiveContainer>
              )}
            </div>
            <div className="flex h-80 w-full flex-col">
              <div className="flex items-center justify-between text-sm text-slate-300">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-amber-300/70">Donut view</p>
                  <h3 className="text-lg font-semibold text-white">
                    {shipmentViewMode === 'goods-type' ? 'ALL vs COD share' : 'Status mix'}
                  </h3>
                </div>
              </div>
              <div className="mt-4 flex-1">
                {comparativeData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">No summary available.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip
                        contentStyle={TOOLTIP_STYLES.content}
                        labelStyle={TOOLTIP_STYLES.label}
                        itemStyle={TOOLTIP_STYLES.item}
                        formatter={(value: number, name: string) => [`${value.toLocaleString()} goods`, name]}
                      />
                      <Pie data={comparativeData} dataKey="value" nameKey="label" innerRadius={70} outerRadius={110} paddingAngle={4}>
                        {comparativeData.map((entry) => (
                          <Cell key={entry.key} fill={entry.color} />
                        ))}
                        <Label
                          position="center"
                          content={({ viewBox }) => {
                            if (!viewBox || !('cx' in viewBox) || !('cy' in viewBox)) {
                              return null
                            }
                            const total = comparativeData.reduce((sum, item) => sum + item.value, 0)
                            return (
                              <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" fill="#fefce8">
                                <tspan x={viewBox.cx} dy="-0.4em" className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
                                  Total
                                </tspan>
                                <tspan x={viewBox.cx} dy="1.4em" className="text-2xl font-bold text-white">
                                  {total.toLocaleString()}
                                </tspan>
                                <tspan x={viewBox.cx} dy="1.2em" className="text-xs text-slate-400">
                                  goods
                                </tspan>
                              </text>
                            )
                          }}
                        />
                      </Pie>
                      <Legend
                        verticalAlign="bottom"
                        align="center"
                        iconType="circle"
                        formatter={(value) => <span className="text-xs uppercase tracking-[0.25em] text-slate-200">{value}</span>}
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
              <p className="text-xs uppercase tracking-[0.3em] text-amber-300/70">Totals overview</p>
              <h2 className="text-xl font-semibold text-white">ALL goods volume by segment</h2>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <span className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-500">View by</span>
              <div className="rounded-full border border-white/10 bg-slate-900/60 p-1">
                {(['area', 'branch', 'member'] as const).map((view) => (
                  <button
                    key={view}
                    className={`rounded-full px-4 py-1 text-xs uppercase tracking-[0.2em] ${
                      totalsView === view ? 'bg-amber-400/20 text-white' : 'text-slate-400 hover:text-white'
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
              <div className="flex h-full items-center justify-center text-sm text-slate-400">No total goods data to display.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={totalsChartData} margin={{ top: 20, left: 16, right: 16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" opacity={0.2} />
                  <XAxis dataKey="label" stroke="#94a3b8" angle={-10} height={60} tickMargin={12} />
                  <YAxis stroke="#94a3b8" allowDecimals={false} />
                  <Legend
                    wrapperStyle={{ color: '#cbd5f5' }}
                    formatter={(value) => <span className="text-xs uppercase tracking-[0.25em] text-slate-200">{value}</span>}
                  />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} content={<TotalsTooltip />} />
                  <Bar dataKey="shipping" stackId="totals" barSize={56} fill={STATUS_META.shipping.color} name={STATUS_META.shipping.label} radius={[0, 0, 0, 0]}>
                    <LabelList dataKey="shipping" content={(props) => <SegmentPercentLabel {...props} segment="shipping" />} />
                  </Bar>
                  <Bar dataKey="arrived" stackId="totals" barSize={56} fill={STATUS_META.arrived.color} name={STATUS_META.arrived.label} radius={[0, 0, 0, 0]}>
                    <LabelList dataKey="arrived" content={(props) => <SegmentPercentLabel {...props} segment="arrived" />} />
                  </Bar>
                  <Bar dataKey="completed" stackId="totals" barSize={56} fill={STATUS_META.completed.color} name={STATUS_META.completed.label} radius={[12, 12, 0, 0]}>
                    <LabelList dataKey="total" content={(props) => <TotalsTopLabel {...props} />} />
                    <LabelList dataKey="completed" content={(props) => <SegmentPercentLabel {...props} segment="completed" />} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-amber-300/70">Shipment log</p>
              <h2 className="text-xl font-semibold text-white">VIP member manifest</h2>
            </div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200">{shipmentRows.length} rows</span>
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
                      <td className="py-3 pr-6 whitespace-nowrap">{row.member}</td>
                      <td className="py-3 pr-6 whitespace-nowrap text-slate-300">{row.phone}</td>
                      <td className="py-3 pr-6 whitespace-nowrap">{row.date}</td>
                      <td className="py-3 pr-1 whitespace-nowrap">
                        <div className="rounded-l-2xl border border-white/10 bg-white/5 px-4 py-2 text-white">{row.all.shipping}</div>
                      </td>
                      <td className="py-3 px-1 whitespace-nowrap">
                        <div className="border-y border-white/10 bg-white/5 px-4 py-2 text-amber-200">{row.all.arrived}</div>
                      </td>
                      <td className="py-3 pl-1 pr-1 whitespace-nowrap">
                        <div className="rounded-r-2xl border border-white/10 bg-white/5 px-4 py-2 text-emerald-200">{row.all.completed}</div>
                      </td>


                      <td className="py-3 pr-1 pl-1 whitespace-nowrap">
                        <div className="rounded-l-2xl border border-sky-300/30 bg-sky-500/10 px-4 py-2 text-white">{row.cod.shipping}</div>
                      </td>
                      <td className="py-3 px-1 whitespace-nowrap">
                        <div className="border-y border-sky-300/30 bg-sky-500/10 px-4 py-2 text-amber-200">{row.cod.arrived}</div>
                      </td>
                      <td className="py-3 pl-1 whitespace-nowrap">
                        <div className="rounded-r-2xl border border-sky-300/30 bg-sky-500/10 px-4 py-2 text-emerald-200">{row.cod.completed}</div>
                      </td>
                      <td className="py-3 pl-1 whitespace-nowrap">
                        <div className="rounded-2xl border border-amber-300/30 bg-amber-500/10 px-4 py-2 text-white">{row.totalGoods}</div>
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
  )
}
