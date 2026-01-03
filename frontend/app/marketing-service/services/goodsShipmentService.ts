'use client'

import { API_BASE_URL } from '@/config/env'
import { fetchWithAuth } from '@/src/services/httpClient'

const MARKETING_API_BASE = `${API_BASE_URL}/api/marketing`

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

async function request<T>(
  path: string,
  options: { method?: HttpMethod; body?: unknown } = {},
): Promise<T> {
  const response = await fetchWithAuth(`${MARKETING_API_BASE}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`
    try {
      const payload = await response.json()
      message = payload?.message ?? payload?.error ?? message
    } catch {
      // ignore parsing errors
    }
    throw new Error(message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  try {
    return (await response.json()) as T
  } catch {
    return undefined as T
  }
}

export type GoodsStatus = {
  shipping: number
  arrived: number
  complete: number
}

export type UserGoodsRecord = {
  userId: string
  sendDate: string
  cod_goods: GoodsStatus
  non_cod_goods: GoodsStatus
}

export type MarketingGoodsShipmentRecord = {
  id: number
  memberId: number
  memberName: string
  branchId: number
  branchName: string
  sendDate: string
  codGoods: GoodsStatus
  nonCodGoods: GoodsStatus
  createdAt: string
  createdBy: number
}

export const goodsShipmentService = {
  createBatch(payload: UserGoodsRecord[]): Promise<{ accepted: number }> {
    return request('/goods-shipments', {
      method: 'POST',
      body: payload,
    })
  },

  listRecent(
    params: {
      memberId?: number
      branchId?: number
      subAreaId?: number
      areaId?: number
      memberQuery?: string
      limit?: number
      myOnly?: boolean
      startDate?: string
      endDate?: string
    } = {},
  ) {
    const search = new URLSearchParams()
    const {
      memberId,
      branchId,
      subAreaId,
      areaId,
      memberQuery,
      limit,
      myOnly = true,
      startDate,
      endDate,
    } = params

    if (memberId) {
      search.set('memberId', String(memberId))
    }
    if (!memberId && branchId) {
      search.set('branchId', String(branchId))
    }
    if (subAreaId) {
      search.set('subAreaId', String(subAreaId))
    }
    if (areaId) {
      search.set('areaId', String(areaId))
    }
    if (memberQuery?.trim()) {
      search.set('memberQuery', memberQuery.trim())
    }
    if (limit) {
      search.set('limit', String(limit))
    }
    search.set('myOnly', String(myOnly))
    if (startDate) {
      search.set('startDate', startDate)
    }
    if (endDate) {
      search.set('endDate', endDate)
    }

    const query = search.toString()
    const path = query ? `/goods-shipments?${query}` : '/goods-shipments'
    return request<MarketingGoodsShipmentRecord[]>(path)
  },

  update(id: number, payload: MarketingGoodsShipmentRecordUpdatePayload) {
    return request<MarketingGoodsShipmentRecord>(`/goods-shipments/${id}`, {
      method: 'PUT',
      body: payload,
    })
  },

  delete(id: number) {
    return request<void>(`/goods-shipments/${id}`, { method: 'DELETE' })
  },
}

export type MarketingGoodsShipmentRecordUpdatePayload = {
  sendDate: string
  codGoods: GoodsStatus
  nonCodGoods: GoodsStatus
}
