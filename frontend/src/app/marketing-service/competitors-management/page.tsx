"use client";

import { useEffect, useState } from "react";
import React from "react";
import { ModalPortal } from "@/components/ModalPortal";
import { MarketingServiceGuard } from "@/components/marketing-service/MarketingServiceGuard";
import {
  marketingHierarchyService,
  type MarketingArea,
  type MarketingSubArea,
} from "@/services/marketing-service/marketingHierarchyService";
import {
  competitorService,
  type MarketingCompetitor,
} from "@/services/marketing-service/competitorService";
import {
  competitorAssignmentService,
  type MarketingCompetitorAssignment,
  type CompetitorAssignmentPayload,
  type CompetitorPriceRange,
} from "@/services/marketing-service/competitorAssignmentService";

// ============================================================================
// REUSABLE COMPONENTS
// ============================================================================

interface ModalHeaderProps {
  title: string;
  subtitle?: string;
  label?: string;
  onClose: () => void;
}

const ModalHeader: React.FC<ModalHeaderProps> = ({
  title,
  subtitle,
  label = "Competitor Analysis",
  onClose
}) => (
  <header className="shrink-0 border-b border-white/5 bg-linear-to-r from-slate-800/50 to-slate-900/50 backdrop-blur-sm px-6 py-4">
    <div className="flex items-start justify-between">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse"></div>
          <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-amber-400/80">{label}</p>
        </div>
        <h1 className="text-xl font-bold text-white mb-0.5">{title}</h1>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
      <button
        onClick={onClose}
        className="group rounded-lg border border-white/10 bg-slate-800/50 p-1.5 text-slate-400 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 transition-all"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </header>
);

interface ModalFooterProps {
  count: number;
  onClose: () => void;
  showSave?: boolean;
  onSave?: () => void;
}

const ModalFooter: React.FC<ModalFooterProps> = ({ count, onClose, showSave, onSave }) => (
  <div className="shrink-0 flex items-center justify-between border-t border-white/5 bg-slate-900/50 backdrop-blur-sm px-6 py-3">
    <div className="flex items-center gap-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10">
        <span className="text-xs font-bold text-amber-400">{count}</span>
      </div>
      <span className="text-xs text-slate-400">Total Competitors</span>
    </div>
    <div className="flex gap-2">
      <button
        onClick={onClose}
        className="rounded-lg border border-white/10 bg-slate-800/50 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-700/50 hover:border-amber-500/30 transition-all"
      >
        {showSave ? 'Cancel' : 'Close'}
      </button>
      {showSave && (
        <button
          onClick={onSave}
          className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-1.5 text-xs font-semibold text-green-300 hover:bg-green-500/20 transition-all"
        >
          Save All Changes
        </button>
      )}
    </div>
  </div>
);

interface CompetitorHeaderProps {
  competitor?: MarketingCompetitor;
  competitorId: string;
}

const CompetitorHeader: React.FC<CompetitorHeaderProps> = ({ competitor, competitorId }) => (
  <div className="mb-4 flex flex-col items-center text-center pb-3 border-b border-white/5">
    <div className="relative mb-3">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-amber-500/30 bg-linear-to-br from-amber-500/20 to-amber-600/10 shadow-lg shadow-amber-500/10">
        <span className="text-xl font-bold text-amber-300">
          {competitor?.name?.charAt(0).toUpperCase() || 'C'}
        </span>
      </div>
      <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-slate-900 bg-green-500 shadow-lg"></div>
    </div>
    <h2 className="text-sm font-bold text-white mb-0.5">
      {competitor?.name || `Competitor ${competitorId}`}
    </h2>
    <p className="text-[10px] text-slate-500 font-mono">#{competitorId}</p>
  </div>
);

interface PriceRangeSectionProps {
  profile: any;
  readonly: boolean;
  onFieldChange?: (field: string, value: any) => void;
}

const PriceRangeSection: React.FC<PriceRangeSectionProps> = ({ profile, readonly, onFieldChange }) => (
  <div className="col-span-2 rounded-lg border border-emerald-500/10 bg-linear-to-br from-emerald-500/5 to-emerald-600/5 p-3">
    <div className="flex items-center gap-2 mb-1.5">
      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/10">
        <svg className="h-3 w-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      </div>
      <h3 className="text-[10px] font-bold uppercase tracking-wide text-emerald-300">Price Range</h3>
    </div>
    {readonly ? (
      <p className="text-sm font-bold text-white text-center">
        ${profile.priceRange.lowestPrice} - ${profile.priceRange.highestPrice}
      </p>
    ) : (
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          value={profile.priceRange.lowestPrice}
          onChange={(e) => onFieldChange?.('priceRange', {
            ...profile.priceRange,
            lowestPrice: parseInt(e.target.value) || 0
          })}
          className="flex-1 min-w-0 rounded border border-white/10 bg-slate-800/50 px-2 py-1 text-xs text-white text-center"
          placeholder="Lowest"
        />
        <span className="text-xs text-slate-400 shrink-0">-</span>
        <input
          type="number"
          value={profile.priceRange.highestPrice}
          onChange={(e) => onFieldChange?.('priceRange', {
            ...profile.priceRange,
            highestPrice: parseInt(e.target.value) || 0
          })}
          className="flex-1 min-w-0 rounded border border-white/10 bg-slate-800/50 px-2 py-1 text-xs text-white text-center"
          placeholder="Highest"
        />
      </div>
    )}
  </div>
);

interface BranchCountSectionProps {
  profile: any;
  readonly: boolean;
  onFieldChange?: (value: number) => void;
}

