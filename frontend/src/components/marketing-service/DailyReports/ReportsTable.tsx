import { DailyReport } from "@/types/types";
import { marketingUserAssignmentService, MarketingUserAssignment } from "@/services/marketingUserAssignmentService";
import { useState, useEffect } from "react";
import { apiFetch } from "@/services/httpClient";

interface ReportsTableProps {
    reports: DailyReport[];
    loading: boolean;
    onEdit: (report: DailyReport, e: React.MouseEvent) => void;
    onDelete: (id: string, e: React.MouseEvent) => void;
    onView: (report: DailyReport) => void;
}

interface FilterOptions {
    dateRange: {
        start: string;
        end: string;
    };
    subArea: string;
    createdBy: string;
}

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
};

const SubAreaCell = ({ createdBy }: { createdBy: string }) => {
    const [userAssignments, setUserAssignments] = useState<MarketingUserAssignment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserAssignments = async () => {
            try {
                // First get user ID from username
                const userIdResponse = await apiFetch(`/api/users/username/${createdBy}/id`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });
                const userId = await userIdResponse.json();

                if (userId) {
                    // Then get assignments by user ID
                    const assignments = await marketingUserAssignmentService.getUserAssignments(userId);
                    setUserAssignments(assignments);
                }
            } catch (error) {
                console.error('Failed to fetch user assignments:', error);
            } finally {
                setLoading(false);
            }
        };

        if (createdBy) {
            fetchUserAssignments();
        }
    }, [createdBy]);

    const getUserSubAreas = () => {
        const subAreas = userAssignments
            .filter(assignment => assignment.active && assignment.subAreaName)
            .map(assignment => assignment.subAreaName);
        return [...new Set(subAreas)]; // Remove duplicates
    };

    const userSubAreas = getUserSubAreas();

    if (loading) {
        return <div className="text-sm text-slate-400">Loading...</div>;
    }

    if (userSubAreas.length === 0) {
        return <div className="text-sm text-slate-400">-</div>;
    }

    return (
        <div className="text-sm text-slate-300">
            {userSubAreas.join(", ")}
        </div>
    );
};

export const ReportsTable = ({ reports, loading, onEdit, onDelete, onView }: ReportsTableProps) => {
    const [filters, setFilters] = useState<FilterOptions>({
        dateRange: {
            start: new Date().toISOString().split('T')[0], // Today
            end: new Date().toISOString().split('T')[0], // Today
        },
        subArea: '',
        createdBy: '',
    });

    const [allSubAreas, setAllSubAreas] = useState<string[]>([]);
    const [allCreators, setAllCreators] = useState<string[]>([]);

    // Extract unique sub areas and creators from reports
    useEffect(() => {
        const extractFilterOptions = async () => {
            const subAreasSet = new Set<string>();
            const creatorsSet = new Set<string>();

            // Get unique creators
            reports.forEach(report => {
                creatorsSet.add(report.createdBy);
            });

            setAllCreators(Array.from(creatorsSet).sort());

            // Get sub areas for each creator
            const subAreaPromises = Array.from(creatorsSet).map(async (creator) => {
                try {
                    const userIdResponse = await apiFetch(`/api/users/username/${creator}/id`, {
                        method: "GET",
                        headers: { "Content-Type": "application/json" },
                    });
                    const userId = await userIdResponse.json();

                    if (userId) {
                        const assignments = await marketingUserAssignmentService.getUserAssignments(userId);
                        assignments.forEach(assignment => {
                            if (assignment.active && assignment.subAreaName) {
                                subAreasSet.add(assignment.subAreaName);
                            }
                        });
                    }
                } catch (error) {
                    console.error(`Failed to fetch sub areas for ${creator}:`, error);
                }
            });

            await Promise.all(subAreaPromises);
            setAllSubAreas(Array.from(subAreasSet).sort());
        };

        if (reports.length > 0) {
            extractFilterOptions();
        }
    }, [reports]);

    // Filter reports based on selected filters
    const filteredReports = reports.filter(report => {
        // Date range filter
        const reportDate = new Date(report.reportDate);
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);

        if (reportDate < startDate || reportDate > endDate) {
            return false;
        }

        // Created by filter
        if (filters.createdBy && report.createdBy !== filters.createdBy) {
            return false;
        }

        // Sub area filter - need to check if report creator has the selected sub area
        if (filters.subArea) {
            // This is async, so we'll handle it differently
            // For now, return all reports and filter in render
        }

        return true;
    });

    const handleFilterChange = (key: keyof FilterOptions, value: any) => {
        setFilters(prev => ({
            ...prev,
            [key]: value,
        }));
    };

    const clearFilters = () => {
        setFilters({
            dateRange: {
                start: new Date().toISOString().split('T')[0],
                end: new Date().toISOString().split('T')[0],
            },
            subArea: '',
            createdBy: '',
        });
    };
    return (
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold text-white mb-6">
                Recent Reports
            </h2>

            {/* Filter Section */}
            <div className="mb-6 p-4 rounded-2xl border border-white/10 bg-white/5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-slate-300">Filters</h3>
                    <button
                        onClick={clearFilters}
                        className="text-xs text-slate-400 hover:text-slate-300 transition-colors"
                    >
                        Clear All
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Date Range Filter */}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-2">
                            Date Range
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="date"
                                value={filters.dateRange.start}
                                onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, start: e.target.value })}
                                className="flex-1 px-3 py-2 text-sm bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent"
                            />
                            <span className="text-slate-400 self-center">to</span>
                            <input
                                type="date"
                                value={filters.dateRange.end}
                                onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, end: e.target.value })}
                                className="flex-1 px-3 py-2 text-sm bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Created By Filter */}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-2">
                            Created By
                        </label>
                        <select
                            value={filters.createdBy}
                            onChange={(e) => handleFilterChange('createdBy', e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent"
                        >
                            <option value="" className="text-slate-900">All Users</option>
                            {allCreators.map(creator => (
                                <option key={creator} value={creator} className="text-slate-900">
                                    {creator}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Sub Area Filter */}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-2">
                            Sub Area
                        </label>
                        <select
                            value={filters.subArea}
                            onChange={(e) => handleFilterChange('subArea', e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent"
                        >
                            <option value="" className="text-slate-900">All Sub Areas</option>
                            {allSubAreas.map(subArea => (
                                <option key={subArea} value={subArea} className="text-slate-900">
                                    {subArea}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {loading && reports.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                    Loading reports...
                </div>
            ) : filteredReports.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                    {reports.length === 0 ? "No reports found. Create your first daily report!" : "No reports match your filters."}
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Report Date</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Created By</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Sub Area</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Item Name</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Values/Points</th>
                                <th className="text-center py-3 px-4 text-sm font-medium text-slate-300">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredReports.map((report, reportIndex) => {
                                const itemCount = report.items.length;
                                return report.items.map((item, itemIndex) => (
                                    <tr
                                        key={`${report.id}-${itemIndex}`}
                                        className={`${itemIndex === itemCount - 1 && reportIndex !== filteredReports.length - 1 ? 'border-b border-white/5' : ''} hover:bg-white/5 transition-colors align-top cursor-pointer`}
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
                                                <td className="py-3 px-4 align-top" rowSpan={itemCount}>
                                                    <SubAreaCell createdBy={report.createdBy} />
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