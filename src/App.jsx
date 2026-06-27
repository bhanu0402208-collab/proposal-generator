import { useState } from "react";
import { Send } from "lucide-react";
import "./App.css";

function App() {
  // messages holds the entire conversation history.
  // Each message is an object: { role: "assistant" | "user", text: "..." }
  // We start with one greeting message from the assistant.
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi! Let's put together a proposal. Is this for a hospital or a doctor?",
    },
  ]);

  // inputValue holds whatever the sales person is currently typing.
  const [inputValue, setInputValue] = useState("");

  // isLoading lets us show a "thinking..." indicator while we wait for Gemini to respond.
  const [isLoading, setIsLoading] = useState(false);

  // This function runs when the user clicks Send or presses Enter.
  async function handleSend() {
    if (inputValue.trim() === "") return; // ignore empty messages

    // Add the user's message to the conversation.
    const newMessages = [...messages, { role: "user", text: inputValue }];
    setMessages(newMessages);
    setInputValue("");
    setIsLoading(true);

    try {
      // Call our own serverless function — not Gemini directly.
      // The browser never sees the API key; this just sends the message to our backend.
      const response = await fetch("/api/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: inputValue }),
      });

      const data = await response.json();

      setMessages((current) => [
        ...current,
        { role: "assistant", text: data.reply || "Something went wrong — no reply received." },
      ]);
    } catch (error) {
      console.error("Error calling /api/collect:", error);
      setMessages((current) => [
        ...current,
        { role: "assistant", text: "Sorry, something went wrong connecting to the server." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  // Allow pressing Enter to send, instead of only clicking the button.
  function handleKeyDown(e) {
    if (e.key === "Enter") {
      handleSend();
    }
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Atoms Proposal Generator</h1>
      </header>

      <div className="chat-window">
        {messages.map((message, index) => (
          <div
            key={index}
            className={
              message.role === "user" ? "message user-message" : "message assistant-message"
            }
          >
            {message.text}
          </div>
        ))}
        {isLoading && <div className="message assistant-message thinking">Thinking...</div>}
      </div>

      <div className="chat-input-bar">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your answer..."
          disabled={isLoading}
        />
        <button onClick={handleSend} disabled={isLoading}>
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

export default App;