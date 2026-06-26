import ReactMarkdown from 'react-markdown';
import { Download } from 'lucide-react';

export default function AnalysisResult({ markdown }) {
  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'requirement-analysis.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="result">
      <div className="result__header">
        <h2>Analysis Report</h2>
        <button className="btn btn--outline" onClick={handleDownload}>
          <Download size={16} />
          Download .md
        </button>
      </div>
      <div className="result__body prose">
        <ReactMarkdown>{markdown}</ReactMarkdown>
      </div>
    </section>
  );
}
