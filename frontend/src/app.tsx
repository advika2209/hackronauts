import { useState, useMemo } from 'react';
import { Scissors } from 'lucide-react';
import { TopNav } from './components/TopNav';
import { PatientSidebar } from './components/PatientSidebar';
import { ClinicalFlagsPanel } from './components/ClinicalFlagsPanel';
import { MedicationTable } from './components/MedicationTable';
import { ProvenanceViewer } from './components/ProvenanceViewer';
import { PatientView } from './components/PatientView';
import { UploadView } from './components/UploadView';
import {
  patients,
  medications,
  clinicalFlags,
  sourceDocuments,
  patientConditions,
  labValues,
  buildMedicationSelection,
  buildFlagSelection,
  buildConditionSelection,
  buildLabSelection,
  type ProvenanceSelection,
} from './data/mockData';

type AppView = 'upload' | 'dashboard';
type DoctorPatientView = 'doctor' | 'patient';

export default function App() {
  const [appView, setAppView] = useState<AppView>('upload');
  const [viewMode, setViewMode] = useState<DoctorPatientView>('doctor');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('p5');
  const [provenanceSelection, setProvenanceSelection] = useState<ProvenanceSelection | null>(null);

  const selectedPatient = useMemo(
    () => patients.find((p) => p.id === selectedPatientId),
    [selectedPatientId]
  );

  const currentMedications = useMemo(
    () => medications[selectedPatientId] ?? [],
    [selectedPatientId]
  );

  const currentFlags = useMemo(
    () => clinicalFlags[selectedPatientId] ?? [],
    [selectedPatientId]
  );

  const currentConditions = useMemo(
    () => patientConditions[selectedPatientId] ?? [],
    [selectedPatientId]
  );

  const currentLabValues = useMemo(
    () => labValues[selectedPatientId] ?? [],
    [selectedPatientId]
  );

  function handleMedicationSelect(id: string | null) {
    if (!id) { setProvenanceSelection(null); return; }
    const med = currentMedications.find((m) => m.id === id);
    if (med) setProvenanceSelection(buildMedicationSelection(med));
  }

  function handleFlagSelect(flagId: string) {
    const flag = currentFlags.find((f) => f.id === flagId);
    if (flag) setProvenanceSelection(buildFlagSelection(flag, currentMedications));
  }

  function handleConditionSelect(condId: string) {
    const cond = currentConditions.find((c) => c.id === condId);
    if (cond) setProvenanceSelection(buildConditionSelection(cond));
  }

  function handleLabSelect(labId: string) {
    const lab = currentLabValues.find((l) => l.id === labId);
    if (lab) setProvenanceSelection(buildLabSelection(lab));
  }

  function handlePatientSelect(id: string) {
    setSelectedPatientId(id);
    setProvenanceSelection(null);
  }

  function handleViewChange(mode: DoctorPatientView) {
    setViewMode(mode);
    setProvenanceSelection(null);
  }

  function handleAppViewChange(view: AppView) {
    setAppView(view);
    setProvenanceSelection(null);
  }

  function handleNavigateToDashboard() {
    setSelectedPatientId('p5');
    setProvenanceSelection(null);
    setViewMode('doctor');
    setAppView('dashboard');
  }

  // Derive which medication row to highlight in the table
  const selectedMedicationId =
    provenanceSelection?.kind === 'medication' ? provenanceSelection.entityId : null;

  return (
    <div className="flex flex-col bg-gray-50" style={{ height: '100vh', overflow: 'hidden' }}>
      <TopNav
        viewMode={viewMode}
        onViewChange={handleViewChange}
        selectedPatient={selectedPatient}
        appView={appView}
        onAppViewChange={handleAppViewChange}
      />

      <div className="flex flex-1 overflow-hidden">
        {appView === 'upload' ? (
          <UploadView onNavigateToDashboard={handleNavigateToDashboard} />
        ) : (
          <>
            <PatientSidebar
              patients={patients}
              selectedId={selectedPatientId}
              onSelect={handlePatientSelect}
            />

            {viewMode === 'doctor' ? (
              <>
                {/* Center Panel */}
                <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-white">
                  {/* Patient header strip */}
                  {selectedPatient && (
                    <div className="px-4 py-2 border-b border-gray-200 bg-white shrink-0 flex items-center justify-between gap-6">
                      {/* Left — identity */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                          <span className="text-blue-600" style={{ fontSize: 10, fontWeight: 700 }}>
                            {selectedPatient.name.split(' ').map((n) => n[0]).join('')}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="text-gray-900" style={{ fontSize: 13, fontWeight: 600 }}>
                              {selectedPatient.name}
                            </span>
                            <span className="text-gray-400" style={{ fontSize: 11 }}>
                              {selectedPatient.age}y · MRN {selectedPatient.mrn}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            {selectedPatient.conditions.flatMap((cond, i) => {
                              const condData = currentConditions.find((c) => c.name === cond);
                              const sep = i > 0 ? (
                                <span key={`sep-${i}`} className="text-gray-200" style={{ fontSize: 10 }}>·</span>
                              ) : null;
                              const el = condData ? (
                                <button
                                  key={cond}
                                  onClick={() => handleConditionSelect(condData.id)}
                                  className="text-gray-400 hover:text-purple-600 transition-colors"
                                  style={{ fontSize: 11 }}
                                  title="View diagnosis source"
                                >
                                  {cond}
                                </button>
                              ) : (
                                <span key={cond} className="text-gray-400" style={{ fontSize: 11 }}>
                                  {cond}
                                </span>
                              );
                              return sep ? [sep, el] : [el];
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Right — alerts + abnormal labs + doctor */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {/* Row 1: Surgery chip + doctor */}
                        <div className="flex items-center gap-2">
                          {selectedPatient.upcomingProcedure && (
                            <div
                              className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-50 border border-red-200"
                              title={`${selectedPatient.upcomingProcedure.procedure} · ${selectedPatient.upcomingProcedure.facility}`}
                            >
                              <Scissors className="w-3 h-3 text-red-500 shrink-0" />
                              <span className="text-red-700" style={{ fontSize: 11, fontWeight: 600 }}>
                                Surgery {selectedPatient.upcomingProcedure.scheduledDate}
                              </span>
                              <span className="px-1 rounded bg-red-100 text-red-700" style={{ fontSize: 10, fontWeight: 700 }}>
                                {selectedPatient.upcomingProcedure.daysUntil}d
                              </span>
                            </div>
                          )}
                          <span className="w-px h-3.5 bg-gray-200" />
                          <span className="text-gray-400" style={{ fontSize: 11 }}>
                            {selectedPatient.primaryDoctor}
                          </span>
                        </div>

                        {/* Row 2: Abnormal labs */}
                        {currentLabValues.filter((l) => l.status !== 'normal').length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap justify-end">
                            {currentLabValues.filter((l) => l.status !== 'normal').map((lab) => (
                              <button
                                key={lab.id}
                                onClick={() => handleLabSelect(lab.id)}
                                className={`px-1.5 py-0.5 rounded border transition-colors ${
                                  lab.status === 'high'
                                    ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                                    : 'bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100'
                                }`}
                                style={{ fontSize: 10, fontWeight: 600 }}
                                title="View lab source"
                              >
                                {lab.name} {lab.value}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="overflow-y-auto shrink-0" style={{ maxHeight: 300 }}>
                    <ClinicalFlagsPanel
                      flags={currentFlags}
                      medications={currentMedications}
                      onMedicationClick={handleMedicationSelect}
                      onFlagSelect={handleFlagSelect}
                    />
                  </div>

                  <MedicationTable
                    medications={currentMedications}
                    flags={currentFlags}
                    selectedMedicationId={selectedMedicationId}
                    onSelect={handleMedicationSelect}
                  />
                </div>

                <ProvenanceViewer
                  selection={provenanceSelection}
                  allDocuments={sourceDocuments}
                  onClose={() => setProvenanceSelection(null)}
                />
              </>
            ) : (
              selectedPatient && (
                <PatientView
                  patient={selectedPatient}
                  medications={currentMedications}
                  flags={currentFlags}
                />
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}
