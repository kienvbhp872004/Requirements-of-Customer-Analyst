const express = require('express');
const OpenAI  = require('openai');
const CHAT_SYSTEM_PROMPT = require('./chatSystemPrompt');

const router = express.Router();

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// Map our internal history format → OpenAI messages array
function buildMessages(messages, systemPrompt) {
  return [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({
      role:    m.role === 'model' ? 'assistant' : 'user',
      content: m.text,
    })),
  ];
}

router.post('/chat', express.json(), async (req, res) => {
  const { messages, generateReport } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required.' });
  }

  const lastText = messages.at(-1).text;
  console.log(`[chat] turn=${messages.length} last="${lastText?.slice(0, 60)}"`);

  try {
    const ai      = getClient();
    const model   = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const oaiMsgs = buildMessages(messages, CHAT_SYSTEM_PROMPT);

    const completion = await ai.chat.completions.create({
      model,
      messages: oaiMsgs,
      // JSON mode: guarantees valid JSON when not generating a free-text report
      ...(!generateReport && { response_format: { type: 'json_object' } }),
    });

    const raw = completion.choices[0].message.content;

    if (generateReport) {
      console.log(`[chat] report generated, length=${raw?.length}`);
      return res.json({ type: 'report', content: raw });
    }

    // With response_format: json_object, OpenAI guarantees valid JSON — no need for fallback heuristics
    try {
      const parsed = JSON.parse(raw);
      console.log(`[chat] confidence=${parsed.confidence} topic="${parsed.currentTopic}" opts=${parsed.options?.length ?? 0} ready=${parsed.readyForReport}`);
      return res.json({ type: 'structured', ...parsed });
    } catch {
      // Safety net: should rarely happen with json_object mode
      console.warn('[chat] JSON parse failed despite json_object mode — using fallback');
      return res.json({
        type: 'structured',
        message: raw,
        confidence: 0,
        currentTopic: '',
        coveredTopics: [],
        options: null,
        readyForReport: false,
      });
    }

  } catch (err) {
    console.error('[chat] Error:', err.message);
    res.status(500).json({ error: err.message || 'Internal server error.' });
  }
});

module.exports = router;
