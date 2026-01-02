'use client'

import { API_BASE_URL } from '@/config/env'

const MARKETING_API_BASE = `${API_BASE_URL}/api/marketing`

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

async function request<T>(
  path: string,
  options: { method?: HttpMethod; body?: unknown } = {},
): Promise<T> {
  const response = await fetch(`${MARKETING_API_BASE}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
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

export type VipMember = {
  id: number
  name: string
  phone: string
  memberCreatedAt: string
  memberDeletedAt?: string | null
  createRemark?: string | null
  deleteRemark?: string | null
  branchId: number
  branchName?: string
  subAreaId?: number | null
  subAreaName?: string | null
  areaId?: number | null
  areaName?: string | null
  createdAt: string
  updatedAt?: string
  createdBy?: number
}

export type VipMemberPayload = {
  name: string
  phone: string
  branchId: number
  memberCreatedAt: string
  memberDeletedAt?: string
  createRemark?: string
  deleteRemark?: string
}

const buildFilterQuery = (params?: { areaId?: number; subAreaId?: number; branchId?: number }) => {
  const searchParams = new URLSearchParams()
  if (params?.areaId) searchParams.append('areaId', String(params.areaId))
  if (params?.subAreaId) searchParams.append('subAreaId', String(params.subAreaId))
  if (params?.branchId) searchParams.append('branchId', String(params.branchId))
  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

export const vipMemberService = {
  listMembers(params?: { areaId?: number; subAreaId?: number; branchId?: number }): Promise<VipMember[]> {
    return request(`/vip-members${buildFilterQuery(params)}`)
  },

  getMember(id: number): Promise<VipMember> {
    return request(`/vip-members/${id}`)
  },

  createMember(payload: VipMemberPayload): Promise<VipMember> {
    return request('/vip-members', { method: 'POST', body: payload })
  },

  updateMember(id: number, payload: VipMemberPayload): Promise<VipMember> {
    return request(`/vip-members/${id}`, { method: 'PUT', body: payload })
  },

  deleteMember(id: number): Promise<void> {
    return request(`/vip-members/${id}`, { method: 'DELETE' })
  },
}
