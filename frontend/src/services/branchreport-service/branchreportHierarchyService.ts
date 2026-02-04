import { apiFetch } from "@/services/httpClient";

export interface Area {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubArea {
  id: string;
  name: string;
  description?: string;
  areaId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Branch {
  id: string;
  name: string;
  description?: string;
  areaId: string;
  subAreaId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AreaPayload {
  name: string;
  description?: string;
}

export interface SubAreaPayload {
  name: string;
  description?: string;
  areaId: string;
}

export interface BranchPayload {
  name: string;
  description?: string;
  areaId: string;
  subAreaId: string;
}

export const branchreportHierarchyService = {
  // Area operations
  async listAreas(): Promise<Area[]> {
    const response = await apiFetch("/api/branchreport/areas");
    return response.json();
  },

  async getArea(id: string): Promise<Area> {
    const response = await apiFetch(`/api/branchreport/areas/${id}`);
    return response.json();
  },

  async createArea(payload: AreaPayload): Promise<Area> {
    const response = await apiFetch("/api/branchreport/areas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return response.json();
  },

  async updateArea(id: string, payload: AreaPayload): Promise<Area> {
    const response = await apiFetch(`/api/branchreport/areas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return response.json();
  },

  async deleteArea(id: string): Promise<void> {
    await apiFetch(`/api/branchreport/areas/${id}`, {
      method: "DELETE",
    });
  },

  // Sub-area operations
  async listSubAreas(areaId?: string): Promise<SubArea[]> {
    const url = areaId
      ? `/api/branchreport/sub-areas?areaId=${areaId}`
      : "/api/branchreport/sub-areas";
    const response = await apiFetch(url);
    return response.json();
  },

  async getSubArea(id: string): Promise<SubArea> {
    const response = await apiFetch(`/api/branchreport/sub-areas/${id}`);
    return response.json();
  },

  async createSubArea(payload: SubAreaPayload): Promise<SubArea> {
    const response = await apiFetch("/api/branchreport/sub-areas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: payload.name,
        description: payload.description,
        area_id: payload.areaId,
      }),
    });
    return response.json();
  },

  async updateSubArea(id: string, payload: SubAreaPayload): Promise<SubArea> {
    const response = await apiFetch(`/api/branchreport/sub-areas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: payload.name,
        description: payload.description,
        area_id: payload.areaId,
      }),
    });
    return response.json();
  },

  async deleteSubArea(id: string): Promise<void> {
    await apiFetch(`/api/branchreport/sub-areas/${id}`, {
      method: "DELETE",
    });
  },

  // Branch operations
  async listBranches(areaId?: string, subAreaId?: string): Promise<Branch[]> {
    const params = new URLSearchParams();
    if (areaId) params.append("areaId", areaId);
    if (subAreaId) params.append("subAreaId", subAreaId);
    const url = `/api/branchreport/branches${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await apiFetch(url);
    return response.json();
  },

  async getBranch(id: string): Promise<Branch> {
    const response = await apiFetch(`/api/branchreport/branches/${id}`);
    return response.json();
  },

  async createBranch(payload: BranchPayload): Promise<Branch> {
    const response = await apiFetch("/api/branchreport/branches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: payload.name,
        description: payload.description,
        area_id: payload.areaId,
        sub_area_id: payload.subAreaId,
      }),
    });
    return response.json();
  },

  async updateBranch(id: string, payload: BranchPayload): Promise<Branch> {
    const response = await apiFetch(`/api/branchreport/branches/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: payload.name,
        description: payload.description,
        area_id: payload.areaId,
        sub_area_id: payload.subAreaId,
      }),
    });
    return response.json();
  },

  async deleteBranch(id: string): Promise<void> {
    await apiFetch(`/api/branchreport/branches/${id}`, {
      method: "DELETE",
    });
  },
};
