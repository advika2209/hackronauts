import { useState, useEffect, useRef } from 'react';
import {
  X, FileText, Building2, User, Calendar, ShieldCheck, Sparkles,
  MousePointerClick, ZoomIn, ZoomOut, ChevronLeft, ChevronRight,
  AlertTriangle, AlertCircle, FileSearch, FlaskConical, Stethoscope,
  Pill, FileX, PanelRightClose,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './ui/utils';
import type {
  SourceDocument, DocumentLine, ProvenanceSelection, ProvenanceKind,
} from '../data/mockData';

interface ProvenanceViewerProps {
  selection: ProvenanceSelection | null;
  allDocuments: Record<string, SourceDocument>;
  onClose: () => void;
}

// ─── Document Line Renderer ───────────────────────────────────────────────────

function DocumentLineRenderer({
  line,
  highlightId,
  entityTitle,
  confidence,
  isLoading,
}: {
  line: DocumentLine;
  highlightId: string;
  entityTitle: string;
  confidence: number | undefined;
  isLoading: boolean;
}) {
  const lineRef = useRef<HTMLDivElement>(null);
  const isHighlighted =
    (!isLoading) &&
    (line.highlightedForMedId === highlightId || line.highlightedForId === highlightId);

  useEffect(() => {
    if (isHighlighted && lineRef.current) {
      lineRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isHighlighted]);

  if (line.type === 'blank') {
    return <div className="h-2" />;
  }

  if (isHighlighted) {
    return (
      <div ref={lineRef} className="relative -mx-1 my-0.5">
        {/* AI Extracted chip */}
        <div className="flex items-center gap-1.5 mb-1 ml-1">
          <span
            className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-500 text-white rounded"
            style={{ fontSize: 10, fontWeight: 600 }}
          >
            <Sparkles className="w-2.5 h-2.5" />
            AI Extracted
          </span>
          {confidence !== undefined && (
            <span className="text-gray-400" style={{ fontSize: 10 }}>
              {confidence}% confidence
            </span>
          )}
        </div>

        {/* Highlighted line box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative border-l-4 border-amber-400 bg-amber-50 px-3 py-2.5 rounded-r-md overflow-hidden"
        >
          <p className="text-gray-900 font-mono" style={{ fontSize: 12, lineHeight: 1.6 }}>
            {line.text}
          </p>
          <div className="mt-1.5 flex items-center gap-1 text-amber-700">
            <ShieldCheck className="w-3 h-3 shrink-0" />
            <span style={{ fontSize: 10, fontWeight: 600 }}>
              Source confirmed · {entityTitle}
            </span>
          </div>

          {/* Animated bounding box that fades out */}
          <motion.div
            className="absolute -inset-0.5 rounded-r-md ring-2 ring-amber-400 pointer-events-none"
            initial={{ opacity: 1, scale: 1.025 }}
            animate={{ opacity: 0, scale: 1 }}
            transition={{ duration: 2.0, ease: 'easeOut', delay: 0.15 }}
          />
        </motion.div>
      </div>
    );
  }

  // Non-highlighted lines
  const baseStyle: React.CSSProperties = { fontSize: 12, lineHeight: 1.6, fontFamily: 'monospace' };

  if (line.type === 'header') {
    return <p className="text-gray-700 mt-1" style={{ ...baseStyle, fontWeight: 700, letterSpacing: '0.03em' }}>{line.text}</p>;
  }
  if (line.type === 'subheader') {
    return <p className="text-gray-600" style={{ ...baseStyle, fontWeight: 600 }}>{line.text}</p>;
  }
  if (line.type === 'signature') {
    return <p className="text-gray-400 italic" style={baseStyle}>{line.text}</p>;
  }
  if (line.type === 'note') {
    return <p className="text-gray-500" style={baseStyle}>{line.text}</p>;
  }
  if (line.type === 'diagnosis') {
    return <p className="text-gray-600" style={baseStyle}>{line.text}</p>;
  }
  if (line.type === 'lab-value') {
    return <p className="text-gray-700" style={{ ...baseStyle, fontWeight: 600 }}>{line.text}</p>;
  }
  if (line.type === 'medication') {
    return <p className="text-gray-700" style={baseStyle}>{line.text}</p>;
  }
  return <p className="text-gray-600" style={baseStyle}>{line.text}</p>;
}

// ─── Skeleton Loading Lines ───────────────────────────────────────────────────

function SkeletonDocContent() {
  const widths = [48, 32, 0, 72, 0, 96, 12, 96, 12, 96, 12, 0, 60, 36];
  return (
    <div className="px-5 py-4 space-y-1.5">
      {widths.map((w, i) =>
        w === 0 ? (
          <div key={i} className="h-2" />
        ) : (
          <div
            key={i}
            className="h-2.5 bg-gray-100 rounded animate-pulse"
            style={{ width: `${w}%`, animationDelay: `${i * 60}ms` }}
          />
        )
      )}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  const hints = [
    { icon: Pill, label: 'Medication', color: 'text-blue-500 bg-blue-50' },
    { icon: AlertTriangle, label: 'Clinical Flag', color: 'text-red-500 bg-red-50' },
    { icon: Stethoscope, label: 'Condition', color: 'text-purple-500 bg-purple-50' },
    { icon: FlaskConical, label: 'Lab Value', color: 'text-emerald-500 bg-emerald-50' },
  ];

  return (
    <motion.div
      key="empty"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex-1 flex flex-col items-center justify-center p-8 text-center"
    >
      {/* Document illustration */}
      <div className="w-16 h-20 mb-5 relative">
        <div className="absolute inset-0 border-2 border-gray-200 rounded-md" />
        {[12, 28, 44, 60].map((top) => (
          <div
            key={top}
            className="absolute left-3 right-3 h-1.5 bg-gray-100 rounded"
            style={{ top }}
          />
        ))}
        <div className="absolute left-3 right-8 h-1.5 bg-gray-100 rounded" style={{ top: 76 }} />
        <div className="absolute inset-0 rounded-md border border-dashed border-gray-200" />
      </div>

      <p className="text-gray-700 mb-1" style={{ fontSize: 14, fontWeight: 500 }}>
        Provenance Viewer
      </p>
      <p className="text-gray-400 mb-5" style={{ fontSize: 12, maxWidth: 200 }}>
        Click any item below to trace it back to its original source document
      </p>

      <div className="grid grid-cols-2 gap-2 w-full max-w-[220px]">
        {hints.map(({ icon: Icon, label, color }) => (
          <div
            key={label}
            className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-transparent', color)}
          >
            <Icon className="w-3 h-3 shrink-0" />
            <span style={{ fontSize: 11, fontWeight: 500 }}>{label}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5 mt-5 text-gray-400" style={{ fontSize: 11 }}>
        <MousePointerClick className="w-3.5 h-3.5" />
        <span>Select any item from the table or flags panel</span>
      </div>
    </motion.div>
  );
}

// ─── Missing Document State ───────────────────────────────────────────────────

function MissingDocState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
        <FileX className="w-5 h-5 text-gray-400" />
      </div>
      <p className="text-gray-600" style={{ fontSize: 13, fontWeight: 500 }}>
        Source document unavailable
      </p>
      <p className="text-gray-400 mt-1" style={{ fontSize: 11 }}>
        The original prescription could not be loaded
      </p>
    </div>
  );
}

// ─── Kind Config ──────────────────────────────────────────────────────────────

const kindConfig: Record<ProvenanceKind, { label: string; badgeClass: string; icon: typeof Pill }> = {
  medication: { label: 'MEDICATION SOURCE', badgeClass: 'bg-amber-100 text-amber-700', icon: Pill },
  flag: { label: 'CONFLICT TRACE', badgeClass: 'bg-red-100 text-red-700', icon: AlertCircle },
  condition: { label: 'DIAGNOSIS SOURCE', badgeClass: 'bg-purple-100 text-purple-700', icon: Stethoscope },
  lab: { label: 'LAB RESULT SOURCE', badgeClass: 'bg-emerald-100 text-emerald-700', icon: FlaskConical },
};

const flagSeverityStyle: Record<string, { bg: string; text: string }> = {
  critical: { bg: 'bg-red-50', text: 'text-red-700' },
  high: { bg: 'bg-orange-50', text: 'text-orange-700' },
  medium: { bg: 'bg-amber-50', text: 'text-amber-700' },
  low: { bg: 'bg-blue-50', text: 'text-blue-700' },
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ZOOM_STEPS = [0.75, 0.85, 1.0, 1.1, 1.2];
const DEFAULT_ZOOM_IDX = 2;

export function ProvenanceViewer({ selection, allDocuments, onClose }: ProvenanceViewerProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [activeDocIdx, setActiveDocIdx] = useState(0);
  const [zoomIdx, setZoomIdx] = useState(DEFAULT_ZOOM_IDX);
  const [isLoading, setIsLoading] = useState(false);

  // Reset and auto-open when selection changes
  useEffect(() => {
    if (selection) {
      setIsOpen(true);
      setActiveDocIdx(0);
      setIsLoading(true);
      const t = setTimeout(() => setIsLoading(false), 380);
      return () => clearTimeout(t);
    }
  }, [selection?.entityId]);

  function switchDoc(idx: number) {
    if (idx === activeDocIdx) return;
    setActiveDocIdx(idx);
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 280);
  }

  const zoomLevel = ZOOM_STEPS[zoomIdx];
  const zoomPct = Math.round(zoomLevel * 100);

  return (
    <motion.aside
      animate={{ width: isOpen ? 420 : 40 }}
      transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="border-l border-gray-200 bg-white flex flex-col shrink-0 overflow-hidden"
    >
      <AnimatePresence mode="wait" initial={false}>
        {/* ── Collapsed tab ── */}
        {!isOpen && (
          <motion.button
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setIsOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-3 hover:bg-gray-50 transition-colors w-full"
            title="Expand provenance viewer"
          >
            <ChevronLeft className="w-4 h-4 text-gray-300" />
            <span
              className="text-gray-300"
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                writingMode: 'vertical-lr',
              }}
            >
              Provenance
            </span>
          </motion.button>
        )}

        {/* ── Open panel ── */}
        {isOpen && (
          <motion.div
            key="open"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {/* Persistent top bar with collapse button */}
            <div className="flex items-center justify-between px-3 h-7 border-b border-gray-100 bg-gray-50 shrink-0">
              <span className="text-gray-400" style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Source Documents
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="w-5 h-5 flex items-center justify-center text-gray-300 hover:text-gray-500 rounded transition-colors"
                title="Collapse panel"
              >
                <PanelRightClose className="w-3.5 h-3.5" />
              </button>
            </div>

            <AnimatePresence mode="wait">
              {!selection ? (
                <EmptyState key="empty" />
              ) : (
                <motion.div
                  key={selection.entityId}
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 18 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="flex-1 flex flex-col overflow-hidden"
                >
                  {/* ── Panel Header ── */}
                  <ActiveHeader
                    selection={selection}
                    onClose={onClose}
                  />

                  {/* ── Document Metadata ── */}
                  {(() => {
                    const currentDoc = selection.docs[activeDocIdx];
                    const doc = currentDoc ? allDocuments[currentDoc.docId] : null;
                    if (!doc) return null;
                    return (
                      <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50 shrink-0">
                        <div className="grid grid-cols-2 gap-y-1.5">
                          <MetaItem icon={FileText} text={doc.title} />
                          <MetaItem icon={Calendar} text={doc.date} />
                          <MetaItem icon={Building2} text={doc.facility} truncate />
                          <MetaItem icon={User} text={doc.doctor} truncate />
                        </div>
                      </div>
                    );
                  })()}

                  {/* ── Doc Tabs (multi-doc only) ── */}
                  {selection.docs.length > 1 && (
                    <div className="border-b border-gray-100 bg-white shrink-0 flex items-center px-3 gap-1 overflow-x-auto">
                      {selection.docs.map((doc, i) => (
                        <button
                          key={doc.docId + i}
                          onClick={() => switchDoc(i)}
                          className={cn(
                            'shrink-0 px-3 py-2 border-b-2 transition-colors whitespace-nowrap',
                            i === activeDocIdx
                              ? 'border-blue-600 text-blue-600'
                              : 'border-transparent text-gray-400 hover:text-gray-600'
                          )}
                          style={{ fontSize: 11, fontWeight: i === activeDocIdx ? 600 : 400 }}
                        >
                          {doc.tabLabel}
                        </button>
                      ))}

                      {/* Prev/Next arrows */}
                      <div className="ml-auto flex items-center gap-0.5 shrink-0">
                        <button
                          disabled={activeDocIdx === 0}
                          onClick={() => switchDoc(activeDocIdx - 1)}
                          className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-gray-400 px-1" style={{ fontSize: 10 }}>
                          {activeDocIdx + 1} / {selection.docs.length}
                        </span>
                        <button
                          disabled={activeDocIdx === selection.docs.length - 1}
                          onClick={() => switchDoc(activeDocIdx + 1)}
                          className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── Document Area ── */}
                  <div className="flex-1 overflow-y-auto">
                    {(() => {
                      const currentDocRef = selection.docs[activeDocIdx];
                      const doc = currentDocRef ? allDocuments[currentDocRef.docId] : null;

                      return (
                        <div className="m-3 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                          {/* Chrome bar */}
                          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center">
                            <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full bg-red-400" />
                              <div className="w-2 h-2 rounded-full bg-amber-400" />
                              <div className="w-2 h-2 rounded-full bg-emerald-400" />
                            </div>
                            <span className="flex-1 text-center text-gray-400 truncate px-3" style={{ fontSize: 10 }}>
                              {doc ? `${doc.title} · ${doc.facility}` : 'Loading…'}
                            </span>
                            {/* Zoom controls */}
                            <div className="flex items-center gap-0.5 shrink-0">
                              <button
                                onClick={() => setZoomIdx((z) => Math.max(0, z - 1))}
                                disabled={zoomIdx === 0}
                                className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
                              >
                                <ZoomOut className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setZoomIdx(DEFAULT_ZOOM_IDX)}
                                className="px-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                                style={{ fontSize: 10, minWidth: 32, textAlign: 'center' }}
                              >
                                {zoomPct}%
                              </button>
                              <button
                                onClick={() => setZoomIdx((z) => Math.min(ZOOM_STEPS.length - 1, z + 1))}
                                disabled={zoomIdx === ZOOM_STEPS.length - 1}
                                className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
                              >
                                <ZoomIn className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Low confidence warning */}
                          {selection.confidence !== undefined && selection.confidence < 80 && !isLoading && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-200">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <p className="text-amber-700" style={{ fontSize: 11, fontWeight: 500 }}>
                                Low extraction confidence — manual verification recommended
                              </p>
                            </div>
                          )}

                          {/* Content */}
                          <AnimatePresence mode="wait">
                            {isLoading ? (
                              <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                              >
                                <SkeletonDocContent />
                              </motion.div>
                            ) : !doc ? (
                              <motion.div
                                key="missing"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                              >
                                <MissingDocState />
                              </motion.div>
                            ) : (
                              <motion.div
                                key={`${selection.entityId}-${activeDocIdx}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                <div className="px-5 py-4 space-y-0.5" style={{ zoom: zoomLevel } as any}>
                                  {doc.lines.map((line) => (
                                    <DocumentLineRenderer
                                      key={line.id}
                                      line={line}
                                      highlightId={currentDocRef!.highlightId}
                                      entityTitle={selection.title}
                                      confidence={selection.confidence}
                                      isLoading={isLoading}
                                    />
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })()}

                    {/* Verification footer */}
                    {!isLoading && (() => {
                      const currentDocRef = selection.docs[activeDocIdx];
                      const doc = currentDocRef ? allDocuments[currentDocRef.docId] : null;
                      if (!doc) return null;
                      const lineIdx = doc.lines.findIndex(
                        (l) =>
                          l.highlightedForMedId === currentDocRef.highlightId ||
                          l.highlightedForId === currentDocRef.highlightId
                      );
                      return (
                        <div className="mx-3 mb-3 px-3 py-2.5 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-2">
                          <ShieldCheck className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-blue-700" style={{ fontSize: 12, fontWeight: 500 }}>
                              Extraction verified by MedThread AI
                            </p>
                            <p className="text-blue-500 mt-0.5" style={{ fontSize: 11 }}>
                              {lineIdx >= 0
                                ? `Traceable to line ${lineIdx + 1} of the original document.`
                                : 'Sourced from the original uploaded document.'}
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}

// ─── Active Header ────────────────────────────────────────────────────────────

function ActiveHeader({
  selection,
  onClose,
}: {
  selection: ProvenanceSelection;
  onClose: () => void;
}) {
  const kc = kindConfig[selection.kind];
  const KindIcon = kc.icon;

  return (
    <div className="px-4 py-3 border-b border-gray-200 shrink-0 bg-white">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <KindIcon className="w-3 h-3 text-gray-400" />
          <span
            className={cn('px-1.5 py-0.5 rounded', kc.badgeClass)}
            style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.04em' }}
          >
            {kc.label}
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <p className="text-gray-900" style={{ fontSize: 15, fontWeight: 600 }}>
        {selection.title}
      </p>
      <p className="text-gray-500 mt-0.5" style={{ fontSize: 12 }}>
        {selection.subtitle}
      </p>

      {/* Confidence + Status badges */}
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        {selection.confidence !== undefined && (
          <div
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border',
              selection.confidence >= 95
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : selection.confidence >= 80
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-amber-50 border-amber-200 text-amber-700'
            )}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span style={{ fontSize: 12, fontWeight: 600 }}>
              {selection.confidence}% confidence
            </span>
          </div>
        )}

        {selection.status && (
          <span
            className={cn(
              'px-2 py-1 rounded-md',
              selection.status === 'verified'
                ? 'bg-emerald-50 text-emerald-700'
                : selection.status === 'inferred'
                  ? 'bg-blue-50 text-blue-700'
                  : 'bg-amber-50 text-amber-700'
            )}
            style={{ fontSize: 11, fontWeight: 500 }}
          >
            {selection.status === 'verified'
              ? 'Verified'
              : selection.status === 'inferred'
                ? 'AI Inferred'
                : 'Low Confidence'}
          </span>
        )}

        {selection.kind === 'flag' && selection.flagSeverity && (() => {
          const sev = flagSeverityStyle[selection.flagSeverity] ?? flagSeverityStyle.low;
          return (
            <span
              className={cn('flex items-center gap-1 px-2 py-1 rounded-md', sev.bg, sev.text)}
              style={{ fontSize: 11, fontWeight: 600 }}
            >
              <AlertTriangle className="w-3 h-3" />
              {selection.flagSeverity.toUpperCase()} RISK
            </span>
          );
        })()}

        {selection.kind === 'flag' && selection.docs.length > 1 && (
          <span
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 text-gray-500"
            style={{ fontSize: 11 }}
          >
            <FileSearch className="w-3 h-3" />
            {selection.docs.length} source documents
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Meta Item ────────────────────────────────────────────────────────────────

function MetaItem({
  icon: Icon,
  text,
  truncate,
}: {
  icon: typeof FileText;
  text: string;
  truncate?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5 text-gray-500 min-w-0" style={{ fontSize: 11 }}>
      <Icon className="w-3 h-3 text-gray-400 shrink-0" />
      <span className={cn(truncate && 'truncate')} style={{ fontWeight: 500 }}>{text}</span>
    </div>
  );
}
