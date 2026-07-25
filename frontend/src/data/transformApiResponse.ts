export function transformApiResponse(apiData: any) {
  const patientId = "live-" + Date.now();

  const meds = (apiData.medications || []).map((m: any, i: number) => {
    const confidence = m.confidence ?? 0.8;
    return {
      id: `med-${i}`,
      name: m.name,
      dose: m.dose,
      frequency: m.frequency,
      prescriber: m.prescriber,
      source_doc: m.source_doc,
      bbox: m.bbox,
      confidence,
      review_status: m.review_status || "pending",
      status: confidence > 0.9 ? "verified" : confidence > 0.7 ? "inferred" : "low-confidence",
      interactions: [], flags: [], risks: [], warnings: [], tags: [],
    };
  });

  const flags = (apiData.flags || []).map((f: any, i: number) => {
    const medIds = meds.filter((m: any) => (f.involved || []).includes(m.name)).map((m: any) => m.id);
    return {
      id: f.id || `flag-${i}`,
      severity: f.severity,
      category: f.category,
      title: f.title,
      detail: f.detail,
      involved: f.involved || [],
      affectedMedications: f.involved || [],
      medications: f.involved || [],
      medicationIds: medIds,
      tags: [],
      source: f.source,
      mode: f.mode,
      source_doc: f.source_doc,
    };
  });

  const conditions = (apiData.conditions || []).map((c: any, i: number) => ({
    id: `cond-${i}`, name: c.name, source_doc: c.source_doc,
  }));

  const labs = (apiData.labs || []).map((l: any, i: number) => ({
    id: `lab-${i}`, name: l.test, value: l.value, unit: l.unit, status: "high", source_doc: l.source_doc,
  }));

  const severityOrder: Record<string, number> = { critical: 3, high: 2, medium: 1, low: 0 };
  let riskLevel = "low";
  for (const f of flags) {
    if ((severityOrder[f.severity] || 0) > (severityOrder[riskLevel] || 0)) riskLevel = f.severity;
  }

  const patient = {
    id: patientId,
    name: apiData.patient?.name || "Unknown Patient",
    age: apiData.patient?.age,
    riskLevel,
    mrn: "MRN-" + Math.floor(Math.random() * 900000 + 100000),
    primaryDoctor: meds[0]?.prescriber || "Unknown",
    conditions: conditions.map((c: any) => c.name),
    upcomingProcedure: null,
  };

  return { patient, medications: meds, flags, conditions, labs, documents: apiData.documents || [] };
}
