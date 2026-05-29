import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, ArrowUpRight, BrainCircuit } from 'lucide-react';

const QUICK_CHIPS = [
  'How is my portfolio?',
  'Should I buy RELIANCE?',
  'What is the current SENSEX index?',
  'Explain MACD indicator'
];

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 'welcome', sender: 'ai', text: 'Hello! 👋 I am your SENSEX AI assistant. I can help analyze your virtual portfolio, look up technical indicators, or scan live stock tickers.\n\nTry asking me: *"Should I buy RELIANCE?"* or *"How is my portfolio doing?"*' }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Scroll chat window to bottom on new messages
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleSend = async (textToSend) => {
    const text = textToSend || inputVal.trim();
    if (!text) return;

    // Add user message to log
    const userMsgId = Math.random().toString(36).substring(7);
    setMessages((prev) => [...prev, { id: userMsgId, sender: 'user', text }]);
    setInputVal('');
    setIsTyping(true);

    try {
      const response = await fetch('http://localhost:5000/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sensex_token')}`
        },
        body: JSON.stringify({ message: text })
      });
      const result = await response.json();

      setIsTyping(false);
      const aiMsgId = Math.random().toString(36).substring(7);

      if (response.ok && result.response) {
        setMessages((prev) => [...prev, { id: aiMsgId, sender: 'ai', text: result.response }]);
      } else {
        setMessages((prev) => [...prev, { id: aiMsgId, sender: 'ai', text: 'Sorry, I couldn\'t process that message. Ensure you are signed in.' }]);
      }
    } catch (err) {
      setIsTyping(false);
      const aiMsgId = Math.random().toString(36).substring(7);
      setMessages((prev) => [...prev, { id: aiMsgId, sender: 'ai', text: 'Network error. I am currently offline.' }]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 font-sans">
      
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all text-white border border-blue-500/20 group cursor-pointer"
          title="Open AI Trading Assistant"
        >
          <BrainCircuit className="h-6 w-6 text-white group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-emerald-400 rounded-full border-2 border-[#070b13] animate-pulse" />
        </button>
      )}

      {/* Floating Chat Panel Box */}
      {isOpen && (
        <div className="glass-panel w-[350px] sm:w-[380px] h-[500px] rounded-3xl shadow-2xl flex flex-col justify-between overflow-hidden border border-slate-800/80 animate-scale-up">
          
          {/* Header */}
          <div className="bg-slate-900/80 px-4 py-3 border-b border-slate-800/80 flex items-center justify-between backdrop-blur-md">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center justify-center">
                <BrainCircuit className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white leading-none">SENSEX Trading AI</h4>
                <div className="flex items-center gap-1 mt-1">
                  <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-ping" />
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Expert Mode</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-500 hover:text-slate-200 p-1 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages log list */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-[#080d16]/30 text-xs">
            {messages.map((m) => {
              const isAi = m.sender === 'ai';
              return (
                <div key={m.id} className={`flex ${isAi ? 'justify-start' : 'justify-end'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed whitespace-pre-wrap ${
                      isAi
                        ? 'bg-slate-900/60 border border-slate-800/80 text-slate-200 rounded-tl-sm'
                        : 'bg-blue-600 text-white font-medium rounded-tr-sm shadow-md'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-slate-900/60 border border-slate-800/80 text-slate-500 rounded-2xl rounded-tl-sm px-4 py-2.5 flex items-center gap-1 font-semibold italic">
                  <span className="h-1.5 w-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-1.5 w-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-1.5 w-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Chips & Text Input Area */}
          <div className="p-3 border-t border-slate-800/80 bg-slate-900/40 backdrop-blur-md">
            
            {/* Quick chips container */}
            <div className="flex gap-1.5 overflow-x-auto pb-2.5 scrollbar-none">
              {QUICK_CHIPS.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(chip)}
                  className="flex items-center gap-0.5 whitespace-nowrap text-[9px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/25 px-2.5 py-1 rounded-full hover:bg-blue-500/20 active:scale-95 transition-all"
                >
                  <span>{chip}</span>
                  <ArrowUpRight className="h-2.5 w-2.5" />
                </button>
              ))}
            </div>

            {/* Input fields */}
            <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800/80">
              <input
                type="text"
                placeholder="Ask chatbot..."
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyPress={handleKeyPress}
                className="bg-transparent border-none outline-none text-slate-100 font-semibold px-2 py-1 flex-1 text-xs"
              />
              <button
                onClick={() => handleSend()}
                className="h-7 w-7 bg-blue-500 text-slate-950 rounded-lg flex items-center justify-center hover:bg-blue-600 active:scale-95 transition-colors cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
