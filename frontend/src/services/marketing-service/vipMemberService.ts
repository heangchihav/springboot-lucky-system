"use client";

import { apiFetch } from "@/services/httpClient";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

async function request<T>(
  path: string,
  options: { method?: HttpMethod; body?: unknown } = {},
): Promise<T> {
  const response = await apiFetch(`/api/marketing${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const payload = await response.json();
      message = payload?.message ?? payload?.error ?? message;
    } catch {
      // ignore parsing errors
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  try {
    return (await response.json()) as T;
  } catch {
    return undefined as T;
  }
}

export type VipMember = {
  id: number;
  name: string;
  phone: string;
  memberCreatedAt: string;
  memberDeletedAt?: string | null;
  createRemark?: string | null;
  deleteRemark?: string | null;
  branchId: number;
  branchName?: string;
  subAreaId?: number | null;
  subAreaName?: string | null;
  areaId?: number | null;
  areaName?: string | null;
  createdAt: string;
  updatedAt?: string;
  createdBy?: number;
};

export type VipMemberPayload = {
  name: string;
  phone: string;
  branchId: number;
  memberCreatedAt: string;
  memberDeletedAt?: string;
  createRemark?: string;
  deleteRemark?: string;
};

export type VipMemberDashboardData = {
  areaCounts: Record<string, number>;
  subAreaCounts: Record<string, number>;
  branchCounts: Record<string, number>;
  dailyCounts: Array<{ date: string; count: number }>;
  weeklyCounts: Array<{ week: string; yearWeek: string; count: number }>;
  monthlyCounts: Array<{ month: string; yearMonth: string; count: number }>;
  earliestDate: string;
  latestDate: string;
  totalMembers: number;
  activeMembers: number;
};

const buildFilterQuery = (params?: {
  areaId?: number;
  subAreaId?: number;
  branchId?: number;
  startDate?: string;
  endDate?: string;
}) => {
  const searchParams = new URLSearchParams();
  if (params?.areaId) searchParams.append("areaId", String(params.areaId));
  if (params?.subAreaId)
    searchParams.append("subAreaId", String(params.subAreaId));
  if (params?.branchId)
    searchParams.append("branchId", String(params.branchId));
  if (params?.startDate)
    searchParams.append("startDate", params.startDate);
  if (params?.endDate)
    searchParams.append("endDate", params.endDate);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

const buildFilterParams = (params?: {
  areaId?: number;
  subAreaId?: number;
  branchId?: number;
  startDate?: string;
  endDate?: string;
}) => {
  const filterParams: Record<string, string> = {};
  if (params?.areaId) filterParams.areaId = String(params.areaId);
  if (params?.subAreaId) filterParams.subAreaId = String(params.subAreaId);
  if (params?.branchId) filterParams.branchId = String(params.branchId);
  if (params?.startDate) filterParams.startDate = params.startDate;
  if (params?.endDate) filterParams.endDate = params.endDate;
  return filterParams;
};

export const vipMemberService = {
  listMembers(params?: {
    areaId?: number;
    subAreaId?: number;
    branchId?: number;
  }): Promise<VipMember[]> {
    return request(`/vip-members${buildFilterQuery(params)}`);
  },

  getMember(id: number): Promise<VipMember> {
    return request(`/vip-members/${id}`);
  },

  createMember(payload: VipMemberPayload): Promise<VipMember> {
    return request<VipMember[]>("/vip-members", { method: "POST", body: [payload] })
      .then(members => members[0]); // Return first created member
  },

  updateMember(id: number, payload: VipMemberPayload): Promise<VipMember> {
    return request(`/vip-members/${id}`, { method: "PUT", body: payload });
  },

  deleteMember(id: number): Promise<void> {
    return request(`/vip-members/${id}`, { method: "DELETE" });
  },

  getDashboardData(params?: {
    areaId?: number;
    subAreaId?: number;
    branchId?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<VipMemberDashboardData> {
    return request(`/vip-members/dashboard${buildFilterQuery(params)}`);
  },

  listMembersPaginated(page: number, size: number, filters?: {
    areaId?: number;
    subAreaId?: number;
    branchId?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<VipMember[]> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      ...buildFilterParams(filters),
    });
    return request(`/vip-members/paginated?${params.toString()}`);
  },

  listAllMembers(page: number, size: number, filters?: {
    areaId?: number;
    subAreaId?: number;
    branchId?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<VipMember[]> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      ...buildFilterParams(filters),
    });
    return request(`/vip-members/all-members-optimized?${params.toString()}`);
  },
};
