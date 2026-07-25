export type ProvenanceSelection = {
  kind: "medication" | "condition" | "allergy" | "lab" | "flag";
  documentId: string;
  bbox?: { x: number; y: number; w: number; h: number } | null;
  label: string;
};

export const patients = [
  {
    id: "p5",
    name: "Kamala Devi",
    age: 78,
    status: "high",
    severity: "high",
    riskLevel: "high",
    primaryDoctor: "Dr. Rao (Cardiology)",
    conditions: ["Type 2 diabetes", "Hypertension"],
    upcomingProcedure: { type: "Cataract surgery", date: "2026-08-10" },
  },
];

export const medications: Record<string, any[]> = {
  p5: [
    { id: "m1", name: "Clopidogrel", dose: "75mg", frequency: "OD", prescriber: "Dr. Rao (Cardiology)", source_doc: "doc1", bbox: { x: 120, y: 340, w: 180, h: 28 }, confidence: 0.94, review_status: "pending", interactions: [], flags: [], risks: [], warnings: [], tags: [] },
    { id: "m2", name: "Metformin", dose: "500mg", frequency: "BD", prescriber: "Dr. Iyer (Endocrinology)", source_doc: "doc2", bbox: { x: 100, y: 210, w: 160, h: 26 }, confidence: 0.9, review_status: "pending", interactions: [], flags: [], risks: [], warnings: [], tags: [] },
  ],
};

export const clinicalFlags: Record<string, any[]> = {
  p5: [
    { id: "acb_high", severity: "high", category: "cognitive", title: "Anticholinergic burden score: 5", detail: "Three medications with anticholinergic activity.", involved: ["Clopidogrel", "Metformin"], affectedMedications: ["Clopidogrel", "Metformin"], medications: ["Clopidogrel", "Metformin"], medicationIds: ["m1", "m2"], tags: [], source: "ACB Scale", mode: "geriatric", source_doc: "doc1" },
  ],
};

export const patientConditions: Record<string, any[]> = {
  p5: [
    { id: "c1", name: "Type 2 diabetes", source_doc: "doc2" },
    { id: "c2", name: "Hypertension", source_doc: "doc1" },
  ],
};

export const labValues: Record<string, any[]> = {
  p5: [
    { id: "l1", name: "Creatinine", value: 1.6, unit: "mg/dL", status: "high", source_doc: "doc4" },
    { id: "l2", name: "HbA1c", value: 8.2, unit: "%", status: "high", source_doc: "doc4" },
  ],
};

export const sourceDocuments = [
  { id: "doc1", image_url: "/uploads/doc1.jpg" },
  { id: "doc2", image_url: "/uploads/doc2.jpg" },
  { id: "doc3", image_url: "/uploads/doc3.jpg" },
  { id: "doc4", image_url: "/uploads/doc4.jpg" },
];

export function buildMedicationSelection(med: any): ProvenanceSelection {
  return { kind: "medication", documentId: med.source_doc, bbox: med.bbox ?? null, label: med.name };
}
export function buildConditionSelection(cond: any): ProvenanceSelection {
  return { kind: "condition", documentId: cond.source_doc, bbox: cond.bbox ?? null, label: cond.name };
}
export function buildAllergySelection(allergy: any): ProvenanceSelection {
  return { kind: "allergy", documentId: allergy.source_doc, bbox: allergy.bbox ?? null, label: allergy.name };
}
export function buildLabSelection(lab: any): ProvenanceSelection {
  return { kind: "lab", documentId: lab.source_doc, bbox: lab.bbox ?? null, label: lab.name };
}
export function buildFlagSelection(flag: any): ProvenanceSelection {
  return { kind: "flag", documentId: flag.source_doc ?? (flag.involved?.[0] ?? ""), bbox: flag.bbox ?? null, label: flag.title };
}
