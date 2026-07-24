import os
os.environ.setdefault(
    "GOOGLE_APPLICATION_CREDENTIALS",
    os.path.join(os.path.dirname(__file__), "credentials", "vision-key.json")
)
from extraction.llm_client import extract_from_image
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import json, os, shutil
from ocr.vision_client import ocr_with_boxes
from pydantic import BaseModel
from review_store import save_record, get_record
from fastapi import HTTPException
from extraction.reconcile import attach_boxes
from rules.engine import evaluate

app = FastAPI(title="MedThread API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/api/health")
def health():
    return {"status": "ok"}
@app.get("/api/demo")
def demo():
    with open("mock/kamala.json") as f:
        return json.load(f)

@app.post("/api/analyze")
async def analyze(files: list[UploadFile] = File(...), mode: str = "geriatric"):
    documents = []
    all_meds, all_conditions, all_allergies, all_labs = [], [], [], []

    for i, f in enumerate(files):
        doc_id = f"doc{i+1}"
        path = f"uploads/{doc_id}.jpg"
        with open(path, "wb") as out:
            shutil.copyfileobj(f.file, out)

        try:
            ocr_words = ocr_with_boxes(path)
        except Exception as e:
            print(f"{doc_id}: OCR failed — {e}")
            ocr_words = []

        try:
            extracted = extract_from_image(path)
        except Exception as e:
            print(f"{doc_id}: extraction failed — {e}")
            extracted = {"medications": [], "conditions": [], "allergies": [], "labs": []}

        extracted = attach_boxes(extracted, ocr_words, doc_id)

        documents.append({"id": doc_id, "image_url": f"/uploads/{doc_id}.jpg"})
        all_meds += extracted.get("medications", [])
        all_conditions += extracted.get("conditions", [])
        all_allergies += extracted.get("allergies", [])
        all_labs += extracted.get("labs", [])

    record = {
        "patient": {"name": "Kamala Devi", "age": 78, "sex": "F"},
        "documents": documents,
        "medications": all_meds,
        "conditions": all_conditions,
        "allergies": all_allergies,
        "labs": all_labs,
    }
    record["flags"] = evaluate(record, mode=mode)
    save_record("kamala", record)
    return record

class ReviewUpdate(BaseModel):
    action: str  # "approve" | "edit" | "reject"
    data: dict | None = None  # new field values, only used when action == "edit"


@app.patch("/api/record/{record_id}/{category}/{index}")
def review_item(record_id: str, category: str, index: int, update: ReviewUpdate):
    record = get_record(record_id)
    if not record or category not in record:
        raise HTTPException(404, "Record or category not found")
    items = record[category]
    if index >= len(items):
        raise HTTPException(404, "Item index out of range")

    if update.action == "approve":
        items[index]["review_status"] = "approved"
    elif update.action == "reject":
        items[index]["review_status"] = "rejected"
    elif update.action == "edit":
        items[index].update(update.data or {})
        items[index]["review_status"] = "edited"
    else:
        raise HTTPException(400, "action must be approve, edit, or reject")

    return items[index]
