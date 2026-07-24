import os
os.environ.setdefault(
    "GOOGLE_APPLICATION_CREDENTIALS",
    os.path.join(os.path.dirname(__file__), "credentials", "vision-key.json")
)

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import json, os, shutil
from ocr.vision_client import ocr_with_boxes
from pydantic import BaseModel
from review_store import save_record, get_record
from fastapi import HTTPException

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
async def analyze(files: list[UploadFile] = File(...)):
    saved = []
    for i, f in enumerate(files):
        path = f"uploads/doc{i+1}.jpg"
        with open(path, "wb") as out:
            shutil.copyfileobj(f.file, out)

        try:
            ocr_words = ocr_with_boxes(path)
            print(f"doc{i+1}: OCR found {len(ocr_words)} words")
        except Exception as e:
            print(f"doc{i+1}: OCR failed — {e}")
            ocr_words = []

        saved.append({
            "id": f"doc{i+1}",
            "image_url": f"/uploads/doc{i+1}.jpg",
            "ocr_word_count": len(ocr_words),
        })

    with open("mock/kamala.json") as f:
        result = json.load(f)
    save_record("kamala", result)
    return result
@app.get("/api/record/{record_id}")
def get_record_endpoint(record_id: str):
    record = get_record(record_id)
    if not record:
        raise HTTPException(404, "Record not found")
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
