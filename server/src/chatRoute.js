const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const CHAT_SYSTEM_PROMPT = require('./chatSystemPrompt');
const path = require('path');

const router = express.Router();

function getClient() {
  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
    || path.resolve(__dirname, '../../vertex-key.json');
  return new GoogleGenAI({
    vertexai: true,
    project: process.env.VERTEX_PROJECT_ID || 'vinuni-project',
    location: process.env.VERTEX_LOCATION || 'us-central1',
    googleAuthOptions: { keyFilename: keyPath },
  });
}

function parseAIResponse(raw) {
  // Strip markdown code fences
  let cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  // 1. Try direct parse
  try { return { parsed: JSON.parse(cleaned), raw: null }; } catch {}

  // 2. Model sometimes adds preamble/suffix — extract first {...} block
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try {
      const extracted = cleaned.slice(start, end + 1);
      return { parsed: JSON.parse(extracted), raw: null };
    } catch {}
  }

  // 3. Give up — return raw text as fallback
  return { parsed: null, raw: cleaned };
}

router.post('/chat', express.json(), async (req, res) => {
  const { messages, generateReport } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required.' });
  }

  const lastText = messages.at(-1).text;
  console.log(`[chat] turn=${messages.length} last="${lastText?.slice(0, 60)}"`);

  try {
    const ai = getClient();
    const model = process.env.VERTEX_MODEL || 'gemini-2.5-flash';

    const contents = messages.map(m => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.text }],
    }));

    // For report generation, get plain markdown; otherwise enforce JSON output
    const result = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: CHAT_SYSTEM_PROMPT,
        ...(generateReport ? {} : { responseMimeType: 'application/json' }),
      },
    });

    const raw = result.text;

    // GENERATE_REPORT returns plain markdown, not JSON
    if (generateReport) {
      console.log(`[chat] report generated, length=${raw?.length}`);
      return res.json({ type: 'report', content: raw });
    }

    const { parsed, raw: fallback } = parseAIResponse(raw);

    if (parsed) {
      console.log(`[chat] confidence=${parsed.confidence} topic="${parsed.currentTopic}" opts=${parsed.options?.length ?? 0} ready=${parsed.readyForReport}`);
      return res.json({ type: 'structured', ...parsed });
    }

    // Fallback: AI didn't return valid JSON — wrap it
    console.warn('[chat] AI returned non-JSON fallback, raw:', raw?.slice(0, 100));
    return res.json({
      type: 'structured',
      message: fallback || raw,
      confidence: 0,
      currentTopic: 'Unknown',
      coveredTopics: [],
      options: null,
      readyForReport: false,
    });

  } catch (err) {
    console.error('[chat] Error:', err.message);
    res.status(500).json({ error: err.message || 'Internal server error.' });
  }
});

module.exports = router;
