import difflib

def attach_boxes(extracted, ocr_words, doc_id):
    texts = [w["text"] for w in ocr_words]

    def find_box(name):
        first = name.split()[0]
        matches = difflib.get_close_matches(first, texts, n=1, cutoff=0.72)
        if not matches:
            return None, 0.0
        idx = texts.index(matches[0])
        score = difflib.SequenceMatcher(None, first.lower(), matches[0].lower()).ratio()
        return ocr_words[idx]["bbox"], round(score, 2)

    for key in ("medications", "conditions", "allergies", "labs"):
        for item in extracted.get(key, []):
            label = item.get("name") or item.get("test") or ""
            box, score = find_box(label)
            item["bbox"] = box
            item["confidence"] = score
            item["source_doc"] = doc_id

    return extracted