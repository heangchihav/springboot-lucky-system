'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Activity, RefreshCw, TrendingUp } from 'lucide-react'
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
} from 'recharts'
import type { PieLabelRenderProps } from 'recharts'
import { API_BASE_URL } from '@/config/env'

const STATUS_COLORS = [
  '#08BDBA', // teal
  '#FF6B6B', // coral
  '#FFD166', // amber
  '#06D6A0', // green
  '#4C6EF5', // blue
  '#9B5DE5', // purple
  '#F2C94C', // gold
  '#EF476F', // magenta
  '#8338EC', // violet
]

const DEFAULT_STATUS_LABELS: Record<string, string> = {
  'not-called-yet': 'មិនទាន់តេ',
  called: 'តេរួច',
  'no-answer': 'តេមិនលើក',
  'call-not-connected': 'តេមិនចូល',
  'delivered-to-customer': 'ដឹកដល់ផ្អះ',
}

type ChartGranularity = 'daily' | 'weekly' | 'monthly'

const GRANULARITY_ORDER: ChartGranularity[] = ['daily', 'weekly', 'monthly']
const GRANULARITY_LABELS: Record<ChartGranularity, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
}

const toUTCDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1))
}

const getISOWeekInfo = (date: Date) => {
  const temp = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const dayNumber = temp.getUTCDay() || 7
  temp.setUTCDate(temp.getUTCDate() + 4 - dayNumber)
  const yearStart = new Date(Date.UTC(temp.getUTCFullYear(), 0, 1))
  const weekNumber = Math.ceil(((temp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return {
    year: temp.getUTCFullYear(),
    week: weekNumber,
  }
}

type BranchResponse = {
  id: number
  name: string
  code?: string
  active: boolean
}

type CallStatusResponse = {
  key: string
  label: string
}

type CallReportSummaryResponse = {
  reportDate: string
  branchId: number | null
  branchName: string
  statusTotals: Record<string, number>
}

const formatDateInput = (date: Date) => date.toISOString().slice(0, 10)
const LOOKBACK_DAYS = 6
const defaultStartDate = () =>
  formatDateInput(new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000))
const defaultEndDate = () => formatDateInput(new Date())

const getStoredUserId = (): number | null => {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = window.localStorage.getItem('user')
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw)
    return parsed?.id ?? null
  } catch {
    return null
  }
}

const fetchAndCacheUserId = async (): Promise<number | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      credentials: 'include',
    })

    if (!response.ok) {
      return null
    }

    const user = await response.json()
    if (user?.id && typeof window !== 'undefined') {
      window.localStorage.setItem('user', JSON.stringify(user))
    }
    return user?.id ?? null
  } catch {
    return null
  }
}

const buildAuthHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  const userId = getStoredUserId()
  if (userId) {
    headers['X-User-Id'] = String(userId)
  }
  return headers
}

