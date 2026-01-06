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

export type MarketingCompetitor = {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: number;
};

export type CompetitorPayload = {
  name: string;
};

export const competitorService = {
  listCompetitors(): Promise<MarketingCompetitor[]> {
    return request("/competitors");
  },

  getCompetitor(id: number): Promise<MarketingCompetitor> {
    return request(`/competitors/${id}`);
  },

  searchCompetitors(name: string): Promise<MarketingCompetitor[]> {
    return request(`/competitors/search?name=${encodeURIComponent(name)}`);
  },

  createCompetitor(payload: CompetitorPayload): Promise<MarketingCompetitor> {
    return request("/competitors", { method: "POST", body: payload });
  },

  updateCompetitor(id: number, payload: CompetitorPayload): Promise<MarketingCompetitor> {
    return request(`/competitors/${id}`, { method: "PUT", body: payload });
  },

  deleteCompetitor(id: number): Promise<void> {
    return request(`/competitors/${id}`, { method: "DELETE" });
  },

  getCompetitorsCount(): Promise<{ count: number }> {
    return request("/competitors/count");
  },

  checkCompetitorExists(id: number): Promise<{ exists: boolean }> {
    return request(`/competitors/exists/${id}`);
  },

  checkCompetitorExistsByName(name: string): Promise<{ exists: boolean }> {
    return request(`/competitors/exists?name=${encodeURIComponent(name)}`);
  },
};
