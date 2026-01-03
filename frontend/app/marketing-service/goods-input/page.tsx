'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { MarketingServiceGuard } from '..//_components/MarketingServiceGuard'
import { useAuth } from '@/src/contexts/AuthContext'
import {
  marketingHierarchyService,
  MarketingArea,
  MarketingBranch,
  MarketingSubArea,
} from '../services/marketingHierarchyService'
import { vipMemberService, VipMember } from '../services/vipMemberService'
import {
  goodsShipmentService,
  GoodsStatus,
  MarketingGoodsShipmentRecord,
  UserGoodsRecord,
} from '../services/goodsShipmentService'

type FilterValue = number | 'all'

type EntryFormState = {
  goodsDate: string
  codShipping: string
  codArrived: string
  codCompleted: string
  nonCodShipping: string
  nonCodArrived: string
  nonCodCompleted: string
}

type PendingEntry = {
  id: string
  memberId: number
  memberName: string
  branchId: number
  branchName: string
  goodsDate: string
  cod_goods: GoodsStatus
  non_cod_goods: GoodsStatus
}

const today = new Date().toISOString().split('T')[0]
const EDIT_MODAL_TITLE_ID = 'goods-shipment-edit-title'

const defaultEntryForm: EntryFormState = {
  goodsDate: today,
  codShipping: '',
  codArrived: '',
  codCompleted: '',
  nonCodShipping: '',
  nonCodArrived: '',
  nonCodCompleted: '',
}

const countIsValid = (value: string) => value === '' || (/^\d+$/.test(value) && Number(value) >= 0)

const mapRecordToForm = (record: MarketingGoodsShipmentRecord): EntryFormState => ({
  goodsDate: record.sendDate,
  codShipping: String(record.codGoods.shipping),
  codArrived: String(record.codGoods.arrived),
  codCompleted: String(record.codGoods.complete),
  nonCodShipping: String(record.nonCodGoods.shipping),
  nonCodArrived: String(record.nonCodGoods.arrived),
  nonCodCompleted: String(record.nonCodGoods.complete),
})

