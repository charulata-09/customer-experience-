import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  User,
  Clock,
  Send,
  Sparkles,
  ShieldAlert,
  Bot,
  Hash,
  MessageSquare,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/axios';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Textarea } from '../components/ui/Textarea';
import { Skeleton } from '../components/ui/Skeleton';
import { AnalysisPanel } from '../components/ai/AnalysisPanel';
import { ReplyComposer } from '../components/ai/ReplyComposer';
import { CsatWidget } from '../components/tickets/CsatWidget';
import { formatDate, formatTimeAgo } from '../lib/formatters';
import { TICKET_STATUSES } from '../lib/constants';

export const TicketDetail = () => {
  const { id } = useParams();
  const { user, isStaff } = useAuth();

  const [loading, setLoading] = useState(true);
  const [ticketData, setTicketData] = useState(null);
  const [replyBody, setReplyBody] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);

  const fetchTicket = async () => {
    try {
      const response = await api.get(`/tickets/${id}`);
      if (response?.data) {
        setTicketData(response.data);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to fetch ticket.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!replyBody.trim()) return;

    setSendingMsg(true);
    try {
      await api.post(`/tickets/${id}/messages`, {
        body: replyBody,
      });
      setReplyBody('');
      toast.success('Message sent');
      await fetchTicket();
    } catch (err) {
      toast.error(err.message || 'Failed to send message');
    } finally {
      setSendingMsg(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      await api.patch(`/tickets/${id}`, {
        status: newStatus,
      });
      toast.success(`Ticket marked as ${newStatus.replace('_', ' ')}`);
      await fetchTicket();
    } catch (err) {
      toast.error(err.message || 'Failed to update ticket status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleReanalyze = async () => {
    setReanalyzing(true);
    try {
      await api.post(`/tickets/${id}/analyze`);
      toast.success('AI analysis updated!');
      await fetchTicket();
    } catch (err) {
      toast.error(err.message || 'Failed to reanalyze interaction');
    } finally {
      setReanalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!ticketData?.ticket) {
    return (
      <div className="text-center py-12 space-y-4">
        <h2 className="text-xl font-bold text-white">Ticket Not Found</h2>
        <Link to="/tickets">
          <Button variant="primary" size="sm" icon={ArrowLeft}>
            Back to Queue
          </Button>
        </Link>
      </div>
    );
  }

  const { ticket, analysis, messages = [], drafts = [], csat } = ticketData;

  return (
    <div className="space-y-6">
      {/* Back button & Header */}
      <div>
        <Link
          to="/tickets"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-3 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to interactions</span>
        </Link>
        <PageHeader
          title={ticket.subject}
          description={`Opened by ${ticket.customer?.full_name || 'Customer'} (${ticket.customer?.email || 'N/A'}) • Channel: ${ticket.channel}`}
          badge={
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  ticket.status === 'resolved'
                    ? 'success'
                    : ticket.status === 'open'
                    ? 'info'
                    : 'warning'
                }
                size="md"
              >
                {ticket.status.replace('_', ' ').toUpperCase()}
              </Badge>
              {analysis?.urgency && (
                <Badge
                  variant={
                    analysis.urgency === 'critical'
                      ? 'danger'
                      : analysis.urgency === 'high'
                      ? 'warning'
                      : 'default'
                  }
                  size="md"
                  dot
                >
                  {analysis.urgency.toUpperCase()}
                </Badge>
              )}
            </div>
          }
          action={
            isStaff && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Status:</span>
                <select
                  disabled={updatingStatus}
                  value={ticket.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 font-medium"
                >
                  {TICKET_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            )
          }
        />
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Thread Conversation & Message Composer */}
        <div className="lg:col-span-2 space-y-6">
          {/* Conversation Thread */}
          <Card title="Interaction Thread" description="Complete omnichannel communication history">
            <div className="space-y-4">
              {messages.map((msg) => {
                const isCustomer = msg.sender_type === 'customer';
                const isAgent = msg.sender_type === 'agent';

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-1 px-1">
                      <span className="font-semibold text-slate-300">
                        {msg.sender?.full_name || (isCustomer ? 'Customer' : 'Support Agent')}
                      </span>
                      <span>•</span>
                      <span>{formatTimeAgo(msg.created_at)}</span>
                    </div>

                    <div
                      className={`max-w-xl rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${
                        isCustomer
                          ? 'bg-slate-800/80 border border-slate-700/60 text-slate-100 rounded-tl-sm'
                          : 'bg-brand-600/20 border border-brand-500/30 text-white rounded-tr-sm'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.body}</p>

                      {/* AI reviewed badge */}
                      {isAgent && (
                        <div className="mt-2 pt-2 border-t border-brand-400/20 flex items-center gap-1.5 text-[11px] text-brand-300">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>AI-drafted — reviewed by agent</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reply Input Form */}
            <form onSubmit={handleSendMessage} className="mt-6 pt-4 border-t border-white/5 space-y-3">
              <Textarea
                placeholder="Type your response to the customer thread..."
                rows={3}
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
              />
              <div className="flex justify-end">
                <Button type="submit" variant="primary" size="sm" loading={sendingMsg} icon={Send}>
                  Send Message
                </Button>
              </div>
            </form>
          </Card>

          {/* Staff AI Reply Composer */}
          {isStaff && (
            <ReplyComposer
              ticketId={ticket.id}
              latestDraft={drafts.find((d) => d.status === 'draft')}
              onReplySent={fetchTicket}
            />
          )}

          {/* Customer CSAT widget when resolved */}
          {(!isStaff || ticket.status === 'resolved' || ticket.status === 'closed') && (
            <CsatWidget
              ticketId={ticket.id}
              existingCsat={csat}
              onCsatSubmitted={fetchTicket}
            />
          )}
        </div>

        {/* Right 1 Col: AI Analysis Panel & Customer Summary */}
        <div className="space-y-6">
          <AnalysisPanel
            analysis={analysis}
            onReanalyze={handleReanalyze}
            reanalyzing={reanalyzing}
            isStaff={isStaff}
          />

          {/* Metadata Card */}
          <Card title="Ticket Metadata" className="border border-white/5 text-xs space-y-3">
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-400">Ticket ID:</span>
              <span className="font-mono text-slate-200">#{ticket.id.slice(0, 8)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-400">Domain:</span>
              <span className="font-semibold text-slate-200 capitalize">
                {ticket.domain.replace('_', ' ')}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-400">Intake Channel:</span>
              <span className="font-semibold text-slate-200 capitalize">{ticket.channel}</span>
            </div>
            {ticket.reference_id && (
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Reference / Order ID:</span>
                <span className="font-mono text-brand-300">{ticket.reference_id}</span>
              </div>
            )}
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-400">Created:</span>
              <span className="text-slate-200">{formatDate(ticket.created_at)}</span>
            </div>
            {ticket.resolved_at && (
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Resolved:</span>
                <span className="text-emerald-400">{formatDate(ticket.resolved_at)}</span>
              </div>
            )}

            {isStaff && ticket.customer_id && (
              <div className="pt-2">
                <Link to={`/customers/${ticket.customer_id}`}>
                  <Button variant="secondary" size="sm" className="w-full text-xs">
                    View Customer 360° Profile
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
