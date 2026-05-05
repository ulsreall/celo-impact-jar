import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createAgent, type AgentMessage, type AgentContext } from './agent';
import type { Campaign } from './main';

// Markdown-lite renderer (bold, list, code)
function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    // Bold
    let processed: React.ReactNode = line.replace(/\*\*(.+?)\*\*/g, (_, m) => `\x01${m}\x02`);
    const parts: React.ReactNode[] = [];
    let remaining = String(processed);
    let idx = 0;
    while (remaining.includes('\x01')) {
      const start = remaining.indexOf('\x01');
      if (start > 0) parts.push(remaining.slice(0, start));
      const end = remaining.indexOf('\x02', start);
      parts.push(<strong key={`${i}-${idx}`}>{remaining.slice(start + 1, end)}</strong>);
      remaining = remaining.slice(end + 1);
      idx++;
    }
    if (remaining) parts.push(remaining);

    // Bullet
    const trimmed = line.trimStart();
    if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('↳ ')) {
      return <div key={i} className="agent-bullet">{parts.length ? parts : line}</div>;
    }
    // Numbered
    if (/^\d+\./.test(trimmed)) {
      return <div key={i} className="agent-bullet">{parts.length ? parts : line}</div>;
    }
    // Empty line = spacing
    if (!line.trim()) return <div key={i} style={{ height: 6 }} />;
    return <span key={i}>{parts.length ? parts : line}<br /></span>;
  });
}

type Props = {
  campaigns: Campaign[];
  walletConnected: boolean;
  isMiniPay: boolean;
  selectedCampaignId: bigint;
  onSelectCampaign: (id: bigint) => void;
};

export default function AgentChat({ campaigns, walletConnected, isMiniPay, selectedCampaignId, onSelectCampaign }: Props) {
  const agentRef = useRef(createAgent());
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [unread, setUnread] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync context
  useEffect(() => {
    agentRef.current.updateContext({ campaigns, walletConnected, isMiniPay, selectedCampaignId });
  }, [campaigns, walletConnected, isMiniPay, selectedCampaignId]);

  // Welcome message on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcome = agentRef.current.getWelcome();
      setMessages([welcome]);
    }
  }, [isOpen]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;
    const userMsg: AgentMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text.trim(),
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(() => {
      const reply = agentRef.current.processMessage(text);
      setMessages((prev) => [...prev, reply]);
      setIsTyping(false);
      if (!isOpen) setUnread((u) => u + 1);
    }, 400 + Math.random() * 600);
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestion = (s: string) => sendMessage(s);

  return (
    <>
      {/* Floating button */}
      <button className="agent-fab" onClick={() => { setIsOpen(!isOpen); setUnread(0); }}>
        {isOpen ? '✕' : '🤖'}
        {!isOpen && unread > 0 && <span className="agent-badge">{unread}</span>}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="agent-panel">
          {/* Header */}
          <div className="agent-header">
            <div className="agent-header-left">
              <span className="agent-avatar">🤖</span>
              <div>
                <div className="agent-name">KindJar AI Agent</div>
                <div className="agent-status">
                  <span className="dot-live" /> {walletConnected ? 'Wallet connected' : 'Ready to help'}
                </div>
              </div>
            </div>
            <button className="agent-close" onClick={() => setIsOpen(false)}>✕</button>
          </div>

          {/* Messages */}
          <div className="agent-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`agent-msg ${msg.role}`}>
                {msg.role === 'agent' && <span className="agent-msg-avatar">🤖</span>}
                <div className="agent-msg-bubble">
                  <div className="agent-msg-content">
                    {renderMarkdown(msg.content)}
                  </div>
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="agent-suggestions">
                      {msg.suggestions.map((s) => (
                        <button key={s} className="agent-suggestion" onClick={() => handleSuggestion(s)}>
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="agent-msg agent">
                <span className="agent-msg-avatar">🤖</span>
                <div className="agent-msg-bubble">
                  <div className="agent-typing">
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form className="agent-input" onSubmit={handleSubmit}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about KindJar..."
              disabled={isTyping}
            />
            <button type="submit" disabled={isTyping || !input.trim()}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
