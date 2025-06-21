import { useState, useEffect, useRef } from 'react';
import { Send, Calendar, BriefcaseBusiness, Clock, CheckCircle, AlertCircle, Loader2, Bot, User } from 'lucide-react';

const CalendarAssistantClient = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [apiStatus, setApiStatus] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // API base URL - update this to match your server
  const API_BASE_URL = 'http://localhost:8000';

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      setIsConnected(data.status === 'healthy');
    } catch (error) {
      console.error('Failed to check API health:', error);
      setIsConnected(false);
      setApiStatus({ status: 'error', message: 'Cannot connect to server' });
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    
    // Add user message to chat
    const newUserMessage = {
      id: Date.now(),
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
        type: 'assistant',
        content: data.response,
        timestamp: new Date(),
        status: data.status
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message to chat
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: 'Sorry, I encountered an error. Please make sure the server is running and try again.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const quickActions = [
    { text: "What's the current time?", icon: Clock },
    { text: "Check my calendar for today", icon: Calendar },
    { text: "Schedule a meeting tomorrow at 2 PM", icon: Calendar },
    { text: "What date is next Friday?", icon: Calendar }
  ];

  const handleQuickAction = (text) => {
    setInputMessage(text);
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto max-w-4xl h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-lg rounded-b-xl p-6 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <BriefcaseBusiness className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Workspace Copilot</h1>
                <p className="text-gray-600 text-sm">AI Workspace Manager</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-full ${
                isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {isConnected ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">
                  {isConnected ? 'Connected' : 'Disconnected'}
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
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action.text)}
                  className="flex items-center space-x-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left"
                >
                  <action.icon className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-700">{action.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 bg-white rounded-xl shadow-lg mb-4 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  Welcome! I'm your Workspace Copilot.
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Ask me to schedule meetings, check your calendar, or get current time and date information.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-3 max-w-3xl ${
                    message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}>
                    <div className={`p-2 rounded-full ${
                      message.type === 'user' 
                        ? 'bg-blue-600' 
                        : message.type === 'error'
                        ? 'bg-red-500'
                        : 'bg-gray-600'
                    }`}>
                      {message.type === 'user' ? (
                        <User className="w-5 h-5 text-white" />
                      ) : (
                        <Bot className="w-5 h-5 text-white" />
                      )}
                    </div>
                    
                    <div className={`rounded-2xl px-6 py-4 ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : message.type === 'error'
                        ? 'bg-red-50 text-red-800 border border-red-200'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      <div className={`text-xs mt-2 ${
                        message.type === 'user' ? 'text-blue-200' : 'text-gray-500'
                      }`}>
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
                  <div className="p-2 rounded-full bg-gray-600">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-gray-100 rounded-2xl px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                      <span className="text-gray-600">Thinking...</span>
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
                  placeholder="Ask me to schedule meetings, check your calendar, or get time information..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows="1"
                  disabled={!isConnected}
                />
              </div>
              
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading || !isConnected}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-colors"
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
                  ⚠️ Not connected to server. Please make sure the API is running on {API_BASE_URL}
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
            Workspace Copilot • IST Timezone Support
          </p>
        </div>
      </div>
    </div>
  );
};

export default CalendarAssistantClient;