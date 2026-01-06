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

export type MarketingProblem = {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: number;
};

export type ProblemPayload = {
  name: string;
};

export const problemService = {
  listProblems(): Promise<MarketingProblem[]> {
    return request("/problems");
  },

  getProblem(id: number): Promise<MarketingProblem> {
    return request(`/problems/${id}`);
  },

  searchProblems(name: string): Promise<MarketingProblem[]> {
    return request(`/problems/search?name=${encodeURIComponent(name)}`);
  },

  createProblem(payload: ProblemPayload): Promise<MarketingProblem> {
    return request("/problems", { method: "POST", body: payload });
  },

  updateProblem(id: number, payload: ProblemPayload): Promise<MarketingProblem> {
    return request(`/problems/${id}`, { method: "PUT", body: payload });
  },

  deleteProblem(id: number): Promise<void> {
    return request(`/problems/${id}`, { method: "DELETE" });
  },

  getProblemsCount(): Promise<{ count: number }> {
    return request("/problems/count");
  },

  checkProblemExists(id: number): Promise<{ exists: boolean }> {
    return request(`/problems/exists/${id}`);
  },

  checkProblemExistsByName(name: string): Promise<{ exists: boolean }> {
    return request(`/problems/exists?name=${encodeURIComponent(name)}`);
  },
};
