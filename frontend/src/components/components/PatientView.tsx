import { type ComponentType } from 'react';
import { AlertTriangle, AlertCircle, CheckCircle, Clock, Pill, Heart, Info } from 'lucide-react';
import { cn } from './ui/utils';
import type { Patient, Medication, ClinicalFlag } from '../data/mockData';

interface PatientViewProps {
  patient: Patient;
  medications: Medication[];
  flags: ClinicalFlag[];
}

const categoryToIcon: Record<string, ComponentType<{ className?: string }>> = {
  Anticoagulant: Heart,
  Antiplatelet: Heart,
  'Beta-Blocker': Heart,
  'ACE Inhibitor': Heart,
  Statin: Heart,
  PPI: Pill,
  'Loop Diuretic': Pill,
  'Aldosterone Antagonist': Pill,
  'Cardiac Glycoside': Heart,
  Bisphosphonate: Pill,
  'Thyroid Hormone': Pill,
  Supplement: Pill,
};

function MedicineCard({ medication, flags }: { medication: Medication; flags: ClinicalFlag[] }) {
  const hasFlag = flags.some((f) => f.medicationIds.includes(medication.id));
  const flag = flags.find((f) => f.medicationIds.includes(medication.id));
  const IconComp = categoryToIcon[medication.category] ?? Pill;
  const isCritical = flag?.severity === 'critical';
  const isHigh = flag?.severity === 'high';

  return (
    <div
      className={cn(
        'bg-white rounded-xl border p-4 transition-shadow',
        isCritical ? 'border-red-200 shadow-sm' : isHigh ? 'border-orange-200 shadow-sm' : 'border-gray-200'
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
            isCritical
              ? 'bg-red-100 text-red-600'
              : isHigh
                ? 'bg-orange-100 text-orange-600'
                : 'bg-blue-50 text-blue-600'
          )}
        >
          <IconComp className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-gray-900" style={{ fontSize: 15, fontWeight: 600 }}>
              {medication.name}
            </p>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full" style={{ fontSize: 11, fontWeight: 500 }}>
              {medication.dose}
            </span>
          </div>
          <p className="text-gray-500 mt-0.5" style={{ fontSize: 12 }}>
            {medication.genericName} · {medication.category}
          </p>
        </div>

        {hasFlag ? (
          isCritical ? (
            <span className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 rounded-lg shrink-0" style={{ fontSize: 11, fontWeight: 600 }}>
              <AlertTriangle className="w-3 h-3" /> Alert
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-600 rounded-lg shrink-0" style={{ fontSize: 11, fontWeight: 600 }}>
              <AlertCircle className="w-3 h-3" /> Review
            </span>
          )
        ) : (
          <span className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg shrink-0" style={{ fontSize: 11, fontWeight: 500 }}>
            <CheckCircle className="w-3 h-3" /> OK
          </span>
        )}
      </div>

      {/* How to take */}
      <div className="flex items-center gap-2 mt-3 px-3 py-2 bg-gray-50 rounded-lg">
        <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        <span className="text-gray-600" style={{ fontSize: 12 }}>
          <span style={{ fontWeight: 500 }}>When to take: </span>
          {medication.frequency}, by mouth
        </span>
      </div>

      {/* Patient-friendly description */}
      <p className="text-gray-600 mt-3" style={{ fontSize: 13, lineHeight: 1.6 }}>
        {medication.patientDescription}
      </p>

      {/* Prescriber */}
      <p className="text-gray-400 mt-2.5" style={{ fontSize: 11 }}>
        Prescribed by {medication.prescriber} · {medication.prescribedDate}
      </p>
    </div>
  );
}

