import { useState, useEffect, useRef } from "react";
import { Send, Plus, FileText, Sparkles, History, X, Download, Printer } from "lucide-react";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi! I am ready to help you create a proposal. Is this for a hospital or a doctor?" },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const [proposalHtml, setProposalHtml] = useState(null);
  const [generating, setGenerating] = useState(false);

  const [sessions, setSessions] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const [showIntro, setShowIntro] = useState(true);
  const [sessionId, setSessionId] = useState(() => Math.random().toString(36).substring(2, 15));
  const [clientInfo, setClientInfo] = useState({ name: "Unknown", type: "Unknown" });

  const chatWindowRef = useRef(null);
  const textareaRef = useRef(null);
  const iframeRef = useRef(null);

  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-resize textarea as the user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || sending) return;

    const updatedMessages = [...messages, { role: "user", text }];
    setMessages(updatedMessages);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationHistory: updatedMessages }),
      });

      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }

      const data = await res.json();

      if (data.parsed && data.parsed.complete) {
        setClientInfo({ name: data.parsed.clientName, type: data.parsed.clientType });
        setMessages((prev) => [...prev, { role: "assistant", text: "Great, generating your proposal now..." }]);
        await generateProposal(data.parsed, updatedMessages);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", text: data.reply }]);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Sorry, something went wrong on my end. Please try again in a moment." },
      ]);
    } finally {
      setSending(false);
    }
  }

  async function generateProposal(proposalData, historyAtGeneration) {
    setGenerating(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalData }),
      });

      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }

      const data = await res.json();
      const html = data.html || data.reply;
      setProposalHtml(html);
      saveSession(historyAtGeneration, html, proposalData);
    } catch (err) {
      console.error("Generate error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "I ran into an issue generating the proposal document. Please try again." },
      ]);
    } finally {
      setGenerating(false);
    }
  }

  function saveSession(history, html, proposalData) {
    fetch("/api/save-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: sessionId,
        clientName: proposalData.clientName,
        clientType: proposalData.clientType,
        history,
        proposal: html,
      }),
    }).catch((err) => console.warn("Silent save-session failure:", err));
  }

  async function loadSessions() {
    setLoadingSessions(true);
    try {
      const res = await fetch("/api/get-sessions");
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (err) {
      console.error("Load sessions error:", err);
      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  }

  function openSidebar() {
    setShowSidebar(true);
    loadSessions();
  }

  function loadSession(session) {
    setProposalHtml(session.final_proposal);
    setClientInfo({ name: session.client_name, type: session.client_type });
    setShowSidebar(false);
  }

  function newChat() {
    setMessages([
      { role: "assistant", text: "Hi! I am ready to help you create a proposal. Is this for a hospital or a doctor?" },
    ]);
    setProposalHtml(null);
    setSessionId(Math.random().toString(36).substring(2, 15));
    setClientInfo({ name: "Unknown", type: "Unknown" });
  }

  function handlePrint() {
    if (iframeRef.current) {
      iframeRef.current.contentWindow.print();
    }
  }

  async function handleDownload() {
    try {
      const res = await fetch("/api/docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: proposalHtml, filename: `${clientInfo.name || "Proposal"}.docx` }),
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${clientInfo.name || "Proposal"}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <>
      {showIntro && (
        <div className="intro-overlay">
          <div className="intro-card">
            <div className="intro-icon-wrapper">
              <Sparkles size={48} className="intro-sparkle" />
            </div>
            <h2>Atoms Proposal AI</h2>
            <p>Your intelligent assistant for crafting professional digital marketing proposals instantly.</p>
            <button className="intro-button" onClick={() => setShowIntro(false)}>
              Get Started
            </button>
          </div>
        </div>
      )}

      <div className={`app-container ${showIntro ? "app-blurred" : ""}`}>
        <header className="top-header">
          <div className="header-logo">
            <div className="logo-icon">⚛</div>
            <div className="logo-text">
              <span className="logo-atoms">ATOMS</span>
              <span className="logo-ds">DIGITAL SOLUTIONS</span>
            </div>
          </div>
          <div className="header-title">
            <h1>Proposal Generator</h1>
            <p>Healthcare digital marketing proposals, built in minutes</p>
          </div>
          <div className="header-actions">
            <div className="header-badge">
              <Sparkles size={14} />
              AI Powered
            </div>
            <button className="history-button" onClick={openSidebar}>
              <History size={16} />
              History
            </button>
          </div>
        </header>

        <div className="main-content">
          {showSidebar && (
            <div className="history-sidebar">
              <div className="sidebar-header">
                <span>Past Proposals</span>
                <button className="close-sidebar" onClick={() => setShowSidebar(false)}>
                  <X size={16} />
                </button>
              </div>
              <div className="sidebar-content">
                {loadingSessions && <div className="sidebar-loading">Loading...</div>}
                {!loadingSessions && sessions.length === 0 && (
                  <div className="sidebar-empty">No past proposals yet.</div>
                )}
                {!loadingSessions &&
                  sessions.map((session) => (
                    <div key={session.id} className="session-item" onClick={() => loadSession(session)}>
                      <div className="session-name">{session.client_name || "Untitled"}</div>
                      <div className="session-meta">
                        {session.client_type} • {new Date(session.created_at).toLocaleDateString("en-IN")}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="chat-panel">
            <div className="chat-panel-header">
              <span>Chat</span>
              <button className="new-button" onClick={newChat}>
                <Plus size={14} />
                New
              </button>
            </div>

            <div className="chat-window" ref={chatWindowRef}>
              {messages.map((msg, idx) => (
                <div key={idx} className={msg.role === "assistant" ? "message assistant-message" : "message user-message"}>
                  {msg.role === "assistant" && <span className="msg-label">Assistant</span>}
                  {msg.text}
                </div>
              ))}
              {(sending || generating) && (
                <div className="message assistant-message loading-message">
                  <span className="dot">●</span>
                  <span className="dot">●</span>
                  <span className="dot">●</span>
                </div>
              )}
            </div>

            <div className="chat-input-area">
              <div className="chat-input-bar">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your reply..."
                  rows={1}
                  disabled={sending || generating}
                />
                <button className="send-button" onClick={sendMessage} disabled={sending || generating || !input.trim()}>
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>

          <div className="proposal-panel">
            <div className="proposal-panel-header">
              <span>Proposal Preview</span>
              {proposalHtml && (
                <div className="header-buttons">
                  <button className="print-button" onClick={handlePrint}>
                    <Printer size={14} style={{ marginRight: 6 }} />
                    Print
                  </button>
                  <button className="download-button" onClick={handleDownload}>
                    <Download size={14} style={{ marginRight: 6 }} />
                    Download
                  </button>
                </div>
              )}
            </div>

            {proposalHtml ? (
              <iframe ref={iframeRef} className="proposal-iframe" srcDoc={proposalHtml} title="Proposal Preview" />
            ) : (
              <div className="proposal-empty">
                <div className="empty-icon-wrap">
                  <FileText size={36} className="empty-icon" />
                </div>
                <h2>No proposal yet</h2>
                <p>
                  Chat with the assistant on the left to describe the client's needs. Once all <strong>7 steps</strong> are
                  complete, the proposal will appear here automatically.
                </p>
                <div className="steps">
                  <div className={`step ${messages.length >= 1 ? "active" : ""}`}>
                    <div className="step-num">1</div>
                    <span>Type</span>
                  </div>
                  <span className="arrow">→</span>
                  <div className="step">
                    <div className="step-num">7</div>
                    <span>Ready</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="app-footer">Atoms Digital Solutions © {new Date().getFullYear()}</footer>
      </div>
    </>
  );
}

export default App;