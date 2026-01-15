import { useState } from "react";
import { API_BASE_URL } from "@/config/env";
import { DailyReport, CreateReportRequest } from "@/types/types";

export const useDailyReports = () => {
    const [reports, setReports] = useState<DailyReport[]>([]);
    const [loading, setLoading] = useState(false);

    const loadReports = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/marketing/daily-reports`, {
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error("Failed to load reports");
            }

            const data = await response.json();
            setReports(data);
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const createReport = async (payload: CreateReportRequest) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/marketing/daily-reports`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error("Failed to create report");
            }

            return await response.json();
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const updateReport = async (id: string, payload: CreateReportRequest) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/marketing/daily-reports/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error("Failed to update report");
            }

            return await response.json();
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const deleteReport = async (id: string) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/marketing/daily-reports/${id}`, {
                method: "DELETE",
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error("Failed to delete report");
            }
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return {
        reports,
        loading,
        loadReports,
        createReport,
        updateReport,
        deleteReport
    };
};