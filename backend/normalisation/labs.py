LAB_SYNONYMS = {
    "sgpt": "ALT", "alanine transaminase": "ALT", "alt": "ALT",
    "sgot": "AST", "aspartate transaminase": "AST", "ast": "AST",
    "hba1c": "HbA1c", "glycated haemoglobin": "HbA1c",
    "creat": "Creatinine", "s. creatinine": "Creatinine",
    "hb": "Haemoglobin", "hgb": "Haemoglobin",
}

def normalise_lab(test: str) -> str:
    return LAB_SYNONYMS.get((test or "").strip().lower(), test)