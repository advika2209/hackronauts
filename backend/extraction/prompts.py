EXTRACTION_PROMPT = """You are a medical document extraction system.

Read this document image and return ONLY valid JSON. No markdown fences,
no explanation, no preamble.

Schema:
{
  "prescriber": "doctor name and specialty, or null",
  "date": "YYYY-MM-DD or null",
  "doc_type": "prescription | lab_report | discharge_summary",
  "medications": [
    {"name": "...", "dose": "...", "frequency": "..."}
  ],
  "conditions": [{"name": "..."}],
  "allergies": [{"name": "..."}],
  "labs": [{"test": "...", "value": 0.0, "unit": "..."}]
}

Rules:
- Transcribe exactly as written. Do not correct or standardise names.
- If a field is not present in the document, use null. Never guess.
- Do not assess safety, risk, or appropriateness. Extraction only.
- Return an empty array for any category with no entries.
"""
PATIENT_PROMPT = """Rewrite this medication summary for a patient with no
medical training.

Rules:
- Simple words. Short sentences.
- Explain what each medicine is FOR, not how it works.
- Never use the words "inappropriate", "risk", "danger", or "warning".
- Frame concerns as things to mention to a doctor, not as alarms.
- End with exactly 3 questions the patient could ask at their next visit.

Return JSON: {"medicines": [...], "tell_your_doctor": [...], "questions": [...]}
"""