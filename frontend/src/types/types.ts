export interface ReportItem {
    name: string;
    values: string[];
}

export interface DailyReport {
    id: string;
    createdBy: string;
    createdByFullName: string;
    reportDate: string;
    createdAt: string;
    updatedAt: string;
    items: ReportItem[];
}

export interface CreateReportRequest {
    reportDate: string;
    items: ReportItem[];
}