function CriticalAlertBanner({ flag, medications }: { flag: ClinicalFlag; medications: Medication[] }) {
  const affected = medications.filter((m) => flag.medicationIds.includes(m.id));

  const bgColor =
    flag.severity === 'critical'
      ? 'bg-red-50 border-red-200'
      : flag.severity === 'high'
        ? 'bg-orange-50 border-orange-200'
        : 'bg-amber-50 border-amber-200';

  const iconColor =
    flag.severity === 'critical'
      ? 'text-red-600'
      : flag.severity === 'high'
        ? 'text-orange-600'
        : 'text-amber-600';

  const titleColor =
    flag.severity === 'critical'
      ? 'text-red-900'
      : flag.severity === 'high'
        ? 'text-orange-900'
        : 'text-amber-900';

  const bodyColor =
    flag.severity === 'critical'
      ? 'text-red-700'
      : flag.severity === 'high'
        ? 'text-orange-700'
        : 'text-amber-700';

  const friendlyMessages: Record<string, string> = {
    'drug-interaction':
      'Two of your medicines may interact with each other. This has been flagged for your doctor to review. Do not stop taking any medicine without speaking to your doctor first.',
    duplicate:
      'You appear to be prescribed two medicines that do the same thing. Your doctor should review this to make sure you are only taking one.',
    monitoring:
      'One of your medicine combinations needs regular blood tests to make sure it is working safely.',
    dosage: 'Your dose may need to be reviewed by your doctor.',
  };

  return (
    <div className={cn('rounded-xl border p-4', bgColor)}>
      <div className="flex items-start gap-3">
        <AlertTriangle className={cn('w-5 h-5 mt-0.5 shrink-0', iconColor)} />
        <div>
          <p className={cn('', titleColor)} style={{ fontSize: 14, fontWeight: 600 }}>
            Important: Please speak with your doctor
          </p>
          <p className={cn('mt-1.5', bodyColor)} style={{ fontSize: 13, lineHeight: 1.6 }}>
            {friendlyMessages[flag.type]}
          </p>
          {affected.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
              <span className={cn('', bodyColor)} style={{ fontSize: 12 }}>Medicines involved:</span>
              {affected.map((m) => (
                <span
                  key={m.id}
                  className="px-2 py-0.5 bg-white border border-current rounded-full"
                  style={{ fontSize: 12, fontWeight: 500 }}
                >
                  {m.name} {m.dose}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function PatientView({ patient, medications, flags }: PatientViewProps) {
  const criticalFlags = flags.filter((f) => f.severity === 'critical' || f.severity === 'high');

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Greeting Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-blue-600 mb-2" style={{ fontSize: 13, fontWeight: 500 }}>
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            Patient View · Simplified
          </div>
          <h1 className="text-gray-900" style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>
            Your Medicines Explained
          </h1>
          <p className="text-gray-500 mt-1" style={{ fontSize: 14 }}>
            {patient.name} · {patient.conditions.join(', ')}
          </p>
        </div>

        {/* Critical Alerts */}
        {criticalFlags.length > 0 && (
          <div className="mb-6 space-y-3">
            {criticalFlags.map((flag) => (
              <CriticalAlertBanner key={flag.id} flag={flag} medications={medications} />
            ))}
          </div>
        )}

        {/* Info strip */}
        <div className="flex items-start gap-2 mb-6 px-3 py-2.5 bg-blue-50 border border-blue-100 rounded-lg">
          <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
          <p className="text-blue-600" style={{ fontSize: 12 }}>
            This information was automatically extracted from your prescriptions. Always follow the advice of your doctor or pharmacist. Do not stop or change your medicines without consulting them.
          </p>
        </div>

        {/* Medication count */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-gray-700" style={{ fontSize: 14, fontWeight: 600 }}>
            Your medicines
          </span>
          <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full" style={{ fontSize: 12, fontWeight: 500 }}>
            {medications.length}
          </span>
        </div>

        {/* Medicine Cards */}
        <div className="space-y-3">
          {medications.map((med) => (
            <MedicineCard key={med.id} medication={med} flags={flags} />
          ))}
        </div>

        {/* Footer disclaimer */}
        <p className="text-center text-gray-400 mt-8" style={{ fontSize: 11 }}>
          Information extracted by MedThread AI · Always verify with your healthcare provider
        </p>
      </div>
    </div>
  );
}
