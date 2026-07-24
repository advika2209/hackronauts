from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import json, os, shutil

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
        saved.append({"id": f"doc{i+1}", "image_url": f"/uploads/doc{i+1}.jpg"})

    with open("mock/kamala.json") as f:
        result = json.load(f)
    return result
