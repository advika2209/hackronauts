import { useState, useMemo } from 'react';
import {
  AlertTriangle, AlertCircle, ChevronDown, Search, X,
  FileText, ArrowUp, ArrowDown, ArrowUpDown, ExternalLink, Copy,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './ui/utils';
import type { ClinicalFlag, Medication, MedicationStatus } from '../data/mockData';

// ─── Types ────────────────────────────────────────────────────────────────────

type SortCol = 'name' | 'dose' | 'prescriber' | 'started' | 'confidence' | 'status';
type FilterVal = 'all' | 'flagged' | MedicationStatus;
type RiskLevel = 'critical' | 'high' | 'medium' | null;

interface MedicationTableProps {
  medications: Medication[];
  flags: ClinicalFlag[];
  selectedMedicationId: string | null;
  onSelect: (id: string | null) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GRID = '165px 86px 140px 72px 52px 1fr 92px 36px';

const STATUS_CFG: Record<MedicationStatus, { label: string; dot: string; text: string; bg: string }> = {
  verified:         { label: 'Verified',        dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  inferred:         { label: 'AI Inferred',     dot: 'bg-blue-500',    text: 'text-blue-700',    bg: 'bg-blue-50'    },
  'low-confidence': { label: 'Low Confidence',  dot: 'bg-amber-500',   text: 'text-amber-700',   bg: 'bg-amber-50'   },
};

const CATEGORY_COLOR: Record<string, string> = {
  Anticoagulant:          'bg-purple-50 text-purple-700 border-purple-200',
  Antiplatelet:           'bg-pink-50   text-pink-700   border-pink-200',
  'Beta-Blocker':         'bg-blue-50   text-blue-700   border-blue-200',
  'ACE Inhibitor':        'bg-cyan-50   text-cyan-700   border-cyan-200',
  Statin:                 'bg-teal-50   text-teal-700   border-teal-200',
  PPI:                    'bg-gray-100  text-gray-600   border-gray-200',
  'Loop Diuretic':        'bg-sky-50    text-sky-700    border-sky-200',
  'Aldosterone Antagonist': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Cardiac Glycoside':    'bg-violet-50 text-violet-700 border-violet-200',
  Bisphosphonate:         'bg-lime-50   text-lime-700   border-lime-200',
  'Thyroid Hormone':      'bg-orange-50 text-orange-700 border-orange-200',
  Supplement:             'bg-green-50  text-green-700  border-green-200',
  Biguanide:              'bg-emerald-50 text-emerald-700 border-emerald-200',
  Sulfonylurea:           'bg-yellow-50  text-yellow-700  border-yellow-200',
  TCA:                    'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
  NSAID:                  'bg-rose-50    text-rose-700    border-rose-200',
  Antimuscarinic:         'bg-red-50     text-red-700     border-red-200',
  Antihistamine:          'bg-amber-50   text-amber-700   border-amber-200',
};

const RISK_BORDER: Record<NonNullable<RiskLevel>, string> = {
  critical: 'border-l-red-500',
  high:     'border-l-orange-400',
  medium:   'border-l-amber-400',
};

const FILTER_OPTIONS: { value: FilterVal; label: string }[] = [
  { value: 'all',              label: 'All'           },
  { value: 'flagged',          label: 'Flagged'       },
  { value: 'verified',         label: 'Verified'      },
  { value: 'inferred',         label: 'AI Inferred'   },
  { value: 'low-confidence',   label: 'Low Conf.'     },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMedRisk(medId: string, flags: ClinicalFlag[]): RiskLevel {
  const medFlags = flags.filter((f) => f.medicationIds.includes(medId));
  if (medFlags.some((f) => f.severity === 'critical')) return 'critical';
  if (medFlags.some((f) => f.severity === 'high'))     return 'high';
  if (medFlags.some((f) => f.severity === 'medium'))   return 'medium';
  return null;
}

function sortMeds(meds: Medication[], col: SortCol, dir: 'asc' | 'desc'): Medication[] {
  return [...meds].sort((a, b) => {
    let av: string | number, bv: string | number;
    switch (col) {
      case 'name':        av = a.name;        bv = b.name;        break;
      case 'dose':        av = a.dose;        bv = b.dose;        break;
      case 'prescriber':  av = a.prescriber;  bv = b.prescriber;  break;
      case 'started':     av = a.prescribedDate; bv = b.prescribedDate; break;
      case 'confidence':  av = a.confidence;  bv = b.confidence;  break;
      case 'status':      av = a.status;      bv = b.status;      break;
      default: return 0;
    }
    if (av < bv) return dir === 'asc' ? -1 : 1;
    if (av > bv) return dir === 'asc' ?  1 : -1;
    return 0;
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SortableHeader({
  label, col, active, dir, onSort,
}: {
  label: string; col?: SortCol; active: boolean; dir: 'asc' | 'desc';
  onSort?: () => void;
}) {
  const Icon = active ? (dir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <div
      onClick={onSort}
      className={cn(
        'px-3 py-2 flex items-center gap-1 select-none',
        onSort && 'cursor-pointer hover:text-gray-700 group',
        active ? 'text-gray-700' : 'text-gray-400',
      )}
      style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}
    >
      {label}
      {onSort && (
        <Icon className={cn('w-3 h-3 shrink-0 transition-opacity', active ? 'opacity-100' : 'opacity-0 group-hover:opacity-60')} />
      )}
    </div>
  );
}

function ConfidencePip({ value }: { value: number }) {
  const color = value >= 95 ? 'text-emerald-600' : value >= 80 ? 'text-blue-600' : value >= 70 ? 'text-amber-600' : 'text-red-600';
  return (
    <span className={cn('tabular-nums', color)} style={{ fontSize: 12, fontWeight: 600 }}>
      {value}%
    </span>
  );
}

function DupBadge() {
  return (
    <span
      className="flex items-center gap-0.5 px-1 py-px bg-amber-100 text-amber-700 rounded border border-amber-200"
      style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.05em' }}
      title="Duplicate drug class detected"
    >
      <Copy className="w-2.5 h-2.5" />
      DUP
    </span>
  );
}

function RiskIcon({ risk }: { risk: RiskLevel }) {
  if (!risk) return null;
  if (risk === 'critical' || risk === 'high') {
    return <AlertTriangle className={cn('w-3.5 h-3.5 shrink-0', risk === 'critical' ? 'text-red-500' : 'text-orange-400')} />;
  }
  return <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-500" />;
}

function StatusPill({ status }: { status: MedicationStatus }) {
  const cfg = STATUS_CFG[status];
  return (
    <span
      className={cn('flex items-center gap-1 px-2 py-0.5 rounded w-fit', cfg.bg, cfg.text)}
      style={{ fontSize: 11, fontWeight: 500 }}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', cfg.dot)} />
      {cfg.label}
    </span>
  );
}

// ─── Expanded Row Detail ──────────────────────────────────────────────────────

function ExpandedDetail({
  med, flags, catColor,
}: {
  med: Medication; flags: ClinicalFlag[]; catColor: string;
}) {
  const medFlags = flags.filter((f) => f.medicationIds.includes(med.id));

  return (
    <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 grid gap-3" style={{ gridTemplateColumns: '165px 1fr' }}>
      {/* Left: drug class */}
      <div className="flex flex-col gap-2">
        <div>
          <p className="text-gray-400 mb-1" style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Drug Class
          </p>
          <span
            className={cn('px-2 py-0.5 rounded border w-fit block', catColor)}
            style={{ fontSize: 11, fontWeight: 500 }}
          >
            {med.category}
          </span>
        </div>
        <div>
          <p className="text-gray-400 mb-0.5" style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Route
          </p>
          <p className="text-gray-600" style={{ fontSize: 12 }}>{med.route}</p>
        </div>
      </div>

      {/* Right: description + flags */}
      <div className="grid gap-3" style={{ gridTemplateColumns: medFlags.length ? '1fr 1fr' : '1fr' }}>
        <div>
          <p className="text-gray-400 mb-1" style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Patient Summary
          </p>
          <p className="text-gray-600 line-clamp-3" style={{ fontSize: 12, lineHeight: 1.5 }}>
            {med.patientDescription}
          </p>
        </div>

        {medFlags.length > 0 && (
          <div>
            <p className="text-gray-400 mb-1" style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Clinical Alerts
            </p>
            <div className="space-y-1.5">
              {medFlags.map((flag) => {
                const severityColor =
                  flag.severity === 'critical' ? 'bg-red-50 border-red-200 text-red-700' :
                  flag.severity === 'high'     ? 'bg-orange-50 border-orange-200 text-orange-700' :
                                                 'bg-amber-50 border-amber-200 text-amber-700';
                return (
                  <div
                    key={flag.id}
                    className={cn('flex items-start gap-1.5 px-2 py-1.5 rounded border', severityColor)}
                  >
                    <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                    <p style={{ fontSize: 11, fontWeight: 500 }}>{flag.title}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Medication Row ───────────────────────────────────────────────────────────

function MedRow({
  med, flags, isSelected, isDuplicate, risk, onSelect, isExpanded, onToggleExpand,
}: {
  med: Medication;
  flags: ClinicalFlag[];
  isSelected: boolean;
  isDuplicate: boolean;
  risk: RiskLevel;
  onSelect: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const catColor = CATEGORY_COLOR[med.category] ?? 'bg-gray-100 text-gray-600 border-gray-200';

  const rowBg = isSelected
    ? 'bg-blue-50'
    : risk === 'critical'
      ? 'bg-red-50/25 hover:bg-red-50/40'
      : 'bg-white hover:bg-gray-50/80';

  const borderColor = isSelected
    ? 'border-l-blue-600'
    : risk
      ? RISK_BORDER[risk]
      : 'border-l-transparent';

  return (
    <div className={cn('border-b border-gray-100', isExpanded && 'bg-gray-50/50')}>
      {/* Main Row */}
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(); }}
        className={cn(
          'grid items-center border-l-[3px] transition-colors cursor-pointer group',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500',
          rowBg, borderColor,
        )}
        style={{ gridTemplateColumns: GRID }}
      >
        {/* Medication */}
        <div className="px-3 py-3 flex items-start gap-2 min-w-0">
          <div className="mt-0.5 shrink-0">
            <RiskIcon risk={risk} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p
                className={cn('truncate', isSelected ? 'text-blue-700' : 'text-gray-900')}
                style={{ fontSize: 13, fontWeight: 500 }}
              >
                {med.name}
              </p>
              {isDuplicate && <DupBadge />}
            </div>
            <p className="text-gray-400 truncate" style={{ fontSize: 11 }}>
              {med.genericName}
            </p>
          </div>
        </div>

        {/* Dose / Frequency */}
        <div className="px-3 py-3">
          <p className="text-gray-800 tabular-nums" style={{ fontSize: 13, fontWeight: 500 }}>
            {med.dose}
          </p>
          <p className="text-gray-400 leading-tight" style={{ fontSize: 11 }}>
            {med.frequency}
          </p>
        </div>

        {/* Prescriber */}
        <div className="px-3 py-3 min-w-0">
          <p className="text-gray-700 truncate" style={{ fontSize: 12, fontWeight: 500 }}>
            {med.prescriber}
          </p>
          <p className="text-gray-400 truncate" style={{ fontSize: 11 }}>
            {med.prescriberSpecialty}
          </p>
        </div>

        {/* Started */}
        <div className="px-3 py-3">
          <p className="text-gray-600" style={{ fontSize: 12 }}>
            {med.prescribedDate}
          </p>
        </div>

        {/* Confidence */}
        <div className="px-3 py-3 text-center">
          <ConfidencePip value={med.confidence} />
        </div>

        {/* Source Document */}
        <div className="px-3 py-3 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <FileText className="w-3 h-3 text-gray-300 shrink-0" />
            <span
              className={cn(
                'truncate transition-colors',
                isSelected ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700',
              )}
              style={{ fontSize: 12 }}
              title={med.sourceDocumentName}
            >
              {med.sourceDocumentName}
            </span>
          </div>
          <p className="text-gray-400 ml-[18px]" style={{ fontSize: 11 }}>
            {med.prescriberSpecialty}
          </p>
        </div>

        {/* Status */}
        <div className="px-3 py-3">
          <StatusPill status={med.status} />
        </div>

        {/* Expand toggle */}
        <div className="px-2 py-3 flex items-center justify-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
            className={cn(
              'w-6 h-6 flex items-center justify-center rounded transition-colors',
              isExpanded ? 'text-blue-500 bg-blue-50' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100',
            )}
            title={isExpanded ? 'Collapse details' : 'Expand details'}
          >
            <ChevronDown
              className={cn('w-3.5 h-3.5 transition-transform duration-200', isExpanded && 'rotate-180')}
            />
          </button>
          <ExternalLink
            className={cn(
              'w-3 h-3 transition-opacity',
              isSelected ? 'text-blue-400 opacity-100' : 'text-gray-300 opacity-0 group-hover:opacity-100',
            )}
          />
        </div>
      </div>

      {/* Expanded Detail Panel */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{ overflow: 'hidden' }}
          >
            <ExpandedDetail med={med} flags={flags} catColor={catColor} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-3">
        <Search className="w-5 h-5 text-gray-300" />
      </div>
      <p className="text-gray-500" style={{ fontSize: 13, fontWeight: 500 }}>No medications match</p>
      <p className="text-gray-400 mt-0.5" style={{ fontSize: 12 }}>Try adjusting your search or filters</p>
      <button
        onClick={onClear}
        className="mt-3 text-blue-600 hover:text-blue-700 transition-colors"
        style={{ fontSize: 12, fontWeight: 500 }}
      >
        Clear all filters
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MedicationTable({
  medications,
  flags,
  selectedMedicationId,
  onSelect,
}: MedicationTableProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterVal>('all');
  const [sort, setSort] = useState<{ col: SortCol; dir: 'asc' | 'desc' } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const flaggedIds = useMemo(
    () => new Set(flags.flatMap((f) => f.medicationIds)),
    [flags]
  );

  // Detect duplicate drug classes
  const duplicateIds = useMemo(() => {
    const groups: Record<string, string[]> = {};
    medications.forEach((m) => {
      if (!groups[m.category]) groups[m.category] = [];
      groups[m.category].push(m.id);
    });
    return new Set(
      Object.values(groups).filter((ids) => ids.length > 1).flat()
    );
  }, [medications]);

  // Pre-compute risk per medication
  const medRisk = useMemo(() => {
    const map: Record<string, RiskLevel> = {};
    medications.forEach((m) => { map[m.id] = getMedRisk(m.id, flags); });
    return map;
  }, [medications, flags]);

  // Active filter count for badge
  const activeFilters = (search.trim() ? 1 : 0) + (filter !== 'all' ? 1 : 0) + (sort ? 1 : 0);

  function handleSort(col: SortCol) {
    setSort((prev) => {
      if (prev?.col === col) {
        if (prev.dir === 'asc') return { col, dir: 'desc' };
        return null;
      }
      return { col, dir: 'asc' };
    });
  }

  function clearAll() {
    setSearch('');
    setFilter('all');
    setSort(null);
  }

  const displayed = useMemo(() => {
    let result = medications;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.genericName.toLowerCase().includes(q) ||
          m.prescriber.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q)
      );
    }

    if (filter === 'flagged') {
      result = result.filter((m) => flaggedIds.has(m.id));
    } else if (filter !== 'all') {
      result = result.filter((m) => m.status === filter);
    }

    if (sort) {
      result = sortMeds(result, sort.col, sort.dir);
    }

    return result;
  }, [medications, search, filter, sort, flaggedIds]);

  return (
    <div className="flex-1 overflow-hidden flex flex-col min-h-0">
      {/* ── Toolbar ── */}
      <div className="px-4 py-2.5 border-b border-gray-200 bg-white shrink-0 flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search medications, prescribers…"
            className="pl-8 pr-7 py-1.5 bg-gray-100 border border-transparent rounded-md text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
            style={{ fontSize: 12, width: 220 }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-1">
          {FILTER_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={cn(
                'px-2.5 py-1 rounded-md border transition-colors',
                filter === value
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700',
              )}
              style={{ fontSize: 11, fontWeight: 500 }}
            >
              {label}
              {value === 'flagged' && flaggedIds.size > 0 && (
                <span
                  className={cn(
                    'ml-1.5 px-1 py-px rounded',
                    filter === 'flagged' ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600',
                  )}
                  style={{ fontSize: 10, fontWeight: 700 }}
                >
                  {flaggedIds.size}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Right side: count + clear */}
        <div className="ml-auto flex items-center gap-3">
          {activeFilters > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors"
              style={{ fontSize: 11, fontWeight: 500 }}
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          )}
          <span className="text-gray-400" style={{ fontSize: 11 }}>
            {displayed.length === medications.length
              ? `${medications.length} medications`
              : `${displayed.length} of ${medications.length}`}
          </span>
        </div>
      </div>

      {/* ── Column Headers ── */}
      <div
        className="grid bg-gray-50 border-b border-gray-200 shrink-0 border-l-[3px] border-l-transparent"
        style={{ gridTemplateColumns: GRID }}
      >
        <SortableHeader
          label="Medication"
          col="name"
          active={sort?.col === 'name'}
          dir={sort?.dir ?? 'asc'}
          onSort={() => handleSort('name')}
        />
        <SortableHeader
          label="Dose / Freq"
          col="dose"
          active={sort?.col === 'dose'}
          dir={sort?.dir ?? 'asc'}
          onSort={() => handleSort('dose')}
        />
        <SortableHeader
          label="Prescriber"
          col="prescriber"
          active={sort?.col === 'prescriber'}
          dir={sort?.dir ?? 'asc'}
          onSort={() => handleSort('prescriber')}
        />
        <SortableHeader
          label="Started"
          col="started"
          active={sort?.col === 'started'}
          dir={sort?.dir ?? 'asc'}
          onSort={() => handleSort('started')}
        />
        <SortableHeader
          label="Conf."
          col="confidence"
          active={sort?.col === 'confidence'}
          dir={sort?.dir ?? 'asc'}
          onSort={() => handleSort('confidence')}
        />
        <SortableHeader
          label="Source Document"
          active={false}
          dir="asc"
        />
        <SortableHeader
          label="Status"
          col="status"
          active={sort?.col === 'status'}
          dir={sort?.dir ?? 'asc'}
          onSort={() => handleSort('status')}
        />
        {/* Expand column header — empty */}
        <div />
      </div>

      {/* ── Rows ── */}
      <div className="flex-1 overflow-y-auto">
        {displayed.length === 0 ? (
          <EmptyState onClear={clearAll} />
        ) : (
          displayed.map((med) => (
            <MedRow
              key={med.id}
              med={med}
              flags={flags}
              isSelected={selectedMedicationId === med.id}
              isDuplicate={duplicateIds.has(med.id)}
              risk={medRisk[med.id] ?? null}
              onSelect={() => onSelect(selectedMedicationId === med.id ? null : med.id)}
              isExpanded={expandedId === med.id}
              onToggleExpand={() => setExpandedId((prev) => (prev === med.id ? null : med.id))}
            />
          ))
        )}
      </div>
    </div>
  );
}
