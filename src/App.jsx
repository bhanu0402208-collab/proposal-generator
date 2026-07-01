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
        { role: