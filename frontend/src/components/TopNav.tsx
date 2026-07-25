import { Activity, ChevronRight, Stethoscope, User, Upload, LayoutDashboard } from 'lucide-react';
import { cn } from './ui/utils';
import type { Patient } from '../data/mockData';

type AppView = 'upload' | 'dashboard';

interface TopNavProps {
  viewMode: 'doctor' | 'patient';
  onViewChange: (mode: 'doctor' | 'patient') => void;
  selectedPatient: Patient | undefined;
  appView: AppView;
  onAppViewChange: (view: AppView) => void;
}

export function TopNav({ viewMode, onViewChange, selectedPatient, appView, onAppViewChange }: TopNavProps) {
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-10">
      {/* Brand + context navigation */}
      <div className="flex items-center gap-3">
        {/* Logo */}
        <button
          onClick={() => onAppViewChange('upload')}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="w-7 h-7 bg-blue-700 rounded-md flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-gray-900" style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>
            MedThread
          </span>
        </button>

        {/* Divider + context */}
        <div className="flex items-center gap-1.5 text-gray-300" style={{ fontSize: 13 }}>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>

        {/* App view tabs */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => onAppViewChange('upload')}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all',
              appView === 'upload'
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50',
            )}
            style={{ fontSize: 13, fontWeight: appView === 'upload' ? 500 : 400 }}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload</span>
          </button>
          <button
            onClick={() => onAppViewChange('dashboard')}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all',
              appView === 'dashboard'
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50',
            )}
            style={{ fontSize: 13, fontWeight: appView === 'dashboard' ? 500 : 400 }}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
        </div>

        {/* Patient breadcrumb (dashboard only) */}
        {appView === 'dashboard' && selectedPatient && (
          <div className="flex items-center gap-1.5 text-gray-400" style={{ fontSize: 13 }}>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-800" style={{ fontWeight: 500 }}>{selectedPatient.name}</span>
            <span className="text-gray-400">MRN {selectedPatient.mrn}</span>
          </div>
        )}
      </div>

      {/* Center: contextual label */}
      <div className="hidden lg:flex items-center gap-2 text-gray-400" style={{ fontSize: 12 }}>
        {appView === 'upload' ? (
          <>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded" style={{ fontSize: 11, fontWeight: 500 }}>
              PDF · JPG · PNG
            </span>
            <span>Prescriptions, discharge summaries, lab reports</span>
          </>
        ) : (
          <>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded" style={{ fontSize: 11, fontWeight: 500 }}>
              AI Extracted
            </span>
            <span>Every claim is traceable to its source document</span>
          </>
        )}
      </div>

      {/* Right: View toggle (dashboard only) */}
      <div className="flex items-center gap-3">
        {appView === 'dashboard' ? (
          <>
            <span className="text-gray-400 hidden sm:block" style={{ fontSize: 12 }}>View as</span>
            <div
              className="flex items-center bg-gray-100 rounded-lg p-0.5"
              role="group"
              aria-label="View mode"
            >
              <button
                onClick={() => onViewChange('doctor')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all',
                  viewMode === 'doctor'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700',
                )}
                style={{ fontSize: 13, fontWeight: viewMode === 'doctor' ? 500 : 400 }}
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Doctor</span>
              </button>
              <button
                onClick={() => onViewChange('patient')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all',
                  viewMode === 'patient'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700',
                )}
                style={{ fontSize: 13, fontWeight: viewMode === 'patient' ? 500 : 400 }}
              >
                <User className="w-3.5 h-3.5" />
                <span>Patient</span>
              </button>
            </div>
          </>
        ) : (
          /* Upload view: just show "Skip to Dashboard" ghost */
          <button
            onClick={() => onAppViewChange('dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-all"
            style={{ fontSize: 13 }}
          >
            Skip to Dashboard
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </header>
  );
}
