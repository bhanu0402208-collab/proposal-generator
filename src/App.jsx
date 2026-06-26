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

  // This function runs when the user clicks Send or presses Enter.
  function handleSend() {
    if (inputValue.trim() === "") return; // ignore empty messages

    // Add the user's message to the conversation.
    const newMessages = [...messages, { role: "user", text: inputValue }];
    setMessages(newMessages);
    setInputValue("");

    // For now, we don't call any AI yet — just a placeholder reply,
    // so we can confirm the chat UI works end-to-end before adding intelligence.
    setTimeout(() => {
      setMessages((current) => [
        ...current,
        { role: "assistant", text: "(AI response will go here)" },
      ]);
    }, 500);
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
      </div>

      <div className="chat-input-bar">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your answer..."
        />
        <button onClick={handleSend}>
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

export default App;
