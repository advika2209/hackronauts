import { useRef, useState, useCallback, useEffect, type ComponentType } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CloudUpload, FileText, CheckCircle2, XCircle,
  Sparkles, ArrowRight, FlaskConical, X,
  Pill, TestTube, Network, ShieldCheck, FileImage,
  ChevronRight
} from 'lucide-react';
import { cn } from './ui/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

type ScreenState = 'idle' | 'dragging' | 'processing' | 'complete';
type FileStatus = 'queued' | 'uploading' | 'complete' | 'error';
type StageStatus = 'pending' | 'active' | 'complete';

interface UploadFile {
  id: string;
  name: string;
  size: string;
  docType: 'prescription' | 'discharge' | 'lab' | 'referral';
  status: FileStatus;
  progress: number;
}

interface ProcessingStage {
  id: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  resultText: string;
}

// ─── Static data ─────────────────────────────────────────────────────────────

const PROCESSING_STAGES: ProcessingStage[] = [
  { id: 's1', title: 'Reading documents', description: 'OCR scanning & text extraction', icon: FileText, resultText: '3 documents · 847 lines read' },
  { id: 's2', title: 'Extracting medications', description: 'AI-powered prescription parsing', icon: Pill, resultText: '6 medications identified' },
  { id: 's3', title: 'Understanding lab reports', description: 'Laboratory value extraction', icon: TestTube, resultText: '12 lab values · 4 abnormal' },
  { id: 's4', title: 'Combining patient history', description: 'Cross-document correlation', icon: Network, resultText: '3 prescribers · 2 facilities linked' },
  { id: 's5', title: 'Applying clinical criteria', description: 'STOPP/BNF rule evaluation', icon: ShieldCheck, resultText: '1 critical flag raised' },
  { id: 's6', title: 'Building patient story', description: 'Final synthesis & formatting', icon: Sparkles, resultText: 'Patient story complete' },
];

const DEMO_FILES: UploadFile[] = [
  { id: 'df1', name: 'discharge_city_general.pdf', size: '1.2 MB', docType: 'discharge', status: 'complete', progress: 100 },
  { id: 'df2', name: 'prescription_harrison.pdf', size: '0.8 MB', docType: 'prescription', status: 'complete', progress: 100 },
  { id: 'df3', name: 'lab_results_dec_2024.pdf', size: '3.4 MB', docType: 'lab', status: 'complete', progress: 100 },
];

const RECENT_UPLOADS = [
  { id: 'r1', patientName: 'James Morrison', fileCount: 3, summary: 'Discharge summary + 2 prescriptions', date: 'Today, 09:14', risk: 'critical' as const },
  { id: 'r2', patientName: 'Eleanor Vance', fileCount: 2, summary: 'Lab report + GP prescription', date: 'Yesterday', risk: 'high' as const },
  { id: 'r3', patientName: 'Robert Kim', fileCount: 4, summary: 'Discharge summary + 3 documents', date: '28 Nov', risk: 'medium' as const },
];

const FILE_TYPES = ['PDF', 'JPG', 'PNG', 'HEIC', 'TIFF'];

const DOC_TYPE_LABELS: Record<UploadFile['docType'], string> = {
  prescription: 'Prescription',
  discharge: 'Discharge Summary',
  lab: 'Lab Report',
  referral: 'Referral Letter',
};

