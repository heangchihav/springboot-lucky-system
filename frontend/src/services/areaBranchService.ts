// API service for Area and Branch management in call-service microservice
import { apiFetch } from "./httpClient";

export interface Area {
  id: number;
  name: string;
  description?: string;
  code?: string;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Subarea {
  id: number;
  name: string;
  description?: string;
  code?: string;
  active: boolean;
  areaId: number;
  areaName: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Branch {
  id: number;
  name: string;
  description?: string;
  code?: string;
  address?: string;
  phone?: string;
  email?: string;
  active: boolean;
  areaId: number;
  areaName: string;
  subareaId: number;
  subareaName: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UserBranchAssignment {
  id: number;
  branchId: number;
  branchName: string;
  areaId?: number;
  areaName?: string;
  active: boolean;
}

export interface CreateAreaRequest {
  name: string;
  description?: string;
  code?: string;
  active: boolean;
}

export interface CreateSubareaRequest {
  name: string;
  description?: string;
  code?: string;
  active: boolean;
  areaId: number;
}

export interface CreateBranchRequest {
  name: string;
  description?: string;
  code?: string;
  address?: string;
  phone?: string;
  email?: string;
  active: boolean;
  subareaId: number;
}

class AreaBranchService {
  private getHeaders(): HeadersInit {
    return {
      "Content-Type": "application/json",
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage;

      try {
        const errorJson = JSON.parse(errorText);
        errorMessage =
          errorJson.message || errorJson.error || `HTTP ${response.status}`;
      } catch {
        errorMessage = errorText || `HTTP ${response.status}`;
      }

      throw new Error(errorMessage);
    }

    return response.json();
  }

  // Area API calls
  async getAreas(): Promise<Area[]> {
    const response = await apiFetch("/api/calls/areas", {
      method: "GET",
      headers: this.getHeaders(),
    });

    return this.handleResponse<Area[]>(response);
  }

  async getActiveAreas(): Promise<Area[]> {
    const response = await apiFetch("/api/calls/areas/active", {
      method: "GET",
      headers: this.getHeaders(),
    });

    return this.handleResponse<Area[]>(response);
  }

  async getAreaById(id: number): Promise<Area> {
    const response = await apiFetch(`/api/calls/areas/${id}`, {
      method: "GET",
      headers: this.getHeaders(),
    });

    return this.handleResponse<Area>(response);
  }

  async createArea(area: CreateAreaRequest): Promise<Area> {
    const response = await apiFetch("/api/calls/areas", {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(area),
    });

    return this.handleResponse<Area>(response);
  }

  async updateArea(
    id: number,
    area: Partial<CreateAreaRequest>,
  ): Promise<Area> {
    const response = await apiFetch(`/api/calls/areas/${id}`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify(area),
    });

    return this.handleResponse<Area>(response);
  }

  async deleteArea(id: number): Promise<void> {
    const response = await apiFetch(`/api/calls/areas/${id}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        errorText || `Failed to delete area: HTTP ${response.status}`,
      );
    }
  }

  async activateArea(id: number): Promise<Area> {
    const response = await apiFetch(`/api/calls/areas/${id}/activate`, {
      method: "PUT",
      headers: this.getHeaders(),
    });

    return this.handleResponse<Area>(response);
  }

  async deactivateArea(id: number): Promise<Area> {
    const response = await apiFetch(`/api/calls/areas/${id}/deactivate`, {
      method: "PUT",
      headers: this.getHeaders(),
    });

    return this.handleResponse<Area>(response);
  }

  async searchAreas(name: string): Promise<Area[]> {
    const response = await apiFetch(
      `/api/calls/areas/search?name=${encodeURIComponent(name)}`,
      {
        method: "GET",
        headers: this.getHeaders(),
      },
    );

    return this.handleResponse<Area[]>(response);
  }

  // Subarea API calls
  async getSubareas(): Promise<Subarea[]> {
    const response = await apiFetch("/api/calls/subareas", {
      method: "GET",
      headers: this.getHeaders(),
    });

    return this.handleResponse<Subarea[]>(response);
  }

  async getActiveSubareas(): Promise<Subarea[]> {
    const response = await apiFetch("/api/calls/subareas/active", {
      method: "GET",
      headers: this.getHeaders(),
    });

    return this.handleResponse<Subarea[]>(response);
  }

  async getSubareasByArea(areaId: number): Promise<Subarea[]> {
    const response = await apiFetch(`/api/calls/subareas/area/${areaId}`, {
      method: "GET",
      headers: this.getHeaders(),
    });

    return this.handleResponse<Subarea[]>(response);
  }

  async getSubareaById(id: number): Promise<Subarea> {
    const response = await apiFetch(`/api/calls/subareas/${id}`, {
      method: "GET",
      headers: this.getHeaders(),
    });

    return this.handleResponse<Subarea>(response);
  }

  async createSubarea(subarea: CreateSubareaRequest): Promise<Subarea> {
    const response = await apiFetch("/api/calls/subareas", {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(subarea),
    });

    return this.handleResponse<Subarea>(response);
  }

  async updateSubarea(
    id: number,
    subarea: Partial<CreateSubareaRequest>,
  ): Promise<Subarea> {
    const response = await apiFetch(`/api/calls/subareas/${id}`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify(subarea),
    });

    return this.handleResponse<Subarea>(response);
  }

  async deleteSubarea(id: number): Promise<void> {
    const response = await apiFetch(`/api/calls/subareas/${id}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        errorText || `Failed to delete subarea: HTTP ${response.status}`,
      );
    }
  }

  async activateSubarea(id: number): Promise<Subarea> {
    const response = await apiFetch(`/api/calls/subareas/${id}/activate`, {
      method: "PUT",
      headers: this.getHeaders(),
    });

    return this.handleResponse<Subarea>(response);
  }

  async deactivateSubarea(id: number): Promise<Subarea> {
    const response = await apiFetch(`/api/calls/subareas/${id}/deactivate`, {
      method: "PUT",
      headers: this.getHeaders(),
    });

    return this.handleResponse<Subarea>(response);
  }

  async searchSubareas(name: string, areaId?: number): Promise<Subarea[]> {
    const params = new URLSearchParams({ name });
    if (areaId) {
      params.append("areaId", areaId.toString());
    }

    const response = await apiFetch(
      `/api/calls/subareas/search?${params}`,
      {
        method: "GET",
        headers: this.getHeaders(),
      },
    );

    return this.handleResponse<Subarea[]>(response);
  }

  // Branch API calls
  async getBranches(): Promise<Branch[]> {
    const response = await apiFetch("/api/calls/branches", {
      method: "GET",
      headers: this.getHeaders(),
    });

    return this.handleResponse<Branch[]>(response);
  }

  async getActiveBranches(): Promise<Branch[]> {
    const response = await apiFetch("/api/calls/branches/active", {
      method: "GET",
      headers: this.getHeaders(),
    });

    return this.handleResponse<Branch[]>(response);
  }

  async getBranchesBySubarea(subareaId: number): Promise<Branch[]> {
    const response = await apiFetch(`/api/calls/branches/subarea/${subareaId}`, {
      method: "GET",
      headers: this.getHeaders(),
    });

    return this.handleResponse<Branch[]>(response);
  }

  async getBranchById(id: number): Promise<Branch> {
    const response = await apiFetch(`/api/calls/branches/${id}`, {
      method: "GET",
      headers: this.getHeaders(),
    });

    return this.handleResponse<Branch>(response);
  }

  async createBranch(branch: CreateBranchRequest): Promise<Branch> {
    const response = await apiFetch("/api/calls/branches", {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(branch),
    });

    return this.handleResponse<Branch>(response);
  }

  async updateBranch(
    id: number,
    branch: Partial<CreateBranchRequest>,
  ): Promise<Branch> {
    const response = await apiFetch(`/api/calls/branches/${id}`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify(branch),
    });

    return this.handleResponse<Branch>(response);
  }

