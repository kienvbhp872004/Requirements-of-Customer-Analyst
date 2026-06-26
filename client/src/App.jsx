import { Sparkles } from 'lucide-react';
import ChatWindow from './components/ChatWindow';
import './App.css';

export default function App() {
  return (
    <div className="app">
      <header className="app__header">
        <div className="app__logo">
          <Sparkles size={18} />
          <span>ReqSense</span>
        </div>
        <span className="app__badge">Beta</span>
        <p className="app__tagline">AI-powered requirement analysis · Powered by Vertex AI</p>
      </header>

      <main className="app__main">
        <ChatWindow />
      </main>
    </div>
  );
}