const RISK_COLORS = {
  critical: { dot: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50' },
  high: { dot: 'bg-orange-500', text: 'text-orange-700', bg: 'bg-orange-50' },
  medium: { dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' },
  low: { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SkeletonLine({ width }: { width: string }) {
  return (
    <div
      className="h-2.5 bg-gray-200 rounded animate-pulse"
      style={{ width }}
    />
  );
}

function StageCard({ stage, status, index }: { stage: ProcessingStage; status: StageStatus; index: number }) {
  const Icon = stage.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={cn(
        'rounded-lg border p-4 flex flex-col gap-3 transition-all duration-500',
        status === 'active' && 'border-blue-200 bg-blue-50/40 shadow-sm',
        status === 'complete' && 'border-emerald-200 bg-emerald-50/30',
        status === 'pending' && 'border-gray-200 bg-white',
      )}
    >
      {/* Card header */}
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            'w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-colors duration-500',
            status === 'active' && 'bg-blue-100',
            status === 'complete' && 'bg-emerald-100',
            status === 'pending' && 'bg-gray-100',
          )}
        >
          {status === 'complete' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : status === 'active' ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            >
              <Icon className="w-4 h-4 text-blue-600" />
            </motion.div>
          ) : (
            <Icon className="w-4 h-4 text-gray-400" />
          )}
        </div>

        <div className="min-w-0">
          <p
            className={cn(
              'transition-colors duration-300',
              status === 'active' && 'text-blue-700',
              status === 'complete' && 'text-emerald-700',
              status === 'pending' && 'text-gray-400',
            )}
            style={{ fontSize: 13, fontWeight: 500 }}
          >
            {stage.title}
          </p>
          <p
            className={cn(
              'mt-0.5 transition-colors duration-300',
              status === 'pending' ? 'text-gray-300' : 'text-gray-400',
            )}
            style={{ fontSize: 11 }}
          >
            {stage.description}
          </p>
        </div>
      </div>

      {/* Card body */}
      <div className="space-y-2 pl-0.5">
        {status === 'complete' ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-gray-600"
            style={{ fontSize: 12, fontWeight: 500 }}
          >
            {stage.resultText}
          </motion.p>
        ) : status === 'active' ? (
          <>
            <SkeletonLine width="72%" />
            <SkeletonLine width="55%" />
            <SkeletonLine width="83%" />
          </>
        ) : (
          <>
            <div className="h-2.5 bg-gray-100 rounded" style={{ width: '60%' }} />
            <div className="h-2.5 bg-gray-100 rounded" style={{ width: '45%' }} />
          </>
        )}
      </div>
    </motion.div>
  );
}

