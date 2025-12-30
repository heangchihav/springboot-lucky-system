'use client'

import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { MarketingServiceGuard } from '../_components/MarketingServiceGuard'

type VipMember = {
  id: number
  name: string
  phone: string
  createdAt: string
  deletedAt?: string | null
  createRemark?: string
  deleteRemark?: string
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

type ChartSegment = {
  key: string
  label: string
  members: number
  highlight?: boolean
}

type EnrichedMember = {
  member: VipMember
  areaId: number
  areaName: string
  subAreaId?: number
  subAreaName?: string
  branchId: number
  branchName: string
}

const VIP_MEMBER_DATA: Area[] = [
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
                createdAt: '2025-01-05',
                createRemark: 'Joined via referral program',
              },
              {
                id: 2,
                name: 'Chan Vuthy',
                phone: '098765432',
                createdAt: '2025-01-08',
                deletedAt: '2025-01-20',
                createRemark: 'Signed up from Facebook ad',
                deleteRemark: 'Stopped using service',
              },
            ],
          },
          {
            id: 102,
            name: 'Branch A2',
            members: [
              {
                id: 5,
                name: 'Sokha',
                phone: '099112233',
                createdAt: '2025-01-15',
                createRemark: 'VIP upsell campaign',
              },
            ],
          },
        ],
      },
      {
        id: 12,
        name: 'Sub Area B',
        branches: [
          {
            id: 103,
            name: 'Branch B1',
            members: [
              {
                id: 6,
                name: 'Dalin',
                phone: '015666777',
                createdAt: '2025-01-11',
              },
              {
                id: 7,
                name: 'Rith',
                phone: '017777666',
                createdAt: '2025-01-13',
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
            id: 3,
            name: 'Srey Neang',
            phone: '010203040',
            createdAt: '2025-01-10',
            createRemark: 'Invited by branch manager',
          },
          {
            id: 4,
            name: 'Kimheng',
            phone: '096887766',
            createdAt: '2025-01-12',
            deletedAt: '2025-01-18',
            createRemark: 'Walk-in registration',
            deleteRemark: 'Did not meet VIP requirements',
          },
        ],
      },
      {
        id: 202,
        name: 'Branch B2',
        members: [
          {
            id: 8,
            name: 'Sokny',
            phone: '089555444',
            createdAt: '2025-01-19',
          },
        ],
      },
    ],
  },
  {
    id: 3,
    name: 'Area 3',
    subAreas: [
      {
        id: 31,
        name: 'Sub Area C',
        branches: [
          {
            id: 301,
            name: 'Branch C1',
            members: [
              {
                id: 9,
                name: 'Piseth',
                phone: '011222333',
                createdAt: '2025-02-01',
                createRemark: 'Corporate partnership',
              },
              {
                id: 10,
                name: 'Linda',
                phone: '085111222',
                createdAt: '2025-02-03',
              },
            ],
          },
          {
            id: 302,
            name: 'Branch C2',
            members: [
              {
                id: 11,
                name: 'Malis',
                phone: '016999888',
                createdAt: '2025-02-05',
                createRemark: 'Event signup',
              },
              {
                id: 12,
                name: 'Veasna',
                phone: '097333222',
                createdAt: '2025-02-08',
                deletedAt: '2025-02-20',
                deleteRemark: 'Account merged',
              },
            ],
          },
        ],
      },
      {
        id: 32,
        name: 'Sub Area D',
        branches: [
          {
            id: 303,
            name: 'Branch D1',
            members: [
              {
                id: 13,
                name: 'Dina',
                phone: '095555123',
                createdAt: '2025-02-10',
              },
              {
                id: 14,
                name: 'Sakda',
                phone: '086222444',
                createdAt: '2025-02-14',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 4,
    name: 'Area 4',
    branches: [
      {
        id: 401,
        name: 'Branch E1',
        members: [
          {
            id: 15,
            name: 'Sothy',
            phone: '088444333',
            createdAt: '2025-03-02',
            createRemark: 'Pilot program',
          },
          {
            id: 16,
            name: 'Vichea',
            phone: '090777555',
            createdAt: '2025-03-05',
          },
          {
            id: 17,
            name: 'Leakhena',
            phone: '013555777',
            createdAt: '2025-03-07',
          },
        ],
      },
      {
        id: 402,
        name: 'Branch E2',
        members: [
          {
            id: 18,
            name: 'Sovann',
            phone: '093888111',
            createdAt: '2025-03-09',
          },
          {
            id: 19,
            name: 'Nika',
            phone: '082333111',
            createdAt: '2025-03-12',
            createRemark: 'Referred by Dina',
          },
        ],
      },
    ],
  },
]

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

const countMembersInBranch = (branch: Branch) => branch.members.length

const countMembersInSubArea = (subArea: SubArea) => subArea.branches.reduce((sum, branch) => sum + countMembersInBranch(branch), 0)

const countMembersInArea = (area: Area) => {
  const subAreaMembers = (area.subAreas ?? []).reduce((sum, subArea) => sum + countMembersInSubArea(subArea), 0)
  const branchMembers = (area.branches ?? []).reduce((sum, branch) => sum + countMembersInBranch(branch), 0)
  return subAreaMembers + branchMembers
}

const flattenAreaBranches = (area: Area): Branch[] => [
  ...(area.branches ?? []),
  ...(area.subAreas?.flatMap((sub) => sub.branches) ?? []),
]

const BAR_COLORS = {
  base: '#f97316',
  highlight: '#34d399',
}

const TREND_VIEW_OPTIONS = [
  { key: 'day', label: 'Daily' },
  { key: 'week', label: 'Weekly' },
  { key: 'month', label: 'Monthly' },
] as const

type TrendView = (typeof TREND_VIEW_OPTIONS)[number]['key']

const toISODate = (date: Date) => date.toISOString().split('T')[0]

const parseDate = (value: string) => new Date(`${value}T00:00:00`)

const buildDateRange = (start: string, end: string) => {
  const days: string[] = []
  const cursor = parseDate(start)
  const last = parseDate(end)

  while (cursor <= last) {
    days.push(toISODate(cursor))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return days
}

const flattenMembers = (areas: Area[]): EnrichedMember[] => {
  const entries: EnrichedMember[] = []
  areas.forEach((area) => {
    const areaBranches = area.branches ?? []
    areaBranches.forEach((branch) => {
      branch.members.forEach((member) =>
        entries.push({
          member,
          areaId: area.id,
          areaName: area.name,
          branchId: branch.id,
          branchName: branch.name,
        })
      )
    })

    area.subAreas?.forEach((subArea) =>
      subArea.branches.forEach((branch) =>
        branch.members.forEach((member) =>
          entries.push({
            member,
            areaId: area.id,
            areaName: area.name,
            subAreaId: subArea.id,
            subAreaName: subArea.name,
            branchId: branch.id,
            branchName: branch.name,
          })
        )
      )
    )
  })

  return entries
}

const getEarliestCreatedAt = (members: EnrichedMember[]) => {
  if (members.length === 0) {
    return new Date().toISOString().split('T')[0]
  }
  return members.reduce((earliest, item) => (item.member.createdAt < earliest ? item.member.createdAt : earliest), members[0].member.createdAt)
}

const formatMonthLabel = (date: Date) =>
  date.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })

const getWeekNumber = (date: Date) => {
  const temp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = temp.getUTCDay() || 7
  temp.setUTCDate(temp.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(temp.getUTCFullYear(), 0, 1))
  return Math.ceil(((temp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

function VIPMembersDashboardPage() {
  const [selectedAreaId, setSelectedAreaId] = useState<number | 'all'>('all')
  const [selectedSubAreaId, setSelectedSubAreaId] = useState<number | 'all'>('all')
  const [selectedBranchId, setSelectedBranchId] = useState<number | 'all'>('all')
  const allMembers = useMemo(() => flattenMembers(VIP_MEMBER_DATA), [])
  const [startDate, setStartDate] = useState(() => getEarliestCreatedAt(allMembers))
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0])
  const [trendView, setTrendView] = useState<TrendView>('day')

  const selectedArea = useMemo(
    () => (selectedAreaId === 'all' ? null : VIP_MEMBER_DATA.find((area) => area.id === selectedAreaId) ?? null),
    [selectedAreaId]
  )

  const allSubAreas = useMemo(
    () => VIP_MEMBER_DATA.flatMap((area) => area.subAreas ?? []),
    []
  )

  const allBranches = useMemo(
    () => VIP_MEMBER_DATA.flatMap((area) => flattenAreaBranches(area)),
    []
  )

  const availableSubAreas = useMemo(() => {
    if (selectedArea) {
      return selectedArea.subAreas ?? []
    }
    return allSubAreas
  }, [selectedArea, allSubAreas])

  const availableBranches = useMemo(() => {
    if (!selectedArea) {
      if (selectedSubAreaId !== 'all') {
        const subArea = allSubAreas.find((sub) => sub.id === selectedSubAreaId)
        if (subArea) {
          return subArea.branches
        }
      }
      return allBranches
    }

    if ((selectedArea.subAreas?.length ?? 0) > 0) {
      if (selectedSubAreaId === 'all') {
        return flattenAreaBranches(selectedArea)
      }
      const subArea = selectedArea.subAreas?.find((sub) => sub.id === selectedSubAreaId)
      return subArea?.branches ?? []
    }

    return selectedArea.branches ?? []
  }, [selectedArea, selectedSubAreaId, allBranches, allSubAreas])

  const normalizedBranchId = selectedBranchId === 'all' ? null : selectedBranchId

  const filteredMembers = useMemo(() => {
    const normalizedStart = startDate
    const normalizedEnd = endDate < startDate ? startDate : endDate
    if (normalizedEnd !== endDate) {
      setEndDate(normalizedEnd)
    }

    return allMembers.filter(({ member }) => {
      if (member.deletedAt) {
        return false
      }
      return member.createdAt >= normalizedStart && member.createdAt <= normalizedEnd
    })
  }, [allMembers, startDate, endDate])

  const { areaCounts, subAreaCounts, branchCounts } = useMemo(() => {
    const areaMap = new Map<number, number>()
    const subAreaMap = new Map<number, number>()
    const branchMap = new Map<number, number>()

    filteredMembers.forEach(({ areaId, subAreaId, branchId }) => {
      areaMap.set(areaId, (areaMap.get(areaId) ?? 0) + 1)
      if (subAreaId) {
        subAreaMap.set(subAreaId, (subAreaMap.get(subAreaId) ?? 0) + 1)
      }
      branchMap.set(branchId, (branchMap.get(branchId) ?? 0) + 1)
    })

    return {
      areaCounts: areaMap,
      subAreaCounts: subAreaMap,
      branchCounts: branchMap,
    }
  }, [filteredMembers])

  const chartSegments: ChartSegment[] = useMemo(() => {
    if (selectedAreaId === 'all') {
      return VIP_MEMBER_DATA.map((area) => ({
        key: `area-${area.id}`,
        label: area.name,
        members: areaCounts.get(area.id) ?? 0,
      }))
    }

    if (!selectedArea) {
      return []
    }

    const hasSubAreas = (selectedArea.subAreas?.length ?? 0) > 0

    if (hasSubAreas) {
      if (normalizedBranchId !== null) {
        const branches = flattenAreaBranches(selectedArea)
        return branches.map((branch) => ({
          key: `branch-${branch.id}`,
          label: branch.name,
          members: branchCounts.get(branch.id) ?? 0,
          highlight: branch.id === normalizedBranchId,
        }))
      }

      if (selectedSubAreaId === 'all') {
        return selectedArea.subAreas!.map((subArea) => ({
          key: `sub-${subArea.id}`,
          label: subArea.name,
          members: subAreaCounts.get(subArea.id) ?? 0,
        }))
      }

      const subArea = selectedArea.subAreas?.find((sub) => sub.id === selectedSubAreaId)
      if (!subArea) {
        return []
      }

      return subArea.branches.map((branch) => ({
        key: `branch-${branch.id}`,
        label: branch.name,
        members: branchCounts.get(branch.id) ?? 0,
        highlight: selectedBranchId === branch.id,
      }))
    }

    return (selectedArea.branches ?? []).map((branch) => ({
      key: `branch-${branch.id}`,
      label: branch.name,
      members: branchCounts.get(branch.id) ?? 0,
      highlight: selectedBranchId === branch.id,
    }))
  }, [selectedAreaId, selectedArea, selectedSubAreaId, selectedBranchId, areaCounts, subAreaCounts, branchCounts, normalizedBranchId])

  const totalMembers = filteredMembers.length

  const resolvedBranch = useMemo(
    () => (normalizedBranchId === null ? null : availableBranches.find((branch) => branch.id === normalizedBranchId) ?? null),
    [availableBranches, normalizedBranchId]
  )

  const resolvedSubAreaName = useMemo(() => {
    if (!selectedArea || selectedSubAreaId === 'all') {
      return null
    }
    return selectedArea.subAreas?.find((sub) => sub.id === selectedSubAreaId)?.name ?? null
  }, [selectedArea, selectedSubAreaId])

  const summaryTitle = useMemo(() => {
    if (selectedAreaId === 'all') {
      return 'Member distribution across areas'
    }
    if (selectedArea && (selectedArea.subAreas?.length ?? 0) > 0) {
      if (selectedSubAreaId === 'all') {
        return `Sub-area membership in ${selectedArea.name}`
      }
      return `Branch membership in ${resolvedSubAreaName ?? 'selected sub-area'}`
    }
    return `Branch membership in ${selectedArea?.name ?? 'selected area'}`
  }, [selectedAreaId, selectedArea, selectedSubAreaId, resolvedSubAreaName])

  const chartTotal = useMemo(() => chartSegments.reduce((sum, segment) => sum + segment.members, 0), [chartSegments])

  const timelineData = useMemo(() => {
    const timelineDates = buildDateRange(startDate, endDate)
    if (timelineDates.length === 0) {
      return []
    }

    const baselineIds = new Set<number>()
    allMembers.forEach(({ member }) => {
      const createdBeforeStart = member.createdAt < startDate
      const activeAtStart = !member.deletedAt || member.deletedAt >= startDate
      if (createdBeforeStart && activeAtStart) {
        baselineIds.add(member.id)
      }
    })

    const additionsByDay = new Map<string, number[]>()
    const removalsByDay = new Map<string, number[]>()

    allMembers.forEach(({ member }) => {
      if (member.createdAt >= startDate && member.createdAt <= endDate) {
        if (!additionsByDay.has(member.createdAt)) {
          additionsByDay.set(member.createdAt, [])
        }
        additionsByDay.get(member.createdAt)!.push(member.id)
      }
      if (member.deletedAt && member.deletedAt >= startDate && member.deletedAt <= endDate) {
        if (!removalsByDay.has(member.deletedAt)) {
          removalsByDay.set(member.deletedAt, [])
        }
        removalsByDay.get(member.deletedAt)!.push(member.id)
      }
    })

    const activityLine = timelineDates.map((date, index) => {
      if (index === 0) {
        return { date, total: baselineIds.size }
      }
      return { date, total: 0 }
    })

    const activeSet = new Set<number>(baselineIds)
    activityLine.forEach((point) => {
      additionsByDay.get(point.date)?.forEach((id) => activeSet.add(id))
      removalsByDay.get(point.date)?.forEach((id) => activeSet.delete(id))
      point.total = activeSet.size
    })

    if (trendView === 'day') {
      return activityLine.map((entry) => ({
        key: entry.date,
        label: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: entry.total,
      }))
    }

    if (trendView === 'week') {
      const weekBuckets = new Map<
        string,
        {
          key: string
          label: string
          count: number
        }
      >()
      activityLine.forEach((entry) => {
        const date = new Date(entry.date)
        const week = getWeekNumber(date).toString().padStart(2, '0')
        const key = `${date.getUTCFullYear()}-W${week}`
        if (!weekBuckets.has(key) || entry.total > weekBuckets.get(key)!.count) {
          weekBuckets.set(key, {
            key,
            label: `Week ${week} (${date.getUTCFullYear()})`,
            count: entry.total,
          })
        }
      })
      return Array.from(weekBuckets.values()).sort((a, b) => (a.key > b.key ? 1 : -1))
    }

    const monthBuckets = new Map<
      string,
      {
        key: string
        label: string
        count: number
      }
    >()
    activityLine.forEach((entry) => {
      const date = new Date(entry.date)
      const monthKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
      if (!monthBuckets.has(monthKey) || entry.total > monthBuckets.get(monthKey)!.count) {
        monthBuckets.set(monthKey, {
          key: monthKey,
          label: formatMonthLabel(date),
          count: entry.total,
        })
      }
    })
    return Array.from(monthBuckets.values()).sort((a, b) => (a.key > b.key ? 1 : -1))
  }, [allMembers, startDate, endDate, trendView])

  const memberDetails = useMemo(() => {
    const normalizedEnd = endDate < startDate ? startDate : endDate
    return allMembers
      .filter((entry) => {
        const { member, areaId, subAreaId, branchId } = entry
        if (member.createdAt < startDate || member.createdAt > normalizedEnd) {
          return false
        }

        if (selectedAreaId !== 'all' && areaId !== selectedAreaId) {
          return false
        }

        const areaHasSubAreas = selectedArea && (selectedArea.subAreas?.length ?? 0) > 0
        if (selectedSubAreaId !== 'all') {
          if (selectedAreaId === 'all') {
            if (subAreaId !== selectedSubAreaId) {
              return false
            }
          } else if (areaHasSubAreas && subAreaId !== selectedSubAreaId) {
            return false
          }
        }

        if (normalizedBranchId !== null && branchId !== normalizedBranchId) {
          return false
        }

        return true
      })
      .sort((a, b) => (a.member.createdAt > b.member.createdAt ? -1 : 1))
  }, [
    allMembers,
    startDate,
    endDate,
    selectedAreaId,
    selectedArea,
    selectedSubAreaId,
    normalizedBranchId,
  ])

  const activeMembers = useMemo(
    () => memberDetails.filter(({ member }) => !member.deletedAt),
    [memberDetails]
  )

  const removedMembers = useMemo(
    () => memberDetails.filter(({ member }) => !!member.deletedAt),
    [memberDetails]
  )

  const handleAreaChange = (value: string) => {
    const next = value === 'all' ? 'all' : Number(value)
    setSelectedAreaId(next)
    setSelectedSubAreaId('all')
    setSelectedBranchId('all')
  }

  const handleSubAreaChange = (value: string) => {
    const next = value === 'all' ? 'all' : Number(value)
    setSelectedSubAreaId(next)
    setSelectedBranchId('all')
  }

  const handleBranchChange = (value: string) => {
    setSelectedBranchId(value === 'all' ? 'all' : Number(value))
  }

  const handleStartDateChange = (value: string) => {
    if (!value) return
    setStartDate(value)
    if (value > endDate) {
      setEndDate(value)
    }
  }

  const handleEndDateChange = (value: string) => {
    if (!value) return
    setEndDate(value < startDate ? startDate : value)
  }

  return (
    <MarketingServiceGuard>
      <div className="space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-amber-300/70">Marketing ◦ VIP network</p>
          <h1 className="text-3xl font-semibold text-white">VIP member footprint</h1>
          <p className="text-sm text-slate-300">
            Explore how VIP members are distributed across areas, sub-areas, and branches to understand where growth is concentrated.
          </p>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
            <div className="flex-1 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-amber-200/80">
                <span>Locations</span>
                <button
                  className="rounded-full border border-white/10 px-3 py-1 text-[0.6rem] text-white/70 hover:text-white"
                  onClick={() => {
                    setSelectedAreaId('all')
                    setSelectedSubAreaId('all')
                    setSelectedBranchId('all')
                  }}
                >
                  Reset
                </button>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="flex flex-col text-xs text-slate-300">
                  <label className="text-[0.6rem] uppercase tracking-[0.25em] text-slate-400">Area</label>
                  <select
                    className="mt-1 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-amber-400/60 focus:outline-none"
                    value={selectedAreaId}
                    onChange={(event) => handleAreaChange(event.target.value)}
                  >
                    <option value="all">All areas</option>
                    {VIP_MEMBER_DATA.map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.name}
                      </option>
                    ))}
                  </select>
                </div>

                {availableSubAreas.length > 0 && (
                  <div className="flex flex-col text-xs text-slate-300">
                    <label className="text-[0.6rem] uppercase tracking-[0.25em] text-slate-400">Sub area</label>
                    <select
                      className="mt-1 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-amber-400/60 focus:outline-none"
                      value={selectedSubAreaId}
                      onChange={(event) => handleSubAreaChange(event.target.value)}
                    >
                      <option value="all">All sub areas</option>
                      {selectedArea?.subAreas?.map((subArea) => (
                        <option key={subArea.id} value={subArea.id}>
                          {subArea.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {availableBranches.length > 0 && (
                  <div className="flex flex-col text-xs text-slate-300 md:col-span-2">
                    <label className="text-[0.6rem] uppercase tracking-[0.25em] text-slate-400">Branch</label>
                    <select
                      className="mt-1 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-amber-400/60 focus:outline-none"
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
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-white lg:w-72">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-amber-200/80">
                <span>Date range</span>
                <button
                  className="rounded-full border border-white/10 px-3 py-1 text-[0.6rem] text-white/70 hover:text-white"
                  onClick={() => {
                    const earliest = getEarliestCreatedAt(allMembers)
                    setStartDate(earliest)
                    setEndDate(new Date().toISOString().split('T')[0])
                  }}
                >
                  Today
                </button>
              </div>
              <div className="mt-3 space-y-3 text-xs">
                <div className="flex flex-col">
                  <label className="text-[0.6rem] uppercase tracking-[0.25em] text-slate-400">Start date</label>
                  <input
                    type="date"
                    className="mt-1 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-amber-400/60 focus:outline-none"
                    value={startDate}
                    max={endDate}
                    onChange={(event) => handleStartDateChange(event.target.value)}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-[0.6rem] uppercase tracking-[0.25em] text-slate-400">End date</label>
                  <input
                    type="date"
                    className="mt-1 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-amber-400/60 focus:outline-none"
                    value={endDate}
                    min={startDate}
                    onChange={(event) => handleEndDateChange(event.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-amber-300/70">Members overview</p>
              <h2 className="text-xl font-semibold text-white">{summaryTitle}</h2>
              <p className="text-sm text-slate-300">
                {selectedAreaId === 'all'
                  ? `Total VIP members: ${totalMembers}`
                  : resolvedBranch
                    ? `${resolvedBranch.members.length} member(s) enrolled in ${resolvedBranch.name}`
                    : `${chartTotal} member(s) within current focus`}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-right text-sm text-slate-300">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Total members shown</p>
              <p className="text-2xl font-semibold text-white">{chartTotal.toLocaleString()}</p>
            </div>
          </div>

          <div className="mt-6 h-96 w-full">
            {chartSegments.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">No members in the selected segment.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartSegments} margin={{ top: 24, left: 16, right: 16, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" opacity={0.2} />
                  <XAxis dataKey="label" stroke="#94a3b8" interval={0} angle={chartSegments.length > 5 ? -20 : 0} height={chartSegments.length > 5 ? 70 : 40} tickMargin={12} />
                  <YAxis stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={TOOLTIP_STYLES.content}
                    labelStyle={TOOLTIP_STYLES.label}
                    itemStyle={TOOLTIP_STYLES.item}
                    formatter={(value: number, name) => [`${value.toLocaleString()} member(s)`, name ?? 'Members']}
                  />
                  <Bar dataKey="members" radius={[12, 12, 0, 0]} barSize={48}>
                    {chartSegments.map((segment) => (
                      <Cell key={segment.key} fill={segment.highlight ? BAR_COLORS.highlight : BAR_COLORS.base} />
                    ))}
                    <LabelList
                      dataKey="members"
                      position="top"
                      fill="#f1f5f9"
                      fontSize={12}
                      formatter={(value: number) => value.toLocaleString()}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-amber-300/70">Momentum</p>
              <h2 className="text-xl font-semibold text-white">New VIPs over time</h2>
              <p className="text-sm text-slate-300">
                Visualize how many members registered in the selected period. Deleted members are excluded automatically.
              </p>
            </div>
            <div className="rounded-full border border-white/10 bg-slate-900/60 p-1 text-xs uppercase tracking-[0.2em] text-slate-400">
              {TREND_VIEW_OPTIONS.map((view) => (
                <button
                  key={view.key}
                  className={`rounded-full px-4 py-1 ${
                    trendView === view.key ? 'bg-amber-400/20 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  onClick={() => setTrendView(view.key)}
                >
                  {view.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-6 h-72 w-full">
            {timelineData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">No members in this period.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData} margin={{ top: 16, left: 8, right: 16, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" opacity={0.2} />
                  <XAxis dataKey="label" stroke="#94a3b8" tickMargin={12} />
                  <YAxis stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip
                    cursor={{ stroke: '#f97316', strokeWidth: 2 }}
                    contentStyle={TOOLTIP_STYLES.content}
                    labelStyle={TOOLTIP_STYLES.label}
                    itemStyle={TOOLTIP_STYLES.item}
                    formatter={(value: number) => [`${value.toLocaleString()} total member(s)`, 'Total Members']}
                  />
                  <Line type="monotone" dataKey="count" stroke="#fb923c" strokeWidth={3} dot={{ stroke: '#fed7aa', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-amber-300/70">Member details</p>
              <h2 className="text-xl font-semibold text-white">Individual VIP records</h2>
              <p className="text-sm text-slate-300">
                {memberDetails.length === 0
                  ? 'No members match the current filters.'
                  : `${memberDetails.length} member${memberDetails.length === 1 ? '' : 's'} shown with their registration and removal remarks.`}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-right text-sm text-slate-300">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Active filters</p>
              <p className="text-white">
                {selectedAreaId === 'all' ? 'All areas' : selectedArea?.name ?? 'Custom'} ·{' '}
                {selectedSubAreaId === 'all' ? 'All sub areas' : resolvedSubAreaName ?? 'N/A'} ·{' '}
                {normalizedBranchId === null ? 'All branches' : resolvedBranch?.name ?? 'Custom'}
              </p>
            </div>
          </div>
          <div className="mt-6 space-y-6">
            <div className="max-h-112 overflow-auto rounded-2xl border border-emerald-400/40 bg-emerald-950/20 shadow-inner shadow-emerald-900/30 ring-1 ring-emerald-400/30">
              <div className="flex items-center justify-between border-b border-emerald-400/30 px-4 py-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/80">Active members</p>
                  <p className="text-sm text-emerald-100/80">
                    {activeMembers.length === 0
                      ? 'No active members'
                      : `${activeMembers.length} active member${activeMembers.length === 1 ? '' : 's'}`}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-semibold text-emerald-100">
                  Live
                </span>
              </div>
              <table className="min-w-full divide-y divide-emerald-400/15 text-sm">
                <thead className="sticky top-0 z-10 bg-emerald-950/90 backdrop-blur text-xs uppercase tracking-[0.3em] text-emerald-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Name</th>
                    <th className="px-4 py-3 text-left font-medium">Phone</th>
                    <th className="px-4 py-3 text-left font-medium">Area</th>
                    <th className="px-4 py-3 text-left font-medium">Branch</th>
                    <th className="px-4 py-3 text-left font-medium">Registration Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {activeMembers.length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-center text-emerald-200/70" colSpan={5}>
                        No active members for the selected filters.
                      </td>
                    </tr>
                  ) : (
                    activeMembers.map((entry, index) => (
                      <tr
                        key={`${entry.member.id}-active-${index}`}
                        className={index % 2 === 0 ? 'bg-emerald-400/5' : 'bg-emerald-400/10'}
                      >
                        <td className="px-4 py-3">
                          <p className="font-semibold text-white">{entry.member.name}</p>
                          <p className="text-xs text-emerald-100/70">Joined {entry.member.createdAt}</p>
                        </td>
                        <td className="px-4 py-3 text-emerald-50/90">{entry.member.phone}</td>
                        <td className="px-4 py-3 text-emerald-50/90">{entry.areaName}</td>
                        <td className="px-4 py-3 text-emerald-50/90">{entry.branchName}</td>
                        <td className="px-4 py-3 text-emerald-50/90">{entry.member.createRemark ?? '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="max-h-112 overflow-auto rounded-2xl border border-rose-400/40 bg-rose-950/20 shadow-inner shadow-rose-900/30 ring-1 ring-rose-400/30">
              <div className="flex items-center justify-between border-b border-rose-400/30 px-4 py-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-rose-300/80">Removed members</p>
                  <p className="text-sm text-rose-100/80">
                    {removedMembers.length === 0
                      ? 'No removed members'
                      : `${removedMembers.length} removed member${removedMembers.length === 1 ? '' : 's'}`}
                  </p>
                </div>
                <span className="rounded-full bg-rose-400/20 px-3 py-1 text-xs font-semibold text-rose-100">
                  Archived
                </span>
              </div>
              <table className="min-w-full divide-y divide-rose-400/15 text-sm">
                <thead className="sticky top-0 z-10 bg-rose-950/90 backdrop-blur text-xs uppercase tracking-[0.3em] text-rose-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Name</th>
                    <th className="px-4 py-3 text-left font-medium">Phone</th>
                    <th className="px-4 py-3 text-left font-medium">Area</th>
                    <th className="px-4 py-3 text-left font-medium">Branch</th>
                    <th className="px-4 py-3 text-left font-medium">Removed Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {removedMembers.length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-center text-rose-200/70" colSpan={5}>
                        No removed members for the selected filters.
                      </td>
                    </tr>
                  ) : (
                    removedMembers.map((entry, index) => (
                      <tr
                        key={`${entry.member.id}-removed-${index}`}
                        className={index % 2 === 0 ? 'bg-rose-400/5' : 'bg-rose-400/10'}
                      >
                        <td className="px-4 py-3">
                          <p className="font-semibold text-white">{entry.member.name}</p>
                          <p className="text-xs text-rose-100/70">
                            Joined {entry.member.createdAt} · Removed {entry.member.deletedAt}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-rose-50/90">{entry.member.phone}</td>
                        <td className="px-4 py-3 text-rose-50/90">{entry.areaName}</td>
                        <td className="px-4 py-3 text-rose-50/90">{entry.branchName}</td>
                        <td className="px-4 py-3 text-rose-50/90">
                          {entry.member.deleteRemark ?? 'Removed without note'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </MarketingServiceGuard>
  )
}

export default VIPMembersDashboardPage