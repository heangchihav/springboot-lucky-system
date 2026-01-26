"use client";

import { useEffect, useMemo, useState } from "react";
import React from "react";
import { ModalPortal } from "@/components/ModalPortal";
import { MarketingServiceGuard } from "@/components/marketing-service/MarketingServiceGuard";
import { useMarketingData } from "@/hooks/useMarketingData";
import { useToast } from "@/components/ui/Toast";
import {
  type MarketingArea,
  type MarketingSubArea,
} from "@/services/marketing-service/marketingHierarchyService";
import {
  competitorAssignmentService,
  type MarketingCompetitorAssignment,
  type CompetitorAssignmentPayload,
} from "@/services/marketing-service/competitorAssignmentService";
import { type MarketingCompetitor } from "@/services/marketing-service/competitorService";
import { userService, type User } from "@/services/userService";

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
        ៛{profile.priceRange?.lowestPrice || 0} - ៛{profile.priceRange?.highestPrice || 0}
      </p>
    ) : (
      <div className="flex items-center gap-1.5">
        <div className="flex-1 min-w-0 relative">
          <input
            type="text"
            value={profile.priceRange?.lowestPrice || ''}
            onChange={(e) => onFieldChange?.('priceRange', {
              ...(profile.priceRange || {}),
              lowestPrice: e.target.value
            })}
            className="w-full rounded border border-white/10 bg-slate-800/50 px-2 py-1 text-xs text-white text-center"
            placeholder="5000៛"
          />
        </div>
        <span className="text-xs text-slate-400 shrink-0">-</span>
        <div className="flex-1 min-w-0 relative">
          <input
            type="text"
            value={profile.priceRange?.highestPrice || ''}
            onChange={(e) => onFieldChange?.('priceRange', {
              ...(profile.priceRange || {}),
              highestPrice: e.target.value
            })}
            className="w-full rounded border border-white/10 bg-slate-800/50 px-2 py-1 text-xs text-white text-center"
            placeholder="10000៛"
          />
        </div>
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
        type="text"
        value={profile.branchCount ? profile.branchCount.toString() : ''}
        onChange={(e) => onFieldChange?.(parseInt(e.target.value) || 0)}
        className="w-full rounded border border-white/10 bg-slate-800/50 px-2 py-1 text-xs text-white text-center"
        placeholder=""
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
    <div className="w-full rounded-xl border border-white/10 bg-linear-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm p-4 hover:border-amber-500/20 transition-all group">
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
  loadAssignments: () => Promise<void>;
}> = ({ show, assignment, competitors, onClose, loadAssignments }) => {
  const [editingProfiles, setEditingProfiles] = useState<Record<string, any>>({});
  const [strengthInputs, setStrengthInputs] = useState<Record<string, string>>({});
  const [weaknessInputs, setWeaknessInputs] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  // Initialize editing profiles when assignment changes
  useEffect(() => {
    if (assignment) {
      setEditingProfiles({ ...assignment.competitorProfiles });
      // Initialize strength/weakness inputs
      const initialStrengths: Record<string, string> = {};
      const initialWeaknesses: Record<string, string> = {};
      Object.keys(assignment.competitorProfiles).forEach(competitorId => {
        initialStrengths[competitorId] = '';
        initialWeaknesses[competitorId] = '';
      });
      setStrengthInputs(initialStrengths);
      setWeaknessInputs(initialWeaknesses);
    }
  }, [assignment]);

  const handleFieldChange = (competitorId: string, field: string, value: any) => {
    setEditingProfiles(prev => ({
      ...prev,
      [competitorId]: {
        ...prev[competitorId],
        [field]: value
      }
    }));
  };

  const handleStrengthInputChange = (competitorId: number, value: string) => {
    setStrengthInputs(prev => ({
      ...prev,
      [competitorId]: value
    }));
  };

  const handleWeaknessInputChange = (competitorId: number, value: string) => {
    setWeaknessInputs(prev => ({
      ...prev,
      [competitorId]: value
    }));
  };

  const handleAddStrength = (competitorId: number) => {
    const input = strengthInputs[competitorId];
    if (input && input.trim()) {
      const currentStrengths = editingProfiles[competitorId]?.strengths || [];
      handleFieldChange(competitorId.toString(), 'strengths', [...currentStrengths, input.trim()]);
      setStrengthInputs(prev => ({
        ...prev,
        [competitorId]: ''
      }));
    }
  };

  const handleAddWeakness = (competitorId: number) => {
    const input = weaknessInputs[competitorId];
    if (input && input.trim()) {
      const currentWeaknesses = editingProfiles[competitorId]?.weaknesses || [];
      handleFieldChange(competitorId.toString(), 'weaknesses', [...currentWeaknesses, input.trim()]);
      setWeaknessInputs(prev => ({
        ...prev,
        [competitorId]: ''
      }));
    }
  };

  const handleRemoveStrength = (competitorId: number, index: number) => {
    const currentStrengths = editingProfiles[competitorId]?.strengths || [];
    handleFieldChange(competitorId.toString(), 'strengths', currentStrengths.filter((_: any, i: number) => i !== index));
  };

  const handleRemoveWeakness = (competitorId: number, index: number) => {
    const currentWeaknesses = editingProfiles[competitorId]?.weaknesses || [];
    handleFieldChange(competitorId.toString(), 'weaknesses', currentWeaknesses.filter((_: any, i: number) => i !== index));
  };

  if (!show || !assignment) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Update each competitor profile
      for (const [competitorId, profile] of Object.entries(editingProfiles)) {
        // Ensure the profile has all required fields and parse strings to numbers
        const sanitizedProfile = {
          priceRange: {
            lowestPrice: parseInt(profile.priceRange?.lowestPrice) || 0,
            highestPrice: parseInt(profile.priceRange?.highestPrice) || 0
          },
          strengths: Array.isArray(profile.strengths) ? profile.strengths : [],
          weaknesses: Array.isArray(profile.weaknesses) ? profile.weaknesses : [],
          remarks: profile.remarks || '',
          branchCount: typeof profile.branchCount === 'number' ? profile.branchCount : parseInt(profile.branchCount) || 0
        };

        const payload = {
          areaId: assignment.areaId,
          subAreaId: assignment.subAreaId ?? undefined,
          competitorProfiles: {
            [parseInt(competitorId)]: sanitizedProfile
          }
        };

        console.log('Sending payload:', JSON.stringify(payload, null, 2));
        await competitorAssignmentService.updateAssignment(assignment.id, payload);
      }

      // Reload assignments to get the latest data
      await loadAssignments();

      showToast("Competitor profiles updated successfully", "success");
      onClose();
    } catch (error) {
      console.error('Update error:', error);
      showToast(
        error instanceof Error ? error.message : "Failed to update competitor profiles",
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-full flex items-center justify-center p-6">
        <div className="w-full max-w-xl rounded-3xl border border-white/20 bg-linear-to-br from-slate-900 via-slate-900 to-slate-800 shadow-2xl flex flex-col">
          <ModalHeader
            title={assignment.areaName}
            subtitle={assignment.subAreaName}
            onClose={onClose}
          />

          <div className="flex-1 p-4">
            <div className="w-full grid grid-cols-1 gap-4">
              {Object.entries(assignment.competitorProfiles).map(([competitorId, profile]) => {
                const competitor = competitors.find(c => c.id === parseInt(competitorId));
                return (
                  <CompetitorCard
                    key={competitorId}
                    competitor={competitor}
                    competitorId={competitorId.toString()}
                    profile={editingProfiles[competitorId] || profile}
                    readonly={false}
                    onFieldChange={(competitorIdNum, field, value) => handleFieldChange(competitorIdNum.toString(), field, value)}
                    strengthInput={strengthInputs[competitorId] || ''}
                    weaknessInput={weaknessInputs[competitorId] || ''}
                    onStrengthInputChange={handleStrengthInputChange}
                    onWeaknessInputChange={handleWeaknessInputChange}
                    onAddStrength={handleAddStrength}
                    onAddWeakness={handleAddWeakness}
                    onRemoveStrength={handleRemoveStrength}
                    onRemoveWeakness={handleRemoveWeakness}
                  />
                );
              })}
            </div>
          </div>

          <ModalFooter
            count={Object.keys(assignment.competitorProfiles).length}
            onClose={onClose}
            showSave={true}
            onSave={handleSave}
          />
        </div>
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
      <div className="fixed inset-0 z-9999 bg-black/70 backdrop-blur-md overflow-y-auto">
        <div className="min-h-full flex items-start justify-center p-6 pt-10">
          <div className="w-full max-w-[95vw] rounded-2xl border border-white/10 bg-linear-to-br from-slate-900 via-slate-900 to-slate-800 shadow-2xl flex flex-col">
            <ModalHeader
              title={`${assignment.areaName}${assignment.subAreaName ? ` → ${assignment.subAreaName}` : ''}`}
              subtitle="Edit all competitors in this assignment"
              label="Edit Competitors"
              onClose={onClose}
            />

            <div className="flex-1 p-6">
              <div className="flex gap-4 pb-2 min-w-max overflow-x-auto">
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
      </div>
    );
  };