function FileRow({ file, onRemove }: { file: UploadFile; onRemove: (id: string) => void }) {
  const isComplete = file.status === 'complete';
  const isError = file.status === 'error';
  const isUploading = file.status === 'uploading' || file.status === 'queued';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0"
    >
      {/* Icon */}
      <div
        className={cn(
          'w-8 h-8 rounded-md flex items-center justify-center shrink-0',
          isError ? 'bg-red-50' : 'bg-gray-100',
        )}
      >
        {file.name.match(/\.(jpg|jpeg|png|heic|tiff)$/i) ? (
          <FileImage className={cn('w-4 h-4', isError ? 'text-red-400' : 'text-gray-400')} />
        ) : (
          <FileText className={cn('w-4 h-4', isError ? 'text-red-400' : 'text-gray-400')} />
        )}
      </div>

      {/* Name + meta */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-gray-700 truncate" style={{ fontSize: 12, fontWeight: 500 }}>
            {file.name}
          </p>
          <div className="flex items-center gap-1.5 shrink-0">
            {isComplete && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
            {isError && (
              <span className="flex items-center gap-1 text-red-500" style={{ fontSize: 11 }}>
                <XCircle className="w-3.5 h-3.5" />
                Failed
              </span>
            )}
            <button
              onClick={() => onRemove(file.id)}
              className="w-5 h-5 rounded flex items-center justify-center text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <span className="text-gray-400" style={{ fontSize: 11 }}>
            {file.size}
          </span>
          <span className="text-gray-300" style={{ fontSize: 11 }}>·</span>
          <span className="text-gray-400" style={{ fontSize: 11 }}>
            {DOC_TYPE_LABELS[file.docType]}
          </span>
        </div>

        {/* Progress bar */}
        {isUploading && (
          <div className="mt-1.5 h-1 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-blue-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${file.progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}
        {isError && (
          <div className="mt-1.5 h-1 bg-red-100 rounded-full" />
        )}
      </div>
    </motion.div>
  );
}

function RecentUploadItem({ item, onClick }: {
  item: typeof RECENT_UPLOADS[0];
  onClick: () => void;
}) {
  const risk = RISK_COLORS[item.risk];

  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-start gap-2.5 py-2.5 border-b border-gray-100 last:border-0 hover:bg-gray-50 -mx-3 px-3 rounded transition-colors group"
    >
      <div className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
        <FileText className="w-3.5 h-3.5 text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-gray-800 group-hover:text-blue-700 transition-colors" style={{ fontSize: 13, fontWeight: 500 }}>
            {item.patientName}
          </span>
          <span
            className={cn('flex items-center gap-0.5 px-1.5 py-0.5 rounded shrink-0', risk.bg, risk.text)}
            style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.04em' }}
          >
            <span className={cn('w-1 h-1 rounded-full', risk.dot)} />
            {item.risk.charAt(0).toUpperCase() + item.risk.slice(1)}
          </span>
        </div>
        <p className="text-gray-400 mt-0.5" style={{ fontSize: 11 }}>
          {item.fileCount} files · {item.summary}
        </p>
        <p className="text-gray-400 mt-0.5" style={{ fontSize: 11 }}>
          {item.date}
        </p>
      </div>
      <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-400 mt-0.5 transition-colors shrink-0" />
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface UploadViewProps {
  onNavigateToDashboard: () => void;
}

export function UploadView({ onNavigateToDashboard }: UploadViewProps) {
  const [screenState, setScreenState] = useState<ScreenState>('idle');
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [activeStageIndex, setActiveStageIndex] = useState<number>(-1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const allFilesComplete = files.length > 0 && files.every((f) => f.status === 'complete');
  const hasFiles = files.length > 0;

  // ── Upload progress simulation ──────────────────────────────────────────────
  useEffect(() => {
    if (files.every((f) => f.status !== 'queued' && f.status !== 'uploading')) return;

    const interval = setInterval(() => {
      setFiles((prev) => {
        const updated = prev.map((f) => {
          if (f.status === 'queued') return { ...f, status: 'uploading' as const, progress: 5 };
          if (f.status === 'uploading') {
            const next = Math.min(f.progress + Math.random() * 18 + 8, 100);
            return { ...f, progress: next, status: next >= 100 ? ('complete' as const) : f.status };
          }
          return f;
        });
        return updated;
      });
    }, 180);

    return () => clearInterval(interval);
  }, [files]);

  // ── Processing stage simulation ─────────────────────────────────────────────
  useEffect(() => {
    if (screenState !== 'processing') return;

    setActiveStageIndex(0);
    const timings = [1100, 1300, 1100, 1200, 1400, 1600];
    let current = 0;

    const advance = () => {
      current++;
      if (current < PROCESSING_STAGES.length) {
        setActiveStageIndex(current);
        setTimeout(advance, timings[current] ?? 1200);
      } else {
        setTimeout(() => setScreenState('complete'), 600);
      }
    };

    const timeout = setTimeout(advance, timings[0]);
    return () => clearTimeout(timeout);
  }, [screenState]);

  // ── Drag handlers ───────────────────────────────────────────────────────────
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    setScreenState('dragging');
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setScreenState('idle');
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setScreenState('idle');
    const dropped = Array.from(e.dataTransfer.files);
    addRealFiles(dropped);
  }, []);

  // ── File handling ───────────────────────────────────────────────────────────
  function addRealFiles(rawFiles: File[]) {
    const docTypeGuess = (name: string): UploadFile['docType'] => {
      const lower = name.toLowerCase();
      if (lower.includes('lab') || lower.includes('result')) return 'lab';
      if (lower.includes('discharge')) return 'discharge';
      if (lower.includes('referral')) return 'referral';
      return 'prescription';
    };

    const newFiles: UploadFile[] = rawFiles.slice(0, 10).map((f, i) => ({
      id: `f-${Date.now()}-${i}`,
      name: f.name,
      size: f.size > 1_000_000 ? `${(f.size / 1_000_000).toFixed(1)} MB` : `${Math.round(f.size / 1000)} KB`,
      docType: docTypeGuess(f.name),
      status: 'queued',
      progress: 0,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      addRealFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  function handleDemoPatient() {
    setFiles(DEMO_FILES);
    setTimeout(() => startProcessing(), 600);
  }

  function startProcessing() {
    setScreenState('processing');
    setActiveStageIndex(-1);
  }

  function handleBuildStory() {
    startProcessing();
  }

  function getStageStatus(index: number): StageStatus {
    if (screenState === 'complete') return 'complete';
    if (index < activeStageIndex) return 'complete';
    if (index === activeStageIndex) return 'active';
    return 'pending';
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <AnimatePresence mode="wait">
        {/* ── Processing / Complete screen ── */}
        {(screenState === 'processing' || screenState === 'complete') ? (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-full flex flex-col"
          >
            <div className="max-w-3xl mx-auto w-full px-6 py-12 flex-1 flex flex-col">
              {/* Processing header */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  {screenState === 'complete' ? (
                    <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md" style={{ fontSize: 11, fontWeight: 600 }}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Complete
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md" style={{ fontSize: 11, fontWeight: 600 }}>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                        className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full"
                      />
                      Processing
                    </span>
                  )}
                </div>

                <h2 className="text-gray-900" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.015em' }}>
                  {screenState === 'complete' ? 'Patient Story Ready' : 'Building Patient Story'}
                </h2>
                <p className="text-gray-500 mt-1" style={{ fontSize: 13 }}>
                  {screenState === 'complete'
                    ? `Analysis complete — ${files.length} document${files.length !== 1 ? 's' : ''} processed`
                    : `Analysing ${files.length} document${files.length !== 1 ? 's' : ''}. This takes a few seconds.`}
                </p>

                {/* Stage progress strip */}
                <div className="flex items-center gap-1 mt-4">
                  {PROCESSING_STAGES.map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'h-1 flex-1 rounded-full transition-all duration-500',
                        i < activeStageIndex && 'bg-emerald-400',
                        i === activeStageIndex && 'bg-blue-500',
                        i > activeStageIndex && 'bg-gray-200',
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Stage cards grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 flex-1">
                {PROCESSING_STAGES.map((stage, i) => (
                  <StageCard
                    key={stage.id}
                    stage={stage}
                    status={getStageStatus(i)}
                    index={i}
                  />
                ))}
              </div>

              {/* Complete CTA */}
              <AnimatePresence>
                {screenState === 'complete' && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4"
                  >
                    <div>
                      <p className="text-gray-700" style={{ fontSize: 14, fontWeight: 500 }}>
                        James Morrison · MRN 004782
                      </p>
                      <p className="text-gray-400 mt-0.5" style={{ fontSize: 12 }}>
                        6 medications extracted · 1 critical flag · 3 documents
                      </p>
                    </div>
                    <button
                      onClick={onNavigateToDashboard}
                      className="flex items-center gap-2 px-5 py-2.5 bg-blue-700 text-white rounded-lg hover:bg-blue-800 active:bg-blue-900 transition-colors shrink-0 shadow-sm"
                      style={{ fontSize: 14, fontWeight: 500 }}
                    >
                      View Patient Dashboard
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : (
          /* ── Upload screen (idle / dragging / files queued) ── */
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-5xl mx-auto w-full px-6 py-10"
          >
            {/* Page header */}
            <div className="mb-8">
              <span
                className="text-blue-600"
                style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}
              >
                New Patient
              </span>
              <h1 className="text-gray-900 mt-1" style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.015em' }}>
                Upload Patient Documents
              </h1>
              <p className="text-gray-500 mt-1.5" style={{ fontSize: 13 }}>
                Upload prescriptions, discharge summaries, and laboratory reports. MedThread AI will extract and consolidate the clinical record.
              </p>
            </div>

            {/* Main 2-column grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* ── Left: Drop zone + file queue ── */}
              <div className="lg:col-span-2 flex flex-col gap-4">
                {/* Drop zone */}
                <div
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => !hasFiles && fileInputRef.current?.click()}
                  className={cn(
                    'relative rounded-xl border-2 border-dashed transition-all duration-200',
                    screenState === 'dragging'
                      ? 'border-blue-400 bg-blue-50 cursor-copy'
                      : hasFiles
                        ? 'border-gray-200 bg-white cursor-default'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/30 cursor-pointer',
                    !hasFiles && 'py-16'
                  )}
                >
                  {hasFiles ? (
                    /* Compact drop zone when files present */
                    <div className="px-4 py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-gray-400" style={{ fontSize: 12 }}>
                        <CloudUpload className="w-4 h-4" />
                        <span>Drop more files or</span>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="text-blue-600 hover:underline"
                          style={{ fontWeight: 500 }}
                        >
                          click to browse
                        </button>
                      </div>
                      <div className="flex items-center gap-1 text-gray-400" style={{ fontSize: 11 }}>
                        {FILE_TYPES.map((t) => (
                          <span key={t} className="px-1.5 py-0.5 bg-gray-100 rounded" style={{ fontSize: 10 }}>
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Full drop zone when empty */
                    <div className="flex flex-col items-center text-center px-8">
                      <motion.div
                        animate={screenState === 'dragging' ? { scale: 1.1 } : { scale: 1 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                          'w-14 h-14 rounded-xl flex items-center justify-center mb-4',
                          screenState === 'dragging' ? 'bg-blue-100' : 'bg-gray-100',
                        )}
                      >
                        <CloudUpload
                          className={cn(
                            'w-7 h-7 transition-colors',
                            screenState === 'dragging' ? 'text-blue-600' : 'text-gray-400',
                          )}
                        />
                      </motion.div>

                      <p className="text-gray-700" style={{ fontSize: 15, fontWeight: 500 }}>
                        {screenState === 'dragging' ? 'Release to upload' : 'Drop documents here'}
                      </p>
                      <p className="text-gray-400 mt-1" style={{ fontSize: 13 }}>
                        {screenState === 'dragging' ? 'Files will be added to the queue' : (
                          <>or <span className="text-blue-600" style={{ fontWeight: 500 }}>click to browse</span> your computer</>
                        )}
                      </p>

                      {screenState !== 'dragging' && (
                        <div className="flex items-center gap-1.5 mt-5 flex-wrap justify-center">
                          {FILE_TYPES.map((t) => (
                            <span
                              key={t}
                              className="px-2 py-1 bg-gray-100 text-gray-500 rounded-md"
                              style={{ fontSize: 11, fontWeight: 500 }}
                            >
                              {t}
                            </span>
                          ))}
                          <span className="text-gray-400" style={{ fontSize: 11 }}>
                            · Max 25 MB per file
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Drag overlay pulse */}
                  {screenState === 'dragging' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 rounded-xl border-2 border-blue-400 pointer-events-none"
                    />
                  )}
                </div>

                {/* File queue */}
                <AnimatePresence>
                  {hasFiles && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="bg-white border border-gray-200 rounded-lg"
                    >
                      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-gray-500"
                            style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}
                          >
                            Queue
                          </span>
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded" style={{ fontSize: 11, fontWeight: 500 }}>
                            {files.length}
                          </span>
                        </div>
                        {allFilesComplete && (
                          <span className="flex items-center gap-1 text-emerald-600" style={{ fontSize: 12, fontWeight: 500 }}>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            All ready
                          </span>
                        )}
                      </div>
                      <div className="px-4 divide-y-0">
                        <AnimatePresence>
                          {files.map((file) => (
                            <FileRow key={file.id} file={file} onRemove={removeFile} />
                          ))}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Build CTA */}
                <AnimatePresence>
                  {allFilesComplete && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-between gap-3 bg-white border border-gray-200 rounded-lg px-4 py-3"
                    >
                      <div>
                        <p className="text-gray-700" style={{ fontSize: 13, fontWeight: 500 }}>
                          {files.length} document{files.length !== 1 ? 's' : ''} ready for analysis
                        </p>
                        <p className="text-gray-400 mt-0.5" style={{ fontSize: 11 }}>
                          AI will extract medications, run clinical checks, and build the patient story
                        </p>
                      </div>
                      <button
                        onClick={handleBuildStory}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 active:bg-blue-900 transition-colors shrink-0 shadow-sm"
                        style={{ fontSize: 13, fontWeight: 500 }}
                      >
                        <Sparkles className="w-4 h-4" />
                        Build Patient Story
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── Right: sidebar ── */}
              <div className="flex flex-col gap-4">
                {/* Demo patient button */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p
                    className="text-gray-500"
                    style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}
                  >
                    Quick Demo
                  </p>
                  <p className="text-gray-600 mt-2" style={{ fontSize: 12 }}>
                    See MedThread in action with a pre-loaded patient — James Morrison, 72, with a critical drug interaction.
                  </p>
                  <button
                    onClick={handleDemoPatient}
                    className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 active:bg-gray-700 transition-colors shadow-sm"
                    style={{ fontSize: 13, fontWeight: 500 }}
                  >
                    <FlaskConical className="w-4 h-4" />
                    Try Demo Patient
                  </button>
                </div>

                {/* Recent uploads */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p
                    className="text-gray-500 mb-3"
                    style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}
                  >
                    Recent Uploads
                  </p>
                  <div>
                    {RECENT_UPLOADS.map((item) => (
                      <RecentUploadItem
                        key={item.id}
                        item={item}
                        onClick={onNavigateToDashboard}
                      />
                    ))}
                  </div>
                </div>

                {/* Supported formats */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p
                    className="text-gray-500 mb-3"
                    style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}
                  >
                    Supported Formats
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {FILE_TYPES.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md border border-gray-200"
                        style={{ fontSize: 11, fontWeight: 600 }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="space-y-1.5 border-t border-gray-100 pt-3">
                    {[
                      { label: 'Prescriptions', desc: 'GP, specialist, discharge' },
                      { label: 'Lab Reports', desc: 'Blood tests, pathology' },
                      { label: 'Discharge Summaries', desc: 'Hospital, clinic' },
                      { label: 'Referral Letters', desc: 'Specialist correspondence' },
                    ].map((t) => (
                      <div key={t.label} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                        <span className="text-gray-600" style={{ fontSize: 12, fontWeight: 500 }}>{t.label}</span>
                        <span className="text-gray-400" style={{ fontSize: 11 }}>· {t.desc}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-gray-400 mt-3 pt-3 border-t border-gray-100" style={{ fontSize: 11 }}>
                    Max 25 MB per file · Up to 20 files per patient
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png,.heic,.tiff"
        className="hidden"
        onChange={handleFileInputChange}
      />
    </div>
  );
}