const BranchCountSection: React.FC<BranchCountSectionProps> = ({ profile, readonly, onFieldChange }) => (
  <div className="col-span-2 rounded-lg border border-amber-500/10 bg-linear-to-br from-amber-500/5 to-amber-600/5 p-3">
    <div className="flex items-center gap-2 mb-1.5">
      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/10">
        <svg className="h-3 w-3 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </div>
      <h3 className="text-[10px] font-bold uppercase tracking-wide text-amber-300">Branches</h3>
    </div>
    {readonly ? (
      <p className="text-sm font-bold text-white text-center">
        {profile.branchCount} <span className="text-xs text-slate-400">locations</span>
      </p>
    ) : (
      <input
        type="number"
        value={profile.branchCount}
        onChange={(e) => onFieldChange?.(parseInt(e.target.value) || 0)}
        className="w-full rounded border border-white/10 bg-slate-800/50 px-2 py-1 text-xs text-white text-center"
        placeholder="Number of branches"
      />
    )}
  </div>
);

interface ListSectionProps {
  title: string;
  items: string[];
  readonly: boolean;
  input?: string;
  color: 'blue' | 'rose';
  icon: React.ReactNode;
  onInputChange?: (value: string) => void;
  onAdd?: () => void;
  onRemove?: (index: number) => void;
}

