import { DailyReport } from "@/types/types";

interface ReportsTableProps {
    reports: DailyReport[];
    loading: boolean;
    onEdit: (report: DailyReport, e: React.MouseEvent) => void;
    onDelete: (id: string, e: React.MouseEvent) => void;
    onView: (report: DailyReport) => void;
}

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
};

export const ReportsTable = ({ reports, loading, onEdit, onDelete, onView }: ReportsTableProps) => {
    return (
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold text-white mb-6">
                Recent Reports
            </h2>

            {loading && reports.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                    Loading reports...
                </div>
            ) : reports.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                    No reports found. Create your first daily report!
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Report Date</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Created By</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Item Name</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Values/Points</th>
                                <th className="text-center py-3 px-4 text-sm font-medium text-slate-300">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reports.map((report, reportIndex) => {
                                const itemCount = report.items.length;
                                return report.items.map((item, itemIndex) => (
                                    <tr
                                        key={`${report.id}-${itemIndex}`}
                                        className={`${itemIndex === itemCount - 1 && reportIndex !== reports.length - 1 ? 'border-b border-white/5' : ''} hover:bg-white/5 transition-colors align-top cursor-pointer`}
                                        onClick={() => onView(report)}
                                    >
                                        {itemIndex === 0 && (
                                            <>
                                                <td className="py-3 px-4 align-top" rowSpan={itemCount}>
                                                    <div className="text-white font-medium">{formatDate(report.reportDate)}</div>
                                                </td>
                                                <td className="py-3 px-4 align-top" rowSpan={itemCount}>
                                                    <div className="text-slate-300">{report.createdBy}</div>
                                                </td>
                                            </>
                                        )}
                                        <td className="py-3 px-4 align-top">
                                            <div className="text-sm font-medium text-slate-200 whitespace-nowrap">{item.name}</div>
                                        </td>
                                        <td className="py-3 px-4 align-top">
                                            <div className="text-sm text-slate-400">
                                                {item.values.join(', ')}
                                            </div>
                                        </td>
                                        {itemIndex === 0 && (
                                            <td className="py-3 px-4 align-top" rowSpan={itemCount}>
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        className="rounded-xl bg-white/10 px-3 py-1 text-xs font-medium text-white hover:bg-white/20 transition-colors"
                                                        onClick={(e) => onEdit(report, e)}
                                                        disabled={loading}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        className="rounded-xl bg-red-500/20 px-3 py-1 text-xs font-medium text-red-300 hover:bg-red-500/30 transition-colors"
                                                        onClick={(e) => onDelete(report.id, e)}
                                                        disabled={loading}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ));
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
};