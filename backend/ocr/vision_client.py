from google.cloud import vision

def ocr_with_boxes(image_path):
    client = vision.ImageAnnotatorClient()
    with open(image_path, "rb") as f:
        image = vision.Image(content=f.read())

    response = client.document_text_detection(image=image)
    words = []

    for page in response.full_text_annotation.pages:
        for block in page.blocks:
            for para in block.paragraphs:
                for word in para.words:
                    text = "".join(s.text for s in word.symbols)
                    verts = word.bounding_box.vertices
                    xs = [v.x for v in verts]
                    ys = [v.y for v in verts]
                    words.append({
                        "text": text,
                        "bbox": {
                            "x": min(xs), "y": min(ys),
                            "w": max(xs) - min(xs),
                            "h": max(ys) - min(ys),
                        },
                    })
    return words