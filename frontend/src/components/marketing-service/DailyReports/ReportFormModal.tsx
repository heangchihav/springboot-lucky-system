import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { DailyReport, ReportItem } from "@/types/types";
import { usePortal } from "@/hooks/marketing-service/DailyReports/usePortal";

interface ReportFormModalProps {
    editingReport: DailyReport | null;
    onSave: (data: { reportDate: string; items: ReportItem[] }) => Promise<void>;
    onClose: () => void;
    loading: boolean;
}

export const ReportFormModal = ({ editingReport, onSave, onClose, loading }: ReportFormModalProps) => {
    const portalRoot = usePortal();
    const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
    const [reportItems, setReportItems] = useState<ReportItem[]>([
        { name: "ផែនការប្រចាំថ្ងៃ", values: ["• "] },
        { name: "លិទ្ធផលការងារសម្រេចបានប្រចាំថ្ងៃ", values: ["• "] },
        { name: "លិទ្ធផលការងារមិនទាន់បានសម្រេច", values: ["• "] },
        { name: "ព័តមានអំពីដៃគូប្រកួតប្រជែង", values: ["• "] }
    ]);

    useEffect(() => {
        if (editingReport) {
            setReportDate(editingReport.reportDate);
            setReportItems(editingReport.items.length > 0 ? editingReport.items : [
                { name: "ផែនការប្រចាំថ្ងៃ", values: ["• "] },
                { name: "លិទ្ធផលការងារសម្រេចបានប្រចាំថ្ងៃ", values: ["• "] },
                { name: "លិទ្ធផលការងារមិនទាន់បានសម្រេច", values: ["• "] },
                { name: "ព័តមានអំពីដៃគូប្រកួតប្រជែង", values: ["• "] }
            ]);
        } else {
            setReportDate(new Date().toISOString().split('T')[0]);
            setReportItems([
                { name: "ផែនការប្រចាំថ្ងៃ", values: ["• "] },
                { name: "លិទ្ធផលការងារសម្រេចបានប្រចាំថ្ងៃ", values: ["• "] },
                { name: "លិទ្ធផលការងារមិនទាន់បានសម្រេច", values: ["• "] },
                { name: "ព័តមានអំពីដៃគូប្រកួតប្រជែង", values: ["• "] }
            ]);
        }
    }, [editingReport]);

    const addReportItem = () => {
        setReportItems([...reportItems, { name: "", values: ["• "] }]);
    };

    const removeReportItem = (index: number) => {
        setReportItems(reportItems.filter((_, i) => i !== index));
    };

    const updateItemName = (index: number, name: string) => {
        const updated = [...reportItems];
        updated[index].name = name;
        setReportItems(updated);
    };

    const addValueToItem = (itemIndex: number) => {
        const updated = [...reportItems];
        updated[itemIndex].values.push("• ");
        setReportItems(updated);
    };

    const updateItemValue = (itemIndex: number, valueIndex: number, value: string) => {
        const updated = [...reportItems];
        updated[itemIndex].values[valueIndex] = value;
        setReportItems(updated);
    };

    const removeValueFromItem = (itemIndex: number, valueIndex: number) => {
        const updated = [...reportItems];
        updated[itemIndex].values = updated[itemIndex].values.filter((_, i) => i !== valueIndex);
        setReportItems(updated);
    };

    const handleSave = async () => {
        const validItems = reportItems.filter(item =>
            item.name.trim() &&
            item.values.some(v => v.trim() && v.trim() !== "•")
        );

        // Filter out empty values (only dot and space) from valid items
        const itemsWithFilteredValues = validItems.map(item => ({
            ...item,
            values: item.values.filter(v => v.trim() && v.trim() !== "•")
        }));

        if (itemsWithFilteredValues.length === 0) {
            return;
        }

        await onSave({ reportDate, items: itemsWithFilteredValues });
    };

    if (!portalRoot) return null;

    // Add custom scrollbar styles
    const scrollbarStyles = `
        .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(15, 23, 42, 0.5);
            border-radius: 0;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(51, 65, 85, 0.8);
            border-radius: 0;
            border: none;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(71, 85, 105, 0.9);
        }
        .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: rgba(51, 65, 85, 0.8) rgba(15, 23, 42, 0.5);
        }
    `;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 bg-black/60 backdrop-blur-sm">
            <style>{scrollbarStyles}</style>
            <div className="mx-4 max-h-[85vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-white/10 bg-slate-900/95 p-6 shadow-2xl custom-scrollbar">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">
                        {editingReport ? "Edit Report" : "Create New Report"}
                    </h2>
                    <button
                        className="rounded-full border border-white/20 bg-slate-900/60 p-2 text-slate-400 hover:border-white/40 hover:bg-slate-800/60 hover:text-white disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                        onClick={onClose}
                        disabled={loading}
                        title="Close form"
                    >
                        ×
                    </button>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="text-sm text-slate-300 block mb-2">
                            Report Date
                        </label>
                        <input
                            type="date"
                            className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-white focus:border-amber-400/60 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                            value={reportDate}
                            onChange={(e) => setReportDate(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <label className="text-sm text-slate-300">
                                Report Items
                            </label>
                            <button
                                className="rounded-xl border border-white/20 bg-slate-900/60 px-3 py-1 text-xs text-slate-300 hover:border-white/40 hover:bg-slate-800/60 hover:text-white disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                onClick={addReportItem}
                                disabled={loading}
                            >
                                + Add Item
                            </button>
                        </div>

                        <div className="space-y-4">
                            {reportItems.map((item, itemIndex) => (
                                <div key={itemIndex} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <input
                                            type="text"
                                            placeholder="Item name (e.g., Daily work achievements)"
                                            className="flex-1 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-amber-400/60 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                            value={item.name}
                                            onChange={(e) => updateItemName(itemIndex, e.target.value)}
                                            disabled={loading}
                                        />
                                        <button
                                            className="ml-2 rounded-full border border-red-500/30 bg-red-500/10 p-1 text-red-400 hover:border-red-500/50 hover:bg-red-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                            onClick={() => removeReportItem(itemIndex)}
                                            disabled={loading || reportItems.length === 1}
                                            title="Remove item"
                                        >
                                            ×
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs text-slate-400">
                                                Values
                                            </label>
                                            <button
                                                className="rounded-lg border border-white/20 bg-slate-900/60 px-2 py-1 text-xs text-slate-300 hover:border-white/40 hover:bg-slate-800/60 hover:text-white disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                                onClick={() => addValueToItem(itemIndex)}
                                                disabled={loading}
                                            >
                                                + Add Value
                                            </button>
                                        </div>

                                        {item.values.map((value, valueIndex) => (
                                            <div key={valueIndex} className="flex items-start gap-2">
                                                <textarea
                                                    placeholder="Enter value (supports multiple lines)"
                                                    className="flex-1 min-h-10 rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-amber-400/60 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed resize-y"
                                                    value={value}
                                                    onChange={(e) => updateItemValue(itemIndex, valueIndex, e.target.value)}
                                                    disabled={loading}
                                                />
                                                <button
                                                    className="rounded-full border border-red-500/30 bg-red-500/10 p-1 text-red-400 hover:border-red-500/50 hover:bg-red-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                                    onClick={() => removeValueFromItem(itemIndex, valueIndex)}
                                                    disabled={loading || item.values.length === 1}
                                                    title="Remove value"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            className="flex-1 rounded-2xl bg-gradient-to-r from-amber-500/90 to-orange-500/90 px-4 py-2 text-sm font-semibold text-white hover:from-amber-400 hover:to-orange-400 disabled:opacity-60 disabled:cursor-not-allowed"
                            onClick={handleSave}
                            disabled={loading}
                        >
                            {loading ? "Saving..." : editingReport ? "Update Report" : "Create Report"}
                        </button>
                        <button
                            className="rounded-2xl border border-white/20 bg-slate-900/60 px-6 py-2 text-sm font-semibold text-slate-300 hover:border-white/40 hover:bg-slate-800/60 hover:text-white disabled:opacity-60 disabled:cursor-not-allowed"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        portalRoot
    );
};