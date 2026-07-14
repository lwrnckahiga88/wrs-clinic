import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles } from 'lucide-react';
import { apiUrl } from '../config';

// Ported from the untitled__5_ AI Studio build's AIAssistant.tsx — same
// design tokens (paper/ink/teal/rule), re-wired to hit our own Express
// gateway's /api/assistant/ask instead of a relative /api/ask-gemini path
// (this app can be opened via a tunnel domain with no dev proxy, so
// relative paths don't reliably resolve — see src/config.js).
export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: '1', role: 'assistant', text: 'Hello! I am the WRS Clinic AI. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { id: Date.now().toString(), role: 'user', text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(apiUrl('/api/assistant/ask'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMsg.text,
          context: `Current page: ${window.location.pathname}`
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch response');

      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', text: data.text }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', text: `Sorry — ${error.message}` }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-20 right-4 w-14 h-14 rounded-full bg-wrs-teal text-white shadow-lg flex items-center justify-center transition-transform hover:scale-105 z-30 focus:outline-none focus:ring-4 focus:ring-wrs-teal/30 ${
          isOpen ? 'scale-0 opacity-0' : ''
        }`}
      >
        <Sparkles className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-paper shadow-2xl flex flex-col z-50 border-l border-rule sm:rounded-l-2xl sm:inset-y-auto sm:bottom-20 sm:top-20">
          <div className="p-4 bg-ink text-white flex justify-between items-center sm:rounded-tl-2xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-wrs-teal flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">WRS AI Assistant</h3>
                <p className="text-[10px] text-white/60 uppercase tracking-widest font-mono">Gemini Powered</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-paper-dim">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] p-3 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed shadow-sm ${
                    msg.role === 'user' ? 'bg-wrs-teal text-white rounded-br-sm' : 'bg-white border border-rule text-ink rounded-bl-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] p-4 rounded-2xl bg-white border border-rule text-ink rounded-bl-sm flex gap-1 items-center h-10 shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-wrs-teal/40 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-wrs-teal/60 animate-bounce [animation-delay:150ms]" />
                  <div className="w-2 h-2 rounded-full bg-wrs-teal animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-white border-t border-rule sm:rounded-bl-2xl">
            <div className="flex gap-2 bg-paper-dim border border-rule rounded-full p-1 pl-4 focus-within:ring-2 focus-within:ring-wrs-teal focus-within:border-wrs-teal">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask WRS AI..."
                className="flex-1 bg-transparent text-sm focus:outline-none"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 rounded-full bg-wrs-teal text-white flex items-center justify-center disabled:opacity-50 hover:bg-teal-deep transition-colors"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
