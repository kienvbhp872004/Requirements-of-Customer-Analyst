const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function analyzeDocument({ text, file }) {
  const form = new FormData();
  if (file) {
    form.append('file', file);
  } else {
    form.append('text', text);
  }

  const res = await fetch(`${BASE_URL}/api/analyze`, { method: 'POST', body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data.analysis;
}

// messages: [{ role: 'user'|'model', text: string }]
// returns structured object: { type, message, confidence, currentTopic, coveredTopics, options, readyForReport }
// or for report: { type: 'report', content: string }
export async function sendChat(messages, generateReport = false) {
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, generateReport }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}
