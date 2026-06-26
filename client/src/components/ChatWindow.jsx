import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Loader2, ClipboardList, RefreshCw, GripVertical, History } from 'lucide-react';
import ChatMessage from './ChatMessage';
import ConfidenceMeter from './ConfidenceMeter';
import AnalysisResult from './AnalysisResult';
import { sendChat } from '../api';

const SEED_TEXT = 'Hello, I want to start a requirement consultation.';
const SIDEBAR_MIN = 180;
const SIDEBAR_MAX = 320;
const CHAT_MIN = 300;
const CHAT_MAX = 700;
const STORAGE_KEY = 'reqsense_session';

// ── localStorage helpers ─────────────────────────────────
function saveSession(payload) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); } catch {}
}

function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function clearSession() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

export default function ChatWindow() {
  const [apiHistory, setApiHistory]       = useState([]);
  const [displayMsgs, setDisplayMsgs]     = useState([]);
  const [input, setInput]                 = useState('');
  const [loading, setLoading]             = useState(false);
  const [report, setReport]               = useState(null);
  const [reportMeta, setReportMeta]       = useState(null);
  const [error, setError]                 = useState(null);
  const [restored, setRestored]           = useState(false); // banner "session restored"

  const [confidence, setConfidence]       = useState(0);
  const [coveredTopics, setCoveredTopics] = useState([]);
  const [currentTopic, setCurrentTopic]   = useState('');
  const [readyForReport, setReadyForReport] = useState(false);

  const [sidebarW, setSidebarW] = useState(220);
  const [chatW, setChatW]       = useState(420);

  const layoutRef    = useRef(null);
  const bottomRef    = useRef(null);
  const inputRef     = useRef(null);
  const mountedOnce  = useRef(false);   // guard against StrictMode double-mount

  // ── Mount: restore OR start fresh ───────────────────────
  useEffect(() => {
    if (mountedOnce.current) return;
    mountedOnce.current = true;

    const saved = loadSession();
    if (saved?.apiHistory?.length > 1) {
      // Restore previous session
      setApiHistory(saved.apiHistory);
      setDisplayMsgs(saved.displayMsgs || []);
      setConfidence(saved.confidence || 0);
      setCoveredTopics(saved.coveredTopics || []);
      setCurrentTopic(saved.currentTopic || '');
      setReadyForReport(saved.readyForReport || false);
      setReport(saved.report || null);
      setRestored(true);
      setTimeout(() => setRestored(false), 4000); // auto-hide banner after 4s
    } else {
      startSession();
    }
  }, []);

  // ── Auto-scroll ──────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMsgs, loading]);

  // ── Persist to localStorage whenever key state changes ───
  useEffect(() => {
    if (apiHistory.length > 1) {  // don't save empty/seed-only state
      saveSession({ apiHistory, displayMsgs, confidence, coveredTopics, currentTopic, readyForReport, report });
    }
  }, [apiHistory, displayMsgs, confidence, coveredTopics, currentTopic, readyForReport, report]);

  // ── Drag-to-resize ───────────────────────────────────────
  function useDrag(setter) {
    return useCallback((e) => {
      e.preventDefault();
      const startX = e.clientX;
      const startW = setter === setSidebarW ? sidebarW : chatW;
      const min    = setter === setSidebarW ? SIDEBAR_MIN : CHAT_MIN;
      const max    = setter === setSidebarW ? SIDEBAR_MAX : CHAT_MAX;

      const onMove = (ev) => setter(Math.min(max, Math.max(min, startW + ev.clientX - startX)));
      const onUp   = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    }, [setter, sidebarW, chatW]);
  }

  const onDragSidebar = useDrag(setSidebarW);
  const onDragChat    = useDrag(setChatW);

  // ── Session helpers ──────────────────────────────────────
  function toRaw(data) {
    return JSON.stringify({
      message: data.message, confidence: data.confidence,
      currentTopic: data.currentTopic, coveredTopics: data.coveredTopics,
      options: data.options, readyForReport: data.readyForReport,
    });
  }

  function applyBA(data) {
    if (typeof data.confidence === 'number' && data.confidence > 0)
      setConfidence(prev => Math.max(prev, data.confidence));
    if (Array.isArray(data.coveredTopics) && data.coveredTopics.length > 0)
      setCoveredTopics(prev => {
        const merged = [...prev];
        for (const t of data.coveredTopics) if (!merged.includes(t)) merged.push(t);
        return merged;
      });
    if (data.currentTopic)  setCurrentTopic(data.currentTopic);
    if (data.readyForReport) setReadyForReport(true);
  }

  async function startSession() {
    clearSession();
    setApiHistory([]); setDisplayMsgs([]); setReport(null); setReportMeta(null); setError(null); setRestored(false);
    setConfidence(0); setCoveredTopics([]); setCurrentTopic(''); setReadyForReport(false);
    setLoading(true);
    try {
      const userMsg = { role: 'user', text: SEED_TEXT };
      const data    = await sendChat([userMsg]);
      setApiHistory([userMsg, { role: 'model', text: toRaw(data) }]);
      setDisplayMsgs([{ role: 'model', text: data.message, options: data.options || null, topic: data.currentTopic }]);
      applyBA(data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); inputRef.current?.focus(); }
  }

  // ── Send ─────────────────────────────────────────────────
  async function send(text) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput(''); setError(null);

    setDisplayMsgs(prev => [...prev.map(m => ({ ...m, options: undefined })), { role: 'user', text: msg }]);
    const nextHistory = [...apiHistory, { role: 'user', text: msg }];
    setLoading(true);

    try {
      const data = await sendChat(nextHistory);
      setApiHistory([...nextHistory, { role: 'model', text: toRaw(data) }]);
      setDisplayMsgs(prev => [...prev, { role: 'model', text: data.message, options: data.options || null, topic: data.currentTopic }]);
      applyBA(data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); inputRef.current?.focus(); }
  }

  async function generateReport() {
    setLoading(true); setError(null);
    const meta = {
      date:        new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      confidence,
      topicsCount: coveredTopics.length,
      exchanges:   Math.max(0, Math.floor((apiHistory.length - 2) / 2)),
      coveredTopics,
    };
    try {
      const data = await sendChat([...apiHistory, { role: 'user', text: 'GENERATE_REPORT' }], true);
      setReport(data.content);
      setReportMeta(meta);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  // Number of real turns (excluding seed)
  const turnCount = Math.max(0, Math.floor((apiHistory.length - 2) / 2));

  return (
    <div className="chat-layout" ref={layoutRef}>

      {/* ── Sidebar ── */}
      <div className="sidebar-panel" style={{ width: sidebarW }}>
        <ConfidenceMeter confidence={confidence} coveredTopics={coveredTopics} currentTopic={currentTopic} />

        {/* Session meta */}
        {turnCount > 0 && (
          <div className="session-meta">
            <History size={11} />
            <span>{turnCount} exchange{turnCount !== 1 ? 's' : ''} · auto-saved</span>
          </div>
        )}

        <button className="btn--ghost sidebar-new" onClick={startSession}>
          <RefreshCw size={13} /> New session
        </button>
      </div>

      {/* ── Drag handle 1 ── */}
      <div className="drag-handle" onMouseDown={onDragSidebar} title="Drag to resize">
        <GripVertical size={14} />
      </div>

      {/* ── Chat panel ── */}
      <div className="chat-panel" style={{ width: chatW, minWidth: CHAT_MIN, maxWidth: CHAT_MAX }}>
        <div className="chat-panel__header">
          <div className="chat-panel__persona">
            <div className="chat-panel__avatar">A</div>
            <div>
              <div className="chat-panel__name">Alex</div>
              <div className="chat-panel__role">Senior Business Analyst</div>
            </div>
          </div>
          <span className="chat-panel__online">Online</span>
        </div>

        {/* Restored session banner */}
        {restored && (
          <div className="restored-banner">
            <History size={13} />
            Session restored — your previous conversation is back.
          </div>
        )}

        <div className="chat-panel__messages">
          {displayMsgs.map((m, i) => (
            <div key={i}>
              <ChatMessage role={m.role} text={m.text} topic={m.topic} />
              {m.options && i === displayMsgs.length - 1 && !loading && (
                <div className="option-chips">
                  {m.options.map((opt, j) => (
                    <button key={j} className="option-chip" onClick={() => send(opt)}>{opt}</button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="chat-msg chat-msg--model">
              <div className="chat-msg__ava chat-msg__ava--model">A</div>
              <div className="chat-msg__bubble chat-msg__bubble--model chat-msg__bubble--typing">
                <span /><span /><span />
              </div>
            </div>
          )}

          {error && <p className="chat-error">{error}</p>}
          <div ref={bottomRef} />
        </div>

        <div className="chat-panel__footer">
          {readyForReport && !report && (
            <button className="btn--report" onClick={generateReport} disabled={loading}>
              {loading
                ? <><Loader2 size={14} className="spin" /> Generating…</>
                : <><ClipboardList size={15} /> Generate Full Report</>}
            </button>
          )}
          <div className="chat-input-row">
            <textarea
              ref={inputRef}
              className="chat-input"
              placeholder="Type your reply… (Enter to send)"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={2}
              disabled={loading}
            />
            <button className="btn--send" onClick={() => send()} disabled={!input.trim() || loading}>
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Drag handle 2 ── */}
      <div className="drag-handle" onMouseDown={onDragChat} title="Drag to resize">
        <GripVertical size={14} />
      </div>

      {/* ── Report panel ── */}
      <div className="report-panel">
        {report ? (
          <AnalysisResult markdown={report} meta={reportMeta} />
        ) : (
          <div className="report-panel__empty">
            <div className="report-panel__empty-icon"><ClipboardList size={30} /></div>
            <h3>Structured Report</h3>
            <p>
              {readyForReport
                ? 'Alex has enough context. Click Generate Full Report.'
                : `Keep chatting with Alex. Report unlocks at 75% (currently ${confidence}%).`}
            </p>
            <div className="report-panel__empty-steps">
              <span data-n="1">Describe your project idea</span>
              <span data-n="2">Answer Alex's guided questions</span>
              <span data-n="3">Reach 75% confidence</span>
              <span data-n="4">Generate & download the report</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
