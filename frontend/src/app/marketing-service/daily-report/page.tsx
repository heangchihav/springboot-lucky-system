"use client";

import { useEffect, useState } from "react";
import { MarketingServiceGuard } from "@/components/marketing-service/MarketingServiceGuard";
import { useToast } from "@/components/ui/Toast";
import { API_BASE_URL } from "@/config/env";
import { useDailyReports } from "@/hooks/marketing-service/DailyReports/useDailyReports";
import { ReportFormModal } from "@/components/marketing-service/DailyReports/ReportFormModal";
import { ReportViewModal } from "@/components/marketing-service/DailyReports/ReportViewModal";
import { ReportsTable } from "@/components/marketing-service/DailyReports/ReportsTable";
import { DailyReport } from "@/types/types";

const DailyReportPage = () => {
    const { showToast } = useToast();
    const {
        reports,
        loading,
        loadReports,
        createReport,
        updateReport,
        deleteReport
    } = useDailyReports();

    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingReport, setEditingReport] = useState<DailyReport | null>(null);
    const [viewingReport, setViewingReport] = useState<DailyReport | null>(null);

    useEffect(() => {
        loadReports();
    }, []);

    const handleSave = async (data: { reportDate: string; items: any[] }) => {
        try {
            if (editingReport) {
                await updateReport(editingReport.id, data);
                showToast("Report updated successfully");
            } else {
                await createReport(data);
                showToast("Report created successfully");
            }
            setShowCreateForm(false);
            setEditingReport(null);
            await loadReports();
        } catch (error) {
            showToast(
                error instanceof Error ? error.message : "Failed to save report",
                "error"
            );
        }
    };

    const handleEdit = (report: DailyReport, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingReport(report);
        setShowCreateForm(true);
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this report?")) {
            return;
        }

        try {
            await deleteReport(id);
            showToast("Report deleted successfully");
            await loadReports();
        } catch (error) {
            showToast(
                error instanceof Error ? error.message : "Failed to delete report",
                "error"
            );
        }
    };

    return (
        <MarketingServiceGuard>
            <div className="space-y-8">
                <header className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.4em] text-amber-300/70">
                        Marketing · Reports
                    </p>
                    <h1 className="text-3xl font-semibold text-white">
                        Daily Reports
                    </h1>
                    <p className="text-sm text-slate-300">
                        Create and manage daily marketing reports with structured data.
                    </p>
                </header>

                <div className="flex justify-between items-center">
                    <div></div>
                    <button
                        className="rounded-2xl bg-gradient-to-r from-amber-500/90 to-orange-500/90 px-6 py-2 text-sm font-semibold text-white hover:from-amber-400 hover:to-orange-400 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                        onClick={() => {
                            setEditingReport(null);
                            setShowCreateForm(true);
                        }}
                        disabled={loading}
                    >
                        Create New Report
                    </button>
                </div>

                <ReportsTable
                    reports={reports}
                    loading={loading}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onView={setViewingReport}
                />

                {showCreateForm && (
                    <ReportFormModal
                        editingReport={editingReport}
                        onSave={handleSave}
                        onClose={() => {
                            setShowCreateForm(false);
                            setEditingReport(null);
                        }}
                        loading={loading}
                    />
                )}

                {viewingReport && (
                    <ReportViewModal
                        report={viewingReport}
                        onClose={() => setViewingReport(null)}
                    />
                )}
            </div>
        </MarketingServiceGuard>
    );
};

export default DailyReportPage;