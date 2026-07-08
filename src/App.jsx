import { useState } from "react";
import { Send, Plus, FileText, Sparkles } from "lucide-react";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: `Hi! I am the Proposal Generator Agent. I will help you create a professional digital marketing proposal for Atoms Digital Solutions.

You can either fill in the details below all at once, or I'll guide you step by step.

To fill all at once, copy and paste this format:

Client Type: Hospital / Doctor
Client Name: 
City: 
Speciality (if Doctor): 
Package: Standard / Custom
Reels (if custom): 
Posters (if custom): 
Shoots (if custom): 
Base Price (if custom): 
Platforms: All / Instagram / Facebook / YouTube / GMB
Add-Ons: (list from menu or 'none')
Total Price Override: (optional)

Or just type "start" and I'll guide you step by step!`,
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
            { role: "assistant", text: "Done! Proposal updated successfully." },
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

        fetch("/api/save-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
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

  return (
    <div className="app-container">
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
        <div className="header-badge">
          <Sparkles size={14} />
          <span>AI Powered</span>
        </div>
      </header>

      <div className="main-content">
        <div className="chat-panel">
          <div className="chat-panel-header">
            <span>Conversation</span>
            <button className="new-button" onClick={handleNew}>
              <Plus size={14} /> New
            </button>
          </div>

          <div className="chat-window">
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
                <>
                  <span className="spinner" /> Generating...
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Generate Proposal Preview
                </>
              )}
            </button>
          </div>
        </div>

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
                🖨 Print / Save PDF
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
  );
}

export default App;