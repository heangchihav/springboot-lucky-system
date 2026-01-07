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

export type CompetitorPriceRange = {
  lowestPrice: number;
  highestPrice: number;
};

export type CompetitorProfileResponse = {
  priceRange: CompetitorPriceRange;
  strengths: string[];
  weaknesses: string[];
  remarks?: string;
  branchCount: number;
};

export type MarketingCompetitorAssignment = {
  id: number;
  areaId: number;
  areaName: string;
  subAreaId?: number;
  subAreaName?: string;
  competitorProfiles: Record<number, CompetitorProfileResponse>;
  createdAt: string;
  updatedAt?: string;
  createdBy?: number;
};

export type CompetitorProfilePayload = {
  priceRange: CompetitorPriceRange;
  strengths: string[];
  weaknesses: string[];
  remarks?: string;
  branchCount: number;
};

export type CompetitorAssignmentPayload = {
  areaId: number;
  subAreaId?: number;
  competitorProfiles: Record<number, CompetitorProfilePayload>;
};

export const competitorAssignmentService = {
  listAssignments(): Promise<MarketingCompetitorAssignment[]> {
    return request("/competitor-assignments");
  },

  getAssignment(id: number): Promise<MarketingCompetitorAssignment> {
    return request(`/competitor-assignments/${id}`);
  },

  getAssignmentsByAreaAndSubArea(areaId?: number, subAreaId?: number): Promise<MarketingCompetitorAssignment[]> {
    const params = new URLSearchParams();
    if (areaId !== undefined) params.append("areaId", String(areaId));
    if (subAreaId !== undefined) params.append("subAreaId", String(subAreaId));
    const query = params.toString();
    return request(`/competitor-assignments/by-area-subarea${query ? `?${query}` : ""}`);
  },

  getAssignmentsByArea(areaId: number): Promise<MarketingCompetitorAssignment[]> {
    return request(`/competitor-assignments/by-area/${areaId}`);
  },

  getAssignmentsBySubArea(subAreaId: number): Promise<MarketingCompetitorAssignment[]> {
    return request(`/competitor-assignments/by-subarea/${subAreaId}`);
  },

  searchAssignments(keyword: string): Promise<MarketingCompetitorAssignment[]> {
    return request(`/competitor-assignments/search?keyword=${encodeURIComponent(keyword)}`);
  },

  createAssignment(payload: CompetitorAssignmentPayload): Promise<MarketingCompetitorAssignment> {
    return request("/competitor-assignments", { method: "POST", body: payload });
  },

  updateAssignment(id: number, payload: CompetitorAssignmentPayload): Promise<MarketingCompetitorAssignment> {
    return request(`/competitor-assignments/${id}`, { method: "PUT", body: payload });
  },

  deleteAssignment(id: number): Promise<void> {
    return request(`/competitor-assignments/${id}`, { method: "DELETE" });
  },

  checkAssignmentExists(areaId?: number, subAreaId?: number): Promise<{ exists: boolean }> {
    const params = new URLSearchParams();
    if (areaId !== undefined) params.append("areaId", String(areaId));
    if (subAreaId !== undefined) params.append("subAreaId", String(subAreaId));
    const query = params.toString();
    return request(`/competitor-assignments/exists${query ? `?${query}` : ""}`);
  },
};
