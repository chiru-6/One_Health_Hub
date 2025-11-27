import React, { useState, useRef, useEffect } from "react";
import { Send, MessageCircle, Loader } from "lucide-react";

function PredictMed() {
  const [input, setInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when chat history updates
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = {
      type: "user",
      text: input,
      timestamp: new Date().toISOString(),
    };

    setChatHistory([...chatHistory, userMessage]);
    setInput("");
    setLoading(true);

    try {
      console.log("Sending request to backend...");
      const response = await fetch(
        "http://localhost:5010/api/healthcare/answer",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            question: input,
          }),
        }
      );

      console.log("Response status:", response.status);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(
            "API endpoint not found. Please check if the server is running and the endpoint is correct."
          );
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Received data:", data);

      const botMessage = {
        type: "bot",
        text: data.answer,
        timestamp: new Date().toISOString(),
      };

      setChatHistory((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error details:", error);
      const errorMessage = {
        type: "bot",
        text: `Error: ${
          error.message ||
          "Failed to connect to the server. Please ensure the backend is running on port 5010."
        }`,
        timestamp: new Date().toISOString(),
      };
      setChatHistory((prev) => [...prev, errorMessage]);

      console.log("Full error object:", error);
      console.log("Was the server running on port 5010?");
    }

    setLoading(false);
  };

  // Format timestamp to readable time
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-screen max-h-screen bg-gray-50 text-gray-800">
      {/* Header */}
      <div className="bg-white p-4 shadow-md">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <MessageCircle className="mr-2 text-blue-600" />
            Medical Q&A Assistant
          </h2>
          <p className="text-blue-600 mt-2">
            Ask medical questions and get expert explanations
          </p>
        </div>
      </div>

      {/* Chat Container - using flex-1 for proper height calculation without scrollbar */}
      <div className="flex-1 overflow-hidden p-4 max-w-4xl mx-auto w-full">
        <div className="h-full overflow-y-auto" style={{ paddingRight: "5px" }}>
          {chatHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <MessageCircle size={48} className="mb-4 text-blue-500 opacity-70" />
              <p className="text-lg">Ask a medical question to get started</p>
              <p className="text-sm mt-2">Example: "What is hypertension and how is it treated?"</p>
            </div>
          ) : (
            <div className="space-y-4">
              {chatHistory.map((msg, index) => (
                <div 
                  key={index} 
                  className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div 
                    className={`p-3 rounded-lg max-w-[80%] ${
                      msg.type === "user" 
                        ? "bg-blue-600 text-white" 
                        : msg.text.startsWith("Error:") 
                          ? "bg-red-600 text-white" 
                          : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                    <div className={`text-xs mt-1 ${msg.type === "user" ? "text-blue-200" : "text-gray-500"}`}>
                      {formatTime(msg.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Form */}
      <div className="p-4 bg-white border-t border-gray-200">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your medical question..."
            className="flex-1 p-3 rounded-l-lg bg-gray-100 text-gray-800 placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-r-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <Loader className="animate-spin" size={20} />
            ) : (
              <Send size={20} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default PredictMed;