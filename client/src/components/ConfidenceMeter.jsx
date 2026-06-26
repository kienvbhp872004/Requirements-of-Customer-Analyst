import { CheckCircle2, Circle, CircleDot, Zap } from 'lucide-react';

const PHASES = [
  {
    label: 'Discovery',
    color: '#6366f1',
    topics: [
      { n: 1, name: 'Project Overview',          key: 'project' },
      { n: 2, name: 'Target Users & Roles',      key: 'target' },
      { n: 3, name: 'Core Features & Workflows', key: 'core' },
      { n: 4, name: 'Business Rules',            key: 'business' },
    ],
  },
  {
    label: 'Technical',
    color: '#0ea5e9',
    topics: [
      { n: 5, name: 'Non-functional Requirements', key: 'non' },
      { n: 6, name: 'Integrations',                key: 'integration' },
      { n: 7, name: 'Deployment & Infrastructure', key: 'deployment' },
    ],
  },
  {
    label: 'Compliance & Delivery',
    color: '#f59e0b',
    topics: [
      { n: 8,  name: 'Compliance & Regulations', key: 'compliance' },
      { n: 9,  name: 'Timeline & Budget',        key: 'timeline' },
      { n: 10, name: 'Success Criteria',         key: 'success' },
    ],
  },
];

const ALL_TOPICS = PHASES.flatMap(p => p.topics);

function isCovered(topic, coveredTopics) {
  return coveredTopics.some(c => {
    const cl = c.toLowerCase();
    const kl = topic.key.toLowerCase();
    return cl.includes(kl) || cl.includes(topic.name.toLowerCase().split(' ')[0]);
  });
}

function isActive(topic, currentTopic) {
  if (!currentTopic) return false;
  const ct = currentTopic.toLowerCase();
  return ct.includes(topic.key) || ct.includes(topic.name.toLowerCase().split(' ')[0]);
}

function getColor(pct) {
  if (pct >= 75) return '#34d399';
  if (pct >= 50) return '#fbbf24';
  if (pct >= 25) return '#f97316';
  return '#6366f1';
}

function getLabel(pct) {
  if (pct >= 75) return 'Ready to report';
  if (pct >= 50) return 'Getting there';
  if (pct >= 25) return 'Gathering info';
  return 'Just started';
}

function RingProgress({ pct }) {
  const r = 38;
  const stroke = 7;
  const norm = 2 * Math.PI * r;
  const offset = norm * (1 - pct / 100);
  const color = getColor(pct);

  return (
    <svg width={96} height={96} viewBox="0 0 96 96" className="cm-ring">
      {/* track */}
      <circle cx={48} cy={48} r={r} fill="none" stroke="var(--border2)" strokeWidth={stroke} />
      {/* progress */}
      <circle
        cx={48} cy={48} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={norm}
        strokeDashoffset={offset}
        transform="rotate(-90 48 48)"
        style={{ transition: 'stroke-dashoffset 0.9s ease, stroke 0.4s ease' }}
      />
      <text x={48} y={44} textAnchor="middle" fill={color} fontSize={18} fontWeight={700} fontFamily="inherit">
        {pct}%
      </text>
      <text x={48} y={60} textAnchor="middle" fill="var(--text2)" fontSize={9} fontFamily="inherit" letterSpacing="0.04em" fontWeight={600} textTransform="uppercase">
        COVERED
      </text>
    </svg>
  );
}

export default function ConfidenceMeter({ confidence = 0, coveredTopics = [], currentTopic = '' }) {
  const coveredCount = ALL_TOPICS.filter(t => isCovered(t, coveredTopics)).length;
  const label = getLabel(confidence);
  const mainColor = getColor(confidence);

  return (
    <div className="cm-root">
      {/* ── Header ── */}
      <div className="cm-header">
        <span className="cm-header__label">Progress</span>
        {confidence >= 75 && (
          <span className="cm-ready-badge"><Zap size={10} /> Ready</span>
        )}
      </div>

      {/* ── Ring ── */}
      <div className="cm-ring-wrap">
        <RingProgress pct={confidence} />
        <p className="cm-ring-sub" style={{ color: mainColor }}>{label}</p>
        <p className="cm-ring-count">{coveredCount} of 10 topics</p>
      </div>

      {/* ── Phases ── */}
      <div className="cm-phases">
        {PHASES.map(phase => {
          const phaseCount = phase.topics.filter(t => isCovered(t, coveredTopics)).length;
          return (
            <div key={phase.label} className="cm-phase">
              <div className="cm-phase__header">
                <span className="cm-phase__label" style={{ color: phase.color }}>{phase.label}</span>
                <span className="cm-phase__count" style={{ color: phase.color }}>
                  {phaseCount}/{phase.topics.length}
                </span>
              </div>
              {phase.topics.map(topic => {
                const covered = isCovered(topic, coveredTopics);
                const active  = !covered && isActive(topic, currentTopic);
                return (
                  <div
                    key={topic.n}
                    className={`cm-topic ${covered ? 'cm-topic--done' : ''} ${active ? 'cm-topic--active' : ''}`}
                  >
                    <span className="cm-topic__icon">
                      {covered
                        ? <CheckCircle2 size={13} color="#34d399" />
                        : active
                          ? <CircleDot size={13} color={phase.color} />
                          : <Circle size={13} color="var(--border2)" />}
                    </span>
                    <span className="cm-topic__num">{topic.n}</span>
                    <span className="cm-topic__name">{topic.name}</span>
                    {active && <span className="cm-topic__pulse" style={{ background: phase.color }} />}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
