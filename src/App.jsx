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
  const [proposalData, setProposalData] = useState(null);
  const [proposalHtml, setProposalHtml] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleSend() {
    if (inputValue.trim() === "") return;

    const userMessage = { role: "user", text: inputValue };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue("");
    setIsLoading(true);

    try {
      // If proposal already generated, treat this as a refinement request
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

      // Otherwise continue the collection conversation
      const response = await fetch("/api/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationHistory: newMessages }),
      });

      const data = await response.json();

      // If Gemini returned completed JSON, show Generate button instead of raw JSON
      if (data.parsed?.complete === true) {
        setProposalData(data.parsed);
        setMessages((current) => [
          ...current,
          {
            role: "assistant",
            text: "All details collected! Click Generate Proposal to create the document.",
          },
        ]);
      } else {
        // Normal conversation reply
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
            text: "Proposal generated! Preview is on the right. Type any changes you want to make.",
          },
        ]);
      } else {
        setMessages((current) => [
          ...current,
          { role: "assistant", text: "Something went wrong generating the proposal. Please try again." },
        ]);
      }
    } catch (error) {
      console.error("Generate error:", error);
      setMessages((current) => [
        ...current,
        { role: "assistant", text: "Failed to generate proposal. Please try again." },
      ]);
    } finally {
      setIsGenerating(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleSend();
  }

  return (
    <div className="app-container">
      {/* Left side - chat */}
      <div className="chat-panel">
        <header className="app-header">
          <h1>Atoms Proposal Generator</h1>
        </header>

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
              {message.text}
            </div>
          ))}

          {isLoading && (
            <div className="message assistant-message thinking">
              Thinking...
            </div>
          )}

          {proposalData && !proposalHtml && (
            <div className="generate-button-container">
              <button
                className="generate-button"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? "Generating..." : "Generate Proposal"}
              </button>
            </div>
          )}
        </div>

        <div className="chat-input-bar">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              proposalHtml
                ? "Type changes to refine..."
                : "Type your answer..."
            }
            disabled={isLoading}
          />
          <button onClick={handleSend} disabled={isLoading}>
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* Right side - proposal preview */}
      {proposalHtml && (
        <div className="proposal-panel">
          <div className="proposal-toolbar">
            <span>Proposal Preview</span>
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
          </div>
          <iframe
            className="proposal-iframe"
            srcDoc={proposalHtml}
            title="Proposal Preview"
          />
        </div>
      )}
    </div>
  );
}

export default App;