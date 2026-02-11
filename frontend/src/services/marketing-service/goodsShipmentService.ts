"use client";

import { API_BASE_URL } from "@/config/env";
import { fetchWithAuth } from "@/services/httpClient";

const MARKETING_API_BASE = `${API_BASE_URL}/api/marketing`;

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

async function request<T>(
  path: string,
  options: { method?: HttpMethod; body?: unknown } = {},
): Promise<T> {
  const response = await fetchWithAuth(`${MARKETING_API_BASE}${path}`, {
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

export type UserGoodsRecord = {
  userId: string;
  sendDate: string;
  totalGoods: number;
};

export type OptimizedBulkGoodsRequest = {
  sendDate: string;
  records: Array<{
    userId: string;
    totalGoods: number;
  }>;
};

export type BulkGoodsResponse = {
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
  errors: string[];
  processedAt: string;
  batchId: string;
  processingTimeMs: number;
};

export type MarketingGoodsShipmentRecord = {
  id: number;
  memberId: number;
  memberName: string;
  memberPhone: string;
  branchId: number;
  branchName: string;
  sendDate: string;
  totalGoods: number;
  createdAt: string;
  createdBy: number;
};

export type GoodsShipmentRecord = {
  sendDate: string;
  totalGoods: number;
};

export type GroupedGoodsShipmentResponse = {
  memberId: number;
  memberName: string;
  memberPhone: string;
  branchId: number;
  branchName: string;
  records: GoodsShipmentRecord[];
  totalGoods?: number;
  rank?: number;
};

export type GoodsDashboardStatsResponse = {
  statusMetrics: Array<{
    metric: string;
    shipping: number;
    arrived: number;
    completed: number;
    total: number;
  }>;
  hierarchyTotals: Array<{
    key: string;
    label: string;
    total: number;
    type: "area" | "branch" | "subArea" | "member";
    id: number;
    highlight: boolean;
  }>;
  dailyTrends: Array<{
    date: string;
    totalGoods: number;
  }>;
  weeklyTrends: Array<{
    week: number;
    year: number;
    label: string;
    totalGoods: number;
  }>;
  monthlyTrends: Array<{
    month: number;
    year: number;
    label: string;
    totalGoods: number;
  }>;
  summaryStats: {
    totalGoods: number;
    totalMembers: number;
    totalBranches: number;
    totalAreas: number;
    totalSubAreas: number;
  };
};

export const goodsShipmentService = {
  createBatch(payload: UserGoodsRecord[]): Promise<{ accepted: number }> {
    return request("/goods-shipments", {
      method: "POST",
      body: payload,
    });
  },

  createOptimizedBulk(payload: OptimizedBulkGoodsRequest): Promise<BulkGoodsResponse> {
    return request("/goods-shipments/bulk", {
      method: "POST",
      body: payload,
    });
  },

  listRecent: async (params: {
    memberId?: number;
    branchId?: number;
    subAreaId?: number;
    areaId?: number;
    limit?: number;
    page?: number;
    size?: number;
    myOnly?: boolean;
    memberQuery?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const searchParams = new URLSearchParams();

    if (params.memberId !== undefined) searchParams.append('memberId', params.memberId.toString());
    if (params.branchId !== undefined) searchParams.append('branchId', params.branchId.toString());
    if (params.subAreaId !== undefined) searchParams.append('subAreaId', params.subAreaId.toString());
    if (params.areaId !== undefined) searchParams.append('areaId', params.areaId.toString());
    if (params.limit !== undefined) searchParams.append('limit', params.limit.toString());
    if (params.page !== undefined) searchParams.append('page', params.page.toString());
    if (params.size !== undefined) searchParams.append('size', params.size.toString());
    if (params.myOnly !== undefined) searchParams.append('myOnly', params.myOnly.toString());
    if (params.memberQuery) searchParams.append('memberQuery', params.memberQuery);
    if (params.startDate) searchParams.append('startDate', params.startDate);
    if (params.endDate) searchParams.append('endDate', params.endDate);

    // If pagination parameters are provided, expect paginated response
    if (params.page !== undefined && params.size !== undefined) {
      const response = await request<PaginatedGoodsShipmentResponse>(`/goods-shipments?${searchParams.toString()}`);
      return response.data; // Return just the data array for compatibility
    } else {
      // Legacy limit-based response
      const response = await request<MarketingGoodsShipmentRecord[]>(`/goods-shipments?${searchParams.toString()}`);
      return response;
    }
  },

  listRecentPaginated: async (params: {
    memberId?: number;
    branchId?: number;
    subAreaId?: number;
    areaId?: number;
    page?: number;
    size?: number;
    myOnly?: boolean;
    memberQuery?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const searchParams = new URLSearchParams();

    if (params.memberId !== undefined) searchParams.append('memberId', params.memberId.toString());
    if (params.branchId !== undefined) searchParams.append('branchId', params.branchId.toString());
    if (params.subAreaId !== undefined) searchParams.append('subAreaId', params.subAreaId.toString());
    if (params.areaId !== undefined) searchParams.append('areaId', params.areaId.toString());
    if (params.page !== undefined) searchParams.append('page', params.page.toString());
    if (params.size !== undefined) searchParams.append('size', params.size.toString());
    if (params.myOnly !== undefined) searchParams.append('myOnly', params.myOnly.toString());
    if (params.memberQuery) searchParams.append('memberQuery', params.memberQuery);
    if (params.startDate) searchParams.append('startDate', params.startDate);
    if (params.endDate) searchParams.append('endDate', params.endDate);

    const response = await request<PaginatedGoodsShipmentResponse>(`/goods-shipments?${searchParams.toString()}`);
    return response;
  },

  update: async (id: number, payload: MarketingGoodsShipmentRecordUpdatePayload) => {
    return request<MarketingGoodsShipmentRecord>(`/goods-shipments/${id}`, {
      method: "PUT",
      body: payload,
    });
  },

  delete: async (id: number) => {
    return request<void>(`/goods-shipments/${id}`, { method: "DELETE" });
  },

  getDashboardStats: async (params: {
    areaId?: number;
    subAreaId?: number;
    branchId?: number;
    memberId?: number;
    startDate?: string;
    endDate?: string;
  } = {}) => {
    const searchParams = new URLSearchParams();

    if (params.areaId !== undefined) searchParams.append('areaId', params.areaId.toString());
    if (params.subAreaId !== undefined) searchParams.append('subAreaId', params.subAreaId.toString());
    if (params.branchId !== undefined) searchParams.append('branchId', params.branchId.toString());
    if (params.memberId !== undefined) searchParams.append('memberId', params.memberId.toString());
    if (params.startDate) searchParams.append('startDate', params.startDate);
    if (params.endDate) searchParams.append('endDate', params.endDate);

    const response = await request<GoodsDashboardStatsResponse>(`/goods-shipments/dashboard-stats?${searchParams.toString()}`);
    return response;
  },

  listRecentGrouped: async (params: {
    memberId?: number;
    branchId?: number;
    subAreaId?: number;
    areaId?: number;
    limit?: number;
    page?: number;
    size?: number;
    myOnly?: boolean;
    memberQuery?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const searchParams = new URLSearchParams();

    if (params.memberId !== undefined) searchParams.append('memberId', params.memberId.toString());
    if (params.branchId !== undefined) searchParams.append('branchId', params.branchId.toString());
    if (params.subAreaId !== undefined) searchParams.append('subAreaId', params.subAreaId.toString());
    if (params.areaId !== undefined) searchParams.append('areaId', params.areaId.toString());
    if (params.limit !== undefined) searchParams.append('limit', params.limit.toString());
    if (params.page !== undefined) searchParams.append('page', params.page.toString());
    if (params.size !== undefined) searchParams.append('size', params.size.toString());
    if (params.myOnly !== undefined) searchParams.append('myOnly', params.myOnly.toString());
    if (params.memberQuery) searchParams.append('memberQuery', params.memberQuery);
    if (params.startDate) searchParams.append('startDate', params.startDate);
    if (params.endDate) searchParams.append('endDate', params.endDate);

    // If pagination parameters are provided, expect paginated response
    if (params.page !== undefined && params.size !== undefined) {
      const response = await request<PaginatedGroupedGoodsShipmentResponse>(`/goods-shipments/grouped?${searchParams.toString()}`);
      return response.data; // Return just the data array for compatibility
    } else {
      // Legacy limit-based response
      const response = await request<GroupedGoodsShipmentResponse[]>(`/goods-shipments/grouped?${searchParams.toString()}`);
      return response;
    }
  },

  listRecentGroupedPaginated: async (params: {
    memberId?: number;
    branchId?: number;
    subAreaId?: number;
    areaId?: number;
    page?: number;
    size?: number;
    myOnly?: boolean;
    memberQuery?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => {
    const searchParams = new URLSearchParams();

    if (params.memberId !== undefined) searchParams.append('memberId', params.memberId.toString());
    if (params.branchId !== undefined) searchParams.append('branchId', params.branchId.toString());
    if (params.subAreaId !== undefined) searchParams.append('subAreaId', params.subAreaId.toString());
    if (params.areaId !== undefined) searchParams.append('areaId', params.areaId.toString());
    if (params.page !== undefined) searchParams.append('page', params.page.toString());
    if (params.size !== undefined) searchParams.append('size', params.size.toString());
    if (params.myOnly !== undefined) searchParams.append('myOnly', params.myOnly.toString());
    if (params.memberQuery) searchParams.append('memberQuery', params.memberQuery);
    if (params.startDate) searchParams.append('startDate', params.startDate);
    if (params.endDate) searchParams.append('endDate', params.endDate);
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);

    const response = await request<PaginatedGroupedGoodsShipmentResponse>(`/goods-shipments/grouped?${searchParams.toString()}`);
    return response;
  },
};

export type PaginatedGoodsShipmentResponse = {
  data: MarketingGoodsShipmentRecord[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
};

export type PaginatedGroupedGoodsShipmentResponse = {
  data: GroupedGoodsShipmentResponse[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

export type MarketingGoodsShipmentRecordUpdatePayload = {
  sendDate: string;
  totalGoods: number;
};
