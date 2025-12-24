// API service for Area and Branch management in call-service microservice

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export interface Area {
  id: number;
  name: string;
  description?: string;
  code?: string;
  active: boolean;
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
  createdAt: string;
  updatedAt?: string;
}

export interface UserBranchAssignment {
  id: number;
  branchId: number;
  branchName: string;
  active: boolean;
}

export interface CreateAreaRequest {
  name: string;
  description?: string;
  code?: string;
  active: boolean;
}

export interface CreateBranchRequest {
  name: string;
  description?: string;
  code?: string;
  address?: string;
  phone?: string;
  email?: string;
  active: boolean;
  area: {
    id: number;
  };
}

class AreaBranchService {
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage;
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || `HTTP ${response.status}`;
      } catch {
        errorMessage = errorText || `HTTP ${response.status}`;
      }
      
      throw new Error(errorMessage);
    }
    
    return response.json();
  }

  // Area API calls
  async getAreas(): Promise<Area[]> {
    const response = await fetch(`${API_BASE}/calls/areas`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return this.handleResponse<Area[]>(response);
  }

  async getActiveAreas(): Promise<Area[]> {
    const response = await fetch(`${API_BASE}/calls/areas/active`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return this.handleResponse<Area[]>(response);
  }

  async getAreaById(id: number): Promise<Area> {
    const response = await fetch(`${API_BASE}/calls/areas/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return this.handleResponse<Area>(response);
  }

  async createArea(area: CreateAreaRequest): Promise<Area> {
    const response = await fetch(`${API_BASE}/calls/areas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(area),
    });
    
    return this.handleResponse<Area>(response);
  }

  async updateArea(id: number, area: Partial<CreateAreaRequest>): Promise<Area> {
    const response = await fetch(`${API_BASE}/calls/areas/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(area),
    });
    
    return this.handleResponse<Area>(response);
  }

  async deleteArea(id: number): Promise<void> {
    const response = await fetch(`${API_BASE}/calls/areas/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Failed to delete area: HTTP ${response.status}`);
    }
  }

  async activateArea(id: number): Promise<Area> {
    const response = await fetch(`${API_BASE}/calls/areas/${id}/activate`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return this.handleResponse<Area>(response);
  }

  async deactivateArea(id: number): Promise<Area> {
    const response = await fetch(`${API_BASE}/calls/areas/${id}/deactivate`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return this.handleResponse<Area>(response);
  }

  async searchAreas(name: string): Promise<Area[]> {
    const response = await fetch(`${API_BASE}/calls/areas/search?name=${encodeURIComponent(name)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return this.handleResponse<Area[]>(response);
  }

  // Branch API calls
  async getBranches(): Promise<Branch[]> {
    const response = await fetch(`${API_BASE}/calls/branches`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return this.handleResponse<Branch[]>(response);
  }

  async getActiveBranches(): Promise<Branch[]> {
    const response = await fetch(`${API_BASE}/calls/branches/active`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return this.handleResponse<Branch[]>(response);
  }

  async getBranchesByArea(areaId: number): Promise<Branch[]> {
    const response = await fetch(`${API_BASE}/calls/branches/area/${areaId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return this.handleResponse<Branch[]>(response);
  }

  async getBranchById(id: number): Promise<Branch> {
    const response = await fetch(`${API_BASE}/calls/branches/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return this.handleResponse<Branch>(response);
  }

  async createBranch(branch: CreateBranchRequest): Promise<Branch> {
    const response = await fetch(`${API_BASE}/calls/branches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(branch),
    });
    
    return this.handleResponse<Branch>(response);
  }

  async updateBranch(id: number, branch: Partial<CreateBranchRequest>): Promise<Branch> {
    const response = await fetch(`${API_BASE}/calls/branches/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(branch),
    });
    
    return this.handleResponse<Branch>(response);
  }

  async deleteBranch(id: number): Promise<void> {
    const response = await fetch(`${API_BASE}/calls/branches/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Failed to delete branch: HTTP ${response.status}`);
    }
  }

  async activateBranch(id: number): Promise<Branch> {
    const response = await fetch(`${API_BASE}/calls/branches/${id}/activate`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return this.handleResponse<Branch>(response);
  }

  async deactivateBranch(id: number): Promise<Branch> {
    const response = await fetch(`${API_BASE}/calls/branches/${id}/deactivate`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return this.handleResponse<Branch>(response);
  }

  async searchBranches(name: string, areaId?: number): Promise<Branch[]> {
    const params = new URLSearchParams({ name });
    if (areaId) {
      params.append('areaId', areaId.toString());
    }
    
    const response = await fetch(`${API_BASE}/calls/branches/search?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return this.handleResponse<Branch[]>(response);
  }

  async getUserBranchesByUser(userId: number): Promise<UserBranchAssignment[]> {
    const response = await fetch(`${API_BASE}/calls/user-branches/user/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await this.handleResponse<any[]>(response);
    return data.map((assignment) => ({
      id: assignment.id,
      branchId: assignment.branchId,
      branchName: assignment.branchName,
      active: assignment.active,
    }));
  }

  async assignUserToBranch(userId: number, branchId: number): Promise<void> {
    const response = await fetch(`${API_BASE}/calls/user-branches/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, branchId }),
    });

    await this.handleResponse(response);
  }

  async removeUserFromBranch(userId: number, branchId: number): Promise<void> {
    const response = await fetch(`${API_BASE}/calls/user-branches/remove`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, branchId }),
    });

    await this.handleResponse(response);
  }
}

export const areaBranchService = new AreaBranchService();
