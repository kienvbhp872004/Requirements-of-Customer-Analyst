import ReactMarkdown from 'react-markdown';

const TOPIC_COLORS = {
  'Project Overview':            { bg: 'rgba(99,102,241,.15)',  text: '#818cf8', border: 'rgba(99,102,241,.3)'  },
  'Target Users & Roles':        { bg: 'rgba(16,185,129,.12)',  text: '#34d399', border: 'rgba(16,185,129,.3)'  },
  'Core Features & Workflows':   { bg: 'rgba(245,158,11,.12)',  text: '#fbbf24', border: 'rgba(245,158,11,.3)'  },
  'Business Rules':              { bg: 'rgba(239,68,68,.12)',   text: '#f87171', border: 'rgba(239,68,68,.3)'   },
  'Non-functional Requirements': { bg: 'rgba(168,85,247,.12)',  text: '#c084fc', border: 'rgba(168,85,247,.3)'  },
  'Integrations':                { bg: 'rgba(20,184,166,.12)',  text: '#2dd4bf', border: 'rgba(20,184,166,.3)'  },
  'Deployment & Infrastructure': { bg: 'rgba(249,115,22,.12)',  text: '#fb923c', border: 'rgba(249,115,22,.3)'  },
  'Compliance & Regulations':    { bg: 'rgba(236,72,153,.12)',  text: '#f472b6', border: 'rgba(236,72,153,.3)'  },
  'Timeline & Budget':           { bg: 'rgba(234,179,8,.12)',   text: '#facc15', border: 'rgba(234,179,8,.3)'   },
  'Success Criteria':            { bg: 'rgba(34,211,238,.12)',  text: '#22d3ee', border: 'rgba(34,211,238,.3)'  },
};

function getTopicStyle(topic) {
  for (const [key, style] of Object.entries(TOPIC_COLORS)) {
    if (topic?.toLowerCase().includes(key.toLowerCase().split(' ')[0].toLowerCase())) {
      return { key, ...style };
    }
  }
  return null;
}

// Custom markdown components for rich rendering
const markdownComponents = {
  p({ children }) {
    return <p className="cm-p">{children}</p>;
  },
  strong({ children }) {
    return <strong className="cm-strong">{children}</strong>;
  },
  ul({ children }) {
    return <ul className="cm-ul">{children}</ul>;
  },
  ol({ children }) {
    return <ol className="cm-ol">{children}</ol>;
  },
  li({ children }) {
    return <li className="cm-li">{children}</li>;
  },
  h3({ children }) {
    return <h3 className="cm-h3">{children}</h3>;
  },
};

// Normalize any literal \n sequences the AI might emit as escaped chars
function normalizeText(raw = '') {
  return raw.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
}

export default function ChatMessage({ role, text, topic }) {
  const isUser = role === 'user';
  const topicStyle = !isUser ? getTopicStyle(topic) : null;
  const cleanText = normalizeText(text);

  if (isUser) {
    return (
      <div className="chat-msg chat-msg--user">
        <div className="chat-msg__ava chat-msg__ava--user">You</div>
        <div className="chat-msg__bubble chat-msg__bubble--user">
          <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.65 }}>{text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-msg chat-msg--model">
      <div className="chat-msg__ava chat-msg__ava--model">A</div>
      <div className="chat-msg__bubble chat-msg__bubble--model">
        {topicStyle && (
          <span
            className="chat-topic-badge"
            style={{ background: topicStyle.bg, color: topicStyle.text, borderColor: topicStyle.border }}
          >
            {topicStyle.key}
          </span>
        )}
        <div className="chat-prose">
          <ReactMarkdown components={markdownComponents}>{cleanText}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
