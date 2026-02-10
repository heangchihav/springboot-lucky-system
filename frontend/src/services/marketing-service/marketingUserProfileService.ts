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

export interface MarketingUserProfile {
  id?: number;
  userId: number;
  departmentManager?: string;
  managerName?: string;
  userSignature?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MarketingUserProfileRequest {
  departmentManager?: string;
  managerName?: string;
  userSignature?: string;
}

class MarketingUserProfileService {
  async getCurrentUserProfile(): Promise<MarketingUserProfile> {
    return request<MarketingUserProfile>("/users/profile/me");
  }

  async updateCurrentUserProfile(profileRequest: MarketingUserProfileRequest): Promise<MarketingUserProfile> {
    return request<MarketingUserProfile>("/users/profile/me", {
      method: "PUT",
      body: profileRequest,
    });
  }

  async getUserProfile(userId: number): Promise<MarketingUserProfile> {
    return request<MarketingUserProfile>(`/users/profile/${userId}`);
  }

  async updateUserProfile(userId: number, profileRequest: MarketingUserProfileRequest): Promise<MarketingUserProfile> {
    return request<MarketingUserProfile>(`/users/profile/${userId}`, {
      method: "PUT",
      body: profileRequest,
    });
  }

  async deleteUserProfile(userId: number): Promise<void> {
    return request<void>(`/users/profile/${userId}`, {
      method: "DELETE",
    });
  }
}

export const marketingUserProfileService = new MarketingUserProfileService();
