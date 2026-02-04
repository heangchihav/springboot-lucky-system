"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

type CallStatusResponse = {
  key: string;
  label: string;
  createdBy: string;
  createdAt: string;
};

type ProcessedRecord = {
  arrivedAt: string;
  receiver: string;
  calledAt: string;
  status: string;
};

type StatusSummary = {
  arrivedAt: string;
  calledAt: string;
  count: number;
};

interface ExcelDataProcessorProps {
  isOpen: boolean;
  onClose: () => void;
  onDataProcessed: (entries: Record<string, string>, arrivedAt?: string) => void;
  statuses: CallStatusResponse[];
  filterArrivedDate?: string;
  filterCalledDate?: string;
}

export function ExcelDataProcessor({
  isOpen,
  onClose,
  onDataProcessed,
  statuses,
  filterArrivedDate,
  filterCalledDate
}: ExcelDataProcessorProps) {
  const [quickInputData, setQuickInputData] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  // Helper function to format date to dd/mm/yyyy without time
  const formatDate = (dateString: string): string => {
    // Extract date part from various formats
    const dateMatch = dateString.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (dateMatch) {
      const [, day, month, year] = dateMatch;
      // Ensure two-digit format
      const formattedDay = day.padStart(2, '0');
      const formattedMonth = month.padStart(2, '0');
      return `${formattedDay}/${formattedMonth}/${year}`;
    }

    // If no match, return original
    return dateString;
  };

  useEffect(() => {
    setPortalRoot(document.body);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setQuickInputData("");
    }
  }, [isOpen]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === "text/plain" || file.name.endsWith(".csv") || file.name.endsWith(".txt")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target?.result as string;
          setQuickInputData(text);
        };
        reader.readAsText(file);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    setQuickInputData(pastedData);
  };

  const normalizeDate = (value?: string) => {
    if (!value) return "";

    const slashMatch = value.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (slashMatch) {
      const [, day, month, year] = slashMatch;
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }

    const isoMatch = value.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      return `${day}/${month}/${year}`;
    }

    return "";
  };

  const isRecordAllowed = (arrivedAt?: string, calledAt?: string) => {
    const normalizedArrivedFilter = normalizeDate(filterArrivedDate);
    const normalizedCalledFilter = normalizeDate(filterCalledDate);

    if (!normalizedArrivedFilter && !normalizedCalledFilter) {
      return true;
    }

    if (normalizedArrivedFilter) {
      const normalizedArrived = normalizeDate(arrivedAt);
      if (normalizedArrived !== normalizedArrivedFilter) {
        return false;
      }
    }

    if (normalizedCalledFilter) {
      const normalizedCalled = normalizeDate(calledAt);
      if (normalizedCalled !== normalizedCalledFilter) {
        return false;
      }
    }

    return true;
  };

  const processQuickInputData = () => {
    try {
      const lines = quickInputData.trim().split('\n').filter(line => line.trim());
      const statusCountMap = new Map<string, number>();
      const processedRecords: ProcessedRecord[] = [];

      // Track the current arrived at date and receiver
      let currentArrivedAt = '';
      let currentReceiver = '';

      lines.forEach((line) => {
        // Split by tabs (Excel copy-paste uses tabs)
        const columns = line.split('\t');

        // Check if this is a main data row (starts with a number)
        const isFirstColumnNumber = columns[0]?.trim().match(/^\d+$/);

        if (isFirstColumnNumber && columns.length > 10) {
          // This is a main data row - extract arrived at from Column B and receiver from Column E
          const arrivedAtColumn = columns[1]?.trim(); // Column B - Arrived At
          const receiverColumn = columns[4]?.trim(); // Column E - Receiver

          if (arrivedAtColumn) {
            const normalizedArrivedAt = normalizeDate(arrivedAtColumn);
            if (normalizedArrivedAt) {
              currentArrivedAt = normalizedArrivedAt;
            }
          }

          // Update current receiver from Column E
          if (receiverColumn) {
            currentReceiver = receiverColumn;
          }

          // Also check Column K for multi-line content within the same column
          const statusColumn = columns[10]?.trim(); // Column K - might contain multi-line
          if (statusColumn) {
            // Split Column K content by newlines to handle multi-line content
            const kLines = statusColumn.split('\n').filter(kLine => kLine.trim());

            for (const kLine of kLines) {
              // Check if this line contains status and date
              const statusDateMatch = kLine.match(/^(.+?)\s+(\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{2}:\d{2})$/);

              if (statusDateMatch) {
                // Found status with date
                const status = statusDateMatch[1].trim();
                const calledAt = formatDate(statusDateMatch[2].trim());

                if (!isRecordAllowed(currentArrivedAt, calledAt)) {
                  return;
                }

                // For re-call data (when arrivedAt and calledAt are different), exclude "ដឹកដល់ផ្ទះ" status
                const isRecallData = currentArrivedAt && calledAt && normalizeDate(currentArrivedAt) !== normalizeDate(calledAt);
                if (isRecallData && status === "ដឹកដល់ផ្ទះ") {
                  return; // Skip this status for re-call data
                }

                // Validate that status exists in backend statuses
                const isValidStatus = statuses.some(backendStatus =>
                  backendStatus.label === status ||
                  backendStatus.key === status.toLowerCase().replace(/[^a-z0-9]/g, '-')
                );

                // Only process if status is valid and not empty
                if (status && isValidStatus && status.trim().length > 0) {

                  // Count status occurrences
                  statusCountMap.set(status, (statusCountMap.get(status) || 0) + 1);

                  processedRecords.push({
                    arrivedAt: currentArrivedAt,
                    receiver: currentReceiver,
                    calledAt,
                    status
                  });
                }
              } else {
                // Check if it's just a status without date - use today's date
                const statusOnly = kLine.trim();
                if (statusOnly && statusOnly.length > 0) {
                  // Validate that status exists in backend statuses (case-insensitive)
                  const isValidStatus = statuses.some(backendStatus =>
                    backendStatus.label.toLowerCase() === statusOnly.toLowerCase() ||
                    backendStatus.key === statusOnly.toLowerCase().replace(/[^a-z0-9]/g, '-')
                  );

                  if (isValidStatus) {
                    const today = new Date();
                    const day = today.getDate().toString().padStart(2, '0');
                    const month = (today.getMonth() + 1).toString().padStart(2, '0');
                    const year = today.getFullYear();
                    const todayFormatted = `${day}/${month}/${year}`;

                    if (!isRecordAllowed(currentArrivedAt, todayFormatted)) {
                      return;
                    }

                    statusCountMap.set(statusOnly, (statusCountMap.get(statusOnly) || 0) + 1);
                    processedRecords.push({
                      arrivedAt: currentArrivedAt,
                      receiver: currentReceiver,
                      calledAt: todayFormatted,
                      status: statusOnly
                    });
                  }
                }
              }
            }
          }
        } else if (!isFirstColumnNumber && currentArrivedAt) {
          // This might be a separate status line - check if it contains status and date
          const statusDateMatch = line.match(/^(.+?)\s+(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2})/);

          if (statusDateMatch) {
            // Found status with date
            const status = statusDateMatch[1].trim();
            const calledAt = formatDate(statusDateMatch[2].trim());

            if (!isRecordAllowed(currentArrivedAt, calledAt)) {
              return;
            }

            // For re-call data (when arrivedAt and calledAt are different), exclude "ដឹកដល់ផ្ទះ" status
            const isRecallData = currentArrivedAt && calledAt && normalizeDate(currentArrivedAt) !== normalizeDate(calledAt);
            if (isRecallData && status === "ដឹកដល់ផ្ទះ") {
              return; // Skip this status for re-call data
            }

            // Validate that status exists in backend statuses
            const isValidStatus = statuses.some(backendStatus =>
              backendStatus.label === status ||
              backendStatus.key === status.toLowerCase().replace(/[^a-z0-9]/g, '-')
            );

            // Only process if status is valid and not empty
            if (status && isValidStatus && status.trim().length > 0) {

              statusCountMap.set(status, (statusCountMap.get(status) || 0) + 1);
              processedRecords.push({ arrivedAt: currentArrivedAt, receiver: currentReceiver, calledAt, status });
            }
          } else {
            // Check if it's a status without date - use current date
            const statusOnly = line.trim();
            if (statusOnly && statusOnly.length > 0) {
              // Validate that status exists in backend statuses
              const isValidStatus = statuses.some(backendStatus =>
                backendStatus.label === statusOnly ||
                backendStatus.key === statusOnly.toLowerCase().replace(/[^a-z0-9]/g, '-')
              );

              if (isValidStatus) {
                const today = new Date();
                const day = today.getDate().toString().padStart(2, '0');
                const month = (today.getMonth() + 1).toString().padStart(2, '0');
                const year = today.getFullYear();
                const todayFormatted = `${day}/${month}/${year}`;

                if (!isRecordAllowed(currentArrivedAt, todayFormatted)) {
                  return;
                }

                statusCountMap.set(statusOnly, (statusCountMap.get(statusOnly) || 0) + 1);
                processedRecords.push({ arrivedAt: currentArrivedAt, receiver: currentReceiver, calledAt: todayFormatted, status: statusOnly });
              }
            }
          }
        }
      });

      // Start with zero values for every status to ensure previous inputs reset
      const populatedEntries: Record<string, string> = Object.fromEntries(
        statuses.map((status) => [status.key, "0"])
      );

      // Try to match status counts with existing statuses
      statusCountMap.forEach((count: number, statusName: string) => {
        // Find matching status by label (case-insensitive)
        const matchingStatus = statuses.find(s =>
          s.label.toLowerCase() === statusName.toLowerCase()
        );

        if (matchingStatus) {
          populatedEntries[matchingStatus.key] = count.toString();
        } else {
          // If no matching status, try to create a key from the status name
          const statusKey = statusName.toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');

          // Check if this status key exists
          const existingStatus = statuses.find(s => s.key === statusKey);
          if (existingStatus) {
            populatedEntries[statusKey] = count.toString();
          }
        }
      });

      // Get the most common arrivedAt date from processed records
      const arrivedAtCounts = new Map<string, number>();
      processedRecords.forEach(record => {
        if (record.arrivedAt) {
          arrivedAtCounts.set(record.arrivedAt, (arrivedAtCounts.get(record.arrivedAt) || 0) + 1);
        }
      });

      // Find the most common arrivedAt date
      let mostCommonArrivedAt = '';
      if (arrivedAtCounts.size > 0) {
        let maxCount = 0;
        arrivedAtCounts.forEach((count, arrivedAt) => {
          if (count > maxCount) {
            maxCount = count;
            mostCommonArrivedAt = arrivedAt;
          }
        });
      }

      onDataProcessed(populatedEntries, mostCommonArrivedAt);
      onClose();
      setQuickInputData("");
    } catch (error) {
      console.error('Error processing quick input data:', error);
    }
  };

  if (!isOpen) return null;

  return portalRoot && createPortal(
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-9999 p-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose}></div>
      <div className="relative z-10 w-full h-full overflow-y-auto flex items-center justify-center">
        <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Quick Data Entry</h2>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white transition-colors text-2xl"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-slate-300">
              Import Excel data to automatically populate form fields. Extracts Column B (Arrived At), Column E (Receiver), and Column K (Status).
            </p>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* File Upload Area */}
            <div className="space-y-4 mb-6">
              <div className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center transition-colors"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}>
                <div className={`space-y-4 ${isDragging ? 'scale-105' : ''}`}>
                  <div className="text-4xl">📁</div>
                  <div>
                    <p className="text-white font-medium">
                      {isDragging ? 'Drop your file here' : 'Drag & drop your Excel file here'}
                    </p>
                    <p className="text-slate-400 text-sm mt-1">
                      or click to browse
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".csv,.txt,.xlsx,.xls"
                    className="hidden"
                    id="file-upload"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const text = event.target?.result as string;
                          setQuickInputData(text);
                        };
                        reader.readAsText(file);
                      }
                    }}
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-flex items-center px-4 py-2 bg-linear-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:shadow-lg cursor-pointer transition-all duration-300"
                  >
                    Choose File
                  </label>
                </div>
              </div>
            </div>

            {/* Paste Area */}
            <div className="space-y-3">
              <label className="text-base font-medium text-slate-300">
                Or copy & paste data directly:
              </label>
              <textarea
                value={quickInputData}
                onChange={(e) => setQuickInputData(e.target.value)}
                onPaste={handlePaste}
                placeholder="Paste your Excel data here...

