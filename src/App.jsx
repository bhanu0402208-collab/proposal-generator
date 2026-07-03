import { useState } from "react";
import { Send } from "lucide-react";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi! Let's put together a proposal. Is this for a hospital or a doctor?",
    },
  ]);

  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // proposalData holds the final JSON once all 7 steps are complete
  const [proposalData, setProposalData] = useState(null);

  async function handleSend() {
    if (inputValue.trim() === "") return;

    const userMessage = { role: "user", text: inputValue };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Send the FULL conversation history, not just the latest message.
        // This is how Gemini knows which step of the 7 steps it's on.
        body: JSON.stringify({ conversationHistory: newMessages }),
      });

      const data = await response.json();

      // Add Gemini's reply to the conversation
      setMessages((current) => [
        ...current,
import React, { useState, useEffect, useRef } from "react";
      import { Send, FileText, Download, Edit3, X, Loader2 } from "lucide-react";
      import "./App.css";
      export default function App() {
        const [messages, setMessages] = useState([
          {
            role: "assistant",
            text: "Hi! I'm your Atoms Proposal Assistant. Is this for a hospital or a doctor?",
          },
        ]);
        const [inputValue, setInputValue] = useState("");
        const [isLoading, setIsLoading] = useState(false);
        const [proposalData, setProposalData] = useState(null);
        const [proposalHtml, setProposalHtml] = useState(null);
        const [isGenerating, setIsGenerating] = useState(false);

        const messagesEndRef = useRef(null);
        const scrollToBottom = () => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        };
        useEffect(() => {
          scrollToBottom();
        }, [messages, isLoading]);
        async function handleSend() {
          if (inputValue.trim() === "") return;
          const userText = inputValue;
          const newMessages = [...messages, { role: "user", text: userText }];
          setMessages(newMessages);
          setInputValue("");
          setIsLoading(true);
          try {
            // If we already have a generated proposal, this is a REFINEMENT message
            if (proposalHtml) {
              const response = await fetch("/api/refine", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ instruction: userText, currentHtml: proposalHtml }),
              });

              const data = await response.json();

              if (data.html) {
                setProposalHtml(data.html);
                setMessages((current) => [
                  ...current,
                  { role: "assistant", text: "I have updated the proposal as requested. Check the preview." }
                ]);
              } else {
                setMessages((current) => [
                  ...current,
                  { role: "assistant", text: "Sorry, I couldn't understand how to refine that." }
                ]);
              }
            } else {
              // Normal Collection Phase
              const response = await fetch("/api/collect", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ conversationHistory: newMessages }),
              });
              const data = await response.json();
              if (data.reply && data.reply.trim() !== "") {
                setMessages((current) => [
                  ...current,
                  { role: "assistant", text: data.reply }
                ]);
              }
              if (data.parsed && data.parsed.complete) {
                setProposalData(data.parsed);
              }
            }
          } catch (error) {
            console.error("Error:", error);
            setMessages((current) => [
              ...current,
              { role: "assistant", text: "Something went wrong. Please try again." }
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
              body: JSON.stringify({ data: proposalData }),
            });

            const resData = await response.json();
            if (resData.html) {
              setProposalHtml(resData.html);
              setMessages((current) => [
                ...current,
                { role: "assistant", text: "I've generated the proposal! You can review it on the right. If you want any changes (like 'remove SEO section' or 'change price to ₹65,000'), just tell me here." }
              ]);

              // Also save session silently
              fetch("/api/save-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  clientName: proposalData.clientName,
                  clientType: proposalData.clientType,
                  history: messages,
                  proposal: resData.html
                })
              }).catch(e => console.log("Silent save failed:", e));
            }
          } catch (err) {
            console.error(err);
            alert("Failed to generate proposal.");
          } finally {
            setIsGenerating(false);
          }
        }
        async function downloadDoc() {
          try {
            const response = await fetch("/api/export-docs", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ html: proposalHtml, filename: `${proposalData?.clientName || 'Proposal'}.docx` })
            });

            if (response.ok) {
              const blob = await response.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${proposalData?.clientName || 'Proposal'} - Atoms Digital.docx`;
              document.body.appendChild(a);
              a.click();
              window.URL.revokeObjectURL(url);
              a.remove();
            } else {
              alert("Failed to create document.");
            }
          } catch (e) {
            console.error(e);
            alert("Error downloading document.");
          }
        }
        return (
          <div className="app-container">
            <header className="header">
              <h1>Atoms Proposal Agent</h1>
            </header>
            <main className="main-content">
              {/* Chat Section */}
              <section className={`chat-section ${proposalHtml ? 'split' : ''}`}>
                <div className="messages-container">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`message ${msg.role}`}>
                      <div className="message-bubble">{msg.text}</div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="message assistant">
                      <div className="message-bubble loader">
                        <span></span><span></span><span></span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                {/* Generate Overlay before proposal is generated */}
                {proposalData && !proposalHtml && !isLoading && (
                  <div className="generate-overlay">
                    <button className="btn-generate" onClick={handleGenerate} disabled={isGenerating}>
                      {isGenerating ? <Loader2 className="spinner" /> : <FileText />}
                      {isGenerating ? "Generating..." : "Generate Proposal"}
                    </button>
                  </div>
                )}
                <div className="input-area">
                  <div className="input-wrapper">
                    <input
                      type="text"
                      className="chat-input"
                      placeholder={proposalHtml ? "Type changes (e.g. 'remove SEO')..." : "Type your answer..."}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSend();
                      }}
                      disabled={isGenerating || isLoading}
                    />
                    <button
                      className="send-button"
                      onClick={handleSend}
                      disabled={inputValue.trim() === "" || isGenerating || isLoading}
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </section>
              {/* Proposal Preview Section */}
              {proposalHtml && (
                <section className="proposal-preview-section">
                  <div className="preview-header">
                    <h2>Proposal Preview</h2>
                    <div className="action-buttons">
                      <button className="btn btn-primary" onClick={downloadDoc}>
                        <Download size={16} />
                        Download Doc
                      </button>
                    </div>
                  </div>
                  <div className="proposal-content">
                    <div className="document-page">
                      <div className="document-content" dangerouslySetInnerHTML={{ __html: proposalHtml }} />
                    </div>
                  </div>
                </section>
              )}
            </main>
          </div>
        );
      }
      { role: