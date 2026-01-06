"use client";

import { API_BASE_URL } from "@/config/env";
import { fetchWithAuth } from "@/services/httpClient";

const MARKETING_API_BASE = `${API_BASE_URL}/api/marketing`;

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

async function request<T>(
  path: string,
  options: { method?: HttpMethod; body?: any } = {},
): Promise<T> {
  const response = await fetchWithAuth(`${MARKETING_API_BASE}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // ignore JSON parsing errors
    }
    throw new Error(errorMessage);
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

export type MarketingArea = {
  id: number;
  name: string;
  code?: string;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
  createdBy?: number;
};

export type MarketingSubArea = {
  id: number;
  name: string;
  code?: string;
  description?: string;
  active: boolean;
  areaId: number;
  createdAt: string;
  updatedAt?: string;
  createdBy?: number;
};

export type MarketingBranch = {
  id: number;
  name: string;
  code?: string;
  description?: string;
  active: boolean;
  areaId: number;
  subAreaId?: number | null;
  createdAt: string;
  updatedAt?: string;
  createdBy?: number;
};

export type AreaPayload = {
  name: string;
  code?: string;
  description?: string;
  active: boolean;
};

export type SubAreaPayload = AreaPayload & {
  areaId: number;
};

export type BranchPayload = AreaPayload & {
  areaId: number;
  subAreaId?: number | null;
};

export const marketingHierarchyService = {
  listAreas(): Promise<MarketingArea[]> {
    return request("/areas");
  },

  createArea(payload: AreaPayload): Promise<MarketingArea> {
    return request("/areas", { method: "POST", body: payload });
  },

  updateArea(id: number, payload: AreaPayload): Promise<MarketingArea> {
    return request(`/areas/${id}`, { method: "PUT", body: payload });
  },

  deleteArea(id: number): Promise<void> {
    return request(`/areas/${id}`, { method: "DELETE" });
  },

  listSubAreas(areaId?: number): Promise<MarketingSubArea[]> {
    const query = areaId ? `?areaId=${areaId}` : "";
    return request(`/sub-areas${query}`);
  },

  createSubArea(payload: SubAreaPayload): Promise<MarketingSubArea> {
    return request("/sub-areas", { method: "POST", body: payload });
  },

  updateSubArea(
    id: number,
    payload: SubAreaPayload,
  ): Promise<MarketingSubArea> {
    return request(`/sub-areas/${id}`, { method: "PUT", body: payload });
  },

  deleteSubArea(id: number): Promise<void> {
    return request(`/sub-areas/${id}`, { method: "DELETE" });
  },

  listBranches(params?: {
    areaId?: number;
    subAreaId?: number;
  }): Promise<MarketingBranch[]> {
    const urlParams = new URLSearchParams();
    if (params?.areaId) urlParams.append("areaId", String(params.areaId));
    if (params?.subAreaId)
      urlParams.append("subAreaId", String(params.subAreaId));
    const query = urlParams.toString();
    return request(`/branches${query ? `?${query}` : ""}`);
  },

  createBranch(payload: BranchPayload): Promise<MarketingBranch> {
    return request("/branches", { method: "POST", body: payload });
  },

  updateBranch(id: number, payload: BranchPayload): Promise<MarketingBranch> {
    return request(`/branches/${id}`, { method: "PUT", body: payload });
  },

  deleteBranch(id: number): Promise<void> {
    return request(`/branches/${id}`, { method: "DELETE" });
  },
};
