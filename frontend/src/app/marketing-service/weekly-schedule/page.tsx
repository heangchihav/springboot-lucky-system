"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { MarketingServiceGuard } from "@/components/marketing-service/MarketingServiceGuard";
import { useToast } from "@/components/ui/Toast";

/* ================= TYPES ================= */

type DaySchedule = {
  date: string;
  dayName: string;
  isDayOff: boolean;
  remark: string;
  morning: string;
  afternoon: string;
  inMonth: boolean;
};

type WeekSchedule = {
  weekNumber: number;
  days: DaySchedule[];
};

type MonthlySchedule = {
  year: number;
  month: number;
  weeks: WeekSchedule[];
};

type UserInfo = {
  fullName: string;
  phoneNumber: string;
  subArea: string;
  month: number;
  week: number;
};

type SubmittedSchedule = {
  userInfo: UserInfo;
  selectedWeek: number | null;
  currentWeekIndex: number | null;
  weekDetails: {
    weekNumber: number;
    days: Array<{
      dayNumber: number;
      dayName: string;
      date: string;
      isDayOff: boolean;
      morningSchedule: string;
      afternoonSchedule: string;
      inMonth: boolean;
    }>;
  } | null;
  timestamp: string;
};

/* ================= UTILS ================= */

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function formatLocalDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * BUSINESS RULES:
 * - Week = Monday → Sunday
 * - Cross-month weeks allowed
 * - Late month week can extend into next month
 * - BUT new month first Monday = Week 1
 * - Week numbers RESET every month
 */
function generateBusinessMonth(year: number, month: number): WeekSchedule[] {
  const weeks: WeekSchedule[] = [];

  const firstOfMonth = new Date(year, month - 1, 1, 12);
  const lastOfMonth = new Date(year, month, 0, 12);

  // find Monday on/before first day
  const start = new Date(firstOfMonth);
  const day = start.getDay(); // 0=Sun
  const diffToMonday = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diffToMonday);

  let current = new Date(start);

  let weekNumber = 0; // will start when first Monday of month appears
  let startedMonth = false;

  while (current <= lastOfMonth || current.getDay() !== 1) {
    const days: DaySchedule[] = [];

    const weekStart = new Date(current);

    for (let i = 0; i < 7; i++) {
      const d = new Date(current.getFullYear(), current.getMonth(), current.getDate(), 12);

      days.push({
        date: formatLocalDate(d),
        dayName: dayNames[d.getDay()],
        isDayOff: false,
        remark: "",
        morning: "",
        afternoon: "",
        inMonth: d.getMonth() === month - 1,
      });

      current.setDate(current.getDate() + 1);
    }

    const hasMonthDay = days.some(d => d.inMonth);

    // detect first Monday inside month
    if (!startedMonth) {
      const mondayInMonth = days.find(d => d.dayName === "Monday" && d.inMonth);
      if (mondayInMonth) {
        startedMonth = true;
        weekNumber = 1;
      }
    } else {
      weekNumber++;
    }

    if (hasMonthDay && startedMonth) {
      weeks.push({
        weekNumber,
        days,
      });
    }
  }

  return weeks;
}

const usePortal = () => {
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPortalRoot(document.body);
    }
  }, []);

  return portalRoot;
};

/* ================= PAGE ================= */

