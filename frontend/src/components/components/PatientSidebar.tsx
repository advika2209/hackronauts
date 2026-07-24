import { AlertTriangle, Clock, FileText, Pill } from 'lucide-react';
import { cn } from './ui/utils';
import type { Patient, RiskLevel } from '../data/mockData';

interface PatientSidebarProps {
  patients: Patient[];
  selectedId: string;
  onSelect: (id: string) => void;
}

const riskConfig: Record<RiskLevel, { label: string; dot: string; text: string; border: string; bg: string }> = {
  critical: {
    label: 'Critical',
    dot: 'bg-red-500',
    text: 'text-red-700',
    border: 'border-l-red-500',
    bg: 'bg-red-50',
  },
  high: {
    label: 'High',
    dot: 'bg-orange-500',
    text: 'text-orange-700',
    border: 'border-l-orange-400',
    bg: 'bg-orange-50',
  },
  medium: {
    label: 'Medium',
    dot: 'bg-amber-500',
    text: 'text-amber-700',
    border: 'border-l-amber-400',
    bg: 'bg-amber-50',
  },
  low: {
    label: 'Low Risk',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700',
    border: 'border-l-emerald-400',
    bg: 'bg-emerald-50',
  },
};

export function PatientSidebar({ patients, selectedId, onSelect }: PatientSidebarProps) {
  return (
    <aside className="w-72 bg-gray-50 border-r border-gray-200 flex flex-col shrink-0 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <span className="text-gray-700" style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Patients
          </span>
          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded" style={{ fontSize: 11, fontWeight: 500 }}>
            {patients.length}
          </span>
        </div>
      </div>

      {/* Patient List */}
      <div className="flex-1 overflow-y-auto py-2">
        {patients.map((patient) => {
          const risk = riskConfig[patient.riskLevel];
          const isSelected = patient.id === selectedId;

          return (
            <button
              key={patient.id}
              onClick={() => onSelect(patient.id)}
              className={cn(
                'w-full text-left px-3 py-3 mx-1.5 rounded-lg transition-all border-l-2 mb-0.5',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                isSelected
                  ? 'bg-white border-l-blue-600 shadow-sm'
                  : 'border-l-transparent hover:bg-white hover:shadow-sm'
              )}
              style={{ width: 'calc(100% - 12px)' }}
            >
              {/* Name row */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className={cn('text-gray-900', isSelected && 'text-blue-700')} style={{ fontSize: 14, fontWeight: 500 }}>
                    {patient.name}
                  </p>
                  <p className="text-gray-400 mt-0.5" style={{ fontSize: 11 }}>
                    MRN {patient.mrn} · Age {patient.age}
                  </p>
                </div>

                {/* Risk badge */}
                <span
                  className={cn('shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded', risk.bg, risk.text)}
                  style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.02em' }}
                >
                  <span className={cn('w-1.5 h-1.5 rounded-full', risk.dot)} />
                  {risk.label}
                </span>
              </div>

              {/* Conditions */}
              <p className="text-gray-500 mt-1.5" style={{ fontSize: 11 }}>
                {patient.conditions.slice(0, 2).join(' · ')}
                {patient.conditions.length > 2 && ` +${patient.conditions.length - 2}`}
              </p>

              {/* Meta row */}
              <div className="flex items-center gap-3 mt-2">
                <span className="flex items-center gap-1 text-gray-400" style={{ fontSize: 11 }}>
                  <Pill className="w-3 h-3" />
                  {patient.medicationCount} meds
                </span>
                <span className="flex items-center gap-1 text-gray-400" style={{ fontSize: 11 }}>
                  <FileText className="w-3 h-3" />
                  {patient.documentsCount} docs
                </span>
                <span className="flex items-center gap-1 text-gray-400 ml-auto" style={{ fontSize: 11 }}>
                  <Clock className="w-3 h-3" />
                  {patient.lastUpdated}
                </span>
              </div>

              {/* Critical alert indicator */}
              {patient.riskLevel === 'critical' && (
                <div className="flex items-center gap-1 mt-2 text-red-600" style={{ fontSize: 11 }}>
                  <AlertTriangle className="w-3 h-3" />
                  <span style={{ fontWeight: 500 }}>Active drug interaction detected</span>
                </div>
              )}
              {patient.riskLevel === 'high' && (
                <div className="flex items-center gap-1 mt-2 text-orange-600" style={{ fontSize: 11 }}>
                  <AlertTriangle className="w-3 h-3" />
                  <span style={{ fontWeight: 500 }}>Duplicate therapy detected</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200 bg-white">
        <p className="text-gray-400" style={{ fontSize: 11 }}>
          Last synced: Today, 09:14 AM
        </p>
      </div>
    </aside>
  );
}
