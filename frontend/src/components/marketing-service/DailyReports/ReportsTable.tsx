import { useState, useEffect } from "react";
import { apiFetch } from "@/services/httpClient";
import { marketingUserAssignmentService, MarketingUserAssignment } from "@/services/marketingUserAssignmentService";
import { DailyReport } from "@/types/types";

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
            .map(assignment => assignment.subAreaName!)
            .filter((subArea): subArea is string => subArea !== undefined);
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
            start: new Date().toISOString().split('T')[0],
            end: new Date().toISOString().split('T')[0],
        },
        subArea: '',
        createdBy: '',
    });

    const [allSubAreas, setAllSubAreas] = useState<string[]>([]);
    const [allCreators, setAllCreators] = useState<string[]>([]);
    const [userSubAreaMap, setUserSubAreaMap] = useState<Record<string, string[]>>({});

    // Extract unique sub areas and creators from reports
    useEffect(() => {
        const extractFilterOptions = async () => {
            const subAreasSet = new Set<string>();
            const creatorsSet = new Set<string>();
            const subAreaMap: Record<string, string[]> = {};

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
                    });
                    const userId = await userIdResponse.json();

                    if (userId) {
                        const assignments = await marketingUserAssignmentService.getUserAssignments(userId);
                        const userSubAreas = assignments
                            .filter(assignment => assignment.active && assignment.subAreaName)
                            .map(assignment => assignment.subAreaName!)
                            .filter((subArea): subArea is string => subArea !== undefined);

                        subAreaMap[creator] = [...new Set(userSubAreas)]; // Remove duplicates

                        userSubAreas.forEach(subArea => {
                            subAreasSet.add(subArea);
                        });
                    }
                } catch (error) {
                    console.error(`Failed to fetch sub areas for ${creator}:`, error);
                    subAreaMap[creator] = [];
                }
            });

            await Promise.all(subAreaPromises);
            setAllSubAreas(Array.from(subAreasSet).sort());
            setUserSubAreaMap(subAreaMap);
        };

        if (reports.length > 0) {
            extractFilterOptions();
        }
    }, [reports]);

    const filteredReports = reports.filter(report => {
        const reportDate = new Date(report.reportDate);
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);

        if (reportDate < startDate || reportDate > endDate) {
            return false;
        }

        if (filters.createdBy && report.createdBy !== filters.createdBy) {
            return false;
        }

        // Sub area filter
        if (filters.subArea) {
            const userSubAreas = userSubAreaMap[report.createdBy] || [];
            if (!userSubAreas.includes(filters.subArea)) {
                return false;
            }
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
        <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/50 to-slate-800/50 p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-6 bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                Recent Reports
            </h2>

            {/* Filter Section */}
            <div className="mb-6 p-5 rounded-xl border border-white/10 bg-slate-900/40 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        Filters
                    </h3>
                    <button
                        onClick={clearFilters}
                        className="text-xs text-amber-400 hover:text-amber-300 transition-colors font-medium"
                    >
                        Clear All
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Date Range Filter */}
                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-2">
                            Date Range
                        </label>
                        <div className="flex gap-2 items-center">
                            <input
                                type="date"
                                value={filters.dateRange.start}
                                onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, start: e.target.value })}
                                className="flex-1 px-3 py-2.5 text-sm bg-slate-800/60 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-transparent transition-all"
                            />
                            <span className="text-slate-400 text-sm">→</span>
                            <input
                                type="date"
                                value={filters.dateRange.end}
                                onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, end: e.target.value })}
                                className="flex-1 px-3 py-2.5 text-sm bg-slate-800/60 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-transparent transition-all"
                            />
                        </div>
                    </div>

                    {/* Created By Filter */}
                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-2">
                            Created By
                        </label>
                        <select
                            value={filters.createdBy}
                            onChange={(e) => handleFilterChange('createdBy', e.target.value)}
                            className="w-full px-3 py-2.5 text-sm bg-slate-800/60 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-transparent transition-all"
                        >
                            <option value="" className="bg-slate-800">All Users</option>
                            {allCreators.map(creator => (
                                <option key={creator} value={creator} className="bg-slate-800">
                                    {creator}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Sub Area Filter */}
                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-2">
                            Sub Area
                        </label>
                        <select
                            value={filters.subArea}
                            onChange={(e) => handleFilterChange('subArea', e.target.value)}
                            className="w-full px-3 py-2.5 text-sm bg-slate-800/60 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-transparent transition-all"
                        >
                            <option value="" className="bg-slate-800">All Sub Areas</option>
                            {allSubAreas.map(subArea => (
                                <option key={subArea} value={subArea} className="bg-slate-800">
                                    {subArea}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {loading && reports.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-600 border-t-amber-400 mb-3"></div>
                    <p>Loading reports...</p>
                </div>
            ) : filteredReports.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-slate-400 mb-2 text-4xl">📋</div>
                    <p className="text-slate-400">
                        {reports.length === 0 ? "No reports found. Create your first daily report!" : "No reports match your filters."}
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-800/60 border-b border-white/10">
                                <th className="text-left py-4 px-4 text-sm font-semibold text-slate-200 whitespace-nowrap">Report Date</th>
                                <th className="text-left py-4 px-4 text-sm font-semibold text-slate-200 whitespace-nowrap">Created By</th>
                                <th className="text-left py-4 px-4 text-sm font-semibold text-slate-200 whitespace-nowrap">Sub Area</th>
                                <th className="text-left py-4 px-4 text-sm font-semibold text-slate-200 whitespace-nowrap">Item Name</th>
                                <th className="text-left py-4 px-4 text-sm font-semibold text-slate-200 whitespace-nowrap w-[300px]">Values/Points</th>
                                <th className="text-center py-4 px-4 text-sm font-semibold text-slate-200 whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredReports.map((report, reportIndex) => {
                                const itemCount = report.items.length;
                                return report.items.map((item, itemIndex) => (
                                    <tr
                                        key={`${report.id}-${itemIndex}`}
                                        className={`${itemIndex === itemCount - 1 && reportIndex !== filteredReports.length - 1 ? 'border-b border-white/10' : ''} hover:bg-slate-800/40 transition-colors align-top cursor-pointer group`}
                                        onClick={() => onView(report)}
                                    >
                                        {itemIndex === 0 && (
                                            <>
                                                <td className="py-4 px-4 align-top border-r border-white/5" rowSpan={itemCount}>
                                                    <div className="text-white font-semibold whitespace-nowrap">{formatDate(report.reportDate)}</div>
                                                </td>
                                                <td className="py-4 px-4 align-top border-r border-white/5" rowSpan={itemCount}>
                                                    <div className="text-slate-300 font-medium">{report.createdBy}</div>
                                                </td>
                                                <td className="py-4 px-4 align-top border-r border-white/5" rowSpan={itemCount}>
                                                    <SubAreaCell createdBy={report.createdBy} />
                                                </td>
                                            </>
                                        )}
                                        <td className="py-4 px-4 align-top border-r border-white/5">
                                            <div className="text-sm font-medium text-amber-300 truncate max-w-[200px]">
                                                {item.name}
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 align-top border-r border-white/5">
                                            <div className="text-sm text-slate-300 truncate max-w-[300px]">
                                                {item.values.join(', ')}
                                            </div>
                                        </td>
                                        {itemIndex === 0 && (
                                            <td className="py-4 px-4 align-top" rowSpan={itemCount}>
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        className="rounded-lg bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-400/30 px-4 py-2 text-xs font-semibold text-blue-300 hover:from-blue-500/30 hover:to-blue-600/30 hover:border-blue-400/50 transition-all duration-200 hover:scale-105"
                                                        onClick={(e) => onEdit(report, e)}
                                                        disabled={loading}
                                                    >
                                                        ✏️ Edit
                                                    </button>
                                                    <button
                                                        className="rounded-lg bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-400/30 px-4 py-2 text-xs font-semibold text-red-300 hover:from-red-500/30 hover:to-red-600/30 hover:border-red-400/50 transition-all duration-200 hover:scale-105"
                                                        onClick={(e) => onDelete(report.id, e)}
                                                        disabled={loading}
                                                    >
                                                        🗑️ Delete
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