export default function MonthlySchedulePage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [schedule, setSchedule] = useState<MonthlySchedule | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [currentWeekIndex, setCurrentWeekIndex] = useState<number | null>(null);
  const [showSaveTable, setShowSaveTable] = useState(false);
  const [showWeekModal, setShowWeekModal] = useState(false);
  const [selectedWeekForView, setSelectedWeekForView] = useState<number | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo>({
    fullName: "John Doe",
    phoneNumber: "+855 123 4567",
    subArea: "Phnom Penh",
    month: month,
    week: 1
  });
  const { showToast } = useToast();
  const portalRoot = usePortal();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [focusedRow, setFocusedRow] = useState<string | null>(null);
  const [submittedSchedule, setSubmittedSchedule] = useState<SubmittedSchedule | null>(null);
  const [showSubmittedTable, setShowSubmittedTable] = useState(false);

  const expandRow = (weekIndex: number, dayIndex: number) => {
    const uniqueKey = `${weekIndex}-${dayIndex}`;
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      newSet.add(uniqueKey); // Only add, never remove
      return newSet;
    });
    setFocusedRow(uniqueKey);
  };

  const collapseRow = (weekIndex: number, dayIndex: number) => {
    const uniqueKey = `${weekIndex}-${dayIndex}`;
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      newSet.delete(uniqueKey);
      return newSet;
    });
    setFocusedRow(null);
  };

  const isRowExpanded = (weekIndex: number, dayIndex: number) => {
    const uniqueKey = `${weekIndex}-${dayIndex}`;
    return expandedRows.has(uniqueKey) && focusedRow === uniqueKey;
  };

  // Auto-generate schedule when year/month changes
  useEffect(() => {
    if (year && month) {
      const weeks = generateBusinessMonth(year, month);
      setSchedule({ year, month, weeks });
      setCurrentWeekIndex(null);
      setSelectedWeek(null);
    }
  }, [year, month]);

  const updateDay = (
    wIndex: number,
    dIndex: number,
    field: keyof DaySchedule,
    value: any
  ) => {
    if (!schedule) return;
    const newSchedule = structuredClone(schedule);
    (newSchedule.weeks[wIndex].days[dIndex] as any)[field] = value;
    setSchedule(newSchedule);
  };
  const openWeekViewModal = (weekNumber: number) => {
    setSelectedWeekForView(weekNumber);
    setShowWeekModal(true);
  };

  const openWeekModal = (weekNumber: number) => {
    setSelectedWeek(weekNumber);
    setUserInfo(prev => ({ ...prev, week: weekNumber }));
    setSelectedWeekForView(weekNumber);
  };


  const getWeekByNumber = (weekNumber: number) => {
    if (!schedule) return null;
    return schedule.weeks.find(w => w.weekNumber === weekNumber);
  };

  const getCurrentWeek = () => {
    if (!schedule || currentWeekIndex === null || !schedule.weeks[currentWeekIndex]) return null;
    return schedule.weeks[currentWeekIndex];
  };

  const selectWeek = (weekNumber: number) => {
    if (!schedule) return;
    const weekIndex = schedule.weeks.findIndex(w => w.weekNumber === weekNumber);
    if (weekIndex !== -1) {
      setCurrentWeekIndex(weekIndex);
      setSelectedWeek(weekNumber);
      setUserInfo(prev => ({ ...prev, week: weekNumber }));
      setSelectedWeekForView(weekNumber);
    }
  };

  const handleSaveSchedule = () => {
    const currentWeek = getCurrentWeek();
    const submissionData: SubmittedSchedule = {
      userInfo: userInfo,
      selectedWeek: selectedWeek,
      currentWeekIndex: currentWeekIndex,
      weekDetails: currentWeek ? {
        weekNumber: currentWeek.weekNumber,
        days: currentWeek.days.map((day, index) => ({
          dayNumber: index + 1,
          dayName: day.dayName,
          date: day.date,
          isDayOff: day.isDayOff,
          morningSchedule: day.morning,
          afternoonSchedule: day.afternoon,
          inMonth: day.inMonth
        }))
      } : null,
      timestamp: new Date().toISOString()
    };

    console.log('=== SCHEDULE SUBMISSION ===');
    console.log(JSON.stringify(submissionData, null, 2));
    console.log('=== END SUBMISSION ===');

    // Store the submitted data for display
    setSubmittedSchedule(submissionData);
    setShowSubmittedTable(true);
    showToast('Schedule saved successfully!', 'success');
  };

  return (
    <MarketingServiceGuard>
      <div className="space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-amber-300/70">
            Marketing · Schedule
          </p>
          <h1 className="text-3xl font-semibold text-white">
            Weekly Schedule
          </h1>
          <p className="text-sm text-slate-300">
            Plan and manage weekly business schedules with detailed time allocations.
          </p>
        </header>

        {/* CONTROLS */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
          <div className="flex gap-4 items-end flex-wrap">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Year</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(+e.target.value)}
                className="bg-slate-900/50 border border-slate-600/50 rounded-lg px-3 py-2 w-32 text-white focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Month</label>
              <select
                value={month}
                onChange={(e) => setMonth(+e.target.value)}
                className="bg-slate-900/50 border border-slate-600/50 rounded-lg px-3 py-2 w-40 text-white focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i} value={i + 1} className="bg-slate-900">
                    {new Date(0, i).toLocaleString("default", { month: "long" })}
                  </option>
                ))}
              </select>
            </div>

            {/* WEEK SELECTION DROPDOWN */}
            {schedule && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Week</label>
                <select
                  value={selectedWeek || ""}
                  onChange={(e) => {
                    const weekNumber = e.target.value ? parseInt(e.target.value) : null;
                    if (weekNumber) {
                      selectWeek(weekNumber);
                    }
                  }}
                  className="bg-slate-900/50 border border-slate-600/50 rounded-lg px-3 py-2 w-40 text-white focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="" className="bg-slate-900">Select week...</option>
                  {schedule.weeks.map((week) => (
                    <option key={week.weekNumber} value={week.weekNumber} className="bg-slate-900">
                      Week {week.weekNumber}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* TABLE VIEW */}
        {schedule && getCurrentWeek() && selectedWeek && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 shadow-xl">
            <h2 className="font-semibold text-xl text-white text-center mb-6">
              Week {getCurrentWeek()!.weekNumber} (Monday → Sunday)
            </h2>

            {/* Clickable Table */}
            <div
              className="overflow-x-auto cursor-pointer hover:bg-slate-700/10 p-2 rounded-lg transition-colors"
              onClick={() => openWeekModal(selectedWeek)}
            >
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-900/50 text-sm">
                    <th className="border border-slate-600/50 p-3 text-left text-slate-300">Day</th>
                    <th className="border border-slate-600/50 p-3 text-left text-slate-300">Date</th>
                    <th className="border border-slate-600/50 p-3 text-center text-slate-300">Off</th>
                    <th className="border border-slate-600/50 p-3 text-left text-slate-300">Morning</th>
                    <th className="border border-slate-600/50 p-3 text-left text-slate-300">Afternoon</th>
                  </tr>
                </thead>
                <tbody>
                  {getCurrentWeek()!.days.map((day, dIndex) => (
                    <tr
                      key={dIndex}
                      className="bg-slate-800/30 hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="border border-slate-600/50 p-3 font-medium text-white">{day.dayName}</td>
                      <td className="border border-slate-600/50 p-3 text-sm text-slate-300">{day.date}</td>
                      <td className="border border-slate-600/50 p-3 text-center">
                        <input
                          type="checkbox"
                          checked={day.isDayOff}
                          onChange={(e) => {
                            e.stopPropagation();
                            updateDay(currentWeekIndex!, dIndex, "isDayOff", e.target.checked);
                          }}
                          className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-amber-500 focus:ring-amber-500/20 focus:ring-2"
                        />
                      </td>
                      <td className="border border-slate-600/50 p-3">
                        <textarea
                          disabled={day.isDayOff}
                          className={`w-full bg-slate-900/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white placeholder-slate-500 transition-all focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 focus:outline-none resize-y disabled:bg-slate-800/50 disabled:text-slate-500 ${isRowExpanded(currentWeekIndex!, dIndex) ? 'h-24' : 'min-h-12 max-h-24'
                            }`}
                          value={day.morning}
                          onChange={(e) => {
                            e.stopPropagation();
                            updateDay(currentWeekIndex!, dIndex, "morning", e.target.value);
                          }}
                          onFocus={(e) => {
                            e.stopPropagation();
                            expandRow(currentWeekIndex!, dIndex);
                          }}
                          onBlur={(e) => {
                            e.stopPropagation();
                            collapseRow(currentWeekIndex!, dIndex);
                          }}
                          placeholder="Morning schedule..."
                          rows={isRowExpanded(currentWeekIndex!, dIndex) ? 3 : 1}
                        />
                      </td>
                      <td className="border border-slate-600/50 p-3">
                        <textarea
                          disabled={day.isDayOff}
                          className={`w-full bg-slate-900/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white placeholder-slate-500 transition-all focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 focus:outline-none resize-y disabled:bg-slate-800/50 disabled:text-slate-500 ${isRowExpanded(currentWeekIndex!, dIndex) ? 'h-24' : 'min-h-12 max-h-24'
                            }`}
                          value={day.afternoon}
                          onChange={(e) => {
                            e.stopPropagation();
                            updateDay(currentWeekIndex!, dIndex, "afternoon", e.target.value);
                          }}
                          onFocus={(e) => {
                            e.stopPropagation();
                            expandRow(currentWeekIndex!, dIndex);
                          }}
                          onBlur={(e) => {
                            e.stopPropagation();
                            collapseRow(currentWeekIndex!, dIndex);
                          }}
                          placeholder="Afternoon schedule..."
                          rows={isRowExpanded(currentWeekIndex!, dIndex) ? 3 : 1}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-center mt-4 text-sm text-slate-400">
              Click on table to view full week details
            </div>
          </div>
        )}

        {/* SAVE BUTTON SECTION */}
        {schedule && (
          <div className="flex justify-end">
            <button
              onClick={handleSaveSchedule}
              className="rounded-2xl bg-gradient-to-r from-green-500/90 to-emerald-500/90 px-8 py-3 text-lg font-semibold text-white hover:from-green-400 hover:to-emerald-400 transition-colors"
            >
              Save Schedule
            </button>
          </div>
        )}

        {/* WEEK VIEW MODAL */}
        {showWeekModal && selectedWeekForView && getWeekByNumber(selectedWeekForView) && portalRoot && createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowWeekModal(false)}
          >
            <div className="bg-slate-900 rounded-2xl border border-slate-700 p-8 max-w-7xl w-full mx-4 max-h-[95vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-2xl font-semibold text-white">
                  Week {selectedWeekForView} Schedule Details
                </h3>
                <button
                  onClick={() => setShowWeekModal(false)}
                  className="text-slate-400 hover:text-slate-300 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-900/50 text-sm">
                      <th className="border border-slate-600/50 p-4 text-left text-slate-300 bg-blue-900/30">Time</th>
                      <th className="border border-slate-600/50 p-4 text-center text-slate-300 bg-blue-900/30">Monday</th>
                      <th className="border border-slate-600/50 p-4 text-center text-slate-300 bg-blue-900/30">Tuesday</th>
                      <th className="border border-slate-600/50 p-4 text-center text-slate-300 bg-blue-900/30">Wednesday</th>
                      <th className="border border-slate-600/50 p-4 text-center text-slate-300 bg-blue-900/30">Thursday</th>
                      <th className="border border-slate-600/50 p-4 text-center text-slate-300 bg-blue-900/30">Friday</th>
                      <th className="border border-slate-600/50 p-4 text-center text-slate-300 bg-blue-900/30">Saturday</th>
                      <th className="border border-slate-600/50 p-4 text-center text-slate-300 bg-blue-900/30">Sunday</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Morning Row */}
                    <tr className="bg-slate-800/30">
                      <td className="border border-slate-600/50 p-4 font-medium text-white bg-slate-900/50">
                        Morning
                      </td>
                      {getWeekByNumber(selectedWeekForView)!.days.map((day: DaySchedule, dIndex: number) => (
                        <td key={dIndex} className="border border-slate-600/50 p-3">
                          {day.isDayOff ? (
                            <div className="text-center text-red-400 font-medium">OFF</div>
                          ) : (
                            <div className="text-sm text-slate-300 min-h-16">
                              {day.morning || <span className="text-slate-500 italic">No schedule</span>}
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* Afternoon Row */}
                    <tr className="bg-slate-800/30">
                      <td className="border border-slate-600/50 p-4 font-medium text-white bg-slate-900/50">
                        Afternoon
                      </td>
                      {getWeekByNumber(selectedWeekForView)!.days.map((day: DaySchedule, dIndex: number) => (
                        <td key={dIndex} className="border border-slate-600/50 p-3">
                          {day.isDayOff ? (
                            <div className="text-center text-red-400 font-medium">OFF</div>
                          ) : (
                            <div className="text-sm text-slate-300 min-h-16">
                              {day.afternoon || <span className="text-slate-500 italic">No schedule</span>}
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>

                  </tbody>
                </table>
              </div>

              <div className="flex justify-end space-x-4 mt-8">
                <button
                  onClick={() => setShowWeekModal(false)}
                  className="px-6 py-3 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          portalRoot
        )}

        {/* SAVE TABLE */}
        {showSaveTable && schedule && (
          <div className="mt-8 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">Schedule Summary - {year}/{month}</h3>
              <button
                onClick={() => setShowSaveTable(false)}
                className="text-slate-400 hover:text-slate-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-900/50 text-sm">
                    <th className="border border-slate-600/50 p-3 text-left text-slate-300">Week</th>
                    <th className="border border-slate-600/50 p-3 text-left text-slate-300">Monday</th>
                    <th className="border border-slate-600/50 p-3 text-left text-slate-300">Tuesday</th>
                    <th className="border border-slate-600/50 p-3 text-left text-slate-300">Wednesday</th>
                    <th className="border border-slate-600/50 p-3 text-left text-slate-300">Thursday</th>
                    <th className="border border-slate-600/50 p-3 text-left text-slate-300">Friday</th>
                    <th className="border border-slate-600/50 p-3 text-left text-slate-300">Saturday</th>
                    <th className="border border-slate-600/50 p-3 text-left text-slate-300">Sunday</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedWeek && getCurrentWeek() && (
                    <tr
                      key={selectedWeek}
                      className="bg-slate-800/30 hover:bg-slate-700/30 transition-colors cursor-pointer"
                      onClick={() => openWeekViewModal(selectedWeek)}
                    >
                      <td className="border border-slate-600/50 p-3 font-medium text-white">
                        Week {selectedWeek}
                      </td>
                      {getCurrentWeek()!.days.map((day) => (
                        <td key={day.date} className="border border-slate-600/50 p-2 text-sm">
                          <div className="text-slate-300">{day.date}</div>
                          {day.isDayOff ? (
                            <div className="text-red-400 text-xs font-medium">OFF</div>
                          ) : (
                            <div className="text-xs text-slate-400">
                              {day.morning && <div>• {day.morning.substring(0, 20)}...</div>}
                              {day.afternoon && <div>• {day.afternoon.substring(0, 20)}...</div>}
                            </div>
                          )}
                          {day.remark && (
                            <div className="text-xs text-amber-400 mt-1">
                              Note: {day.remark.substring(0, 15)}...
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowSaveTable(false)}
                className="px-6 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* SUBMITTED SCHEDULE TABLE */}
        {showSubmittedTable && submittedSchedule && (
          <div className="mt-8 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-semibold text-white">Submitted Schedule - Week {submittedSchedule.weekDetails?.weekNumber}</h3>
                <p className="text-sm text-slate-400 mt-1">
                  {submittedSchedule.userInfo.fullName} • {submittedSchedule.userInfo.subArea} • {new Date(submittedSchedule.timestamp).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    // Edit functionality - load data back to form
                    if (submittedSchedule.weekDetails && currentWeekIndex !== null && schedule) {
                      const newSchedule = structuredClone(schedule);
                      submittedSchedule.weekDetails.days.forEach((day, index) => {
                        if (newSchedule.weeks[currentWeekIndex] && newSchedule.weeks[currentWeekIndex].days[index]) {
                          newSchedule.weeks[currentWeekIndex].days[index].isDayOff = day.isDayOff;
                          newSchedule.weeks[currentWeekIndex].days[index].morning = day.morningSchedule;
                          newSchedule.weeks[currentWeekIndex].days[index].afternoon = day.afternoonSchedule;
                        }
                      });
                      setSchedule(newSchedule);
                      setShowSubmittedTable(false);
                      showToast('Schedule loaded for editing!', 'info');
                    }
                  }}
                  className="px-4 py-2 bg-blue-500/90 text-white rounded-lg hover:bg-blue-400/90 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={() => {
                    setSubmittedSchedule(null);
                    setShowSubmittedTable(false);
                    showToast('Schedule deleted!', 'error');
                  }}
                  className="px-4 py-2 bg-red-500/90 text-white rounded-lg hover:bg-red-400/90 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
                <button
                  onClick={() => setShowSubmittedTable(false)}
                  className="px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-900/50 text-sm">
                    <th className="border border-slate-600/50 p-3 text-left text-slate-300">Week</th>
                    <th className="border border-slate-600/50 p-3 text-center text-slate-300">Monday</th>
                    <th className="border border-slate-600/50 p-3 text-center text-slate-300">Tuesday</th>
                    <th className="border border-slate-600/50 p-3 text-center text-slate-300">Wednesday</th>
                    <th className="border border-slate-600/50 p-3 text-center text-slate-300">Thursday</th>
                    <th className="border border-slate-600/50 p-3 text-center text-slate-300">Friday</th>
                    <th className="border border-slate-600/50 p-3 text-center text-slate-300">Saturday</th>
                    <th className="border border-slate-600/50 p-3 text-center text-slate-300">Sunday</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-slate-800/30 hover:bg-slate-700/30 transition-colors">
                    <td className="border border-slate-600/50 p-3 font-medium text-white">
                      Week {submittedSchedule.weekDetails?.weekNumber}
                    </td>
                    {submittedSchedule.weekDetails?.days.map((day, index) => (
                      <td key={index} className="border border-slate-600/50 p-2 text-sm">
                        <div className="text-slate-300 font-medium mb-1">{day.date}</div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={day.isDayOff}
                              disabled
                              className="w-3 h-3 rounded border-slate-600 bg-slate-900 text-amber-500 disabled:opacity-50"
                            />
                            <span className="text-xs text-slate-400">Off</span>
                          </div>
                          {!day.isDayOff && (
                            <>
                              <div className="text-xs text-slate-300">
                                <span className="font-medium">M:</span> {day.morningSchedule || '-'}
                              </div>
                              <div className="text-xs text-slate-300">
                                <span className="font-medium">A:</span> {day.afternoonSchedule || '-'}
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </MarketingServiceGuard>
  );
}
