import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  MessageSquare,
  Send,
  Sparkles,
  Bot,
  User,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  PlusCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/axios';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { DOMAINS } from '../lib/constants';

export const Chat = () => {
  const { user } = useAuth();
  const [domain, setDomain] = useState('ecommerce');
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputContent, setInputContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [quickReplies, setQuickReplies] = useState([]);
  const [escalateSuggested, setEscalateSuggested] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [escalatedTicketId, setEscalatedTicketId] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typing]);

  const initSession = async (selectedDomain = domain) => {
    setLoading(true);
    setEscalateSuggested(false);
    setEscalatedTicketId(null);
    try {
      const response = await api.post('/chat/sessions', { domain: selectedDomain });
      if (response?.data) {
        setSessionId(response.data.id);
        const sessionDetail = await api.get(`/chat/sessions/${response.data.id}`);
        setMessages(sessionDetail?.data?.messages || []);
        setQuickReplies([
          'What is your refund policy?',
          'My order is delayed',
          'I need help updating my account',
        ]);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to start AI assistant session.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initSession();
  }, []);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputContent;
    if (!text.trim() || !sessionId) return;

    const optimisticUserMsg = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticUserMsg]);
    setInputContent('');
    setQuickReplies([]);
    setTyping(true);

    try {
      const response = await api.post(`/chat/sessions/${sessionId}/messages`, {
        content: text,
      });

      if (response?.data) {
        const { message, escalate_suggested, quick_replies } = response.data;
        setMessages((prev) => [...prev, message]);
        setQuickReplies(quick_replies || []);
        if (escalate_suggested) {
          setEscalateSuggested(true);
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to send message.');
    } finally {
      setTyping(false);
    }
  };

  const handleEscalate = async () => {
    if (!sessionId) return;
    setEscalating(true);
    try {
      const response = await api.post(`/chat/sessions/${sessionId}/escalate`, {
        subject: `Live Chat Support Escalation (${domain.replace('_', ' ')})`,
        preferred_contact: 'in_app',
      });

      if (response?.data) {
        const ticketId = response.data.id || response.data.ticket_id;
        setEscalatedTicketId(ticketId);
        setEscalateSuggested(false);
        toast.success(`Escalated to human support as Ticket #${ticketId.slice(0, 8)}!`);
        // Refresh session messages
        const detail = await api.get(`/chat/sessions/${sessionId}`);
        setMessages(detail?.data?.messages || []);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to escalate to human agent.');
    } finally {
      setEscalating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <PageHeader
        title="AI Support Assistant"
        description="Instant multi-turn conversational support grounded in our Knowledge Base."
        action={
          <div className="flex items-center gap-2">
            <select
              value={domain}
              onChange={(e) => {
                setDomain(e.target.value);
                initSession(e.target.value);
              }}
              className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 font-medium"
            >
              {DOMAINS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
            <Button
              variant="secondary"
              size="sm"
              icon={PlusCircle}
              onClick={() => initSession(domain)}
            >
              New Chat
            </Button>
          </div>
        }
      />

      {/* Frustration / Escalation Alert Banner */}
      {escalateSuggested && !escalatedTicketId && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-200 uppercase tracking-wider">
                Needs human assistance?
              </p>
              <p className="text-xs text-amber-300/90 mt-0.5">
                Our AI noticed this issue might require authorization from a live support agent.
              </p>
            </div>
          </div>
          <Button
            variant="warning"
            size="sm"
            loading={escalating}
            icon={ArrowRight}
            onClick={handleEscalate}
            className="shrink-0"
          >
            Escalate to Human Specialist
          </Button>
        </div>
      )}

      {/* Escalated Confirmation Banner */}
      {escalatedTicketId && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>
              Conversation successfully escalated as Ticket #{escalatedTicketId.slice(0, 8)}
            </span>
          </div>
          <a
            href={`/tickets/${escalatedTicketId}`}
            className="font-bold underline hover:text-emerald-200"
          >
            View Ticket Detail →
          </a>
        </div>
      )}

      {/* Chat Window */}
      <Card className="border border-white/5 h-[580px] flex flex-col p-0 overflow-hidden shadow-2xl">
        {/* Messages Stream */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-semibold ${
                    isUser
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                      : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-lg rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    isUser
                      ? 'bg-brand-600 text-white rounded-tr-sm shadow-sm'
                      : 'bg-slate-900 border border-white/5 text-slate-100 rounded-tl-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {typing && (
            <div className="flex items-start gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-900 border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" />
                <span
                  className="w-2 h-2 rounded-full bg-brand-400 animate-bounce"
                  style={{ animationDelay: '0.15s' }}
                />
                <span
                  className="w-2 h-2 rounded-full bg-brand-400 animate-bounce"
                  style={{ animationDelay: '0.3s' }}
                />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Reply Chips */}
        {quickReplies.length > 0 && !typing && (
          <div className="px-4 py-2 bg-slate-900/60 border-t border-white/5 flex items-center gap-2 overflow-x-auto">
            <span className="text-[11px] font-semibold text-slate-500 uppercase shrink-0">
              Suggestions:
            </span>
            {quickReplies.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(q)}
                className="px-3 py-1 rounded-full bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-xs text-slate-300 hover:text-white whitespace-nowrap transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-slate-900/90 border-t border-white/5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputContent}
              onChange={(e) => setInputContent(e.target.value)}
              placeholder="Ask anything or describe your issue..."
              disabled={loading || typing}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={!inputContent.trim() || typing}
              icon={Send}
            >
              Send
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
};
