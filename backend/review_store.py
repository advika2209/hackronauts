RECORDS = {}

def save_record(record_id, record):
    for key in ("medications", "conditions", "allergies", "labs"):
        for item in record.get(key, []):
            item.setdefault("review_status", "pending")  # pending | approved | edited | rejected
    RECORDS[record_id] = record
    return record

def get_record(record_id):
    return RECORDS.get(record_id)