# ReqSense — AI-Powered Requirements Analyst Chatbot

**ReqSense** is an interactive web application that acts as a Senior Business Analyst (Alex) to guide customers step-by-step through a structured requirement-gathering consultation, ultimately generating a professional software requirement specification report.

---

## Overview

Instead of dumping your idea into a generic AI prompt, ReqSense conducts a **real BA consultation**: it asks focused questions, tracks coverage across 10 requirement areas, scores confidence incrementally, and only generates the final report once enough information has been gathered.

### Key Features

| Feature | Description |
|---|---|
| **Guided consultation** | Alex asks 1–2 focused questions per turn, never overwhelming the user |
| **Progress tracking** | SVG ring meter + phase-grouped checklist (Discovery / Technical / Compliance & Delivery) |
| **Confidence scoring** | 0–100% score, report unlocks only at ≥ 75% with ≥ 6 topics covered |
| **Option chips** | Clickable suggestions on every question — or type your own answer |
| **Rich chat messages** | Topic badges, bold highlights, bullet lists, ✅ acknowledgements |
| **Resizable panels** | Drag the dividers to adjust sidebar / chat / report panel widths |
| **Structured report** | Full Markdown requirement specification with 10 sections |
| **Powered by Gemini** | Google Vertex AI (Gemini 2.5 Flash) via service account authentication |

### Interface

```
┌──────────────────┬──────────────────────────┬────────────────────────────┐
│  Progress Sidebar │       Chat (Alex)         │     Requirement Report     │
│                  │                           │                            │
│  SVG Ring 42%    │  ┌────────────────────┐   │  Generated Markdown        │
│  JUST STARTED    │  │ PROJECT OVERVIEW   │   │  report appears here       │
│                  │  │ ✅ Got it — food    │   │  after confidence ≥ 75%    │
│  DISCOVERY  1/4  │  │ delivery app...    │   │                            │
│  ✓ Project Ovw   │  └────────────────────┘   │  # 1. Project Summary      │
│  ● Target Users  │                           │  # 2. Functional Req.      │
│  ○ Core Features │  [Faster delivery]         │  # 3. Non-functional Req.  │
│  ○ Business Rules│  [Lower fees] [Other]      │  ...                       │
│                  │                           │                            │
│  TECHNICAL  0/3  │  ┌─────────────────────┐  │                            │
│  ○ Non-functional│  │ Type your reply...  │  │                            │
│  ...             │  └─────────────────────┘  │                            │
└──────────────────┴──────────────────────────┴────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, `react-markdown`, `lucide-react` |
| Backend | Node.js + Express 5.x |
| AI | Google Vertex AI — Gemini 2.5 Flash (`@google/genai`) |
| Auth | Google service account (JSON key file) |
| Styling | Pure CSS (dark theme, CSS custom properties) |

---

## Prerequisites

- **Node.js** v18+ and npm
- A **Google Cloud project** with Vertex AI API enabled
- A **service account** JSON key with `roles/aiplatform.user` permission

---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/kienvbhp872004/Requirements-of-Customer-Analyst.git
cd Requirements-of-Customer-Analyst
```

### 2. Add your Vertex AI service account key

Place your Google service account JSON key file in the **project root** and name it:

```
vertex-key.json
```

> **Security note:** `vertex-key.json` is listed in `.gitignore` and will never be committed. Never share or commit this file.

### 3. Configure environment (optional)

The server reads these environment variables. Defaults work for most setups:

```bash
# server/.env  (copy from server/.env.example)
PORT=3001
VERTEX_PROJECT_ID=your-gcp-project-id   # defaults to "vinuni-project"
VERTEX_LOCATION=us-central1             # defaults to "us-central1"
VERTEX_MODEL=gemini-2.5-flash           # defaults to "gemini-2.5-flash"
GOOGLE_APPLICATION_CREDENTIALS=../vertex-key.json
```

### 4. Install dependencies

```bash
# Install all (root + client + server) in one command
npm run install:all

# Or manually:
cd client && npm install
cd ../server && npm install
```

### 5. Start the development servers

```bash
# From project root — starts both client (port 5173) and server (port 3001)
npm run dev

# Or start separately:
cd server && node --watch index.js   # backend on :3001
cd client && npm run dev              # frontend on :5173
```

Open **http://localhost:5173** in your browser.

---

## Project Structure

```
Requirements-of-Customer-Analyst/
├── client/                         # React + Vite frontend
│   └── src/
│       ├── App.jsx                 # Root layout (header + chat mode)
│       ├── App.css                 # Dark theme, all component styles
│       ├── api.js                  # fetch wrappers for /api/chat
│       └── components/
│           ├── ChatWindow.jsx      # Main chat orchestrator, drag-resize logic
│           ├── ChatMessage.jsx     # Individual message with topic badge + prose
│           ├── ConfidenceMeter.jsx # SVG ring + phase-grouped topic checklist
│           └── AnalysisResult.jsx  # Markdown report renderer
│
├── server/                         # Node.js + Express backend
│   ├── index.js                    # Express app entry point
│   └── src/
│       ├── chatRoute.js            # POST /api/chat — Vertex AI integration
│       ├── chatSystemPrompt.js     # Full BA system prompt with scoring rules
│       └── analyzeRoute.js         # POST /api/analyze (document upload mode)
│
├── vertex-key.json                 # ← YOUR KEY HERE (gitignored)
├── package.json                    # Root scripts
└── README.md
```

---

## How It Works

1. **Session starts** — frontend sends a seed message; Alex introduces himself and asks for the project idea.
2. **Conversation loop** — each user reply is sent with the full conversation history. Alex:
   - Acknowledges the answer with a ✅ summary
   - Asks 1–2 follow-up questions
   - Updates `confidence`, `coveredTopics`, `currentTopic`, and `options`
3. **Sidebar updates** — the client reads the structured JSON and animates the progress ring and checklist in real time.
4. **Report unlock** — once `confidence ≥ 75` and at least 6 topics are covered, the "Generate Full Report" button appears.
5. **Report generation** — a final `GENERATE_REPORT` command is sent; Alex outputs a 10-section Markdown specification.

### Conversation History Strategy

Model turns are stored as **raw JSON strings** in the API history. This keeps Gemini in "JSON mode" across turns — the model sees its own previous structured output and continues the format. Display messages are extracted from the `message` field only.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start both client and server in development mode |
| `npm run build` | Build the client for production (`client/dist/`) |
| `cd server && node index.js` | Start backend only (production) |
| `cd client && npm run dev` | Start frontend only |

---

## Requirement Areas (10 Topics)

Alex guides the conversation through these areas in order:

| # | Area | Phase |
|---|---|---|
| 1 | Project Overview | Discovery |
| 2 | Target Users & Roles | Discovery |
| 3 | Core Features & Workflows | Discovery |
| 4 | Business Rules | Discovery |
| 5 | Non-functional Requirements | Technical |
| 6 | Integrations | Technical |
| 7 | Deployment & Infrastructure | Technical |
| 8 | Compliance & Regulations | Compliance & Delivery |
| 9 | Timeline & Budget | Compliance & Delivery |
| 10 | Success Criteria | Compliance & Delivery |

---

## Generated Report Sections

Once confidence reaches the threshold, the report includes:

1. Project Summary
2. Functional Requirements
3. Non-functional Requirements
4. Actors
5. Business Rules
6. Constraints
7. Missing Information
8. Clarification Questions
9. Requirement Quality Assessment
10. Risk Analysis

---

## License

MIT