This tool automatically extracts:
• Column B: Arrived At dates
• Column E: Receiver names
• Column K: Status (with or without dates)

Example Excel format:
[A] [B: Date] [C] [D] [E: Receiver] ... [K: Status/Status+Date]
1  27/01/2026  ...  John Doe  ...  តេរួច 27/01/2026 11:41:10
2  27/01/2026  ...  Jane Smith  ...  មិនទាន់ទទួល

Tip: Copy rows from Excel and paste directly here"
                className="w-full h-48 px-4 py-3 text-base bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-400 resize-none focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-colors"
              />
            </div>

            {/* Data Preview */}
            {quickInputData.trim() && (
              <div className="space-y-3">
                <label className="text-base font-medium text-slate-300">
                  Extracted Data Preview (Column B: Arrived At, Column E: Receiver, Column K: Status):
                </label>
                <div className="bg-slate-800/50 border border-slate-600 rounded-xl p-4">
                  <div className="space-y-2">
                    {(() => {
                      try {
                        const lines = quickInputData.trim().split('\n').filter(line => line.trim());
                        const statusCountMap = new Map<string, number>();
                        const processedRecords: ProcessedRecord[] = [];

                        // Track the current arrived at date and receiver
                        let currentArrivedAt = '';
                        let currentReceiver = '';

                        lines.forEach(line => {
                          const columns = line.split('\t');

                          // Check if this is a main data row (starts with a number)
                          const isFirstColumnNumber = columns[0]?.trim().match(/^\d+$/);

                          if (isFirstColumnNumber && columns.length > 10) {
                            const arrivedAtColumn = columns[1]?.trim();
                            const receiverColumn = columns[4]?.trim(); // Column E - Receiver
                            const statusColumn = columns[10]?.trim();

                            if (arrivedAtColumn && statusColumn) {
                              // Parse arrived at date from Column B and update currentArrivedAt
                              let arrivedAt = '';
                              const dateMatch = arrivedAtColumn.match(/(\d{2}\/\d{2}\/\d{4})/);
                              if (dateMatch) {
                                arrivedAt = formatDate(dateMatch[1]);
                                currentArrivedAt = arrivedAt; // Update the tracking variable
                              }

                              // Update current receiver from Column E
                              if (receiverColumn) {
                                currentReceiver = receiverColumn;
                              }

                              // Split Column K content by newlines to handle multi-line content
                              const kLines = statusColumn.split('\n').filter(kLine => kLine.trim());

                              for (const kLine of kLines) {
                                // Check if this line contains status and date
                                const statusDateMatch = kLine.match(/^(.+?)\s+(\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{2}:\d{2})$/);

                                if (statusDateMatch) {
                                  // Found status with date
                                  const status = statusDateMatch[1].trim();
                                  const calledAt = formatDate(statusDateMatch[2].trim());

                                  if (!isRecordAllowed(currentArrivedAt, calledAt)) {
                                    return;
                                  }

                                  // For re-call data (when arrivedAt and calledAt are different), exclude "ដឹកដល់ផ្ទះ" status
                                  const isRecallData = currentArrivedAt && calledAt && normalizeDate(currentArrivedAt) !== normalizeDate(calledAt);
                                  if (isRecallData && status === "ដឹកដល់ផ្ទះ") {
                                    return; // Skip this status for re-call data
                                  }

                                  // Validate that status exists in backend statuses
                                  const isValidStatus = statuses.some(backendStatus =>
                                    backendStatus.label === status ||
                                    backendStatus.key === status.toLowerCase().replace(/[^a-z0-9]/g, '-')
                                  );

                                  // Only process if status is valid and not empty
                                  if (status && isValidStatus && status.trim().length > 0) {

                                    statusCountMap.set(status, (statusCountMap.get(status) || 0) + 1);
                                    processedRecords.push({ arrivedAt, receiver: currentReceiver, calledAt, status });
                                  }
                                } else {
                                  // Check if it's a status without date - use current date
                                  const statusOnly = kLine.trim();
                                  if (statusOnly && statusOnly.length > 0) {
                                    // Validate that status exists in backend statuses
                                    const isValidStatus = statuses.some(backendStatus =>
                                      backendStatus.label === statusOnly ||
                                      backendStatus.key === statusOnly.toLowerCase().replace(/[^a-z0-9]/g, '-')
                                    );

                                    if (isValidStatus) {
                                      // Use today's date in dd/mm/yyyy format
                                      const today = new Date();
                                      const day = today.getDate().toString().padStart(2, '0');
                                      const month = (today.getMonth() + 1).toString().padStart(2, '0');
                                      const year = today.getFullYear();
                                      const calledAt = `${day}/${month}/${year}`;

                                      statusCountMap.set(statusOnly, (statusCountMap.get(statusOnly) || 0) + 1);
                                      processedRecords.push({ arrivedAt, receiver: currentReceiver, calledAt, status: statusOnly });
                                    }
                                  }
                                }
                              }
                            }
                          } else if (!isFirstColumnNumber) {
                            // This might be a separate status line - check if it contains status and date
                            const statusDateMatch = line.match(/^(.+?)\s+(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2})/);

                            if (statusDateMatch) {
                              // Found status with date
                              const status = statusDateMatch[1].trim();
                              const calledAt = formatDate(statusDateMatch[2].trim());

                              if (!isRecordAllowed(currentArrivedAt, calledAt)) {
                                return;
                              }

                              // For re-call data (when arrivedAt and calledAt are different), exclude "ដឹកដល់ផ្ទះ" status
                              const isRecallData = currentArrivedAt && calledAt && normalizeDate(currentArrivedAt) !== normalizeDate(calledAt);
                              if (isRecallData && status === "ដឹកដល់ផ្ទះ") {
                                return; // Skip this status for re-call data
                              }

                              // Validate that status exists in backend statuses
                              const isValidStatus = statuses.some(backendStatus =>
                                backendStatus.label === status ||
                                backendStatus.key === status.toLowerCase().replace(/[^a-z0-9]/g, '-')
                              );

                              // Only process if status is valid and not empty
                              if (status && isValidStatus && status.trim().length > 0) {

                                statusCountMap.set(status, (statusCountMap.get(status) || 0) + 1);
                                processedRecords.push({ arrivedAt: currentArrivedAt, receiver: currentReceiver, calledAt, status });
                              }
                            } else {
                              // Check if it's a status without date - use current date
                              const statusOnly = line.trim();
                              if (statusOnly && statusOnly.length > 0) {
                                // Validate that status exists in backend statuses
                                const isValidStatus = statuses.some(backendStatus =>
                                  backendStatus.label === statusOnly ||
                                  backendStatus.key === statusOnly.toLowerCase().replace(/[^a-z0-9]/g, '-')
                                );

                                if (isValidStatus) {
                                  // Use today's date in dd/mm/yyyy format
                                  const today = new Date();
                                  const day = today.getDate().toString().padStart(2, '0');
                                  const month = (today.getMonth() + 1).toString().padStart(2, '0');
                                  const year = today.getFullYear();
                                  const calledAt = `${day}/${month}/${year}`;

                                  statusCountMap.set(statusOnly, (statusCountMap.get(statusOnly) || 0) + 1);
                                  processedRecords.push({ arrivedAt: currentArrivedAt, receiver: currentReceiver, calledAt, status: statusOnly });
                                }
                              }
                            }
                          }
                        });

                        if (processedRecords.length === 0) {
                          return (
                            <div className="text-sm text-slate-400">
                              No valid data found in Column B, Column E, and Column K. Please check your Excel format.
                            </div>
                          );
                        }

                        // Show status summary with single record per status
                        const totalRecords = processedRecords.length;
                        const statusSummaries = new Map<string, StatusSummary>();

                        // Group by status and get first record's dates for each status
                        processedRecords.forEach(record => {
                          if (!statusSummaries.has(record.status)) {
                            statusSummaries.set(record.status, {
                              arrivedAt: record.arrivedAt,
                              calledAt: record.calledAt,
                              count: 0
                            });
                          }
                          statusSummaries.get(record.status)!.count++;
                        });

                        // Group records by status for table display
                        const recordsByStatus = new Map<string, ProcessedRecord[]>();
                        processedRecords.forEach(record => {
                          if (!recordsByStatus.has(record.status)) {
                            recordsByStatus.set(record.status, []);
                          }
                          recordsByStatus.get(record.status)!.push(record);
                        });

                        return (
                          <>
                            <div className="text-sm text-green-400 font-medium mb-3">
                              ✅ Found {totalRecords} records with {statusSummaries.size} different statuses
                            </div>

                            {/* Status Summary */}
                            <div className="mb-6">
                              <div className="text-xs font-semibold text-slate-400 mb-2">Status Summary:</div>
                              <div className="space-y-1">
                                <div className="grid grid-cols-3 gap-2 text-xs font-mono mb-1">
                                  <div className="text-blue-300 font-semibold">Status</div>
                                  <div className="text-green-300">Called At</div>
                                  <div className="text-slate-400">Count</div>
                                </div>
                                {Array.from(statusSummaries.entries()).map(([status, data], index) => (
                                  <div key={index} className="grid grid-cols-3 gap-2 text-xs font-mono mb-1">
                                    <div className="text-white font-mono">{status}</div>
                                    <div className="text-green-300">{data.calledAt}</div>
                                    <div className="text-orange-300 font-bold">= {data.count}</div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Detailed Records Table */}
                            <div className="mt-6">
                              <div className="text-xs font-semibold text-slate-400 mb-3">All Records by Status:</div>
                              <div className="max-h-96 overflow-y-auto space-y-4">
                                {Array.from(recordsByStatus.entries()).map(([status, records], statusIndex) => (
                                  <div key={statusIndex} className="border border-slate-600 rounded-lg overflow-hidden">
                                    {/* Status Header */}
                                    <div className="bg-slate-700 px-3 py-2 flex items-center justify-between">
                                      <div className="text-sm font-semibold text-white">{status}</div>
                                      <div className="text-xs text-slate-300">{records.length} records</div>
                                    </div>

                                    {/* Records Table */}
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-xs">
                                        <thead className="bg-slate-800/50">
                                          <tr>
                                            <th className="px-3 py-2 text-left text-slate-400 font-semibold">#</th>
                                            <th className="px-3 py-2 text-left text-slate-400 font-semibold">Arrived At</th>
                                            <th className="px-3 py-2 text-left text-slate-400 font-semibold">Receiver</th>
                                            <th className="px-3 py-2 text-left text-slate-400 font-semibold">Called At</th>
                                            <th className="px-3 py-2 text-left text-slate-400 font-semibold">Status</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-700">
                                          {records.map((record, recordIndex) => (
                                            <tr key={recordIndex} className="hover:bg-slate-700/30">
                                              <td className="px-3 py-2 text-slate-400">{recordIndex + 1}</td>
                                              <td className="px-3 py-2 text-blue-300 font-mono">
                                                {record.arrivedAt || '-'}
                                              </td>
                                              <td className="px-3 py-2 text-purple-300 font-mono">
                                                {record.receiver || '-'}
                                              </td>
                                              <td className="px-3 py-2 text-green-300 font-mono">
                                                {record.calledAt}
                                              </td>
                                              <td className="px-3 py-2 text-white font-mono">
                                                {record.status}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        );
                      } catch (error) {
                        return (
                          <div className="text-sm text-red-400">
                            ❌ Error processing data: {error instanceof Error ? error.message : 'Unknown error'}
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-slate-700 bg-slate-900/50">
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => {
                  setQuickInputData("");
                }}
                className="flex-1 px-6 py-3 text-base font-semibold bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors"
              >
                Clear
              </button>
              <button
                onClick={processQuickInputData}
                disabled={!quickInputData.trim()}
                className="flex-1 px-6 py-3 text-base font-semibold bg-linear-to-r from-green-600 to-green-700 text-white rounded-xl hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                Process Data
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-4">
              Supported formats: CSV, TXT, Excel (.xlsx, .xls)
            </p>
          </div>
        </div>
      </div>
    </div>,
    portalRoot
  );
}