function CallDashboard() {
  const [summaryData, setSummaryData] = useState<CallReportSummaryResponse[]>([])
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const [branches, setBranches] = useState<BranchResponse[]>([])
  const [branchesLoading, setBranchesLoading] = useState(false)

  const [statusOptions, setStatusOptions] = useState<CallStatusResponse[]>([])
  const [statusesLoading, setStatusesLoading] = useState(false)

  const [selectedBranchId, setSelectedBranchId] = useState<string>('all')
  const [selectedStatusKeys, setSelectedStatusKeys] = useState<string[]>([])
  const [statusDragging, setStatusDragging] = useState(false)
  const [startDate, setStartDate] = useState<string>(() => defaultStartDate())
  const [endDate, setEndDate] = useState<string>(() => defaultEndDate())
  const [chartGranularity, setChartGranularity] = useState<ChartGranularity>('daily')

  const statusLabelMap = useMemo(() => {
    const map: Record<string, string> = { ...DEFAULT_STATUS_LABELS }
    statusOptions.forEach(({ key, label }) => {
      map[key] = label
    })
    return map
  }, [statusOptions])

  const loadStatuses = useCallback(async () => {
    setStatusesLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/calls/statuses`, {
        headers: buildAuthHeaders(),
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error('Unable to load statuses')
      }
      const serverStatuses: CallStatusResponse[] = await response.json()
      setStatusOptions(serverStatuses)
    } catch (error) {
      console.error('Failed to fetch statuses', error)
      setStatusOptions([])
    } finally {
      setStatusesLoading(false)
    }
  }, [])

  const loadFallbackBranches = useCallback(async () => {
    const response = await fetch(`${API_BASE_URL}/api/calls/branches/active`, {
      headers: buildAuthHeaders(),
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('Failed to load fallback branches')
    }

    const allBranches: BranchResponse[] = await response.json()
    const activeBranches = allBranches.filter((branch) => branch.active)
    setBranches(activeBranches)
  }, [])

  const loadBranches = useCallback(async () => {
    setBranchesLoading(true)
    try {
      const cachedUserId = getStoredUserId() ?? (await fetchAndCacheUserId())
      if (!cachedUserId) {
        await loadFallbackBranches()
        return
      }

      const response = await fetch(
        `${API_BASE_URL}/api/calls/user-branches/user/${cachedUserId}`,
        {
          headers: buildAuthHeaders(),
          credentials: 'include',
        },
      )

      if (!response.ok) {
        throw new Error('Failed to load user branches')
      }

      const assignments: {
        branchId: number
        branchName: string
        active: boolean
      }[] = await response.json()

      const activeAssignments = assignments.filter((assignment) => assignment.active)
      if (activeAssignments.length > 0) {
        const mappedBranches = activeAssignments.map<BranchResponse>((assignment) => ({
          id: assignment.branchId,
          name: assignment.branchName,
          active: assignment.active,
        }))
        setBranches(mappedBranches)
      } else {
        await loadFallbackBranches()
      }
    } catch (error) {
      console.error('Failed to fetch branches', error)
      try {
        await loadFallbackBranches()
      } catch (fallbackError) {
        console.error('Failed to fetch fallback branches', fallbackError)
        setBranches([])
      }
    } finally {
      setBranchesLoading(false)
    }
  }, [loadFallbackBranches])

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true)
    setSummaryError(null)

    try {
      const params = new URLSearchParams()
      if (startDate) {
        params.append('startDate', startDate)
      }
      if (endDate) {
        params.append('endDate', endDate)
      }
      if (selectedBranchId !== 'all') {
        params.append('branchIds', selectedBranchId)
      }
      selectedStatusKeys.forEach((key) => params.append('statusKeys', key))

      const query = params.toString()
      const response = await fetch(
        `${API_BASE_URL}/api/calls/reports/summary${query ? `?${query}` : ''}`,
        {
          headers: buildAuthHeaders(),
          credentials: 'include',
        },
      )

      if (!response.ok) {
        throw new Error('Failed to load summary data')
      }

      const summaries: CallReportSummaryResponse[] = await response.json()
      setSummaryData(summaries)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to fetch call report summary', error)
      setSummaryError('Unable to load dashboard data. Please try again.')
    } finally {
      setSummaryLoading(false)
    }
  }, [endDate, selectedBranchId, selectedStatusKeys, startDate])

  useEffect(() => {
    loadStatuses()
    loadBranches()
  }, [loadBranches, loadStatuses])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  const statusColorMap = useMemo(() => {
    const mapping: Record<string, string> = {}
    statusOptions.forEach((status, index) => {
      mapping[status.key] = STATUS_COLORS[index % STATUS_COLORS.length]
    })
    return mapping
  }, [statusOptions])

  const getStatusLabel = useCallback(
    (key: string) => statusLabelMap[key] ?? key,
    [statusLabelMap],
  )

  const statusKeysInData = useMemo(() => {
    const keys = new Set<string>()
    summaryData.forEach((summary) => {
      Object.keys(summary.statusTotals).forEach((statusKey) => keys.add(statusKey))
    })
    return Array.from(keys)
  }, [summaryData])

  const chartStatusKeys = useMemo(() => {
    if (selectedStatusKeys.length > 0) {
      return selectedStatusKeys
    }
    if (statusKeysInData.length > 0) {
      return statusKeysInData
    }
    return statusOptions.map((status) => status.key)
  }, [selectedStatusKeys, statusKeysInData, statusOptions])

  const statusScrollRef = useRef<HTMLDivElement | null>(null)
  const statusDragState = useRef({
    isDragging: false,
    startX: 0,
    scrollLeft: 0,
  })

  const handleStatusWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
      return
    }
    event.preventDefault()
    event.currentTarget.scrollLeft += event.deltaY
  }, [])

  const handleStatusMouseDown = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!statusScrollRef.current) {
      return
    }
    statusDragState.current.isDragging = true
    statusDragState.current.startX = event.pageX - statusScrollRef.current.offsetLeft
    statusDragState.current.scrollLeft = statusScrollRef.current.scrollLeft
    setStatusDragging(true)
  }, [])

  const endStatusDrag = useCallback(() => {
    statusDragState.current.isDragging = false
    setStatusDragging(false)
  }, [])

  const handleStatusMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!statusDragState.current.isDragging || !statusScrollRef.current) {
      return
    }
    event.preventDefault()
    const x = event.pageX - statusScrollRef.current.offsetLeft
    const walk = x - statusDragState.current.startX
    statusScrollRef.current.scrollLeft = statusDragState.current.scrollLeft - walk
  }, [])

  const totalsByStatus = useMemo(() => {
    const totals: Record<string, number> = {}
    summaryData.forEach((summary) => {
      Object.entries(summary.statusTotals).forEach(([statusKey, value]) => {
        totals[statusKey] = (totals[statusKey] ?? 0) + value
      })
    })
    return totals
  }, [summaryData])

  const grandTotal = useMemo(() => {
    return Object.values(totalsByStatus).reduce((sum, value) => sum + value, 0)
  }, [totalsByStatus])

  const distinctBranchCount = useMemo(() => {
    const identifiers = new Set(
      summaryData.map((summary) => summary.branchId ?? summary.branchName),
    )
    return identifiers.size
  }, [summaryData])

  const topStatus = useMemo(() => {
    let maxKey = ''
    let maxValue = 0
    Object.entries(totalsByStatus).forEach(([statusKey, value]) => {
      if (value > maxValue) {
        maxValue = value
        maxKey = statusKey
      }
    })
    return maxKey ? `${getStatusLabel(maxKey)} • ${maxValue.toLocaleString()}` : '—'
  }, [getStatusLabel, totalsByStatus])

  const dateSeries = useMemo(() => {
    const map = new Map<string, Record<string, string | number>>()
    summaryData.forEach((summary) => {
      const entry = map.get(summary.reportDate) ?? { date: summary.reportDate }
      Object.entries(summary.statusTotals).forEach(([statusKey, value]) => {
        const current = typeof entry[statusKey] === 'number' ? (entry[statusKey] as number) : 0
        entry[statusKey] = current + value
      })
      map.set(summary.reportDate, entry)
    })
    return Array.from(map.values()).sort((a, b) =>
      String(a.date).localeCompare(String(b.date)),
    )
  }, [summaryData])

  const chartSeries = useMemo(() => {
    if (dateSeries.length === 0) {
      return []
    }

    if (chartGranularity === 'daily') {
      return dateSeries.map((entry) => ({
        ...entry,
        label: String(entry.date),
      }))
    }

    const grouped = new Map<string, Record<string, string | number>>()

    dateSeries.forEach((entry) => {
      const baseDate = toUTCDate(String(entry.date))
      let groupKey = ''
      let displayLabel = ''

      if (chartGranularity === 'weekly') {
        const { year, week } = getISOWeekInfo(baseDate)
        const paddedWeek = String(week).padStart(2, '0')
        groupKey = `${year}-W${paddedWeek}`
        displayLabel = `Week ${paddedWeek} · ${year}`
      } else {
        const monthIndex = baseDate.getUTCMonth()
        const paddedMonth = String(monthIndex + 1).padStart(2, '0')
        groupKey = `${baseDate.getUTCFullYear()}-${paddedMonth}`
        displayLabel = `${baseDate.toLocaleString('en-US', { month: 'short' })} ${baseDate.getUTCFullYear()}`
      }

      const existing =
        grouped.get(groupKey) ??
        {
          label: displayLabel,
          sortKey: groupKey,
        }

      Object.entries(entry).forEach(([key, value]) => {
        if (key === 'date' || key === 'label' || key === 'sortKey') {
          return
        }
        const numericValue = typeof value === 'number' ? value : Number(value)
        const safeValue = Number.isFinite(numericValue) ? numericValue : 0
        existing[key] =
          (typeof existing[key] === 'number' ? (existing[key] as number) : 0) + safeValue
      })

      grouped.set(groupKey, existing)
    })

    return Array.from(grouped.values()).sort((a, b) =>
      String(a.sortKey).localeCompare(String(b.sortKey)),
    )
  }, [chartGranularity, dateSeries])

  const branchSeries = useMemo(() => {
    const map = new Map<string, { branch: string; total: number }>()
    summaryData.forEach((summary) => {
      const branchName = summary.branchName || 'Unassigned'
      const total = Object.values(summary.statusTotals).reduce((sum, value) => sum + value, 0)
      const entry = map.get(branchName) ?? { branch: branchName, total: 0 }
      entry.total += total
      map.set(branchName, entry)
    })
    return Array.from(map.values()).sort((a, b) => b.total - a.total)
  }, [summaryData])

  const branchStatusSeries = useMemo(() => {
    const map = new Map<string, Record<string, string | number>>()
    summaryData.forEach((summary) => {
      const branchName = summary.branchName || 'Unassigned'
      const entry =
        map.get(branchName) ??
        {
          branch: branchName,
          total: 0,
        }

      Object.entries(summary.statusTotals).forEach(([statusKey, value]) => {
        const current =
          typeof entry[statusKey] === 'number' ? (entry[statusKey] as number) : 0
        entry[statusKey] = current + value
        entry.total =
          (typeof entry.total === 'number' ? (entry.total as number) : 0) + value
      })

      map.set(branchName, entry)
    })

    return Array.from(map.values()).sort(
      (a, b) =>
        (typeof b.total === 'number' ? (b.total as number) : 0) -
        (typeof a.total === 'number' ? (a.total as number) : 0),
    )
  }, [summaryData])

  const statusDistribution = useMemo(
    () =>
      Object.entries(totalsByStatus).map(([statusKey, value]) => ({
        statusKey,
        label: getStatusLabel(statusKey),
        value,
      })),
    [getStatusLabel, totalsByStatus],
  )

  const renderStatusPieLabel = useCallback(
  (props: PieLabelRenderProps & { payload?: { statusKey?: string; name?: string } }) => {
    const { cx, cy, index, midAngle, outerRadius, percent, payload } = props
    if (
      typeof cx !== 'number' ||
      typeof cy !== 'number' ||
      typeof midAngle !== 'number' ||
      typeof outerRadius !== 'number' ||
      typeof percent !== 'number' ||
      !payload
    ) {
      return null
    }

    const statusKey =
      (payload.statusKey ?? payload.name ?? '') as string

    const RADIAN = Math.PI / 180
    const baseOffset = percent < 0.07 ? 26 : 20
    const elbowRadius = outerRadius + baseOffset
    const horizontalArm = percent < 0.07 ? 70 : 55
    const sx = cx + (outerRadius + 4) * Math.cos(-midAngle * RADIAN)
    const sy = cy + (outerRadius + 4) * Math.sin(-midAngle * RADIAN)
    const mx = cx + elbowRadius * Math.cos(-midAngle * RADIAN)
    const my = cy + elbowRadius * Math.sin(-midAngle * RADIAN)
    const textAnchor = mx > cx ? 'start' : 'end'
    const ex = mx + (textAnchor === 'start' ? horizontalArm : -horizontalArm)
    const ey = my
    const textX = ex + (textAnchor === 'start' ? 8 : -8)
    const lineColor = 'rgba(148,163,184,0.6)'
    const percentLabel = `${(percent * 100).toFixed(1)}%`
    const primaryLabel = getStatusLabel(statusKey)
    const compactLayout = percent < 0.1

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
          <tspan x={textX} dy="1.2em" fill="#cbd5f5" fontSize={compactLayout ? 10 : 11}>
            {percentLabel}
          </tspan>
        </text>
      </g>
    )
  }, [getStatusLabel, statusDistribution])

  const handleStatusToggle = useCallback((statusKey: string) => {
    setSelectedStatusKeys((prev) =>
      prev.includes(statusKey) ? prev.filter((key) => key !== statusKey) : [...prev, statusKey],
    )
  }, [])

  const resetFilters = () => {
    setSelectedBranchId('all')
    setSelectedStatusKeys([])
    setStartDate(defaultStartDate())
    setEndDate(defaultEndDate())
  }

  const formatNumber = (value?: number) => (value ?? 0).toLocaleString()

  return (
    <>
      <div className="relative min-h-screen overflow-hidden px-4 py-8">
        <div className="fixed inset-0 -z-10">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-orange-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-96 h-96 bg-blue-700 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
        <div className="relative z-10 space-y-8 max-w-6xl mx-auto">
      <header className="">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/70">Realtime Insight</p>
            <h1 className="mt-1 text-3xl font-semibold text-white">
              Call Service · Performance Dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Slice millions of call-report rows by branch, date, and outcome to reveal execution
              trends instantly.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80">
            <RefreshCw className={`h-4 w-4 ${summaryLoading ? 'animate-spin' : ''} text-cyan-300`} />
            {lastUpdated ? (
              <span>
                Updated{' '}
                {lastUpdated.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
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
            <h2 className="text-xl font-semibold text-white">Focus on the signals that matter</h2>
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
              <RefreshCw className={`h-4 w-4 ${summaryLoading ? 'animate-spin' : ''}`} />
              Refresh data
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
              max={defaultEndDate()}
              onChange={(event) => setEndDate(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition focus:border-cyan-400 focus:bg-slate-900/50"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            Branch
            <select
              value={selectedBranchId}
              onChange={(event) => setSelectedBranchId(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition focus:border-cyan-400 focus:bg-slate-900/50"
              disabled={branchesLoading}
            >
              <option value="all">All branches</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {/* Status Cards Section */}
      <section className="glass-card animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        <div className="flex items-center gap-2 mb-5">
          <div className="w-1 h-6 bg-linear-to-b from-orange-500 to-orange-600 rounded-full"></div>
          <h2 className="text-2xl font-bold bg-linear-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            Status Statistics
          </h2>
        </div>
        
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs text-slate-400">Total calls across all statuses</p>
          <div className="text-2xl font-bold bg-linear-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            {grandTotal.toLocaleString()}
          </div>
        </div>

        <div
          ref={statusScrollRef}
          className={`flex flex-nowrap gap-3 overflow-x-auto pb-2 -mx-2 px-2 ${
            statusDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{ touchAction: 'pan-x', WebkitOverflowScrolling: 'touch' }}
          onWheel={handleStatusWheel}
          onMouseDown={handleStatusMouseDown}
          onMouseMove={handleStatusMouseMove}
          onMouseLeave={endStatusDrag}
          onMouseUp={endStatusDrag}
        >
          {Object.entries(totalsByStatus).map(([statusKey, count], index) => {
            const color = statusColorMap[statusKey] ?? STATUS_COLORS[index % STATUS_COLORS.length]
            const statusLabel = statusLabelMap[statusKey] ?? statusKey
            
            return (
              <div
                key={statusKey}
                className="entry-card group relative flex w-56 shrink-0 flex-col overflow-hidden"
                style={{ 
                  animationDelay: `${index * 50}ms`,
                  borderLeft: `3px solid ${color}`
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <h3 className="text-lg font-semibold text-white">
                      {statusLabel}
                    </h3>
                  </div>
                </div>
                
                <div className="text-3xl font-bold text-white mb-1">
                  {count.toLocaleString()}
                </div>
                
                <div className="text-xs text-slate-400">
                  Total calls
                </div>
                
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-linear-to-r from-orange-500/0 via-orange-500/0 to-orange-600/0 group-hover:from-orange-500/5 group-hover:via-orange-500/5 group-hover:to-orange-600/5 transition-all duration-500"></div>
              </div>
            )
          })}
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
              <p className="text-sm font-semibold text-slate-300">Status trend</p>
              <p className="text-xs text-slate-400">
                {GRANULARITY_LABELS[chartGranularity]} volumes per call status
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {GRANULARITY_ORDER.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setChartGranularity(option)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    chartGranularity === option
                      ? 'border-white/0 bg-white text-slate-900 shadow'
                      : 'border-white/10 bg-white/5 text-white/70 hover:border-white/40'
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
                <AreaChart data={chartSeries}>
                  <defs>
                    {chartStatusKeys.map((statusKey, index) => {
                      const color = statusColorMap[statusKey] ?? STATUS_COLORS[index % STATUS_COLORS.length]
                      return (
                        <linearGradient
                          key={statusKey}
                          id={`gradient-${statusKey}`}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop offset="10%" stopColor={color} stopOpacity={0.7} />
                          <stop offset="95%" stopColor={color} stopOpacity={0.05} />
                        </linearGradient>
                      )
                    })}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="label" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: 'rgba(255,255,255,0.15)',
                    }}
                    labelStyle={{ color: '#e2e8f0' }}
                    formatter={(value, name) => [
                      formatNumber(value as number),
                      getStatusLabel(name as string),
                    ]}
                    labelFormatter={(label) => String(label)}
                  />
                  <Legend
                    wrapperStyle={{ color: '#cbd5f5' }}
                    formatter={(value) => getStatusLabel(value as string)}
                  />
                  {chartStatusKeys.map((statusKey, index) => {
                    const color = statusColorMap[statusKey] ?? STATUS_COLORS[index % STATUS_COLORS.length]
                    return (
                      <Area
                        key={statusKey}
                        type="monotone"
                        dataKey={statusKey}
                        stackId="1"
                        stroke={color}
                        fill={`url(#gradient-${statusKey})`}
                        strokeWidth={2}
                        activeDot={{ r: 4 }}
                      />
                    )
                  })}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-slate-950/70 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-300">Status mix</p>
              <p className="text-xs text-slate-400">
                3D pie · total calls across every branch and status
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Total</p>
              <p className="text-3xl font-semibold text-white">{grandTotal.toLocaleString()}</p>
            </div>
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
            <div className="h-90">
              {statusDistribution.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">
                  No status distribution to chart.
                </div>
              ) : (
                <div className="relative h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 32, right: 110, bottom: 32, left: 110 }}>
                      <defs>
                        <filter id="pieShadow" x="-20%" y="-20%" width="140%" height="140%">
                          <feDropShadow dx="0" dy="12" stdDeviation="8" floodOpacity="0.35" />
                        </filter>
                        {statusDistribution.map((entry, index) => {
                          const color =
                            statusColorMap[entry.statusKey] ??
                            STATUS_COLORS[index % STATUS_COLORS.length]
                          return (
                            <radialGradient
                              key={`radial-${entry.statusKey}`}
                              id={`radial-${entry.statusKey}`}
                              cx="50%"
                              cy="50%"
                              r="70%"
                            >
                              <stop offset="10%" stopColor="#ffffff" stopOpacity="0.25" />
                              <stop offset="60%" stopColor={color} stopOpacity="0.95" />
                              <stop offset="95%" stopColor={color} stopOpacity="1" />
                            </radialGradient>
                          )
                        })}
                      </defs>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: 'rgba(255,255,255,0.15)',
                        }}
                        labelStyle={{ color: '#e2e8f0' }}
                        itemStyle={{ color: '#f8fafc' }}
                        formatter={(value: number, name) => [
                          `${formatNumber(value)} calls`,
                          getStatusLabel(name as string),
                        ]}
                      />
                      <Pie
                        data={statusDistribution}
                        dataKey="value"
                        nameKey="label"
                        innerRadius={75}
                        outerRadius={120}
                        startAngle={90}
                        endAngle={-270}
                        paddingAngle={2}
                        cornerRadius={8}
                        stroke="rgba(15,23,42,0.6)"
                        strokeWidth={2}
                        labelLine={false}
                        label={renderStatusPieLabel}
                        filter="url(#pieShadow)"
                      >
                        {statusDistribution.map((entry) => (
                          <Cell key={entry.statusKey} fill={`url(#radial-${entry.statusKey})`} />
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
                      <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Total</p>
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
                  STATUS_COLORS[index % STATUS_COLORS.length]
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
                            : '0.0') + '%'}
                        </p>
                      </div>
                    </div>
                    <span className="text-base font-semibold text-white">
                      {formatNumber(entry.value)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-slate-950/70 p-5 space-y-8">
          <div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-300">Branch composition</p>
                <p className="text-xs text-slate-400">Stacked totals per branch with status breakdown</p>
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
                    margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis
                      dataKey="branch"
                      stroke="#94a3b8"
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: 'rgba(255,255,255,0.15)',
                      }}
                      labelStyle={{ color: '#e2e8f0' }}
                      formatter={(value: number, name) => [
                        formatNumber(value),
                        getStatusLabel(name as string),
                      ]}
                    />
                    <Legend
                      wrapperStyle={{ color: '#cbd5f5' }}
                      formatter={(value) => getStatusLabel(value as string)}
                    />
                    {chartStatusKeys.map((statusKey, index) => {
                      const color = statusColorMap[statusKey] ?? STATUS_COLORS[index % STATUS_COLORS.length]
                      return (
                        <Bar
                          key={`branch-bar-${statusKey}`}
                          dataKey={statusKey}
                          stackId="branches"
                          fill={color}
                          barSize={50}
                        />
                      )
                    })}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-300">Branch leaders</p>
              <p className="text-xs text-slate-400">
                Swipe through branches to compare total call volume
              </p>
            </div>
            <span className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
              {branchSeries.length} branches
            </span>
          </div>
          <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
            {branchSeries.length === 0 ? (
              <div className="flex h-32 w-full items-center justify-center text-sm text-slate-400">
                No branch aggregates yet.
              </div>
            ) : (
              branchSeries.map((branch, index) => (
                <div
                  key={branch.branch}
                  className="entry-card relative flex w-64 shrink-0 flex-col gap-3 overflow-hidden"
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
                    <span>BRANCH</span>
                    <span className="text-[10px] text-slate-500">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-white">{branch.branch}</p>
                    <p className="text-xs text-slate-400">Total calls</p>
                  </div>
                  <div className="text-3xl font-bold text-white">
                    {formatNumber(branch.total)}
                  </div>
                  <div className="h-1 rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-cyan-400"
                      style={{
                        width: branchSeries[0]?.total
                          ? `${Math.max((branch.total / branchSeries[0].total) * 100, 2)}%`
                          : '0%',
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

        {summaryLoading && (
        <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-6 text-center text-sm text-slate-300">
          Processing millions of rows… preparing visualization.
        </div>
      )}
        </div>
      </div>

    <style jsx global>{`
      @keyframes fade-in-up {
        from {
          opacity: 0;
          transform: translateY(12px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes aurora {
        0% {
          transform: translate3d(-20%, -20%, 0) scale(1);
        }
        50% {
          transform: translate3d(-10%, -25%, 0) scale(1.05);
        }
        100% {
          transform: translate3d(-20%, -20%, 0) scale(1);
        }
      }

      .glass-card {
        background: rgba(15, 23, 42, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 28px;
        padding: 2.25rem;
        backdrop-filter: blur(30px);
        box-shadow:
          0 30px 60px rgba(2, 6, 23, 0.65),
          inset 0 1px 0 rgba(255, 255, 255, 0.08);
        position: relative;
        overflow: visible;
      }

      .glass-card::after {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at top left, rgba(59, 130, 246, 0.16), transparent 40%);
        opacity: 0;
        transition: opacity 0.4s ease;
        pointer-events: none;
      }

      .glass-card:hover::after {
        opacity: 1;
      }

      .entry-card {
        background: rgba(15, 23, 42, 0.65);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 20px;
        padding: 1.25rem;
        backdrop-filter: blur(18px);
        transition: all 0.35s ease;
        animation: fade-in-up 0.45s ease-out backwards;
        position: relative;
      }

      .dashboard-blob-3 {
        bottom: -15%;
        left: 15%;
        width: 460px;
        height: 460px;
        background: rgba(124, 58, 237, 0.35);
        animation-delay: 4s;
      }

      .entry-card::after {
        content: '';
        position: absolute;
        inset: 1px;
        border-radius: 18px;
        border: 1px solid rgba(255, 255, 255, 0.03);
        pointer-events: none;
      }

      .entry-card:hover {
        border-color: rgba(59, 130, 246, 0.4);
        box-shadow:
          0 20px 35px rgba(2, 6, 23, 0.55),
          inset 0 1px 0 rgba(255, 255, 255, 0.08);
        transform: translateY(-4px) scale(1.01);
      }

      .dashboard-blobs {
        position: absolute;
        inset: 0;
        overflow: hidden;
        opacity: 0.7;
        pointer-events: none;
      }

      .dashboard-blob {
        position: absolute;
        border-radius: 999px;
        filter: blur(120px);
        mix-blend-mode: screen;
        animation: aurora 18s ease-in-out infinite alternate;
      }

      .dashboard-blob-1 {
        top: -10%;
        left: -5%;
        width: 380px;
        height: 380px;
        background: rgba(14, 165, 233, 0.35);
        animation-delay: 0s;
      }

      .dashboard-blob-2 {
        top: 5%;
        right: -10%;
        width: 420px;
        height: 420px;
        background: rgba(240, 132, 40, 0.35);
        animation-delay: 2s;
      }

      .dashboard-blob-3 {
        bottom: -15%;
        left: 15%;
        width: 460px;
        height: 460px;
        background: rgba(124, 58, 237, 0.35);
        animation-delay: 4s;
      }
    `}</style>
    </>
  )
}

export default CallDashboard