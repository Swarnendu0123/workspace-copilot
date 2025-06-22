import { useState, useEffect, useRef } from "react";
import {
  Send,
  Calendar,
  BriefcaseBusiness,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Bot,
  User,
  Mail,
  Inbox,
  Star,
} from "lucide-react";
import MarkdownRenderer from "./components/Markdown";

const WorkspaceCopilotClient = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [apiStatus, setApiStatus] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // API base URL - update this to match your server
  const API_BASE_URL = "http://localhost:8000";

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check API health on component mount
  useEffect(() => {
    checkApiHealth();
  }, []);

  const checkApiHealth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();
      setApiStatus(data);
      setIsConnected(data.status === "healthy");
    } catch (error) {
      console.error("Failed to check API health:", error);
      setIsConnected(false);
      setApiStatus({ status: "error", message: "Cannot connect to server" });
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");

    // Add user message to chat
    const newUserMessage = {
      id: Date.now(),
      type: "user",
      content: userMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Add assistant response to chat
      const assistantMessage = {
        id: Date.now() + 1,
        type: "assistant",
        content: data.response,
        timestamp: new Date(),
        status: data.status,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);

      // Add error message to chat
      const errorMessage = {
        id: Date.now() + 1,
        type: "error",
        content:
          "Sorry, I encountered an error. Please make sure the server is running and try again.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const quickActions = [
    // Calendar Actions
    { text: "What's the current time?", icon: Clock, category: "time" },
    {
      text: "Check my calendar for today",
      icon: Calendar,
      category: "calendar",
    },
    {
      text: "Schedule a meeting tomorrow at 2 PM",
      icon: Calendar,
      category: "calendar",
    },
    { text: "What date is next Friday?", icon: Calendar, category: "calendar" },

    // Email Actions
    { text: "Show me my latest emails", icon: Mail, category: "email" },
    { text: "Any urgent emails?", icon: Star, category: "email" },
    { text: "Summarize my last 10 emails", icon: Inbox, category: "email" },
    { text: "Check for important emails today", icon: Mail, category: "email" },
  ];

  const handleQuickAction = (text) => {
    setInputMessage(text);
    inputRef.current?.focus();
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case "calendar":
        return "bg-blue-50 hover:bg-blue-100 text-blue-700";
      case "email":
        return "bg-green-50 hover:bg-green-100 text-green-700";
      case "time":
        return "bg-purple-50 hover:bg-purple-100 text-purple-700";
      default:
        return "bg-gray-50 hover:bg-gray-100 text-gray-700";
    }
  };

  const getIconColor = (category) => {
    switch (category) {
      case "calendar":
        return "text-blue-600";
      case "email":
        return "text-green-600";
      case "time":
        return "text-purple-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto max-w-5xl h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-lg rounded-b-xl p-6 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <BriefcaseBusiness className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Workspace Copilot
                </h1>
                <p className="text-gray-600 text-sm">
                  AI Calendar & Email Manager
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div
                className={`flex items-center space-x-2 px-3 py-2 rounded-full ${
                  isConnected
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {isConnected ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
              </div>

              <button
                onClick={clearChat}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium text-gray-700 transition-colors"
              >
                Clear Chat
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {messages.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Quick Actions
            </h3>

            {/* Category Headers */}
            <div className="space-y-6">
              {/* Calendar Actions */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <h4 className="text-md font-medium text-gray-700">
                    Calendar & Time
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {quickActions
                    .filter(
                      (action) =>
                        action.category === "calendar" ||
                        action.category === "time"
                    )
                    .map((action, index) => (
                      <button
                        key={`calendar-${index}`}
                        onClick={() => handleQuickAction(action.text)}
                        className={`flex items-center space-x-3 p-3 rounded-lg transition-colors text-left ${getCategoryColor(
                          action.category
                        )}`}
                      >
                        <action.icon
                          className={`w-5 h-5 ${getIconColor(action.category)}`}
                        />
                        <span>{action.text}</span>
                      </button>
                    ))}
                </div>
              </div>

              {/* Email Actions */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Mail className="w-5 h-5 text-green-600" />
                  <h4 className="text-md font-medium text-gray-700">
                    Email Management
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {quickActions
                    .filter((action) => action.category === "email")
                    .map((action, index) => (
                      <button
                        key={`email-${index}`}
                        onClick={() => handleQuickAction(action.text)}
                        className={`flex items-center space-x-3 p-3 rounded-lg transition-colors text-left ${getCategoryColor(
                          action.category
                        )}`}
                      >
                        <action.icon
                          className={`w-5 h-5 ${getIconColor(action.category)}`}
                        />
                        <span>{action.text}</span>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 bg-white rounded-xl shadow-lg mb-4 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <Bot className="w-10 h-10 text-white" />
                </div>
                <p className="text-gray-600 text-lg font-medium mb-2">
                  Welcome to your Workspace Copilot!
                </p>
                <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
                  I can help you manage your calendar, schedule meetings, check
                  emails, and handle your daily workspace tasks. Try one of the
                  quick actions above or ask me anything!
                </p>

                <div className="flex justify-center space-x-6 mt-6">
                  <div className="flex items-center space-x-2 text-blue-600">
                    <Calendar className="w-5 h-5" />
                    <span className="text-sm font-medium">Calendar</span>
                  </div>
                  <div className="flex items-center space-x-2 text-green-600">
                    <Mail className="w-5 h-5" />
                    <span className="text-sm font-medium">Email</span>
                  </div>
                  <div className="flex items-center space-x-2 text-purple-600">
                    <Clock className="w-5 h-5" />
                    <span className="text-sm font-medium">Time</span>
                  </div>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.type === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`flex items-start space-x-3 max-w-3xl ${
                      message.type === "user"
                        ? "flex-row-reverse space-x-reverse"
                        : ""
                    }`}
                  >
                    <div
                      className={`p-2 rounded-full ${
                        message.type === "user"
                          ? "bg-gradient-to-r from-blue-600 to-purple-600"
                          : message.type === "error"
                          ? "bg-red-500"
                          : "bg-gradient-to-r from-gray-600 to-gray-700"
                      }`}
                    >
                      {message.type === "user" ? (
                        <User className="w-5 h-5 text-white" />
                      ) : (
                        <Bot className="w-5 h-5 text-white" />
                      )}
                    </div>

                    <div
                      className={`rounded-2xl px-6 py-4 ${
                        message.type === "user"
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                          : message.type === "error"
                          ? "bg-red-50 text-red-800 border border-red-200"
                          : "bg-gray-50 text-gray-800 border border-gray-200"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">
                        <MarkdownRenderer
                          markdown={message.content}
                          className=""
                        />
                      </div>
                      <div
                        className={`text-xs mt-2 ${
                          message.type === "user"
                            ? "text-blue-100"
                            : "text-gray-500"
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-full bg-gradient-to-r from-gray-600 to-gray-700">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                      <span className="text-gray-600">
                        Processing your request...
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me to schedule meetings, check emails, get time information, or manage your workspace..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows="1"
                  disabled={!isConnected}
                />
              </div>

              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading || !isConnected}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-all duration-200"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>

            {!isConnected && (
              <div className="mt-3 text-center">
                <span className="text-red-600 text-sm">
                  ⚠️ Not connected to server. Please make sure the API is
                  running on {API_BASE_URL}
                </span>
                <button
                  onClick={checkApiHealth}
                  className="ml-2 text-blue-600 hover:text-blue-700 text-sm underline"
                >
                  Retry Connection
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-gray-500 text-sm">
            Workspace Copilot • Calendar & Email Management • IST Timezone
            Support
          </p>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceCopilotClient;
