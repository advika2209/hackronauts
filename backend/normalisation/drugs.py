BRAND_TO_GENERIC = {
    "crocin": "paracetamol", "calpol": "paracetamol", "dolo": "paracetamol",
    "combiflam": "ibuprofen", "brufen": "ibuprofen",
    "ecosprin": "aspirin", "disprin": "aspirin",
    "glycomet": "metformin", "glucophage": "metformin",
    "amlong": "amlodipine", "amlopres": "amlodipine",
    "clopilet": "clopidogrel", "plavix": "clopidogrel",
    "lasix": "furosemide", "restyl": "alprazolam",
}

def normalise(name: str) -> str:
    if not name:
        return ""
    key = name.strip().lower().split()[0]
    return BRAND_TO_GENERIC.get(key, key)