  async deleteBranch(id: number): Promise<void> {
    const response = await apiFetch(`/api/calls/branches/${id}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        errorText || `Failed to delete branch: HTTP ${response.status}`,
      );
    }
  }

  async activateBranch(id: number): Promise<Branch> {
    const response = await apiFetch(`/api/calls/branches/${id}/activate`, {
      method: "PUT",
      headers: this.getHeaders(),
    });

    return this.handleResponse<Branch>(response);
  }

  async deactivateBranch(id: number): Promise<Branch> {
    const response = await apiFetch(
      `/api/calls/branches/${id}/deactivate`,
      {
        method: "PUT",
        headers: this.getHeaders(),
      },
    );

    return this.handleResponse<Branch>(response);
  }

  async searchBranches(name: string, subareaId?: number): Promise<Branch[]> {
    const params = new URLSearchParams({ name });
    if (subareaId) {
      params.append("subareaId", subareaId.toString());
    }

    const response = await apiFetch(
      `/api/calls/branches/search?${params}`,
      {
        method: "GET",
        headers: this.getHeaders(),
      },
    );

    return this.handleResponse<Branch[]>(response);
  }

  async getUserBranchesByUser(userId: number): Promise<UserBranchAssignment[]> {
    const response = await apiFetch(
      `/api/calls/user-branches/user/${userId}`,
      {
        method: "GET",
        headers: this.getHeaders(),
      },
    );

    const data = await this.handleResponse<any[]>(response);
    return data.map((assignment) => ({
      id: assignment.id,
      branchId: assignment.branchId,
      branchName: assignment.branchName,
      areaId: assignment.areaId,
      areaName: assignment.areaName,
      active: assignment.active,
    }));
  }

  async assignUserToBranch(userId: number, branchId: number): Promise<void> {
    const response = await apiFetch("/api/calls/user-branches/assign", {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ userId, branchId }),
    });

    await this.handleResponse(response);
  }

  async assignUserToBranches(userId: number, branchIds: number[]): Promise<void> {
    const response = await apiFetch("/api/calls/user-branches/assign-bulk", {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ userId, branchIds }),
    });

    await this.handleResponse(response);
  }

  async removeUserFromBranch(userId: number, branchId: number): Promise<void> {
    const response = await apiFetch("/api/calls/user-branches/remove", {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ userId, branchId }),
    });

    await this.handleResponse(response);
  }

  async removeUserFromBranches(userId: number, branchIds: number[]): Promise<void> {
    const response = await apiFetch("/api/calls/user-branches/remove-bulk", {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ userId, branchIds }),
    });

    await this.handleResponse(response);
  }
}

export const areaBranchService = new AreaBranchService();
