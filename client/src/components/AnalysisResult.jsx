import ReactMarkdown from 'react-markdown';
import { Download, Printer, CheckCircle2, AlertTriangle, BarChart2, Calendar, MessageSquare, Layers } from 'lucide-react';

function downloadMd(content, filename) {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Render ✅ [Confirmed] / ⚠️ [Inferred] as styled badges inside text
function BadgeText({ children }) {
  if (typeof children !== 'string') return <>{children}</>;
  const parts = children.split(/(\[Confirmed\]|\[Inferred\])/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part === '[Confirmed]') return <span key={i} className="req-badge req-badge--confirmed">✅ Confirmed</span>;
        if (part === '[Inferred]')  return <span key={i} className="req-badge req-badge--inferred">⚠️ Inferred</span>;
        return part;
      })}
    </>
  );
}

// Custom markdown components
function makeComponents() {
  return {
    h1({ children }) { return <h1 className="rp-h1">{children}</h1>; },
    h2({ children }) { return <h2 className="rp-h2">{children}</h2>; },
    h3({ children }) { return <h3 className="rp-h3">{children}</h3>; },
    p({ children })  { return <p  className="rp-p">{children}</p>;  },
    ul({ children }) { return <ul className="rp-ul">{children}</ul>; },
    ol({ children }) { return <ol className="rp-ol">{children}</ol>; },
    li({ children }) { return <li className="rp-li"><BadgeText>{Array.isArray(children) ? children : [children]}</BadgeText></li>; },
    strong({ children }) { return <strong className="rp-strong">{children}</strong>; },
    blockquote({ children }) { return <blockquote className="rp-blockquote">{children}</blockquote>; },
    code({ children }) { return <code className="rp-code">{children}</code>; },
    hr() { return <hr className="rp-hr" />; },
  };
}

function MetaCard({ meta }) {
  if (!meta) return null;
  const color = meta.confidence >= 75 ? '#34d399' : meta.confidence >= 50 ? '#fbbf24' : '#f97316';
  return (
    <div className="report-meta-card">
      <div className="report-meta-card__title">Requirement Specification Report</div>
      <div className="report-meta-card__grid">
        <div className="report-meta-item">
          <Calendar size={13} />
          <span>{meta.date}</span>
        </div>
        <div className="report-meta-item">
          <MessageSquare size={13} />
          <span>{meta.exchanges} exchanges</span>
        </div>
        <div className="report-meta-item">
          <Layers size={13} />
          <span>{meta.topicsCount} / 10 topics covered</span>
        </div>
        <div className="report-meta-item" style={{ color }}>
          <BarChart2 size={13} />
          <span style={{ fontWeight: 700 }}>{meta.confidence}% overall confidence</span>
        </div>
      </div>
      {meta.coveredTopics?.length > 0 && (
        <div className="report-meta-card__topics">
          {meta.coveredTopics.map(t => (
            <span key={t} className="report-meta-topic"><CheckCircle2 size={10} />{t}</span>
          ))}
        </div>
      )}
      <div className="report-meta-card__legend">
        <span className="req-badge req-badge--confirmed">✅ Confirmed</span> Customer explicitly stated
        <span className="req-badge req-badge--inferred" style={{ marginLeft: 12 }}>⚠️ Inferred</span> Deduced from context
      </div>
    </div>
  );
}

export default function AnalysisResult({ markdown, meta }) {
  const filename = `reqsense-report-${meta?.date?.replace(/\//g, '-') || 'export'}.md`;

  // Prepend meta block to markdown for download
  const fullMd = meta
    ? `# ReqSense Requirement Report\n\n` +
      `| Field | Value |\n|---|---|\n` +
      `| Date | ${meta.date} |\n` +
      `| Exchanges | ${meta.exchanges} |\n` +
      `| Topics covered | ${meta.topicsCount}/10 |\n` +
      `| Confidence | ${meta.confidence}% |\n\n---\n\n${markdown}`
    : markdown;

  return (
    <section className="report-result">
      {/* ── Toolbar ── */}
      <div className="report-result__toolbar">
        <span className="report-result__toolbar-title">📄 Requirement Report</span>
        <div className="report-result__toolbar-actions">
          <button className="btn--tool" onClick={() => downloadMd(fullMd, filename)}>
            <Download size={14} /> Download .md
          </button>
          <button className="btn--tool" onClick={() => window.print()}>
            <Printer size={14} /> Print / PDF
          </button>
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div className="report-result__body" id="print-area">
        <MetaCard meta={meta} />
        <div className="report-prose">
          <ReactMarkdown components={makeComponents()}>{markdown}</ReactMarkdown>
        </div>
      </div>
    </section>
  );
}
