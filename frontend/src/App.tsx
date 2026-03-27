import { useState, useEffect, useRef, type FormEvent, type KeyboardEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import Sidebar from './components/Sidebar';
import DocumentPanel from './components/DocumentPanel';
import {
  fetchConversations,
  fetchConversation,
  createConversation,
  deleteConversation,
  sendMessage,
  fetchHealth,
} from './api';
import type { ChatMessage, ConversationSummary } from './types';
import './App.css';

export default function App() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [useRag, setUseRag] = useState(true);
  const [showDocs, setShowDocs] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadConversations(); }, []);
  useEffect(() => {
    fetchHealth()
      .then((data) => setDemoMode(Boolean(data.demoMode)))
      .catch(() => {});
  }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  async function loadConversations() {
    try { setConversations(await fetchConversations()); } catch (e) { console.error(e); }
  }

  async function selectConversation(id: string) {
    setActiveId(id);
    try {
      const conv = await fetchConversation(id);
      setMessages(conv.messages || []);
    } catch (e) { console.error(e); }
  }

  async function handleNewChat() {
    const conv = await createConversation();
    setConversations((p) => [{ ...conv, messageCount: 0 }, ...p]);
    setActiveId(conv._id);
    setMessages([]);
  }

  async function handleDelete(id: string) {
    await deleteConversation(id);
    setConversations((p) => p.filter((c) => c._id !== id));
    if (activeId === id) { setActiveId(null); setMessages([]); }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    let convId = activeId;
    if (!convId) {
      const conv = await createConversation();
      convId = conv._id;
      setActiveId(convId);
      setConversations((p) => [{ ...conv, messageCount: 0 }, ...p]);
    }
    const userMsg: ChatMessage = { role: 'user', content: input.trim() };
    setMessages((p) => [...p, userMsg]);
    setInput('');
    setLoading(true);
    try {
      await sendMessage(convId, userMsg.content, useRag);
      const conv = await fetchConversation(convId);
      setMessages(conv.messages);
      loadConversations();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setMessages((p) => [...p, { role: 'assistant', content: `Error: ${message}` }]);
    } finally { setLoading(false); }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit(e);
    }
  }

  return (
    <div className="app">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={selectConversation}
        onNew={handleNewChat}
        onDelete={handleDelete}
        onToggleDocs={() => setShowDocs(!showDocs)}
      />
      <main className="chat-main">
        <header className="chat-header">
          <h1>CogniChat</h1>
          {demoMode && (
            <span className="demo-badge" title="Set OPENAI_API_KEY in backend .env for live AI">
              Demo mode
            </span>
          )}
          <label className="rag-toggle">
            <input type="checkbox" checked={useRag} onChange={(e) => setUseRag(e.target.checked)} />
            RAG enabled
          </label>
        </header>
        <div className="messages">
          {!messages.length && !loading && (
            <div className="empty-state">
              <div className="empty-icon">✨</div>
              <h2>Start a conversation</h2>
              <p>Ask anything. Upload documents to enable RAG-powered answers.</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.role}`}>
              <div className="avatar">{msg.role === 'user' ? 'You' : 'AI'}</div>
              <div className="bubble">
                {msg.role === 'assistant' ? <ReactMarkdown>{msg.content}</ReactMarkdown> : msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="message assistant">
              <div className="avatar">AI</div>
              <div className="bubble typing"><span /><span /><span /></div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <form className="input-area" onSubmit={handleSubmit}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message CogniChat..."
            rows={1}
            onKeyDown={handleKeyDown}
          />
          <button type="submit" disabled={loading || !input.trim()}>Send</button>
        </form>
      </main>
      {showDocs && <DocumentPanel onClose={() => setShowDocs(false)} />}
    </div>
  );
}
