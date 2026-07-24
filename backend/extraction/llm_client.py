import os
import json
import google.generativeai as genai
from dotenv import load_dotenv
from extraction.prompts import EXTRACTION_PROMPT

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
_model = genai.GenerativeModel("gemini-flash-latest")

FENCE = "`" * 3


def extract_from_image(image_path: str) -> dict:
    with open(image_path, "rb") as f:
        image_bytes = f.read()

    response = _model.generate_content([
        EXTRACTION_PROMPT,
        {"mime_type": "image/jpeg", "data": image_bytes},
    ])

    text = response.text.strip()

    if text.startswith(FENCE):
        text = text.split(FENCE)[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {
            "prescriber": None, "date": None, "doc_type": None,
            "medications": [], "conditions": [], "allergies": [], "labs": []
        }
    