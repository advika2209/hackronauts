const BASE_URL = "http://localhost:8000";

export async function analyzeDocuments(files, mode = "geriatric") {
  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }
  const res = await fetch(`${BASE_URL}/api/analyze?mode=${mode}`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error(`analyze failed: ${res.status}`);
  return res.json();
}

export async function getRecord(recordId) {
  const res = await fetch(`${BASE_URL}/api/record/${recordId}`);
  if (!res.ok) throw new Error(`getRecord failed: ${res.status}`);
  return res.json();
}

export async function reviewItem(recordId, category, index, action, data = null) {
  const res = await fetch(`${BASE_URL}/api/record/${recordId}/${category}/${index}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, data }),
  });
  if (!res.ok) throw new Error(`reviewItem failed: ${res.status}`);
  return res.json();
}
