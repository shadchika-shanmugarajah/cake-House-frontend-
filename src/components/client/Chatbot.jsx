import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, X, Minimize2, Maximize2 } from 'lucide-react';
import './Chatbot.css';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hello! I'm your cake assistant. How can I help you today?", sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { text: input, sender: 'user' }]);
    
    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "I recommend our Chocolate Truffle Cake for birthdays!",
        "Our Red Velvet Cake is a customer favorite for anniversaries.",
        "For weddings, we have customizable tier cakes starting at $200.",
        "We have vegan and gluten-free options available.",
        "Check out our seasonal specials in the 'Trending' section!"
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      setMessages(prev => [...prev, { text: randomResponse, sender: 'bot' }]);
    }, 1000);

    setInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chatbot Toggle Button */}
      {!isOpen && (
        <button className="chatbot-toggle" onClick={() => setIsOpen(true)}>
          <Bot size={24} />
          <span className="pulse-dot"></span>
        </button>
      )}

      {/* Chatbot Window */}
      {isOpen && (
        <div className={`chatbot-container ${isMinimized ? 'minimized' : ''}`}>
          <div className="chatbot-header">
            <div className="chatbot-title">
              <Bot size={20} />
              <span>Cake Assistant</span>
              <span className="status-dot"></span>
            </div>
            <div className="chatbot-controls">
              <button onClick={() => setIsMinimized(!isMinimized)} className="control-btn">
                {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
              </button>
              <button onClick={() => setIsOpen(false)} className="control-btn">
                <X size={18} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              <div className="chatbot-messages">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`message ${msg.sender === 'user' ? 'user-message' : 'bot-message'}`}
                  >
                    <div className="message-content">
                      {msg.text}
                    </div>
                    <div className="message-time">
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="chatbot-input">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about cakes, recommendations, or pricing..."
                />
                <button onClick={handleSend} className="send-btn">
                  <Send size={20} />
                </button>
              </div>

              <div className="chatbot-suggestions">
                <button onClick={() => setInput("Birthday cake recommendations")} className="suggestion-btn">
                  🎂 Birthday Cakes
                </button>
                <button onClick={() => setInput("Vegan options")} className="suggestion-btn">
                  🌱 Vegan Options
                </button>
                <button onClick={() => setInput("Pricing for wedding cakes")} className="suggestion-btn">
                  💍 Wedding Cakes
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default Chatbot;