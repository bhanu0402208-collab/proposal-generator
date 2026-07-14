import { useState, useEffect } from "react";
import { Send, Plus, FileText, Sparkles, History, X } from "lucide-react";
import "./App.css";

function App() {
  const [sessions, setSessions] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [showGreeting, setShowGreeting] = useState(true);

  async function fetchSessions() {
    setLoadingSessions(true);
    try {
      const res = await fetch("/api/get-sessions");
      if (res.ok) {
        const data = await res.json();
        // API may return an object { sessions: [...] } or an array directly
        setSessions(data.sessions ?? data ?? []);
      }
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    } finally {
      setLoadingSessions(false);
    }
  }

  useEffect(() => {
    fetchSessions();
  }, []);

  return (
    <div className="app-container">
      {showGreeting && (
        <div className="greeting-overlay">
          <div className="greeting-card">
            <div className="greeting-icon">✨</div>
            <h2>Welcome to Atoms</h2>
            <p>Your AI-powered Proposal Generator Agent</p>
            <button
              className="greeting-button"
              onClick={() => setShowGreeting(false)}
            >
              Get Started
            </button>
          </div>
        </div>
      )}

      <div className={`main ${showGreeting ? "blurred" : ""}`}>
        <header className="top-header">
          <div className="header-logo">
            <div className="logo-icon">⚛</div>
            <div className="logo-text">
              © 2026 All rights reserved | ⚛ Atoms Digital Solutions
            </div>
          </div>
          <div className="header-actions">
            <button
              className="history-button"
              onClick={() => setShowSidebar(true)}
              aria-label="Open history"
            >
              <History />
              <span className="visually-hidden">History</span>
            </button>
          </div>
        </header>

        {showSidebar && (
          <aside className="history-sidebar">
            <div className="history-header">
              <h3>History</h3>
              <button
                className="close-history"
                onClick={() => setShowSidebar(false)}
                aria-label="Close history"
              >
                <X />
              </button>
            </div>

            {loadingSessions ? (
              <p>Loading sessions...</p>
            ) : sessions.length === 0 ? (
              <p>No saved sessions yet.</p>
            ) : (
              <ul className="history-list">
                {sessions.map((s, idx) => (
                  <li key={s.id ?? idx} className="history-item">
                    <strong>{s.title ?? s.client_name ?? "Untitled session"}</strong>
                    <div className="history-meta">{s.created_at ?? s.date}</div>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        )}

        <main>
          <h1>Proposal Generator</h1>
          {loadingSessions ? (
            <p>Loading sessions...</p>
          ) : (
            <ul>
              {sessions.map((s, idx) => (
                <li key={s.id ?? idx}>{s.title ?? s.client_name ?? "Untitled session"}</li>
              ))}
            </ul>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;