export default function GoodsInputPage() {
  const { user } = useAuth()
  const currentUserId = user?.id ?? null
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null)
  const [members, setMembers] = useState<VipMember[]>([])
  const [areas, setAreas] = useState<MarketingArea[]>([])
  const [subAreas, setSubAreas] = useState<MarketingSubArea[]>([])
  const [branches, setBranches] = useState<MarketingBranch[]>([])

  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null)
  const [recentScope, setRecentScope] = useState<'mine' | 'all'>('mine')
  const [filterAreaId, setFilterAreaId] = useState<FilterValue>('all')
  const [filterSubAreaId, setFilterSubAreaId] = useState<FilterValue>('all')
  const [filterBranchId, setFilterBranchId] = useState<FilterValue>('all')
  const [memberQuery, setMemberQuery] = useState('')

  const [entryForm, setEntryForm] = useState<EntryFormState>(defaultEntryForm)
  const [pendingEntries, setPendingEntries] = useState<PendingEntry[]>([])
  const [recentShipments, setRecentShipments] = useState<MarketingGoodsShipmentRecord[]>([])
  const [editingRecord, setEditingRecord] = useState<MarketingGoodsShipmentRecord | null>(null)
  const [editForm, setEditForm] = useState<EntryFormState>(defaultEntryForm)

  const [loadingMembers, setLoadingMembers] = useState(false)
  const [loadingHierarchy, setLoadingHierarchy] = useState(false)
  const [addingEntry, setAddingEntry] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null)
  const [loadingRecent, setLoadingRecent] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const showToast = (message: string, tone: 'success' | 'error' = 'success') => {
    setToast({ message, tone })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    const loadMembers = async () => {
      setLoadingMembers(true)
      try {
        const roster = await vipMemberService.listMembers()
        setMembers(roster)
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Failed to load VIP members', 'error')
      } finally {
        setLoadingMembers(false)
      }
    }

    void loadMembers()
  }, [])

  useEffect(() => {
    const loadHierarchy = async () => {
      setLoadingHierarchy(true)
      try {
        const [areaData, subAreaData, branchData] = await Promise.all([
          marketingHierarchyService.listAreas(),
          marketingHierarchyService.listSubAreas(),
          marketingHierarchyService.listBranches(),
        ])
        setAreas(areaData)
        setSubAreas(subAreaData)
        setBranches(branchData)
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Failed to load hierarchy data', 'error')
      } finally {
        setLoadingHierarchy(false)
      }
    }

    void loadHierarchy()
  }, [])

  useEffect(() => {
    if (selectedMemberId && !members.some((member) => member.id === selectedMemberId)) {
      setSelectedMemberId(null)
    }
  }, [members, selectedMemberId])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPortalRoot(document.body)
    }
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    if (!editingRecord) {
      document.body.style.removeProperty('overflow')
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [editingRecord])

  const availableFilterSubAreas = useMemo(() => {
    if (filterAreaId === 'all') {
      return subAreas
    }
    return subAreas.filter((subArea) => subArea.areaId === filterAreaId)
  }, [filterAreaId, subAreas])

  const availableFilterBranches = useMemo(() => {
    return branches.filter((branch) => {
      if (filterAreaId !== 'all' && branch.areaId !== filterAreaId) {
        return false
      }
      if (filterSubAreaId !== 'all') {
        return (branch.subAreaId ?? null) === filterSubAreaId
      }
      return true
    })
  }, [branches, filterAreaId, filterSubAreaId])

  useEffect(() => {
    if (filterSubAreaId === 'all') {
      return
    }
    const exists = availableFilterSubAreas.some((subArea) => subArea.id === filterSubAreaId)
    if (!exists) {
      setFilterSubAreaId('all')
    }
  }, [availableFilterSubAreas, filterSubAreaId])

  useEffect(() => {
    if (filterBranchId === 'all') {
      return
    }
    const exists = availableFilterBranches.some((branch) => branch.id === filterBranchId)
    if (!exists) {
      setFilterBranchId('all')
    }
  }, [availableFilterBranches, filterBranchId])

  const selectedMember = useMemo(() => {
    if (!selectedMemberId) {
      return null
    }
    return members.find((member) => member.id === selectedMemberId) ?? null
  }, [members, selectedMemberId])

  const refreshRecentShipments = useCallback(async () => {
    setLoadingRecent(true)
    try {
      const records = await goodsShipmentService.listRecent({
        limit: 15,
        myOnly: recentScope === 'mine',
        ...(recentScope === 'all' && filterAreaId !== 'all' ? { areaId: filterAreaId as number } : {}),
        ...(recentScope === 'all' && filterSubAreaId !== 'all' ? { subAreaId: filterSubAreaId as number } : {}),
        ...(recentScope === 'all' && filterBranchId !== 'all' ? { branchId: filterBranchId as number } : {}),
        ...(memberQuery.trim() ? { memberQuery: memberQuery.trim() } : {}),
      })
      setRecentShipments(records)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to load recent goods records', 'error')
    } finally {
      setLoadingRecent(false)
    }
  }, [filterAreaId, filterBranchId, filterSubAreaId, memberQuery, recentScope])

  useEffect(() => {
    void refreshRecentShipments()
  }, [refreshRecentShipments])

  const handleEntryChange = (field: keyof EntryFormState, value: string) => {
    if (field !== 'goodsDate' && !countIsValid(value)) {
      return
    }
    setEntryForm((prev) => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setEntryForm(defaultEntryForm)
  }

  const parseCounts = (form: EntryFormState) => {
    const codShipping = Number(form.codShipping || 0)
    const codArrived = Number(form.codArrived || 0)
    const codCompleted = Number(form.codCompleted || 0)
    const nonCodShipping = Number(form.nonCodShipping || 0)
    const nonCodArrived = Number(form.nonCodArrived || 0)
    const nonCodCompleted = Number(form.nonCodCompleted || 0)

    if (
      [codShipping, codArrived, codCompleted, nonCodShipping, nonCodArrived, nonCodCompleted].some((value) =>
        Number.isNaN(value),
      )
    ) {
      showToast('Counts must be numeric.', 'error')
      return null
    }
    const hasAnyCount =
      codShipping + codArrived + codCompleted + nonCodShipping + nonCodArrived + nonCodCompleted > 0
    if (!hasAnyCount) {
      showToast('At least one goods count must be greater than zero.', 'error')
      return null
    }
    return {
      cod: { shipping: codShipping, arrived: codArrived, complete: codCompleted },
      nonCod: { shipping: nonCodShipping, arrived: nonCodArrived, complete: nonCodCompleted },
    }
  }

  const validateEntry = () => {
    if (!selectedMember) {
      showToast('Please select a VIP member to link the goods entry.', 'error')
      return null
    }
    if (!entryForm.goodsDate) {
      showToast('Date is required.', 'error')
      return null
    }

    return parseCounts(entryForm)
  }

  const handleAddEntry = () => {
    const counts = validateEntry()
    if (!counts || !selectedMember) {
      return
    }

    setAddingEntry(true)
    setPendingEntries((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        memberId: selectedMember.id,
        memberName: selectedMember.name,
        branchId: selectedMember.branchId,
        branchName: selectedMember.branchName ?? `Branch #${selectedMember.branchId}`,
        goodsDate: entryForm.goodsDate,
        cod_goods: counts.cod,
        non_cod_goods: counts.nonCod,
      },
    ])
    resetForm()
    setAddingEntry(false)
    showToast('Entry staged. Submit to record permanently.')
  }

  const removeEntry = (id: string) => {
    setPendingEntries((prev) => prev.filter((entry) => entry.id !== id))
  }

  const handleEditChange = (field: keyof EntryFormState, value: string) => {
    if (field !== 'goodsDate' && !countIsValid(value)) {
      return
    }
    setEditForm((prev) => ({ ...prev, [field]: value }))
  }

  const beginEditRecord = (record: MarketingGoodsShipmentRecord) => {
    setEditingRecord(record)
    setEditForm(mapRecordToForm(record))
  }

  const cancelEdit = () => {
    setEditingRecord(null)
    setEditForm(defaultEntryForm)
  }

  const handleSaveEdit = async () => {
    if (!editingRecord) {
      return
    }
    if (!editForm.goodsDate) {
      showToast('Date is required.', 'error')
      return
    }
    const counts = parseCounts(editForm)
    if (!counts) {
      return
    }

    setSavingEdit(true)
    try {
      await goodsShipmentService.update(editingRecord.id, {
        sendDate: editForm.goodsDate,
        codGoods: counts.cod,
        nonCodGoods: counts.nonCod,
      })
      await refreshRecentShipments()
      showToast('Shipment updated.')
      cancelEdit()
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to update shipment', 'error')
    } finally {
      setSavingEdit(false)
    }
  }

  const handleDeleteRecord = async (record: MarketingGoodsShipmentRecord) => {
    if (currentUserId === null || record.createdBy !== currentUserId) {
      showToast('You can only delete records you created.', 'error')
      return
    }
    const confirmDelete = window.confirm(
      `Delete shipment for ${record.memberName} dated ${record.sendDate}? This cannot be undone.`,
    )
    if (!confirmDelete) {
      return
    }
    setDeletingId(record.id)
    try {
      await goodsShipmentService.delete(record.id)
      if (editingRecord?.id === record.id) {
        cancelEdit()
      }
      await refreshRecentShipments()
      showToast('Shipment deleted.')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to delete shipment', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  const handleSubmit = async () => {
    if (pendingEntries.length === 0) {
      showToast('Add at least one entry before submitting.', 'error')
      return
    }

    const payload: UserGoodsRecord[] = pendingEntries.map((entry) => ({
      userId: String(entry.memberId),
      sendDate: entry.goodsDate,
      cod_goods: entry.cod_goods,
      non_cod_goods: entry.non_cod_goods,
    }))

    setSubmitting(true)
    try {
      await goodsShipmentService.createBatch(payload)
      setPendingEntries([])
      await refreshRecentShipments()
      showToast('Goods data submitted successfully.')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to submit goods data', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const editModal = useMemo(() => {
    if (!editingRecord || !portalRoot) {
      return null
    }

    return createPortal(
      <div className="fixed inset-0 z-9999 flex items-center justify-center p-4" style={{ zIndex: 2147483647 }}>
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
              <p className="text-xs uppercase tracking-[0.3em] text-amber-300/70">Editing record</p>
              <h3 id={EDIT_MODAL_TITLE_ID} className="text-2xl font-semibold text-white">
                {editingRecord.memberName} · {editingRecord.branchName}
              </h3>
              <p className="text-sm text-slate-300">
                Update counts or date, then save. Only records you created can be edited.
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
              <label className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-400">Goods date</label>
              <input
                type="date"
                className="mt-2 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-white focus:border-amber-400/60 focus:outline-none"
                max={today}
                value={editForm.goodsDate}
                onChange={(event) => handleEditChange('goodsDate', event.target.value)}
              />
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              {
                title: 'COD goods (Cash on delivery)',
                description: 'Orders where the courier collects payment.',
                shippingField: 'codShipping',
                arrivedField: 'codArrived',
                completedField: 'codCompleted',
                accent: 'text-sky-300',
              },
              {
                title: 'Non-COD goods',
                description: 'Pre-paid or zero cash-handling parcels.',
                shippingField: 'nonCodShipping',
                arrivedField: 'nonCodArrived',
                completedField: 'nonCodCompleted',
                accent: 'text-amber-300',
              },
            ].map((card) => (
              <div key={card.title} className="rounded-3xl border border-white/10 bg-slate-950/40 p-4 text-white">
                <p className={`text-xs uppercase tracking-[0.3em] ${card.accent}`}>Segment</p>
                <h3 className="text-lg font-semibold text-white">{card.title}</h3>
                <p className="text-xs text-slate-400">{card.description}</p>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {[
                    { label: 'Shipping', field: card.shippingField as keyof EntryFormState },
                    { label: 'Arrived', field: card.arrivedField as keyof EntryFormState },
                    { label: 'Completed', field: card.completedField as keyof EntryFormState },
                  ].map((input) => (
                    <div key={input.field} className="flex flex-col text-sm text-white">
                      <label className="text-[0.6rem] uppercase tracking-[0.3em] text-slate-400">{input.label}</label>
                      <input
                        inputMode="numeric"
                        pattern="\d*"
                        className="mt-1 rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-2 text-white focus:border-amber-400/60 focus:outline-none"
                        value={editForm[input.field]}
                        onChange={(event) => handleEditChange(input.field, event.target.value)}
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-3 text-sm text-slate-200 lg:flex-row lg:items-center lg:justify-between">
            <span>
              Editing shipment dated <strong>{editingRecord.sendDate}</strong> for{' '}
              <strong>{editingRecord.memberName}</strong>
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
              <button
                type="button"
                className="rounded-full border border-white/10 bg-emerald-500/20 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:border-white/20 disabled:bg-transparent disabled:text-slate-400"
                onClick={handleSaveEdit}
                disabled={savingEdit}
              >
                {savingEdit ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      </div>,
      portalRoot,
    )
  }, [editingRecord, portalRoot, editForm, savingEdit, cancelEdit, handleEditChange, handleSaveEdit])

  return (
    <MarketingServiceGuard>
      <div className="space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-amber-300/70">Marketing ◦ Goods intake</p>
          <h1 className="text-3xl font-semibold text-white">Record VIP shipment activity</h1>
          <p className="text-sm text-slate-300">
            Associate every goods record with a branch and VIP member. Stage multiple entries and submit them in one batch to keep
            freight analytics up to date.
          </p>
        </header>

        {toast && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              toast.tone === 'success'
                ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100'
                : 'border-rose-400/40 bg-rose-500/10 text-rose-100'
            }`}
          >
            {toast.message}
          </div>
        )}

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-2 pb-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-amber-300/70">Entry composer</p>
              <h2 className="text-xl font-semibold text-white">Capture shipment metrics</h2>
              <p className="text-sm text-slate-300">
                Counts are staged locally so you can validate before pushing everything live.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col text-sm text-white md:col-span-2">
              <label className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-400">VIP member</label>
              <select
                className="mt-2 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-white focus:border-amber-400/60 focus:outline-none"
                value={selectedMemberId ?? ''}
                onChange={(event) => {
                  const value = event.target.value
                  setSelectedMemberId(value === '' ? null : Number(value))
                }}
                disabled={loadingMembers || members.length === 0}
              >
                <option value="">{loadingMembers ? 'Loading members…' : 'Select member'}</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} · {member.branchName ?? `Branch #${member.branchId}`} ({member.phone})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-400">
                {loadingMembers
                  ? 'Fetching roster…'
                  : selectedMember
                    ? `Linked to ${selectedMember.branchName ?? `Branch #${selectedMember.branchId}`}.`
                    : 'Pick a member to unlock goods entry.'}
              </p>
            </div>
            <div className="flex flex-col text-sm text-white">
              <label className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-400">Goods date</label>
              <input
                type="date"
                className="mt-2 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-white focus:border-amber-400/60 focus:outline-none"
                max={today}
                value={entryForm.goodsDate}
                onChange={(event) => handleEntryChange('goodsDate', event.target.value)}
              />
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              {
                title: 'COD goods (Cash on delivery)',
                description: 'Orders where the courier collects payment.',
                shippingField: 'codShipping',
                arrivedField: 'codArrived',
                completedField: 'codCompleted',
                accent: 'text-sky-300',
              },
              {
                title: 'Non-COD goods',
                description: 'Pre-paid or zero cash-handling parcels.',
                shippingField: 'nonCodShipping',
                arrivedField: 'nonCodArrived',
                completedField: 'nonCodCompleted',
                accent: 'text-amber-300',
              },
            ].map((card) => (
              <div key={card.title} className="rounded-3xl border border-white/10 bg-slate-950/40 p-4 text-white">
                <p className={`text-xs uppercase tracking-[0.3em] ${card.accent}`}>Segment</p>
                <h3 className="text-lg font-semibold text-white">{card.title}</h3>
                <p className="text-xs text-slate-400">{card.description}</p>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {[
                    { label: 'Shipping', field: card.shippingField as keyof EntryFormState },
                    { label: 'Arrived', field: card.arrivedField as keyof EntryFormState },
                    { label: 'Completed', field: card.completedField as keyof EntryFormState },
                  ].map((input) => (
                    <div key={input.field} className="flex flex-col text-sm text-white">
                      <label className="text-[0.6rem] uppercase tracking-[0.3em] text-slate-400">{input.label}</label>
                      <input
                        inputMode="numeric"
                        pattern="\d*"
                        className="mt-1 rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-2 text-white focus:border-amber-400/60 focus:outline-none"
                        value={entryForm[input.field]}
                        onChange={(event) => handleEntryChange(input.field, event.target.value)}
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-3 text-sm text-slate-200 lg:flex-row lg:items-center lg:justify-between">
            <span>
              {selectedMember
                ? `Staging goods for ${selectedMember.name} @ ${selectedMember.branchName ?? `Branch #${selectedMember.branchId}`}`
                : 'Select a member to enable staging.'}
            </span>
            <button
              type="button"
              disabled={addingEntry || !selectedMember}
              className="rounded-full border border-white/10 bg-emerald-500/20 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:border-white/20 disabled:bg-transparent disabled:text-slate-400"
              onClick={handleAddEntry}
            >
              Add entry
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-2 pb-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-amber-300/70">Pending payload</p>
              <h2 className="text-xl font-semibold text-white">Review before submit</h2>
              <p className="text-sm text-slate-300">Remove entries if something looks off—submission will push everything at once.</p>
            </div>
            <div className="rounded-full border border-white/10 px-4 py-1 text-xs uppercase tracking-[0.3em] text-slate-300">
              {pendingEntries.length} staged
            </div>
          </div>

          {pendingEntries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/40 px-6 py-12 text-center text-sm text-slate-400">
              No entries yet. Configure the form above and click &ldquo;Add entry&rdquo; to stage goods data.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-slate-200">
                <thead>
                  <tr className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    <th className="pb-3 pr-4">Date</th>
                    <th className="pb-3 pr-4">Type</th>
                    <th className="pb-3 pr-4">Branch</th>
                    <th className="pb-3 pr-4">Member</th>
                    <th className="pb-3 pr-4 text-right">Shipping</th>
                    <th className="pb-3 pr-4 text-right">Arrived</th>
                    <th className="pb-3 pr-4 text-right">Completed</th>
                    <th className="pb-3 pr-4">Remark</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {pendingEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td className="py-3 pr-4">{entry.goodsDate}</td>
                      <td className="py-3 pr-4">{entry.branchName}</td>
                      <td className="py-3 pr-4">{entry.memberName}</td>
                      <td className="py-3 pr-4 text-right font-semibold text-white">
                        {entry.cod_goods.shipping.toLocaleString()}
                      </td>
                      <td className="py-3 pr-4 text-right text-amber-200">
                        {entry.cod_goods.arrived.toLocaleString()}
                      </td>
                      <td className="py-3 pr-4 text-right text-emerald-200">
                        {entry.cod_goods.complete.toLocaleString()}
                      </td>
                      <td className="py-3 pr-4 text-right font-semibold text-white">
                        {entry.non_cod_goods.shipping.toLocaleString()}
                      </td>
                      <td className="py-3 pr-4 text-right text-amber-200">
                        {entry.non_cod_goods.arrived.toLocaleString()}
                      </td>
                      <td className="py-3 pr-4 text-right text-emerald-200">
                        {entry.non_cod_goods.complete.toLocaleString()}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          className="rounded-full border border-white/10 px-3 py-1 text-xs text-rose-200 hover:border-rose-400/50 hover:text-rose-100"
                          onClick={() => removeEntry(entry.id)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 text-sm text-slate-200 lg:flex-row lg:items-center lg:justify-between">
            <span>
              {pendingEntries.length === 0
                ? 'Stage goods entries to enable submission.'
                : 'Submitting will sync all rows to the marketing service API.'}
            </span>
            <button
              type="button"
              disabled={pendingEntries.length === 0 || submitting}
              className="rounded-full border border-white/10 bg-amber-500/20 px-6 py-2 text-sm font-semibold text-white transition hover:bg-amber-500/30 disabled:cursor-not-allowed disabled:border-white/20 disabled:bg-transparent disabled:text-slate-400"
              onClick={handleSubmit}
            >
              {submitting ? 'Submitting…' : 'Submit goods data'}
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-2 pb-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-amber-300/70">Recent records</p>
              <h2 className="text-xl font-semibold text-white">Latest goods submissions</h2>
              <p className="text-sm text-slate-300">
                Review what you have recorded or switch to the global feed and slice it by geography or member lookup.
              </p>
            </div>
            {loadingRecent && <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Refreshing…</span>}
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-sm text-white">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[0.6rem] uppercase tracking-[0.4em] text-slate-400">Visibility</p>
                <p className="text-sm text-slate-300">
                  {recentScope === 'mine'
                    ? 'Showing entries you personally submitted.'
                    : 'Showing all entries. Apply filters to narrow scope.'}
                </p>
              </div>
              <div className="inline-flex rounded-full border border-white/10 bg-slate-900/40 p-1 text-xs font-semibold">
                {[
                  { value: 'mine' as const, label: 'My records' },
                  { value: 'all' as const, label: 'All records' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRecentScope(option.value)}
                    className={`rounded-full px-4 py-1 transition ${
                      recentScope === option.value
                        ? 'bg-amber-400/30 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col text-xs text-white">
                <label className="text-[0.6rem] uppercase tracking-[0.3em] text-slate-400">Area</label>
                <select
                  className="mt-2 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-white focus:border-amber-400/60 focus:outline-none"
                  value={filterAreaId}
                  onChange={(event) => {
                    const next = event.target.value === 'all' ? 'all' : Number(event.target.value)
                    setFilterAreaId(next)
                    setFilterSubAreaId('all')
                    setFilterBranchId('all')
                  }}
                  disabled={recentScope === 'mine' || loadingHierarchy}
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
                <label className="text-[0.6rem] uppercase tracking-[0.3em] text-slate-400">Sub area</label>
                <select
                  className="mt-2 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-white focus:border-amber-400/60 focus:outline-none"
                  value={filterSubAreaId}
                  onChange={(event) => {
                    const next = event.target.value === 'all' ? 'all' : Number(event.target.value)
                    setFilterSubAreaId(next)
                    setFilterBranchId('all')
                  }}
                  disabled={recentScope === 'mine' || loadingHierarchy || filterAreaId === 'all'}
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
                <label className="text-[0.6rem] uppercase tracking-[0.3em] text-slate-400">Branch</label>
                <select
                  className="mt-2 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-white focus:border-amber-400/60 focus:outline-none"
                  value={filterBranchId}
                  onChange={(event) => {
                    const next = event.target.value === 'all' ? 'all' : Number(event.target.value)
                    setFilterBranchId(next)
                  }}
                  disabled={recentScope === 'mine' || loadingHierarchy}
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
              {recentScope === 'mine'
                ? 'No submissions yet. Add entries above to seed your history.'
                : 'No shipments found for the applied filters.'}
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-left text-sm text-slate-200">
                <thead>
                  <tr className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    <th className="pb-3 pr-4">Date</th>
                    <th className="pb-3 pr-4">Member</th>
                    <th className="pb-3 pr-4">Branch</th>
                    <th className="pb-3 pr-4 text-right">COD ship</th>
                    <th className="pb-3 pr-4 text-right">COD arrived</th>
                    <th className="pb-3 pr-4 text-right">COD done</th>
                    <th className="pb-3 pr-4 text-right">Non-COD ship</th>
                    <th className="pb-3 pr-4 text-right">Non-COD arrived</th>
                    <th className="pb-3 pr-4 text-right">Non-COD done</th>
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
                      <td className="py-3 pr-4 text-right text-white">{record.codGoods.shipping.toLocaleString()}</td>
                      <td className="py-3 pr-4 text-right text-amber-200">
                        {record.codGoods.arrived.toLocaleString()}
                      </td>
                      <td className="py-3 pr-4 text-right text-emerald-200">
                        {record.codGoods.complete.toLocaleString()}
                      </td>
                      <td className="py-3 pr-4 text-right text-white">{record.nonCodGoods.shipping.toLocaleString()}</td>
                      <td className="py-3 pr-4 text-right text-amber-200">
                        {record.nonCodGoods.arrived.toLocaleString()}
                      </td>
                      <td className="py-3 pr-4 text-right text-emerald-200">
                        {record.nonCodGoods.complete.toLocaleString()}
                      </td>
                      <td className="py-3 pr-4 text-right text-xs text-slate-400">
                        {new Date(record.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 text-right">
                        {currentUserId !== null && record.createdBy === currentUserId ? (
                          <div className="inline-flex gap-2">
                            <button
                              type="button"
                              className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200 hover:border-amber-400/50 hover:text-white"
                              onClick={() => beginEditRecord(record)}
                              disabled={savingEdit && editingRecord?.id === record.id}
                            >
                              {savingEdit && editingRecord?.id === record.id ? 'Saving…' : 'Edit'}
                            </button>
                            <button
                              type="button"
                              className="rounded-full border border-white/10 px-3 py-1 text-xs text-rose-200 hover:border-rose-400/50 hover:text-rose-100"
                              onClick={() => handleDeleteRecord(record)}
                              disabled={deletingId === record.id}
                            >
                              {deletingId === record.id ? 'Deleting…' : 'Delete'}
                            </button>
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
    </MarketingServiceGuard>
  )
}