export default function CompetitorsPage() {
  // Use the marketing data hook for data management
  const {
    areas,
    subAreas,
    competitors,
    assignments,
    currentUserAssignments,
    loading: dataLoading,
    loadAreas,
    loadSubAreas,
    loadCompetitors,
    loadAssignments,
    loadAllData,
  } = useMarketingData({
    loadAreasOnMount: true,
    loadCompetitorsOnMount: true,
    loadAssignmentsOnMount: true,
  });

  // Selection states
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);
  const [selectedSubAreaId, setSelectedSubAreaId] = useState<number | null>(null);
  const [selectedCompetitorIds, setSelectedCompetitorIds] = useState<number[]>([]);

  const filteredSubAreasForForm = useMemo(() => {
    // If no area selected, show all sub areas
    if (!selectedAreaId) return subAreas;
    return subAreas.filter((subArea) => subArea.areaId === selectedAreaId);
  }, [selectedAreaId, subAreas]);

  const filteredAreasForForm = useMemo(() => {
    // If user has no assignments, show all areas
    if (currentUserAssignments.length === 0) return areas;
    return areas;
  }, [areas]);

  const subAreaLookup = useMemo(() => {
    const lookup: Record<number, string> = {};
    subAreas.forEach(subArea => {
      lookup[subArea.id] = subArea.name;
    });
    return lookup;
  }, [subAreas]);

  // Table filter states
  const [tableFilterAreaId, setTableFilterAreaId] = useState<number | null>(null);
  const [tableFilterSubAreaId, setTableFilterSubAreaId] = useState<number | null | -1>(null);
  const [tableFilterCompetitorId, setTableFilterCompetitorId] = useState<number | null>(null);

  // Profile forms
  const [competitorProfiles, setCompetitorProfiles] = useState<Record<number, CompetitorAssignmentPayload>>({});
  const [strengthInputs, setStrengthInputs] = useState<Record<number, string>>({});
  const [weaknessInputs, setWeaknessInputs] = useState<Record<number, string>>({});

  const { showToast } = useToast();

  // User data for displaying created/updated by usernames
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Load users for displaying created/updated by information
  const loadUsers = async () => {
    if (usersLoading || users.length > 0) return; // Avoid reloading if already loaded or loading

    setUsersLoading(true);
    try {
      const userList = await userService.getAllUsers();
      setUsers(userList);
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setUsersLoading(false);
    }
  };

  // Create user lookup map
  const userLookup = useMemo(() => {
    const lookup: Record<number, string> = {};
    users.forEach(user => {
      lookup[user.id] = user.fullName || user.username;
    });
    return lookup;
  }, [users]);

  // Local loading states for form operations
  const [isSaving, setIsSaving] = useState(false);

  // Check for duplicate assignments
  const checkForDuplicateAssignment = (areaId: number, subAreaId: number | null, competitorId?: number) => {
    return assignments.some(assignment => {
      // Only check for exact match (same area, same sub-area, AND same competitor)
      // This allows the same competitor to be assigned to different sub-areas within the same area
      if (assignment.areaId === areaId &&
        assignment.subAreaId === subAreaId &&
        competitorId && assignment.competitorProfiles?.[competitorId]) {
        return true;
      }

      return false;
    });
  };

  // Check if competitor should be disabled (already assigned in same area or sub-area)
  const isCompetitorDisabled = (areaId: number, subAreaId: number | null, competitorId: number) => {
    const targetSubArea = subAreaId ?? null;

    return assignments.some(assignment => {
      if (assignment.areaId !== areaId) return false;

      const assignmentSubArea = assignment.subAreaId ?? null;
      if (assignmentSubArea !== targetSubArea) return false;

      return Boolean(competitorId && assignment.competitorProfiles?.[competitorId]);
    });
  };

  // Modal states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<MarketingCompetitorAssignment | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeCompetitorTab, setActiveCompetitorTab] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<MarketingCompetitorAssignment | null>(null);
  const [editCompetitorProfiles, setEditCompetitorProfiles] = useState<Record<number, any>>({});
  const [editStrengthInputs, setEditStrengthInputs] = useState<Record<number, string>>({});
  const [editWeaknessInputs, setEditWeaknessInputs] = useState<Record<number, string>>({});


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

      // Reload assignments to get the latest data
      await loadAssignments();

      // Close the edit modal first
      handleCloseEditModal();

      // Show success message
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
    // Check for duplicate before allowing selection
    if (!selectedAreaId) {
      showToast("Please select an area first", "error");
      return;
    }

    // Check if competitor is disabled (already assigned in same area)
    const isDisabled = isCompetitorDisabled(selectedAreaId, selectedSubAreaId, competitorId);
    if (isDisabled) {
      const competitor = competitors.find(c => c.id === competitorId);
      const area = areas.find(a => a.id === selectedAreaId);
      showToast(`Competitor "${competitor?.name}" already has an assignment in area "${area?.name}"`, "error");
      return;
    }

    const isDuplicate = checkForDuplicateAssignment(selectedAreaId, selectedSubAreaId, competitorId);
    if (isDuplicate) {
      const competitor = competitors.find(c => c.id === competitorId);
      const location = selectedSubAreaId
        ? `sub-area "${subAreaLookup[selectedSubAreaId]}" in area "${areas.find(a => a.id === selectedAreaId)?.name}"`
        : `area "${areas.find(a => a.id === selectedAreaId)?.name}"`;
      showToast(`Competitor "${competitor?.name}" already has an assignment for this ${location}`, "error");
      return;
    }

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
        // If removing the active tab, switch to another available competitor
        if (activeCompetitorTab === competitorId) {
          const remainingCompetitors = prev.filter(id => id !== competitorId);
          setActiveCompetitorTab(remainingCompetitors.length > 0 ? remainingCompetitors[0] : null);
        }
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
        // Set this competitor as the active tab
        setActiveCompetitorTab(competitorId);
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

    // Check for duplicate assignments for each competitor
    const duplicateCompetitors = selectedCompetitorIds.filter(competitorId =>
      checkForDuplicateAssignment(selectedAreaId, selectedSubAreaId, competitorId)
    );

    if (duplicateCompetitors.length > 0) {
      const competitor = competitors.find(c => c.id === duplicateCompetitors[0]);
      const location = selectedSubAreaId
        ? `sub-area "${subAreaLookup[selectedSubAreaId]}" in area "${areas.find(a => a.id === selectedAreaId)?.name}"`
        : `area "${areas.find(a => a.id === selectedAreaId)?.name}"`;
      showToast(`Competitor "${competitor?.name}" already has an assignment for this ${location}`, "error");
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

    setIsSaving(true);
    try {
      // Create separate assignment for each competitor
      for (const competitorId of selectedCompetitorIds) {
        const profile = competitorProfiles[competitorId]?.competitorProfiles?.[competitorId];
        if (profile) {
          const payload: CompetitorAssignmentPayload = {
            areaId: selectedAreaId,
            subAreaId: selectedSubAreaId ?? undefined,
            competitorProfiles: {
              [competitorId]: {
                priceRange: profile.priceRange,
                strengths: profile.strengths,
                weaknesses: profile.weaknesses,
                remarks: profile.remarks,
                branchCount: profile.branchCount,
              },
            },
          };

          await competitorAssignmentService.createAssignment(payload);
        }
      }

      showToast(`Competitor assignment${selectedCompetitorIds.length > 1 ? 's' : ''} created successfully`);

      resetAll();
      await loadAssignments();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to save assignments",
        "error",
      );
    } finally {
      setIsSaving(false);
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

    try {
      await competitorAssignmentService.deleteAssignment(id);
      await loadAssignments();
      showToast("Assignment deleted");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to delete assignment",
        "error",
      );
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

  const getSubAreaLabel = (assignment: MarketingCompetitorAssignment) => {
    if (!assignment.subAreaId) {
      return "Area level";
    }
    return assignment.subAreaName ?? subAreaLookup[assignment.subAreaId] ?? `Sub-area #${assignment.subAreaId}`;
  };

  // Flatten assignments to individual competitor records and apply filters
  const flattenedAssignments = useMemo(() => {
    const records: Array<{
      assignmentId: number;
      competitorId: number;
      competitorName: string;
      areaId: number;
      areaName: string;
      subAreaId: number | null;
      subAreaName: string | null;
      profile: any;
      createdBy?: number;
      updatedBy?: number;
      createdAt: string;
      updatedAt?: string;
    }> = [];

    assignments.forEach(assignment => {
      Object.entries(assignment.competitorProfiles).forEach(([competitorIdStr, profile]) => {
        const competitorId = parseInt(competitorIdStr);
        const competitor = competitors.find(c => c.id === competitorId);

        records.push({
          assignmentId: assignment.id,
          competitorId,
          competitorName: competitor?.name || `Competitor ${competitorId}`,
          areaId: assignment.areaId,
          areaName: assignment.areaName,
          subAreaId: assignment.subAreaId ?? null,
          subAreaName: assignment.subAreaName ?? null,
          profile,
          createdBy: assignment.createdBy,
          updatedBy: assignment.updatedBy,
          createdAt: assignment.createdAt,
          updatedAt: assignment.updatedAt,
        });
      });
    });

    return records;
  }, [assignments, competitors]);

  const filteredAssignments = useMemo(() => {
    return flattenedAssignments.filter(record => {
      if (tableFilterAreaId && record.areaId !== tableFilterAreaId) {
        return false;
      }

      // Handle sub-area filtering
      if (tableFilterSubAreaId === -1) {
        // "None" selected - show only area-level assignments (subAreaId is null)
        if (record.subAreaId !== null) {
          return false;
        }
      } else if (tableFilterSubAreaId && tableFilterSubAreaId !== -1) {
        // Specific sub-area selected - show only that sub-area
        if (record.subAreaId !== tableFilterSubAreaId) {
          return false;
        }
      }
      // If tableFilterSubAreaId is null/undefined, show all (area + sub-areas)

      if (tableFilterCompetitorId && record.competitorId !== tableFilterCompetitorId) {
        return false;
      }

      return true;
    });
  }, [flattenedAssignments, tableFilterAreaId, tableFilterSubAreaId, tableFilterCompetitorId]);

  useEffect(() => {
    void Promise.all([loadAreas(), loadCompetitors()]);
    void loadUsers(); // Load users for displaying created/updated by information
  }, []);

  useEffect(() => {
    if (selectedAreaId) {
      void loadSubAreas(); // Load all sub-areas, but form will filter them
    }
  }, [selectedAreaId]);

  useEffect(() => {
    if (tableFilterAreaId) {
      void loadSubAreas(); // Load all sub-areas, but filter will handle it
    } else if (!selectedAreaId) {
      void loadSubAreas();
    }
  }, [tableFilterAreaId]);

  useEffect(() => {
    void loadAssignments();
  }, []);

  // Load all sub-areas for dropdowns when component loads and user assignments change
  useEffect(() => {
    void loadSubAreas(); // Load all sub-areas for dropdown filtering
  }, [currentUserAssignments]);

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

          {/* Create Record Button */}
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">Create New Assignment</h2>
                <p className="text-sm text-slate-300">
                  Add new competitor assignments to areas and sub-areas
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="rounded-2xl border border-green-500/30 bg-green-500/10 px-6 py-3 text-sm font-semibold text-green-300 hover:bg-green-500/20 transition-all flex items-center gap-2"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Record
              </button>
            </div>
          </section>

          {/* Create Assignment Modal */}
          <ModalPortal show={showCreateModal}>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
              <div className="min-h-full flex items-center justify-center p-4">
                <div className="bg-slate-900 rounded-3xl border border-white/10 w-full max-w-3xl flex flex-col">
                  <ModalHeader
                    title="Create Competitor Assignment"
                    subtitle="Select location and competitors to create new assignments"
                    onClose={() => setShowCreateModal(false)}
                  />

                  <div className="p-6 flex-1">
                    {/* Location Selection */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Select Location</h3>
                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                        <div className="flex flex-col">
                          <label className="mb-2 text-sm text-slate-300">Area *</label>
                          <select
                            className="rounded-2xl border border-white/20 bg-slate-900/60 px-4 py-2 text-sm text-white focus:border-amber-400/60 focus:outline-none"
                            value={selectedAreaId ?? ""}
                            onChange={(e) => {
                              const value = e.target.value ? Number(e.target.value) : null;
                              setSelectedAreaId(value);
                              setSelectedSubAreaId(null);
                            }}
                          >
                            <option value="">Select area</option>
                            {(currentUserAssignments.length === 0
                              ? areas
                              : areas.filter((area) =>
                                currentUserAssignments.some((assignment) => assignment.areaId === area.id)
                              )
                            ).map((area) => (
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
                            {(currentUserAssignments.length === 0
                              ? filteredSubAreasForForm
                              : filteredSubAreasForForm.filter((subArea) =>
                                currentUserAssignments.some((assignment) => assignment.subAreaId === subArea.id)
                              )
                            ).map((subArea) => (
                              <option key={subArea.id} value={subArea.id}>
                                {subArea.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Competitor Selection */}
                    {selectedAreaId && (
                      <>
                        <div className="mb-6 space-y-6">
                          <div>
                            <h3 className="text-lg font-semibold text-white mb-4">Select Competitors</h3>
                            {dataLoading.competitors ? (
                              <div className="flex items-center justify-center py-8 text-slate-400">
                                Loading competitors...
                              </div>
                            ) : competitors.length === 0 ? (
                              <div className="py-8 text-center text-slate-400">
                                No competitors available
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {competitors.map((competitor) => {
                                  const isSelected = selectedCompetitorIds.includes(competitor.id);
                                  const isDisabled = selectedAreaId && isCompetitorDisabled(selectedAreaId, selectedSubAreaId, competitor.id);

                                  return (
                                    <div
                                      key={competitor.id}
                                      onClick={() => !isDisabled && handleCompetitorSelection(competitor.id)}
                                      className={`rounded-xl border p-3 transition-colors ${isDisabled
                                        ? "border-gray-600/30 bg-gray-800/40 cursor-not-allowed opacity-50"
                                        : isSelected
                                          ? "border-amber-400/60 bg-amber-400/10 cursor-pointer"
                                          : "border-white/10 bg-slate-900/40 cursor-pointer hover:border-white/20"
                                        }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                          <h3 className="font-semibold text-white text-sm truncate">{competitor.name}</h3>
                                          {isDisabled && (
                                            <p className="text-xs text-gray-400 mt-1">Already assigned in this area</p>
                                          )}
                                        </div>
                                        <div
                                          className={`h-4 w-4 rounded-full border-2 shrink-0 ml-2 ${isDisabled
                                            ? "border-gray-500 bg-gray-600"
                                            : isSelected
                                              ? "border-amber-400 bg-amber-400"
                                              : "border-white/30 bg-transparent"
                                            }`}
                                        >
                                          {isSelected && !isDisabled && (
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
                          </div>

                          {/* Individual Competitor Profile Forms */}
                          {selectedCompetitorIds.length > 0 && (
                            <div>
                              <h3 className="text-lg font-semibold text-white mb-4">Competitor Profiles</h3>

                              {/* Competitor Tabs */}
                              <div className="flex flex-wrap gap-2 mb-6 border-b border-white/10 pb-4">
                                {selectedCompetitorIds.map((competitorId) => {
                                  const competitor = competitors.find((c) => c.id === competitorId);
                                  if (!competitor) return null;
                                  const isActive = activeCompetitorTab === competitorId;

                                  return (
                                    <button
                                      key={competitorId}
                                      onClick={() => setActiveCompetitorTab(competitorId)}
                                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive
                                        ? "bg-amber-500/20 border border-amber-500/30 text-amber-300"
                                        : "bg-slate-800/50 border border-white/10 text-slate-400 hover:border-white/20 hover:text-white"
                                        }`}
                                    >
                                      {competitor.name}
                                      <span
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedCompetitorIds(prev => prev.filter(id => id !== competitorId));
                                          const newProfiles = { ...competitorProfiles };
                                          delete newProfiles[competitorId];
                                          setCompetitorProfiles(newProfiles);
                                          const newStrengthInputs = { ...strengthInputs };
                                          delete newStrengthInputs[competitorId];
                                          setStrengthInputs(newStrengthInputs);
                                          const updatedWeaknessInputs = { ...weaknessInputs };
                                          delete updatedWeaknessInputs[competitorId];
                                          setWeaknessInputs(updatedWeaknessInputs);
                                          // If removing the active tab, switch to first available
                                          if (activeCompetitorTab === competitorId && selectedCompetitorIds.length > 1) {
                                            const remainingIds = selectedCompetitorIds.filter(id => id !== competitorId);
                                            if (remainingIds.length > 0) {
                                              setActiveCompetitorTab(remainingIds[0]);
                                            }
                                          }
                                        }}
                                        className="ml-2 text-xs hover:text-red-400 transition-colors cursor-pointer"
                                      >
                                        ×
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Active Competitor Profile Form */}
                              {selectedCompetitorIds.map((competitorId) => {
                                if (competitorId !== activeCompetitorTab) return null;

                                const competitor = competitors.find((c) => c.id === competitorId);
                                const profile = competitorProfiles[competitorId]?.competitorProfiles?.[competitorId];
                                if (!competitor) return null;

                                return (
                                  <div key={competitorId} className="mb-6">
                                    <h3 className="text-lg font-semibold text-white mb-4">Competitor Profile</h3>
                                    <div className="mb-4 flex items-center justify-between">
                                      <h2 className="text-xl font-semibold text-white">
                                        Competitor Profile: {competitor.name}
                                      </h2>
                                      <button
                                        onClick={() => {
                                          setSelectedCompetitorIds(prev => prev.filter(id => id !== competitorId));
                                          const newProfiles = { ...competitorProfiles };
                                          delete newProfiles[competitorId];
                                          setCompetitorProfiles(newProfiles);
                                          const newStrengthInputs = { ...strengthInputs };
                                          delete newStrengthInputs[competitorId];
                                          setStrengthInputs(newStrengthInputs);
                                          const newWeaknessInputs = { ...weaknessInputs };
                                          delete newWeaknessInputs[competitorId];
                                          setWeaknessInputs(newWeaknessInputs);
                                        }}
                                        className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-300 hover:bg-red-500/20"
                                      >
                                        Remove
                                      </button>
                                    </div>

                                    {!profile && (
                                      <button
                                        onClick={() => handleCompetitorSelection(competitorId)}
                                        className="w-full rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-300 hover:bg-amber-500/20"
                                      >
                                        Create Profile for {competitor.name}
                                      </button>
                                    )}

                                    {profile && (
                                      <div className="space-y-4">
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                          <div className="relative">
                                            <label className="mb-1 block text-sm font-medium text-slate-300">
                                              Lowest Price
                                            </label>
                                            <input
                                              type="text"
                                              className="w-full rounded-xl border border-white/20 bg-slate-900/60 px-3 py-2 text-white focus:border-amber-400/60 focus:outline-none"
                                              value={profile.priceRange?.lowestPrice || ''}
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
                                              placeholder="5000៛"
                                            />
                                          </div>
                                          <div className="relative">
                                            <label className="mb-1 block text-sm font-medium text-slate-300">
                                              Highest Price
                                            </label>
                                            <input
                                              type="text"
                                              className="w-full rounded-xl border border-white/20 bg-slate-900/60 px-3 py-2 text-white focus:border-amber-400/60 focus:outline-none"
                                              value={profile.priceRange?.highestPrice || ''}
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
                                              placeholder="10000៛"
                                            />
                                          </div>
                                        </div>

                                        <div className="sm:col-span-2">
                                          <label className="mb-1 block text-sm font-medium text-slate-300">
                                            Branch Count
                                          </label>
                                          <input
                                            type="text"
                                            className="w-full rounded-xl border border-white/20 bg-slate-900/60 px-3 py-2 text-white focus:border-amber-400/60 focus:outline-none"
                                            value={profile.branchCount ? profile.branchCount.toString() : ''}
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
                                            placeholder=""
                                          />
                                        </div>

                                        <div>
                                          <label className="mb-2 block text-sm font-medium text-slate-300">
                                            Strengths
                                          </label>
                                          <div className="flex flex-col gap-2 sm:flex-row">
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
                                              {profile.strengths.map((strength: string, idx: number) => (
                                                <span
                                                  key={idx}
                                                  className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-1 text-xs text-blue-300"
                                                >
                                                  {strength}
                                                  <button
                                                    onClick={() => handleRemoveStrength(competitorId, idx)}
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
                                          <div className="flex flex-col gap-2 sm:flex-row">
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
                                              {profile.weaknesses.map((weakness: string, idx: number) => (
                                                <span
                                                  key={idx}
                                                  className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-1 text-xs text-rose-300"
                                                >
                                                  {weakness}
                                                  <button
                                                    onClick={() => handleRemoveWeakness(competitorId, idx)}
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
                                            Remarks
                                          </label>
                                          <textarea
                                            className="w-full rounded-2xl border border-white/20 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-amber-400/60 focus:outline-none resize-none"
                                            rows={3}
                                            value={profile.remarks ?? ""}
                                            onChange={(e) =>
                                              updateCompetitorProfile(competitorId, {
                                                competitorProfiles: {
                                                  [competitorId]: {
                                                    ...profile,
                                                    remarks: e.target.value,
                                                  },
                                                },
                                              })
                                            }
                                            placeholder="Add any additional notes for this competitor..."
                                          />
                                        </div>

                                        <div className="mt-6 flex gap-3">
                                          <button
                                            onClick={handleSaveAllAssignments}
                                            disabled={isSaving}
                                            className="rounded-2xl bg-amber-400/20 px-6 py-2 text-sm font-medium text-amber-300 hover:bg-amber-400/30 disabled:opacity-50"
                                          >
                                            {isSaving ? "Saving..." : "Save Assignment"}
                                          </button>
                                          <button
                                            onClick={() => {
                                              setSelectedCompetitorIds(prev => prev.filter(id => id !== competitorId));
                                              const newProfiles = { ...competitorProfiles };
                                              delete newProfiles[competitorId];
                                              setCompetitorProfiles(newProfiles);
                                              const newStrengthInputs = { ...strengthInputs };
                                              delete newStrengthInputs[competitorId];
                                              setStrengthInputs(newStrengthInputs);
                                              const newWeaknessInputs = { ...weaknessInputs };
                                              delete newWeaknessInputs[competitorId];
                                              setWeaknessInputs(newWeaknessInputs);
                                            }}
                                            className="rounded-2xl border border-white/20 bg-slate-900/60 px-6 py-2 text-sm text-white hover:bg-slate-800/80"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <ModalFooter
                          count={selectedCompetitorIds.length}
                          onClose={() => setShowCreateModal(false)}
                          showSave={selectedCompetitorIds.length > 0}
                          onSave={handleSaveAllAssignments}
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </ModalPortal>

          {/* Existing Records */}
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-white">
                All Records ({filteredAssignments.length} of {flattenedAssignments.length})
              </h2>
              <div className="mt-4 space-y-4">
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-48">
                    <label className="mb-2 block text-sm font-medium text-slate-300">Filter by Area</label>
                    <select
                      className="w-full rounded-2xl border border-white/20 bg-slate-900/60 px-4 py-2 text-sm text-white focus:border-amber-400/60 focus:outline-none"
                      value={tableFilterAreaId ?? ""}
                      onChange={(e) => setTableFilterAreaId(e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="">All areas</option>
                      {areas.map((area) => (
                        <option key={area.id} value={area.id}>
                          {area.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 min-w-48">
                    <label className="mb-2 block text-sm font-medium text-slate-300">Filter by Sub-area</label>
                    <select
                      className="w-full rounded-2xl border border-white/20 bg-slate-900/60 px-4 py-2 text-sm text-white focus:border-amber-400/60 focus:outline-none"
                      value={tableFilterSubAreaId ?? ""}
                      onChange={(e) => setTableFilterSubAreaId(e.target.value ? Number(e.target.value) : null)}
                      disabled={!tableFilterAreaId}
                    >
                      <option value="">All sub-areas</option>
                      <option value="-1">None (area only)</option>
                      {tableFilterAreaId && subAreas
                        .filter(subArea => subArea.areaId === tableFilterAreaId)
                        .map((subArea) => (
                          <option key={subArea.id} value={subArea.id}>
                            {subArea.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="flex-1 min-w-48">
                    <label className="mb-2 block text-sm font-medium text-slate-300">Filter by Competitor</label>
                    <select
                      className="w-full rounded-2xl border border-white/20 bg-slate-900/60 px-4 py-2 text-sm text-white focus:border-amber-400/60 focus:outline-none"
                      value={tableFilterCompetitorId ?? ""}
                      onChange={(e) => setTableFilterCompetitorId(e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="">All competitors</option>
                      {competitors.map((competitor) => (
                        <option key={competitor.id} value={competitor.id}>
                          {competitor.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setTableFilterAreaId(null);
                    setTableFilterSubAreaId(null);
                    setTableFilterCompetitorId(null);
                  }}
                  className="rounded-2xl border border-white/20 bg-slate-900/60 px-4 py-2 text-sm text-white hover:bg-slate-800/80"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
            {dataLoading.assignments ? (
              <div className="flex items-center justify-center py-8 text-slate-400">
                Loading assignments...
              </div>
            ) : filteredAssignments.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                {flattenedAssignments.length === 0 ? "No assignments found." : "No assignments match the current filters."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 font-semibold text-white text-xs uppercase tracking-wider">No</th>
                      <th className="text-left py-3 px-4 font-semibold text-white text-xs uppercase tracking-wider whitespace-nowrap">Competitor</th>
                      <th className="text-left py-3 px-4 font-semibold text-white text-xs uppercase tracking-wider whitespace-nowrap">Area</th>
                      <th className="text-left py-3 px-4 font-semibold text-white text-xs uppercase tracking-wider whitespace-nowrap">Sub-area</th>
                      <th className="text-left py-3 px-4 font-semibold text-white text-xs uppercase tracking-wider whitespace-nowrap">Price Range</th>
                      <th className="text-left py-3 px-4 font-semibold text-white text-xs uppercase tracking-wider whitespace-nowrap">Branches</th>
                      <th className="text-left py-3 px-4 font-semibold text-white text-xs uppercase tracking-wider w-[300px] whitespace-nowrap">Strengths</th>
                      <th className="text-left py-3 px-4 font-semibold text-white text-xs uppercase tracking-wider w-[300px] whitespace-nowrap">Weaknesses</th>
                      <th className="text-left py-3 px-4 font-semibold text-white text-xs uppercase tracking-wider whitespace-nowrap">Remarks</th>
                      <th className="text-left py-3 px-4 font-semibold text-white text-xs uppercase tracking-wider whitespace-nowrap">Created By</th>
                      <th className="text-left py-3 px-4 font-semibold text-white text-xs uppercase tracking-wider whitespace-nowrap">Created At</th>
                      <th className="text-left py-3 px-4 font-semibold text-white text-xs uppercase tracking-wider whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredAssignments.map((record, index) => {
                      const subAreaLabel = record.subAreaName || "Area level";
                      return (
                        <tr key={`${record.assignmentId}-${record.competitorId}`} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 px-4 text-white font-medium">{index + 1}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-500/30 bg-linear-to-br from-amber-500/20 to-amber-600/10">
                                <span className="text-xs font-bold text-amber-300">
                                  {record.competitorName?.charAt(0).toUpperCase() || 'C'}
                                </span>
                              </div>
                              <div>
                                <p className="text-white font-medium text-sm">
                                  {record.competitorName}
                                </p>
                                <p className="text-slate-500 text-xs font-mono">#{record.competitorId}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-white text-sm whitespace-nowrap">{record.areaName}</td>
                          <td className="py-3 px-4 text-white text-sm whitespace-nowrap">{subAreaLabel}</td>
                          <td className="py-3 px-4 text-white text-sm whitespace-nowrap">
                            ៛{record.profile.priceRange.lowestPrice} - ៛{record.profile.priceRange.highestPrice}
                          </td>
                          <td className="py-3 px-4 text-white text-sm whitespace-nowrap">{record.profile.branchCount}</td>
                          <td className="py-3 px-4 min-w-[300px]">
                            <div className="space-y-1">
                              {(record.profile.strengths || []).map((strength: string, idx: number) => (
                                <div key={idx} className="text-xs text-blue-300 bg-blue-500/10 rounded px-2 py-1">
                                  {strength}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-4 min-w-[300px]">
                            <div className="space-y-1">
                              {(record.profile.weaknesses || []).map((weakness: string, idx: number) => (
                                <div key={idx} className="text-xs text-rose-300 bg-rose-500/10 rounded px-2 py-1">
                                  {weakness}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-white text-sm max-w-xs whitespace-nowrap">
                            <p className="truncate" title={record.profile.remarks || 'No remarks'}>
                              {record.profile.remarks || 'No remarks'}
                            </p>
                          </td>
                          <td className="py-3 px-4 text-white text-sm whitespace-nowrap">
                            {userLookup[record.createdBy || 0] || 'Unknown'}
                          </td>
                          <td className="py-3 px-4 text-white text-sm whitespace-nowrap">
                            {new Date(record.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleOpenProfileModal({
                                  id: record.assignmentId,
                                  areaId: record.areaId,
                                  areaName: record.areaName,
                                  subAreaId: record.subAreaId ?? undefined,
                                  subAreaName: record.subAreaName ?? undefined,
                                  competitorProfiles: { [record.competitorId]: record.profile },
                                  createdBy: 0,
                                  createdAt: new Date().toISOString(),
                                })}
                                className="rounded border border-blue-500/30 bg-blue-500/10 px-2 py-1 text-xs font-semibold text-blue-300 hover:bg-blue-500/20 transition-all"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteAssignment(record.assignmentId)}
                                className="rounded border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs font-semibold text-red-300 hover:bg-red-500/20 transition-all"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Profile Modal Popup */}
          <ModalPortal show={showProfileModal}>
            <CompetitorProfileModal
              show={showProfileModal}
              assignment={selectedAssignment}
              competitors={competitors}
              onClose={handleCloseProfileModal}
              loadAssignments={loadAssignments}
            />
          </ModalPortal>
        </div >
      </MarketingServiceGuard >
    </React.Fragment >
  );
}