const ListSection: React.FC<ListSectionProps> = ({
  title,
  items,
  readonly,
  input,
  color,
  icon,
  onInputChange,
  onAdd,
  onRemove,
}) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/10',
      text: 'text-blue-300',
      bgItem: 'bg-blue-500/5',
      borderItem: 'border-blue-500/10',
      btnBorder: 'border-blue-500/30',
      btnBg: 'bg-blue-500/10',
      btnHover: 'hover:bg-blue-500/20',
    },
    rose: {
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/10',
      text: 'text-rose-300',
      bgItem: 'bg-rose-500/5',
      borderItem: 'border-rose-500/10',
      btnBorder: 'border-rose-500/30',
      btnBg: 'bg-rose-500/10',
      btnHover: 'hover:bg-rose-500/20',
    },
  };

  const colors = colorClasses[color];

  return (
    <div className="mb-3">
      <div className="mb-2 flex items-center gap-2 px-1">
        <div className={`flex h-5 w-5 items-center justify-center rounded-md ${colors.bg}`}>
          {icon}
        </div>
        <h3 className={`text-[10px] font-bold uppercase tracking-wide ${colors.text}`}>{title}</h3>
      </div>
      {!readonly && (
        <div className="space-y-2">
          <div className="flex gap-1.5">
            <input
              type="text"
              value={input}
              onChange={(e) => onInputChange?.(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && onAdd?.()}
              className="flex-1 min-w-0 rounded border border-white/10 bg-slate-800/50 px-2 py-1 text-xs text-white"
              placeholder={`Add ${title.toLowerCase()}`}
            />
            <button
              onClick={onAdd}
              className={`shrink-0 rounded border ${colors.btnBorder} ${colors.btnBg} px-2 py-1 text-xs ${colors.text} ${colors.btnHover}`}
            >
              Add
            </button>
          </div>
        </div>
      )}
      <div className="space-y-1.5 mt-2">
        {items && items.length > 0 ? (
          items.map((item, index) => (
            <div key={index} className={`flex items-center gap-2 rounded-md border ${colors.borderItem} ${colors.bgItem} px-2 py-1.5`}>
              <p className="text-xs text-slate-200 leading-snug flex-1">{item}</p>
              {!readonly && (
                <button onClick={() => onRemove?.(index)} className="text-red-400 hover:text-red-300">
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))
        ) : (
          <p className="text-xs text-slate-500 italic text-center">No data</p>
        )}
      </div>
    </div>
  );
};

interface RemarksSectionProps {
  remarks?: string;
  readonly: boolean;
  onChange?: (value: string) => void;
}

const RemarksSection: React.FC<RemarksSectionProps> = ({ remarks, readonly, onChange }) => (
  <div className="pt-3 border-t border-white/5">
    <div className="mb-2 flex items-center gap-2 px-1">
      <div className="flex h-5 w-5 items-center justify-center rounded-md bg-violet-500/10">
        <svg className="h-2.5 w-2.5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
      </div>
      <h3 className="text-[10px] font-bold uppercase tracking-wide text-violet-300">Notes</h3>
    </div>
    {readonly ? (
      <div className="rounded-md border border-violet-500/10 bg-violet-500/5 px-2 py-2">
        <p className="text-xs text-slate-300 leading-relaxed">{remarks}</p>
      </div>
    ) : (
      <textarea
        value={remarks || ''}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full rounded border border-violet-500/10 bg-slate-800/50 px-2 py-2 text-xs text-white resize-none"
        placeholder="Add notes..."
        rows={3}
      />
    )}
  </div>
);

interface CompetitorCardProps {
  competitor?: MarketingCompetitor;
  competitorId: string;
  profile: any;
  readonly?: boolean;
  strengthInput?: string;
  weaknessInput?: string;
  onFieldChange?: (competitorId: number, field: string, value: any) => void;
  onAddStrength?: (competitorId: number) => void;
  onRemoveStrength?: (competitorId: number, index: number) => void;
  onAddWeakness?: (competitorId: number) => void;
  onRemoveWeakness?: (competitorId: number, index: number) => void;
  onStrengthInputChange?: (competitorId: number, value: string) => void;
  onWeaknessInputChange?: (competitorId: number, value: string) => void;
}

const CompetitorCard: React.FC<CompetitorCardProps> = ({
  competitor,
  competitorId,
  profile,
  readonly = false,
  strengthInput = '',
  weaknessInput = '',
  onFieldChange,
  onAddStrength,
  onRemoveStrength,
  onAddWeakness,
  onRemoveWeakness,
  onStrengthInputChange,
  onWeaknessInputChange,
}) => {
  const id = parseInt(competitorId);

  return (
    <div className="shrink-0 w-72 rounded-xl border border-white/10 bg-linear-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm p-4 hover:border-amber-500/20 transition-all group">
      <CompetitorHeader competitor={competitor} competitorId={competitorId} />

      <div className="grid grid-cols-2 gap-2 mb-4">
        <PriceRangeSection
          profile={profile}
          readonly={readonly}
          onFieldChange={(field, value) => onFieldChange?.(id, field, value)}
        />
        <BranchCountSection
          profile={profile}
          readonly={readonly}
          onFieldChange={(value) => onFieldChange?.(id, 'branchCount', value)}
        />
      </div>

      <ListSection
        title="Strengths"
        items={profile.strengths || []}
        readonly={readonly}
        input={strengthInput}
        color="blue"
        icon={
          <svg className="h-2.5 w-2.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        }
        onInputChange={(value) => onStrengthInputChange?.(id, value)}
        onAdd={() => onAddStrength?.(id)}
        onRemove={(index) => onRemoveStrength?.(id, index)}
      />

      <ListSection
        title="Weaknesses"
        items={profile.weaknesses || []}
        readonly={readonly}
        input={weaknessInput}
        color="rose"
        icon={
          <svg className="h-2.5 w-2.5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
        }
        onInputChange={(value) => onWeaknessInputChange?.(id, value)}
        onAdd={() => onAddWeakness?.(id)}
        onRemove={(index) => onRemoveWeakness?.(id, index)}
      />

      {(profile.remarks || !readonly) && (
        <RemarksSection
          remarks={profile.remarks}
          readonly={readonly}
          onChange={(value) => onFieldChange?.(id, 'remarks', value)}
        />
      )}
    </div>
  );
};

// Modal components moved outside main component to avoid stale closures
const CompetitorProfileModal: React.FC<{
  show: boolean;
  assignment: MarketingCompetitorAssignment | null;
  competitors: MarketingCompetitor[];
  onClose: () => void;
}> = ({ show, assignment, competitors, onClose }) => {
  if (!show || !assignment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
      <div className="w-full max-w-7xl h-[85vh] overflow-hidden rounded-3xl border border-white/20 bg-linear-to-br from-slate-900 via-slate-900 to-slate-800 shadow-2xl flex flex-col">
        <ModalHeader
          title={assignment.areaName}
          subtitle={assignment.subAreaName}
          onClose={onClose}
        />

        <div className="flex-1 overflow-y-auto overflow-x-auto p-4 scrollbar-hide">
          <div className="flex gap-3 pb-2 min-w-max">
            {Object.entries(assignment.competitorProfiles).map(([competitorId, profile]) => {
              const competitor = competitors.find(c => c.id === parseInt(competitorId));
              return (
                <CompetitorCard
                  key={competitorId}
                  competitor={competitor}
                  competitorId={competitorId}
                  profile={profile}
                  readonly
                />
              );
            })}
          </div>
        </div>

        <ModalFooter
          count={Object.keys(assignment.competitorProfiles).length}
          onClose={onClose}
        />
      </div>
    </div>
  );
};

const CompetitorEditModal: React.FC<{
  show: boolean;
  assignment: MarketingCompetitorAssignment | null;
  competitors: MarketingCompetitor[];
  profiles: Record<number, any>;
  strengthInputs: Record<number, string>;
  weaknessInputs: Record<number, string>;
  onClose: () => void;
  onSave: () => void;
  onFieldChange: (competitorId: number, field: string, value: any) => void;
  onAddStrength: (competitorId: number) => void;
  onRemoveStrength: (competitorId: number, index: number) => void;
  onAddWeakness: (competitorId: number) => void;
  onRemoveWeakness: (competitorId: number, index: number) => void;
  onStrengthInputChange: (competitorId: number, value: string) => void;
  onWeaknessInputChange: (competitorId: number, value: string) => void;
}> = ({
  show,
  assignment,
  competitors,
  profiles,
  strengthInputs,
  weaknessInputs,
  onClose,
  onSave,
  onFieldChange,
  onAddStrength,
  onRemoveStrength,
  onAddWeakness,
  onRemoveWeakness,
  onStrengthInputChange,
  onWeaknessInputChange,
}) => {
    if (!show || !assignment || !profiles || Object.keys(profiles).length === 0) return null;

    return (
      <div className="fixed inset-0 z-9999 flex items-start justify-center bg-black/70 backdrop-blur-md p-6 pt-10">
        <div className="w-full max-w-[95vw] max-h-[85vh] overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-slate-900 via-slate-900 to-slate-800 shadow-2xl flex flex-col">
          <ModalHeader
            title={`${assignment.areaName}${assignment.subAreaName ? ` → ${assignment.subAreaName}` : ''}`}
            subtitle="Edit all competitors in this assignment"
            label="Edit Competitors"
            onClose={onClose}
          />

          <div className="flex-1 overflow-y-auto overflow-x-auto p-6 scrollbar-hide">
            <div className="flex gap-4 pb-2 min-w-max">
              {Object.entries(profiles).map(([competitorId, profile]) => {
                const competitor = competitors.find(c => c.id === parseInt(competitorId));
                return (
                  <CompetitorCard
                    key={competitorId}
                    competitor={competitor}
                    competitorId={competitorId}
                    profile={profile}
                    strengthInput={strengthInputs[parseInt(competitorId)] || ''}
                    weaknessInput={weaknessInputs[parseInt(competitorId)] || ''}
                    onFieldChange={onFieldChange}
                    onAddStrength={onAddStrength}
                    onRemoveStrength={onRemoveStrength}
                    onAddWeakness={onAddWeakness}
                    onRemoveWeakness={onRemoveWeakness}
                    onStrengthInputChange={onStrengthInputChange}
                    onWeaknessInputChange={onWeaknessInputChange}
                  />
                );
              })}
            </div>
          </div>

          <ModalFooter
            count={Object.keys(profiles).length}
            onClose={onClose}
            showSave
            onSave={onSave}
          />
        </div>
      </div>
    );
  };

export default function CompetitorsPage() {
  // Data states
  const [areas, setAreas] = useState<MarketingArea[]>([]);
  const [subAreas, setSubAreas] = useState<MarketingSubArea[]>([]);
  const [competitors, setCompetitors] = useState<MarketingCompetitor[]>([]);
  const [assignments, setAssignments] = useState<MarketingCompetitorAssignment[]>([]);

  // Selection states
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);
  const [selectedSubAreaId, setSelectedSubAreaId] = useState<number | null>(null);
  const [selectedCompetitorIds, setSelectedCompetitorIds] = useState<number[]>([]);

  // Table filter states
  const [tableFilterAreaId, setTableFilterAreaId] = useState<number | null>(null);
  const [tableFilterSubAreaId, setTableFilterSubAreaId] = useState<number | null>(null);

  // Profile forms
  const [competitorProfiles, setCompetitorProfiles] = useState<Record<number, CompetitorAssignmentPayload>>({});
  const [strengthInputs, setStrengthInputs] = useState<Record<number, string>>({});
  const [weaknessInputs, setWeaknessInputs] = useState<Record<number, string>>({});

  // UI states
  const [loading, setLoading] = useState(false);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [competitorLoading, setCompetitorLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);

  // Modal states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<MarketingCompetitorAssignment | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<MarketingCompetitorAssignment | null>(null);
  const [editCompetitorProfiles, setEditCompetitorProfiles] = useState<Record<number, any>>({});
  const [editStrengthInputs, setEditStrengthInputs] = useState<Record<number, string>>({});
  const [editWeaknessInputs, setEditWeaknessInputs] = useState<Record<number, string>>({});

  const showToast = (message: string, tone: "success" | "error" = "success") => {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 3000);
  };

  // Load data functions
  const loadAreas = async () => {
    try {
      const data = await marketingHierarchyService.listAreas();
      setAreas(data);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to load areas", "error");
    }
  };

  const loadSubAreas = async (areaId?: number) => {
    try {
      const data = await marketingHierarchyService.listSubAreas(areaId);
      setSubAreas(data);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to load sub-areas", "error");
    }
  };

  const loadCompetitors = async () => {
    setCompetitorLoading(true);
    try {
      const data = await competitorService.listCompetitors();
      setCompetitors(data);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to load competitors", "error");
    } finally {
      setCompetitorLoading(false);
    }
  };

  const loadAssignments = async () => {
    setAssignmentLoading(true);
    try {
      const data = await competitorAssignmentService.listAssignments();
      setAssignments(data);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to load assignments", "error");
    } finally {
      setAssignmentLoading(false);
    }
  };

  // Edit modal handlers
  const handleOpenEditModal = (assignment: MarketingCompetitorAssignment) => {
    const editProfiles: Record<number, any> = {};
    const strengthInputs: Record<number, string> = {};
    const weaknessInputs: Record<number, string> = {};

    Object.entries(assignment.competitorProfiles).forEach(([competitorId, profile]) => {
      const id = parseInt(competitorId);
      editProfiles[id] = {
        priceRange: profile.priceRange,
        branchCount: profile.branchCount,
        strengths: [...profile.strengths],
        weaknesses: [...profile.weaknesses],
        remarks: profile.remarks || ''
      };
      strengthInputs[id] = '';
      weaknessInputs[id] = '';
    });

    // Set all state together - React 18 will batch these automatically
    setEditingAssignment(assignment);
    setEditCompetitorProfiles(editProfiles);
    setEditStrengthInputs(strengthInputs);
    setEditWeaknessInputs(weaknessInputs);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingAssignment(null);
    setEditCompetitorProfiles({});
    setEditStrengthInputs({});
    setEditWeaknessInputs({});
  };

  const handleEditFieldChange = (competitorId: number, field: string, value: any) => {
    setEditCompetitorProfiles(prev => ({
      ...prev,
      [competitorId]: { ...prev[competitorId], [field]: value }
    }));
  };

  const handleAddEditStrength = (competitorId: number) => {
    const input = editStrengthInputs[competitorId]?.trim();
    if (!input) return;
    const current = editCompetitorProfiles[competitorId]?.strengths || [];
    handleEditFieldChange(competitorId, 'strengths', [...current, input]);
    setEditStrengthInputs(prev => ({ ...prev, [competitorId]: '' }));
  };

  const handleRemoveEditStrength = (competitorId: number, index: number) => {
    const current = editCompetitorProfiles[competitorId]?.strengths || [];
    handleEditFieldChange(competitorId, 'strengths', current.filter((_: any, i: number) => i !== index));
  };

  const handleAddEditWeakness = (competitorId: number) => {
    const input = editWeaknessInputs[competitorId]?.trim();
    if (!input) return;
    const current = editCompetitorProfiles[competitorId]?.weaknesses || [];
    handleEditFieldChange(competitorId, 'weaknesses', [...current, input]);
    setEditWeaknessInputs(prev => ({ ...prev, [competitorId]: '' }));
  };

  const handleRemoveEditWeakness = (competitorId: number, index: number) => {
    const current = editCompetitorProfiles[competitorId]?.weaknesses || [];
    handleEditFieldChange(competitorId, 'weaknesses', current.filter((_: any, i: number) => i !== index));
  };

  const handleSaveEdit = async () => {
    if (!editingAssignment || !editCompetitorProfiles) return;
    try {
      const payload = {
        areaId: editingAssignment.areaId,
        subAreaId: editingAssignment.subAreaId,
        competitorProfiles: editCompetitorProfiles
      };
      await competitorAssignmentService.updateAssignment(editingAssignment.id, payload);
      const updatedAssignments = await competitorAssignmentService.listAssignments();
      setAssignments(updatedAssignments);
      if (showProfileModal) {
        const updated = updatedAssignments.find(a => a.id === editingAssignment.id);
        if (updated) setSelectedAssignment(updated);
      }
      handleCloseEditModal();
      showToast('Competitor profiles updated successfully', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to update competitor profiles', 'error');
    }
  };

  // Form handlers
  const resetAll = () => {
    setSelectedAreaId(null);
    setSelectedSubAreaId(null);
    setSelectedCompetitorIds([]);
    setCompetitorProfiles({});
    setStrengthInputs({});
    setWeaknessInputs({});
  };

  const handleCompetitorSelection = (competitorId: number) => {
    setSelectedCompetitorIds(prev => {
      const isSelected = prev.includes(competitorId);
      if (isSelected) {
        const newSelection = prev.filter(id => id !== competitorId);
        const newProfiles = { ...competitorProfiles };
        const newStrengthInputs = { ...strengthInputs };
        const newWeaknessInputs = { ...weaknessInputs };
        delete newProfiles[competitorId];
        delete newStrengthInputs[competitorId];
        delete newWeaknessInputs[competitorId];
        setCompetitorProfiles(newProfiles);
        setStrengthInputs(newStrengthInputs);
        setWeaknessInputs(newWeaknessInputs);
        return newSelection;
      } else {
        setCompetitorProfiles(prev => ({
          ...prev,
          [competitorId]: {
            areaId: selectedAreaId!,
            subAreaId: selectedSubAreaId ?? undefined,
            competitorProfiles: {
              [competitorId]: {
                priceRange: { lowestPrice: 0, highestPrice: 0 },
                strengths: [],
                weaknesses: [],
                remarks: "",
                branchCount: 0,
              }
            }
          },
        }));
        setStrengthInputs(prev => ({ ...prev, [competitorId]: "" }));
        setWeaknessInputs(prev => ({ ...prev, [competitorId]: "" }));
        return [...prev, competitorId];
      }
    });
  };

  const updateCompetitorProfile = (competitorId: number, updates: Partial<CompetitorAssignmentPayload>) => {
    setCompetitorProfiles(prev => ({
      ...prev,
      [competitorId]: {
        ...prev[competitorId],
        competitorProfiles: {
          ...prev[competitorId].competitorProfiles,
          [competitorId]: {
            ...prev[competitorId].competitorProfiles[competitorId],
            ...updates.competitorProfiles?.[competitorId]
          }
        }
      },
    }));
  };

  const handleAddStrength = (competitorId: number) => {
    const input = strengthInputs[competitorId]?.trim();
    if (input) {
      const profile = competitorProfiles[competitorId];
      if (profile && profile.competitorProfiles[competitorId]) {
        const currentStrengths = profile.competitorProfiles[competitorId].strengths || [];
        updateCompetitorProfile(competitorId, {
          competitorProfiles: {
            [competitorId]: {
              strengths: [...currentStrengths, input],
              weaknesses: profile.competitorProfiles[competitorId].weaknesses,
              priceRange: profile.competitorProfiles[competitorId].priceRange,
              branchCount: profile.competitorProfiles[competitorId].branchCount,
              remarks: profile.competitorProfiles[competitorId].remarks,
            }
          }
        });
        setStrengthInputs(prev => ({ ...prev, [competitorId]: "" }));
      }
    }
  };

  const handleRemoveStrength = (competitorId: number, index: number) => {
    const profile = competitorProfiles[competitorId];
    if (profile && profile.competitorProfiles[competitorId]) {
      const currentStrengths = profile.competitorProfiles[competitorId].strengths || [];
      updateCompetitorProfile(competitorId, {
        competitorProfiles: {
          [competitorId]: {
            strengths: currentStrengths.filter((_: string, i: number) => i !== index),
            weaknesses: profile.competitorProfiles[competitorId].weaknesses,
            priceRange: profile.competitorProfiles[competitorId].priceRange,
            branchCount: profile.competitorProfiles[competitorId].branchCount,
            remarks: profile.competitorProfiles[competitorId].remarks,
          }
        }
      });
    }
  };

  const handleAddWeakness = (competitorId: number) => {
    const input = weaknessInputs[competitorId]?.trim();
    if (input) {
      const profile = competitorProfiles[competitorId];
      if (profile && profile.competitorProfiles[competitorId]) {
        const currentWeaknesses = profile.competitorProfiles[competitorId].weaknesses || [];
        updateCompetitorProfile(competitorId, {
          competitorProfiles: {
            [competitorId]: {
              strengths: profile.competitorProfiles[competitorId].strengths,
              weaknesses: [...currentWeaknesses, input],
              priceRange: profile.competitorProfiles[competitorId].priceRange,
              branchCount: profile.competitorProfiles[competitorId].branchCount,
              remarks: profile.competitorProfiles[competitorId].remarks,
            }
          }
        });
        setWeaknessInputs(prev => ({ ...prev, [competitorId]: "" }));
      }
    }
  };

  const handleRemoveWeakness = (competitorId: number, index: number) => {
    const profile = competitorProfiles[competitorId];
    if (profile && profile.competitorProfiles[competitorId]) {
      const currentWeaknesses = profile.competitorProfiles[competitorId].weaknesses || [];
      updateCompetitorProfile(competitorId, {
        competitorProfiles: {
          [competitorId]: {
            strengths: profile.competitorProfiles[competitorId].strengths,
            weaknesses: currentWeaknesses.filter((_: string, i: number) => i !== index),
            priceRange: profile.competitorProfiles[competitorId].priceRange,
            branchCount: profile.competitorProfiles[competitorId].branchCount,
            remarks: profile.competitorProfiles[competitorId].remarks,
          }
        }
      });
    }
  };

  const handleSaveAllAssignments = async () => {
    if (!selectedAreaId) {
      showToast("Area is required", "error");
      return;
    }

    if (selectedCompetitorIds.length === 0) {
      showToast("Please select at least one competitor", "error");
      return;
    }

    const invalidProfiles = selectedCompetitorIds.filter(id => {
      const profile = competitorProfiles[id]?.competitorProfiles?.[id];
      return !profile || profile.branchCount <= 0;
    });

    if (invalidProfiles.length > 0) {
      showToast("All competitors must have a valid branch count", "error");
      return;
    }

    setLoading(true);
    try {
      const payload: CompetitorAssignmentPayload = {
        areaId: selectedAreaId,
        subAreaId: selectedSubAreaId ?? undefined,
        competitorProfiles: {},
      };

      selectedCompetitorIds.forEach(competitorId => {
        const profile = competitorProfiles[competitorId]?.competitorProfiles?.[competitorId];
        if (profile) {
          payload.competitorProfiles[competitorId] = {
            priceRange: profile.priceRange,
            strengths: profile.strengths,
            weaknesses: profile.weaknesses,
            remarks: profile.remarks,
            branchCount: profile.branchCount,
          };
        }
      });

      await competitorAssignmentService.createAssignment(payload);
      showToast("Competitor assignments created successfully");

      resetAll();
      await loadAssignments();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to save assignments",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssignment = async (id: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this assignment? This action cannot be undone.",
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      await competitorAssignmentService.deleteAssignment(id);
      setAssignments((prev) => prev.filter((assignment) => assignment.id !== id));
      showToast("Assignment deleted");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to delete assignment",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProfileModal = (assignment: MarketingCompetitorAssignment) => {
    setSelectedAssignment(assignment);
    setShowProfileModal(true);
  };

  const handleCloseProfileModal = () => {
    setShowProfileModal(false);
    setSelectedAssignment(null);
  };

  const formatDate = (value: string) =>
    new Date(value).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });

  const filteredAssignments = assignments.filter(assignment => {
    if (tableFilterAreaId && assignment.areaId !== tableFilterAreaId) {
      return false;
    }
    if (tableFilterSubAreaId && assignment.subAreaId !== tableFilterSubAreaId) {
      return false;
    }
    return true;
  });

  useEffect(() => {
    void Promise.all([loadAreas(), loadCompetitors()]);
  }, []);

  useEffect(() => {
    if (selectedAreaId) {
      void loadSubAreas(selectedAreaId);
    } else {
      void loadSubAreas();
    }
  }, [selectedAreaId]);

  useEffect(() => {
    if (tableFilterAreaId) {
      void loadSubAreas(tableFilterAreaId);
    } else if (!selectedAreaId) {
      void loadSubAreas();
    }
  }, [tableFilterAreaId]);

  useEffect(() => {
    void loadAssignments();
  }, []);

  return (
    <React.Fragment>
      <ModalPortal show={showEditModal}>
        <CompetitorEditModal
          show={showEditModal}
          assignment={editingAssignment}
          competitors={competitors}
          profiles={editCompetitorProfiles}
          strengthInputs={editStrengthInputs}
          weaknessInputs={editWeaknessInputs}
          onClose={handleCloseEditModal}
          onSave={handleSaveEdit}
          onFieldChange={handleEditFieldChange}
          onAddStrength={handleAddEditStrength}
          onRemoveStrength={handleRemoveEditStrength}
          onAddWeakness={handleAddEditWeakness}
          onRemoveWeakness={handleRemoveEditWeakness}
          onStrengthInputChange={(id, value) => setEditStrengthInputs(prev => ({ ...prev, [id]: value }))}
          onWeaknessInputChange={(id, value) => setEditWeaknessInputs(prev => ({ ...prev, [id]: value }))}
        />
      </ModalPortal>

      <MarketingServiceGuard>
        <div className="space-y-8">
          {/* Header */}
          <header className="space-y-2">
            <p className="text-xs uppercase tracking-[0.4em] text-amber-300/70">
              Marketing ◦ Competitor Management
            </p>
            <h1 className="text-3xl font-semibold text-white">
              Competitors Management
            </h1>
            <p className="text-sm text-slate-300">
              Manage competitor assignments to areas and sub-areas with detailed profiles.
            </p>
          </header>

          {/* Toast */}
          {toast && (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm ${toast.tone === "success"
                ? "border-green-500/30 bg-green-500/10 text-green-300"
                : "border-red-500/30 bg-red-500/10 text-red-300"
                }`}
            >
              {toast.message}
            </div>
          )}

          {/* Filters */}
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-4 text-xl font-semibold text-white">Select Location</h2>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="flex flex-col">
                <label className="mb-2 text-sm text-slate-300">Area *</label>
                <select
                  className="rounded-2xl border border-white/20 bg-slate-900/60 px-4 py-2 text-sm text-white focus:border-amber-400/60 focus:outline-none"
                  value={selectedAreaId ?? ""}
                  onChange={(e) => {
                    const value = e.target.value ? Number(e.target.value) : null;
                    setSelectedAreaId(value);
                  }}
                >
                  <option value="">Select area</option>
                  {areas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="mb-2 text-sm text-slate-300">Sub-area</label>
                <select
                  className="rounded-2xl border border-white/20 bg-slate-900/60 px-4 py-2 text-sm text-white focus:border-amber-400/60 focus:outline-none"
                  value={selectedSubAreaId ?? ""}
                  onChange={(e) => {
                    const value = e.target.value ? Number(e.target.value) : null;
                    setSelectedSubAreaId(value);
                  }}
                  disabled={!selectedAreaId}
                >
                  <option value="">None (Area level)</option>
                  {subAreas.map((subArea) => (
                    <option key={subArea.id} value={subArea.id}>
                      {subArea.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={resetAll}
                  className="w-full rounded-2xl border border-white/20 bg-slate-900/60 px-4 py-2 text-sm text-white hover:bg-slate-800/80"
                >
                  Clear All
                </button>
              </div>
            </div>
          </section>

          {/* Competitor Selection */}
          {selectedAreaId && (
            <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="mb-4 text-xl font-semibold text-white">Select Competitors</h2>
              {competitorLoading ? (
                <div className="flex items-center justify-center py-8 text-slate-400">
                  Loading competitors...
                </div>
              ) : competitors.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  No competitors found. Please create competitors in the Setups page first.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {competitors.map((competitor) => {
                    const isSelected = selectedCompetitorIds.includes(competitor.id);
                    return (
                      <div
                        key={competitor.id}
                        onClick={() => handleCompetitorSelection(competitor.id)}
                        className={`cursor-pointer rounded-2xl border p-4 transition-colors ${isSelected
                          ? "border-amber-400/60 bg-amber-400/10"
                          : "border-white/10 bg-slate-900/40 hover:border-white/20"
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-white">{competitor.name}</h3>
                            <p className="text-xs text-slate-400">
                              Created: {formatDate(competitor.createdAt)}
                            </p>
                          </div>
                          <div
                            className={`h-5 w-5 rounded-full border-2 ${isSelected
                              ? "border-amber-400 bg-amber-400"
                              : "border-white/30 bg-transparent"
                              }`}
                          >
                            {isSelected && (
                              <svg
                                className="h-full w-full text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* Profile Forms for Selected Competitors */}
          {selectedCompetitorIds.length > 0 && (
            <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="mb-4 text-xl font-semibold text-white">
                Competitor Profiles ({selectedCompetitorIds.length})
              </h2>
              <div className="space-y-8">
                {selectedCompetitorIds.map((competitorId) => {
                  const competitor = competitors.find((c) => c.id === competitorId);
                  const profile = competitorProfiles[competitorId]?.competitorProfiles?.[competitorId];
                  if (!competitor || !profile) return null;

                  return (
                    <div
                      key={competitorId}
                      className="rounded-2xl border border-white/10 bg-slate-900/40 p-6"
                    >
                      <h3 className="mb-4 text-lg font-semibold text-white">
                        {competitor.name}
                      </h3>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="mb-1 block text-sm font-medium text-slate-300">
                              Lowest Price
                            </label>
                            <input
                              type="number"
                              className="w-full rounded-xl border border-white/20 bg-slate-900/60 px-3 py-2 text-white focus:border-amber-400/60 focus:outline-none"
                              value={profile.priceRange.lowestPrice}
                              onChange={(e) =>
                                updateCompetitorProfile(competitorId, {
                                  competitorProfiles: {
                                    [competitorId]: {
                                      ...profile,
                                      priceRange: {
                                        ...profile.priceRange,
                                        lowestPrice: parseInt(e.target.value) || 0,
                                      },
                                    },
                                  },
                                })
                              }
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-medium text-slate-300">
                              Highest Price
                            </label>
                            <input
                              type="number"
                              className="w-full rounded-xl border border-white/20 bg-slate-900/60 px-3 py-2 text-white focus:border-amber-400/60 focus:outline-none"
                              value={profile.priceRange.highestPrice}
                              onChange={(e) =>
                                updateCompetitorProfile(competitorId, {
                                  competitorProfiles: {
                                    [competitorId]: {
                                      ...profile,
                                      priceRange: {
                                        ...profile.priceRange,
                                        highestPrice: parseInt(e.target.value) || 0,
                                      },
                                    },
                                  },
                                })
                              }
                            />
                          </div>
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-medium text-slate-300">
                            Branch Count
                          </label>
                          <input
                            type="number"
                            className="w-full rounded-xl border border-white/20 bg-slate-900/60 px-3 py-2 text-white focus:border-amber-400/60 focus:outline-none"
                            value={profile.branchCount}
                            onChange={(e) =>
                              updateCompetitorProfile(competitorId, {
                                competitorProfiles: {
                                  [competitorId]: {
                                    ...profile,
                                    branchCount: parseInt(e.target.value) || 0,
                                  },
                                },
                              })
                            }
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-300">
                            Strengths
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              className="flex-1 rounded-2xl border border-white/20 bg-slate-900/60 px-4 py-2 text-sm text-white focus:border-amber-400/60 focus:outline-none"
                              value={strengthInputs[competitorId] || ""}
                              onChange={(e) =>
                                setStrengthInputs((prev) => ({
                                  ...prev,
                                  [competitorId]: e.target.value,
                                }))
                              }
                              onKeyPress={(e) =>
                                e.key === "Enter" &&
                                (e.preventDefault(), handleAddStrength(competitorId))
                              }
                              placeholder="Add strength"
                            />
                            <button
                              onClick={() => handleAddStrength(competitorId)}
                              className="rounded-2xl border border-white/20 bg-slate-900/60 px-4 py-2 text-sm text-white hover:bg-slate-800/80"
                            >
                              Add
                            </button>
                          </div>
                          {profile.strengths && profile.strengths.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {profile.strengths.map((strength, index) => (
                                <span
                                  key={index}
                                  className="flex items-center gap-1 rounded-full border border-white/20 bg-slate-900/60 px-3 py-1 text-xs text-white"
                                >
                                  {strength}
                                  <button
                                    onClick={() => handleRemoveStrength(competitorId, index)}
                                    className="text-slate-400 hover:text-white"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-300">
                            Weaknesses
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              className="flex-1 rounded-2xl border border-white/20 bg-slate-900/60 px-4 py-2 text-sm text-white focus:border-amber-400/60 focus:outline-none"
                              value={weaknessInputs[competitorId] || ""}
                              onChange={(e) =>
                                setWeaknessInputs((prev) => ({
                                  ...prev,
                                  [competitorId]: e.target.value,
                                }))
                              }
                              onKeyPress={(e) =>
                                e.key === "Enter" &&
                                (e.preventDefault(), handleAddWeakness(competitorId))
                              }
                              placeholder="Add weakness"
                            />
                            <button
                              onClick={() => handleAddWeakness(competitorId)}
                              className="rounded-2xl border border-white/20 bg-slate-900/60 px-4 py-2 text-sm text-white hover:bg-slate-800/80"
                            >
                              Add
                            </button>
                          </div>
                          {profile.weaknesses && profile.weaknesses.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {profile.weaknesses.map((weakness, index) => (
                                <span
                                  key={index}
                                  className="flex items-center gap-1 rounded-full border border-white/20 bg-slate-900/60 px-3 py-1 text-xs text-white"
                                >
                                  {weakness}
                                  <button
                                    onClick={() => handleRemoveWeakness(competitorId, index)}
                                    className="text-slate-400 hover:text-white"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleSaveAllAssignments}
                  disabled={loading}
                  className="rounded-2xl bg-amber-400/20 px-6 py-2 text-sm font-medium text-amber-300 hover:bg-amber-400/30 disabled:opacity-50"
                >
                  {loading ? "Saving..." : `Save ${selectedCompetitorIds.length} Assignments`}
                </button>
                <button
                  onClick={() => {
                    setSelectedCompetitorIds([]);
                    setCompetitorProfiles({});
                    setStrengthInputs({});
                    setWeaknessInputs({});
                  }}
                  className="rounded-2xl border border-white/20 bg-slate-900/60 px-6 py-2 text-sm text-white hover:bg-slate-800/80"
                >
                  Clear Selection
                </button>
              </div>
            </section>
          )}

          {/* Existing Records */}
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-white">
                All Records ({filteredAssignments.length} of {assignments.length})
              </h2>
              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="flex flex-col">
                  <label className="mb-2 text-sm text-slate-300">Filter by Area</label>
                  <select
                    className="rounded-2xl border border-white/20 bg-slate-900/60 px-4 py-2 text-sm text-white focus:border-amber-400/60 focus:outline-none"
                    value={tableFilterAreaId ?? ""}
                    onChange={(e) => {
                      const value = e.target.value ? Number(e.target.value) : null;
                      setTableFilterAreaId(value);
                      setTableFilterSubAreaId(null);
                    }}
                  >
                    <option value="">All areas</option>
                    {areas.map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="mb-2 text-sm text-slate-300">Filter by Sub-area</label>
                  <select
                    className="rounded-2xl border border-white/20 bg-slate-900/60 px-4 py-2 text-sm text-white focus:border-amber-400/60 focus:outline-none"
                    value={tableFilterSubAreaId ?? ""}
                    onChange={(e) => {
                      const value = e.target.value ? Number(e.target.value) : null;
                      setTableFilterSubAreaId(value);
                    }}
                    disabled={!tableFilterAreaId}
                  >
                    <option value="">All sub-areas</option>
                    {subAreas.map((subArea) => (
                      <option key={subArea.id} value={subArea.id}>
                        {subArea.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setTableFilterAreaId(null);
                      setTableFilterSubAreaId(null);
                    }}
                    className="w-full rounded-2xl border border-white/20 bg-slate-900/60 px-4 py-2 text-sm text-white hover:bg-slate-800/80"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
            {assignmentLoading ? (
              <div className="flex items-center justify-center py-8 text-slate-400">
                Loading assignments...
              </div>
            ) : filteredAssignments.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                {assignments.length === 0 ? "No assignments found." : "No assignments match the current filters."}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAssignments.map((assignment) => {
                  const competitorIds = Object.keys(assignment.competitorProfiles).map(id => parseInt(id));
                  return (
                    <div
                      key={assignment.id}
                      className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 hover:bg-slate-900/60 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => handleOpenProfileModal(assignment)}
                        >
                          <div className="mb-2 flex items-center gap-4">
                            <h3 className="text-lg font-semibold text-white">
                              Information Competitor for {assignment.areaName}
                              {assignment.subAreaName && (
                                <span className="text-slate-300"> → {assignment.subAreaName}</span>
                              )}
                            </h3>
                            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
                              {competitorIds.length} competitor{competitorIds.length !== 1 ? 's' : ''}
                            </span>
                          </div>

                          <div className="mb-4">
                            <span className="font-medium text-slate-300">Competitors: </span>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {competitorIds.map(competitorId => {
                                const competitor = competitors.find(c => c.id === competitorId);
                                const profile = assignment.competitorProfiles[competitorId];
                                return (
                                  <div key={competitorId} className="rounded-xl border border-white/10 bg-slate-800/40 p-3">
                                    <div className="font-medium text-white">{competitor?.name || `Competitor ${competitorId}`}</div>
                                    <div className="mt-1 text-sm text-slate-300">
                                      Price: ${profile.priceRange.lowestPrice} - ${profile.priceRange.highestPrice}
                                    </div>
                                    <div className="text-sm text-slate-300">
                                      Branches: {profile.branchCount}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          <div className="mt-3 text-xs text-slate-500">
                            Created: {formatDate(assignment.createdAt)}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditModal(assignment);
                            }}
                            className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-300 hover:bg-amber-500/20"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAssignment(assignment.id);
                            }}
                            className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-300 hover:bg-red-500/20"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

        </div>
      </MarketingServiceGuard>

      {/* Profile Modal Popup */}
      <ModalPortal show={showProfileModal}>
        <CompetitorProfileModal
          show={showProfileModal}
          assignment={selectedAssignment}
          competitors={competitors}
          onClose={handleCloseProfileModal}
        />
      </ModalPortal>
    </React.Fragment>
  );
}