import { apiFetch } from "@/services/httpClient";

export interface Service {
  id: number;
  code: string;
  name: string;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateServiceRequest {
  code: string;
  name: string;
  description?: string;
}

export interface UpdateServiceRequest {
  name: string;
  description?: string;
}

class ServiceService {
  private getAuthHeaders() {
    return {
      "Content-Type": "application/json",
    };
  }

  async getAllServices(): Promise<Service[]> {
    try {
      const response = await apiFetch("/api/services", {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching services:", error);
      throw error;
    }
  }

  async getActiveServices(): Promise<Service[]> {
    try {
      const response = await apiFetch("/api/services/active", {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching active services:", error);
      throw error;
    }
  }

  async getServiceByCode(code: string): Promise<Service> {
    try {
      const response = await apiFetch(`/api/services/code/${code}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching service:", error);
      throw error;
    }
  }

  async createService(serviceData: CreateServiceRequest): Promise<Service> {
    try {
      const response = await apiFetch("/api/services", {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(serviceData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating service:", error);
      throw error;
    }
  }

  async updateService(
    id: number,
    serviceData: UpdateServiceRequest,
  ): Promise<Service> {
    try {
      const response = await apiFetch(`/api/services/${id}`, {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(serviceData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating service:", error);
      throw error;
    }
  }

  async activateService(id: number): Promise<void> {
    try {
      const response = await apiFetch(`/api/services/${id}/activate`, {
        method: "POST",
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error activating service:", error);
      throw error;
    }
  }

  async deactivateService(id: number): Promise<void> {
    try {
      const response = await apiFetch(`/api/services/${id}/deactivate`, {
        method: "POST",
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error deactivating service:", error);
      throw error;
    }
  }

  async deleteService(id: number): Promise<void> {
    try {
      const response = await apiFetch(`/api/services/${id}`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error deleting service:", error);
      throw error;
    }
  }
}

export const serviceService = new ServiceService();
