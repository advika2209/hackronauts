import { type ComponentType, useState } from 'react';
import {
  AlertTriangle, AlertCircle, Info, BookOpen,
  ChevronDown, ChevronUp, ScanSearch, ShieldCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './ui/utils';
import type { ClinicalFlag, Medication, FlagSeverity } from '../data/mockData';

interface ClinicalFlagsPanelProps {
  flags: ClinicalFlag[];
  medications: Medication[];
  onMedicationClick: (id: string) => void;
  onFlagSelect?: (flagId: string) => void;
}

// ─── Severity config — accent-only, white card background ─────────────────────

const SEVERITY: Record<FlagSeverity, {
  icon: ComponentType<{ className?: string }>;
  borderClass: string;
  iconClass: string;
  badgeBg: string;
  badgeText: string;
  label: string;
  defaultConfidence: number;
}> = {
  critical: {
    icon: AlertTriangle,
    borderClass: 'border-l-red-500',
    iconClass: 'text-red-500',
    badgeBg: 'bg-red-50',
    badgeText: 'text-red-600',
    label: 'CRITICAL',
    defaultConfidence: 94,
  },
  high: {
    icon: AlertTriangle,
    borderClass: 'border-l-orange-400',
    iconClass: 'text-orange-400',
    badgeBg: 'bg-orange-50',
    badgeText: 'text-orange-600',
    label: 'HIGH',
    defaultConfidence: 87,
  },
  medium: {
    icon: AlertCircle,
    borderClass: 'border-l-amber-400',
    iconClass: 'text-amber-500',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-600',
    label: 'MEDIUM',
    defaultConfidence: 78,
  },
  low: {
    icon: Info,
    borderClass: 'border-l-blue-300',
    iconClass: 'text-blue-400',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-500',
    label: 'LOW',
    defaultConfidence: 69,
  },
};

// ─── Confidence badge ─────────────────────────────────────────────────────────

function ConfidenceBadge({ value }: { value: number }) {
  const cls =
    value >= 90 ? 'bg-emerald-50 text-emerald-600' :
    value >= 78 ? 'bg-blue-50 text-blue-500' :
                  'bg-amber-50 text-amber-600';
  return (
    <span
      className={cn('flex items-center gap-0.5 px-1.5 py-px rounded shrink-0', cls)}
      style={{ fontSize: 10, fontWeight: 600 }}
    >
      <ShieldCheck className="w-2.5 h-2.5" />
      {value}%
    </span>
  );
}

// ─── Flag Card ────────────────────────────────────────────────────────────────

function FlagCard({
  flag,
  medications,
  onMedicationClick,
  onFlagSelect,
}: {
  flag: ClinicalFlag;
  medications: Medication[];
  onMedicationClick: (id: string) => void;
  onFlagSelect?: (flagId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = SEVERITY[flag.severity];
  const Icon = cfg.icon;
  const affectedMeds = medications.filter((m) => flag.medicationIds.includes(m.id));
  const confidence = flag.confidence ?? cfg.defaultConfidence;

  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-gray-100 border-l-4 overflow-hidden',
        cfg.borderClass
      )}
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
    >
      {/* ── Always-visible header ── */}
      <div className="px-3 pt-2.5 pb-0">

        {/* Row 1: icon + badge + title + actions */}
        <div className="flex items-start gap-2">
          <Icon className={cn('w-3.5 h-3.5 mt-0.5 shrink-0', cfg.iconClass)} />
          <div className="flex-1 min-w-0">
            <span
              className={cn('inline-block px-1.5 py-px rounded mb-1', cfg.badgeBg, cfg.badgeText)}
              style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.07em' }}
            >
              {cfg.label}
            </span>
            <p className="text-gray-900" style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.45 }}>
              {flag.title}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-0.5 shrink-0 mt-0.5">
            {onFlagSelect && (
              <button
                onClick={() => onFlagSelect(flag.id)}
                className="w-6 h-6 flex items-center justify-center rounded text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                title="Trace to source documents"
              >
                <ScanSearch className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => setExpanded((v) => !v)}
              className="w-6 h-6 flex items-center justify-center rounded text-gray-300 hover:text-gray-500 transition-colors"
              aria-label={expanded ? 'Collapse' : 'Expand'}
            >
              {expanded
                ? <ChevronUp className="w-3.5 h-3.5" />
                : <ChevronDown className="w-3.5 h-3.5" />
              }
            </button>
          </div>
        </div>

        {/* Row 2: affected medication pills */}
        {affectedMeds.length > 0 && (
          <div className="flex items-center gap-1 mt-1.5 ml-5 flex-wrap">
            {affectedMeds.map((med) => (
              <button
                key={med.id}
                onClick={() => onMedicationClick(med.id)}
                className="px-2 py-px bg-gray-50 border border-gray-200 rounded-full text-gray-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors"
                style={{ fontSize: 10, fontWeight: 500 }}
              >
                {med.name} {med.dose}
              </button>
            ))}
          </div>
        )}

        {/* Row 3: citation + confidence */}
        <div className="flex items-center gap-2 mt-2 mb-2.5 ml-5">
          <BookOpen className="w-3 h-3 text-gray-300 shrink-0" />
          <span
            className="text-gray-400 flex-1 truncate"
            style={{ fontSize: 10 }}
          >
            {flag.criteria}
          </span>
          <ConfidenceBadge value={confidence} />
        </div>
      </div>

      {/* ── Expandable body ── */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-100 px-3 pt-2.5 pb-3">
              <div className="ml-5 space-y-2.5">
                {/* Description */}
                <p className="text-gray-500" style={{ fontSize: 12, lineHeight: 1.65 }}>
                  {flag.description}
                </p>

                {/* Recommendation */}
                <div className="rounded-md bg-gray-50 border border-gray-100 px-3 py-2.5">
                  <p
                    className="text-gray-400 mb-1"
                    style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}
                  >
                    Recommendation
                  </p>
                  <p className="text-gray-600" style={{ fontSize: 12, lineHeight: 1.6 }}>
                    {flag.recommendation}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Severity summary pill ────────────────────────────────────────────────────

function SeverityCount({
  count, bg, text, label,
}: {
  count: number; bg: string; text: string; label: string;
}) {
  if (count === 0) return null;
  return (
    <span className={cn('px-1.5 py-px rounded', bg, text)} style={{ fontSize: 10, fontWeight: 700 }}>
      {count} {label}
    </span>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────

const SEVERITY_ORDER: FlagSeverity[] = ['critical', 'high', 'medium', 'low'];

export function ClinicalFlagsPanel({
  flags, medications, onMedicationClick, onFlagSelect,
}: ClinicalFlagsPanelProps) {
  if (flags.length === 0) {
    return (
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 12 12" className="w-2.5 h-2.5">
              <path d="M2 6l3 3 5-5" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
          <span className="text-gray-500" style={{ fontSize: 13, fontWeight: 500 }}>
            No clinical flags detected for this patient
          </span>
        </div>
      </div>
    );
  }

  const sorted = [...flags].sort(
    (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity)
  );

  const counts = SEVERITY_ORDER.reduce(
    (acc, s) => ({ ...acc, [s]: flags.filter((f) => f.severity === s).length }),
    {} as Record<FlagSeverity, number>
  );

  return (
    <div className="px-4 py-3 border-b border-gray-200 bg-white shrink-0">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className="text-gray-500"
          style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}
        >
          Clinical Alerts
        </span>
        <div className="flex items-center gap-1">
          <SeverityCount count={counts.critical} bg="bg-red-50"    text="text-red-600"    label="crit" />
          <SeverityCount count={counts.high}     bg="bg-orange-50" text="text-orange-600" label="high" />
          <SeverityCount count={counts.medium}   bg="bg-amber-50"  text="text-amber-600"  label="med"  />
          <SeverityCount count={counts.low}      bg="bg-blue-50"   text="text-blue-500"   label="low"  />
        </div>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2">
        {sorted.map((flag) => (
          <FlagCard
            key={flag.id}
            flag={flag}
            medications={medications}
            onMedicationClick={onMedicationClick}
            onFlagSelect={onFlagSelect}
          />
        ))}
      </div>
    </div>
  );
}
