const express = require('express');
const multer = require('multer');
const { GoogleGenAI } = require('@google/genai');
const SYSTEM_PROMPT = require('./systemPrompt');
const path = require('path');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

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

router.post('/analyze', upload.single('file'), async (req, res) => {
  console.log('[analyze] Request received — file:', req.file?.originalname ?? 'none', '| body keys:', Object.keys(req.body));

  try {
    let documentText = '';

    if (req.file) {
      documentText = req.file.buffer.toString('utf-8');
      console.log('[analyze] Using uploaded file, size:', req.file.size, 'bytes');
    } else if (req.body.text) {
      documentText = req.body.text;
      console.log('[analyze] Using pasted text, length:', documentText.length, 'chars');
    } else {
      console.warn('[analyze] No content provided');
      return res.status(400).json({ error: 'No document provided. Send either a file or text field.' });
    }

    if (!documentText.trim()) {
      console.warn('[analyze] Content is empty after trim');
      return res.status(400).json({ error: 'Document content is empty.' });
    }

    const ai = getClient();
    const model = process.env.VERTEX_MODEL || 'gemini-2.5-flash';
    console.log('[analyze] Calling Vertex AI model:', model);

    const result = await ai.models.generateContent({
      model,
      contents: documentText,
      config: { systemInstruction: SYSTEM_PROMPT },
    });

    console.log('[analyze] Vertex AI responded OK, length:', result.text?.length ?? 0);
    res.json({ analysis: result.text });
  } catch (err) {
    console.error('[analyze] Error:', err.message);
    res.status(500).json({ error: err.message || 'Internal server error.' });
  }
});

module.exports = router;
