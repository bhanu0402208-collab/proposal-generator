import { useState, useEffect, useRef } from "react";
import { Send, Plus, FileText, Sparkles, History, X, Download } from "lucide-react";
import "./App.css";

const INITIAL_MESSAGE = {
  role: "assistant",
  text: `Hi! I am the Proposal Generator Agent. I will help you create a professional digital marketing proposal for Atoms Digital Solutions.

You can either fill in the details below all at once, or I'll guide you step by step.

To fill all at once, copy and paste this format:

Client Type: Hospital / Doctor
Client Name: 
City: 
Speciality (if Doctor): 
Package: Standard / Custom
Platforms: All / Instagram / Facebook / YouTube / GMB
Add-Ons: (list from menu or 'none')

Or just type "start" and I'll guide you step by step!`,
};

function App() {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [proposalData, setProposalData] = useState(null);
  const [proposalHtml, setProposalHtml] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [sessionId, setSessionId] = useState(() => Math.random().toString(36).substring(2, 15));
  const [clientInfo, setClientInfo] = useState({ name: "Unknown", type: "Unknown" });

  const chatWindowRef = useRef(null);

  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  async function fetchSessions() {
    setLoadingSessions(true);
    try {
      const response = await fetch("/api/get-sessions");
      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  }

  function handleOpenHistory() {
    setShowSidebar(true);
    fetchSessions();
  }

  function handleLoadSession(session) {
    setProposalHtml(session.final_proposal);
    setProposalData(null);
    setSessionId(session.id);
    setClientInfo({ name: session.client_name, type: session.client_type });
    if (session.conversation_history && session.conversation_history.length > 0) {
      setMessages(session.conversation_history);
    } else {
      setMessages([
        INITIAL_MESSAGE,
        {
          role: "assistant",
          text: `Loaded proposal for ${session.client_name} (${session.client_type}). You can see it on the right. Type any changes to refine it.`,
        },
      ]);
    }
    setShowSidebar(false);
  }

  function handleNew() {
    setMessages([INITIAL_MESSAGE]);
    setInputValue("");
    setProposalData(null);
    setProposalHtml(null);
    setSessionId(Math.random().toString(36).substring(2, 15));
    setClientInfo({ name: "Unknown", type: "Unknown" });
  }

  async function handleSend() {
    if (inputValue.trim() === "") return;

    const userMessage = { role: "user", text: inputValue };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue("");
    setIsLoading(true);

    try {
      if (proposalHtml) {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            refinementInstruction: inputValue,
            currentHtml: proposalHtml,
          }),
        });
        const data = await response.json();
        if (data.html) {
          setProposalHtml(data.html);
          const updatedMessages = [
            ...newMessages,
            { role: "assistant", text: "Done! Proposal updated successfully." },
          ];
          setMessages(updatedMessages);

          fetch("/api/save-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: sessionId,
              clientName: clientInfo.name,
              clientType: clientInfo.type,
              history: updatedMessages,
              proposal: data.html,
            }),
          }).catch((err) => console.warn("Session save failed:", err));
        }
        return;
      }

      const response = await fetch("/api/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationHistory: newMessages }),
      });

      const data = await response.json();

      if (data.parsed?.complete === true) {
        setProposalData(data.parsed);
        setClientInfo({ name: data.parsed.clientName, type: data.parsed.clientType });
        setMessages((current) => [
          ...current,
          {
            role: "assistant",
            text: "All details collected! Click Generate Proposal Preview below to create the document.",
          },
        ]);
      } else {
        setMessages((current) => [
          ...current,
          { role: "assistant", text: data.reply },
        ]);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((current) => [
        ...current,
        { role: "assistant", text: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGenerate() {
    if (!proposalData) return;
    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalData }),
      });

      const data = await response.json();

      if (data.html) {
        setProposalHtml(data.html);

        fetch("/api/save-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: sessionId,
            clientName: proposalData.clientName,
            clientType: proposalData.clientType,
            history: messages,
            proposal: data.html,
          }),
        }).catch((err) => console.warn("Session save failed:", err));

        setMessages((current) => [
          ...current,
          {
            role: "assistant",
            text: "Proposal generated! Preview is on the right. Type any changes you want to make.",
          },
        ]);
      }
    } catch (error) {
      console.error("Generate error:", error);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleDownload() {
    if (!proposalHtml) return;
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
      handleSend();
    }
  }

  function handleTextareaChange(e) {
    setInputValue(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 150) + "px";
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
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
      <div className={`app-container ${showIntro ? 'app-blurred' : ''}`}>
        <header className="top-header">
          <div className="header-logo">
            <div className="logo-icon">⚛</div>
            <div className="logo-text">
              <span className="logo-atoms">atoms</span>
              <span className="logo-ds">Digital Solutions</span>
            </div>
          </div>
          <div className="header-title">
            <h1>Proposal Generator Agent</h1>
            <p>AI-powered proposal assistant for Atoms Digital Solutions</p>
          </div>
          <div className="header-actions">
            <button className="history-button" onClick={handleOpenHistory}>
              <History size={16} /> History
            </button>
            <div className="header-badge">
              <Sparkles size={14} />
              <span>AI Powered</span>
            </div>
          </div>
        </header>

        <div className="main-content">
          {/* History Sidebar */}
          {showSidebar && (
            <div className="history-sidebar">
              <div className="sidebar-header">
                <span>Past Proposals</span>
                <button className="close-sidebar" onClick={() => setShowSidebar(false)}>
                  <X size={16} />
                </button>
              </div>
              <div className="sidebar-content">
                {loadingSessions ? (
                  <div className="sidebar-loading">Loading...</div>
                ) : sessions.length === 0 ? (
                  <div className="sidebar-empty">No past proposals yet.</div>
                ) : (
                  sessions.map((session) => (
                    <div
                      key={session.id}
                      className="session-item"
                      onClick={() => handleLoadSession(session)}
                    >
                      <div className="session-name">{session.client_name}</div>
                      <div className="session-meta">
                        {session.client_type} · {formatDate(session.created_at)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Chat panel */}
          <div className="chat-panel">
            <div className="chat-panel-header">
              <span>Conversation</span>
              <button className="new-button" onClick={handleNew}>
                <Plus size={14} /> New
              </button>
            </div>

            <div className="chat-window" ref={chatWindowRef}>
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={
                    message.role === "user"
                      ? "message user-message"
                      : "message assistant-message"
                  }
                >
                  {message.role === "assistant" && (
                    <span className="msg-label">AI </span>
                  )}
                  {message.text}
                </div>
              ))}
              {isLoading && (
                <div className="message assistant-message loading-message">
                  <span className="msg-label">AI </span>
                  <span className="dot">●</span>
                  <span className="dot">●</span>
                  <span className="dot">●</span>
                </div>
              )}
            </div>

            <div className="chat-input-area">
              <div className="chat-input-bar">
                <textarea
                  value={inputValue}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    proposalHtml
                      ? "Type changes to refine the proposal..."
                      : "Type your answer here... (Enter to send)"
                  }
                  disabled={isLoading}
                  rows={1}
                />
                <button
                  className="send-button"
                  onClick={handleSend}
                  disabled={isLoading || inputValue.trim() === ""}
                >
                  <Send size={16} />
                </button>
              </div>
              <button
                className="generate-button"
                onClick={handleGenerate}
                disabled={!proposalData || isGenerating}
              >
                {isGenerating ? (
                  <><span className="spinner" /> Generating...</>
                ) : (
                  <><Sparkles size={16} /> Generate Proposal Preview</>
                )}
              </button>
            </div>
          </div>

          {/* Proposal panel */}
          <div className="proposal-panel">
            <div className="proposal-panel-header">
              <span>Proposal Preview</span>
              {proposalHtml && (
                <div className="header-buttons">
                  <button
                    className="print-button"
                    onClick={() => {
                      const win = window.open("", "_blank");
                      win.document.write(proposalHtml);
                      win.document.close();
                      win.print();
                    }}
                  >
                    🖨 Print / Save PDF
                  </button>
                  <button className="download-button" onClick={handleDownload}>
                    <Download size={14} style={{ marginRight: 6 }} />
                    Download DOCX
                  </button>
                </div>
              )}
            </div>

            {proposalHtml ? (
              <iframe
                className="proposal-iframe"
                srcDoc={proposalHtml}
                title="Proposal Preview"
              />
            ) : (
              <div className="proposal-empty">
                <div className="empty-icon-wrap">
                  <FileText size={40} />
                </div>
                <h2>Proposal Preview</h2>
                <p>
                  Chat with the AI on the left, then click{" "}
                  <strong>"Generate Proposal Preview"</strong> to create your document.
                </p>
                <div className="steps">
                  <div className="step active">
                    <span className="step-num">1</span>
                    <span>Chat</span>
                  </div>
                  <span className="arrow">→</span>
                  <div className="step">
                    <span className="step-num">2</span>
                    <span>Confirm</span>
                  </div>
                  <span className="arrow">→</span>
                  <div className="step">
                    <span className="step-num">3</span>
                    <span>Generate</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="app-footer">
          © 2026 All rights reserved | ⚛ Atoms Digital Solutions
        </footer>
      </div>
    </>
  );
}

export default App;