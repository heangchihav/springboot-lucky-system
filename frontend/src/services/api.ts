import { API_BASE_URL } from "@/config/env";
import { apiFetch, configureHttpClient } from "./httpClient";

export interface LoginRequest {
  username: string;
  password: string;
  deviceId?: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  fullName: string;
}

export interface AuthResponse {
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
  tokenType: string;
}

export interface UserInfo {
  id: number;
  username: string;
  fullName: string;
  lastLoginAt?: string;
  userRoles?: UserRole[];
}

export interface UserRole {
  id: number;
  userId: number;
  roleId: number;
  serviceKey: string;
  active: boolean;
  assignedAt: string;
  assignedBy: number;
}

export interface UserServiceEntity {
  id: number;
  code: string;
  name: string;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

class ApiService {
  constructor() {
    configureHttpClient(() => this.refreshToken());
  }
  private getHeaders(): HeadersInit {
    return {
      "Content-Type": "application/json",
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get("content-type");

    if (!response.ok) {
      let errorData: any = { error: "Request failed" };

      if (contentType?.includes("application/json")) {
        try {
          errorData = await response.json();
        } catch {
          // Keep default error
        }
      }

      throw new ApiError(
        errorData.error || errorData.message || `HTTP ${response.status}`,
        response.status,
        errorData,
      );
    }

    if (contentType?.includes("application/json")) {
      return response.json();
    }

    return response.text() as unknown as T;
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const deviceId =
      data.deviceId ||
      `web-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const response = await apiFetch("/api/auth/login", {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        username: data.username,
        password: data.password,
        deviceId,
      }),
      skipAuthRefresh: true,
    });

    return this.handleResponse<AuthResponse>(response);
  }

  async register(data: RegisterRequest): Promise<void> {
    const response = await apiFetch("/api/auth/register", {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
      skipAuthRefresh: true,
    });

    await this.handleResponse<void>(response);
  }

  async refreshToken(deviceId?: string): Promise<AuthResponse> {
    const response = await apiFetch("/api/auth/refresh", {
      method: "POST",
      headers: this.getHeaders(),
      body: deviceId ? JSON.stringify({ deviceId }) : undefined,
      skipAuthRefresh: true,
    });

    return this.handleResponse<AuthResponse>(response);
  }

  async logout(): Promise<void> {
    const response = await apiFetch("/api/auth/logout", {
      method: "POST",
      headers: this.getHeaders(),
      skipAuthRefresh: true,
    });

    await this.handleResponse<void>(response);
  }

  async logoutAll(): Promise<void> {
    const response = await apiFetch("/api/auth/logout-all", {
      method: "POST",
      headers: this.getHeaders(),
      skipAuthRefresh: true,
    });

    await this.handleResponse<void>(response);
  }

  async getCurrentUser(): Promise<UserInfo> {
    const response = await apiFetch("/api/auth/me", {
      method: "GET",
      headers: this.getHeaders(),
    });

    return this.handleResponse<UserInfo>(response);
  }

  async getUserServices(userId: number): Promise<UserServiceEntity[]> {
    const response = await apiFetch(`/api/users/${userId}/services`, {
      method: "GET",
      headers: this.getHeaders(),
    });

    return this.handleResponse<UserServiceEntity[]>(response);
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      await this.getCurrentUser();
      return true;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        return false;
      }
      throw error;
    }
  }
}

export const apiService = new ApiService();
