const express = require('express');
const multer  = require('multer');
const OpenAI  = require('openai');
const SYSTEM_PROMPT = require('./systemPrompt');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

router.post('/analyze', upload.single('file'), async (req, res) => {
  console.log('[analyze] Request received — file:', req.file?.originalname ?? 'none');

  try {
    let documentText = '';

    if (req.file) {
      documentText = req.file.buffer.toString('utf-8');
      console.log('[analyze] Using uploaded file, size:', req.file.size, 'bytes');
    } else if (req.body.text) {
      documentText = req.body.text;
      console.log('[analyze] Using pasted text, length:', documentText.length, 'chars');
    } else {
      return res.status(400).json({ error: 'No document provided. Send either a file or text field.' });
    }

    if (!documentText.trim()) {
      return res.status(400).json({ error: 'Document content is empty.' });
    }

    const ai    = getClient();
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    console.log('[analyze] Calling OpenAI model:', model);

    const completion = await ai.chat.completions.create({
      model,
      messages: [
        { role: 'system',  content: SYSTEM_PROMPT },
        { role: 'user',    content: documentText  },
      ],
    });

    const analysis = completion.choices[0].message.content;
    console.log('[analyze] OpenAI responded OK, length:', analysis?.length ?? 0);
    res.json({ analysis });
  } catch (err) {
    console.error('[analyze] Error:', err.message);
    res.status(500).json({ error: err.message || 'Internal server error.' });
  }
});

module.exports = router;
