import { useState } from "react";
import { Send, Plus, FileText } from "lucide-react";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi! I am the Proposal Generator Agent. I will help you collect client details and generate a proposal.\n\nIs this proposal for a hospital or a doctor?",
    },
  ]);

  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [proposalData, setProposalData] = useState(null);
  const [proposalHtml, setProposalHtml] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  function handleNew() {
    setMessages([
      {
        role: "assistant",
        text: "Hi! I am the Proposal Generator Agent. I will help you collect client details and generate a proposal.\n\nIs this proposal for a hospital or a doctor?",
      },
    ]);
    setInputValue("");
    setProposalData(null);
    setProposalHtml(null);
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
          setMessages((current) => [
            ...current,
            { role: "assistant", text: "Done! Proposal updated." },
          ]);
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
        setMessages((current) => [
          ...current,
          {
            role: "assistant",
            text: "Proposal generated! You can see the preview on the right. Type any changes you want to make.",
          },
        ]);
      }
    } catch (error) {
      console.error("Generate error:", error);
    } finally {
      setIsGenerating(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleSend();
  }

  return (
    <div className="app-container">

      {/* Top header */}
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
      </header>

      <div className="main-content">

        {/* Left panel - chat */}
        <div className="chat-panel">
          <div className="chat-panel-header">
            <span>Conversation</span>
            <button className="new-button" onClick={handleNew}>
              <Plus size={14} /> New
            </button>
          </div>

          <div className="chat-window">
            {messages.map((message, index) => (
              <div key={index} className={message.role === "user" ? "message user-message" : "message assistant-message"}>
                {message.role === "assistant" && <span className="msg-label">AI: </span>}
                {message.text}
              </div>
            ))}
            {isLoading && (
              <div className="message assistant-message">
                <span className="msg-label">AI: </span>Thinking...
              </div>
            )}
          </div>

          <div className="chat-input-area">
            <div className="chat-input-bar">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={proposalHtml ? "Type changes to refine..." : "Enter client details here..."}
                disabled={isLoading}
              />
              <button className="send-button" onClick={handleSend} disabled={isLoading}>
                Send
              </button>
            </div>
            <button
              className="generate-button"
              onClick={handleGenerate}
              disabled={!proposalData || isGenerating}
            >
              {isGenerating ? "Generating..." : "Generate Proposal Preview"}
            </button>
          </div>
        </div>

        {/* Right panel - proposal preview */}
        <div className="proposal-panel">
          <div className="proposal-panel-header">
            <span>Proposal Preview</span>
            {proposalHtml && (
              <button
                className="print-button"
                onClick={() => {
                  const win = window.open("", "_blank");
                  win.document.write(proposalHtml);
                  win.document.close();
                  win.print();
                }}
              >
                Print / Save PDF
              </button>
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
              <FileText size={48} className="empty-icon" />
              <h2>Proposal Preview</h2>
              <p>Chat with the AI assistant on the left to provide client details, then click <strong>"Generate Proposal Preview"</strong> to create your proposal.</p>
              <div className="steps">
                <span className="step active">1. Chat</span>
                <span className="arrow">→</span>
                <span className="step">2. Confirm</span>
                <span className="arrow">→</span>
                <span className="step">3. Generate</span>
              </div>
            </div>
          )}
        </div>

      </div>

      <footer className="app-footer">
        © 2026 All rights reserved | ⚛ Atoms Digital Solutions
      </footer>
    </div>
  );
}

export default App;