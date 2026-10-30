import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Sparkles,
  Send,
  Edit3,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Gift,
  ShieldCheck,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Textarea } from '../ui/Textarea';
import { api } from '../../api/axios';
import { TONES } from '../../lib/constants';

export const ReplyComposer = ({
  ticketId,
  onReplySent,
  latestDraft,
}) => {
  const [tone, setTone] = useState('empathetic');
  const [includeCompensation, setIncludeCompensation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);

  const [currentDraft, setCurrentDraft] = useState(latestDraft || null);
  const [draftText, setDraftText] = useState(latestDraft?.draft_text || '');
  const [confidence, setConfidence] = useState(0.92);
  const [suggestedActions, setSuggestedActions] = useState(latestDraft?.suggested_actions || []);
  const [kbArticles, setKbArticles] = useState([]);
  const [statusAfter, setStatusAfter] = useState('awaiting_customer');

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await api.post(`/tickets/${ticketId}/replies/generate`, {
        tone,
        include_compensation_suggestion: includeCompensation,
        max_reply_words: 160,
      });

      if (response.data) {
        const { draft, confidence: conf, grounded_kb_articles } = response.data;
        setCurrentDraft(draft);
        setDraftText(draft.draft_text);
        setConfidence(conf ?? 0.85);
        setSuggestedActions(draft.suggested_actions || []);
        setKbArticles(grounded_kb_articles || []);
        toast.success(`AI reply draft generated in ${tone} tone!`);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to generate AI reply draft.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAndSend = async () => {
    if (!currentDraft?.id) {
      toast.error('No draft available to approve.');
      return;
    }
    if (!draftText.trim()) {
      toast.error('Draft message cannot be empty.');
      return;
    }

    setApproving(true);
    try {
      // 1. If draft text was edited, update draft first
      if (draftText !== currentDraft.draft_text) {
        await api.patch(`/replies/${currentDraft.id}`, {
          draft_text: draftText,
        });
      }

      // 2. Approve draft and send
      await api.post(`/replies/${currentDraft.id}/approve`, {
        status_after: statusAfter,
      });

      toast.success('Reply approved and published to customer thread!');
      setCurrentDraft(null);
      setDraftText('');
      setSuggestedActions([]);
      if (onReplySent) onReplySent();
    } catch (err) {
      toast.error(err.message || 'Failed to approve and send reply.');
    } finally {
      setApproving(false);
    }
  };

  return (
    <Card
      title="AI Reply Composer"
      description="Human-in-the-loop: Generate grounded drafts, refine text, and approve response"
      className="border border-brand-500/20 shadow-xl"
    >
      {/* Tone Picker */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
          Select Brand Tone
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {TONES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTone(t.value)}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                tone === t.value
                  ? 'bg-brand-600/25 border-brand-500 text-white shadow-md shadow-brand-500/10'
                  : 'bg-slate-900/60 border-white/5 text-slate-400 hover:text-slate-200 hover:border-white/10'
              }`}
            >
              <span className="text-xs font-bold block">{t.label}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5 truncate">{t.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Compensation checkbox & generate button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 p-3 rounded-xl bg-slate-900/40 border border-white/5">
        <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeCompensation}
            onChange={(e) => setIncludeCompensation(e.target.checked)}
            className="rounded border-slate-700 bg-slate-800 text-brand-600 focus:ring-brand-500"
          />
          <span>Suggest goodwill gesture / apology credit</span>
        </label>

        <Button
          variant="primary"
          size="sm"
          loading={loading}
          icon={Sparkles}
          onClick={handleGenerate}
        >
          {currentDraft ? 'Regenerate Draft' : 'Generate AI Reply'}
        </Button>
      </div>

      {/* Draft Workspace */}
      {currentDraft && (
        <div className="space-y-4 pt-3 border-t border-white/5 animate-fade-in">
          {/* Confidence & Quality Indicators */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Confidence:</span>
              <Badge
                variant={confidence >= 0.7 ? 'success' : 'warning'}
                size="sm"
                dot
              >
                {Math.round(confidence * 100)}%
              </Badge>
              {confidence < 0.6 && (
                <span className="text-xs text-amber-400 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Low confidence — review carefully
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Grounded in Knowledge Base</span>
            </div>
          </div>

          {/* Editable Draft Textarea */}
          <Textarea
            label="Agent Editable Draft"
            rows={5}
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            helperText="Support agents can freely modify any part of the drafted message prior to sending."
          />

          {/* Suggested Actions List */}
          {suggestedActions.length > 0 && (
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/5 space-y-2">
              <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5 text-amber-400" />
                AI Suggested Goodwill Actions
              </span>
              <div className="space-y-1.5">
                {suggestedActions.map((act, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 text-xs"
                  >
                    <div>
                      <p className="font-medium text-slate-200">{act.action}</p>
                      <p className="text-[11px] text-slate-400">{act.reason}</p>
                    </div>
                    {act.requires_approval && (
                      <Badge variant="warning" size="sm">
                        Needs Approval
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grounded KB Sources */}
          {kbArticles.length > 0 && (
            <div className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
              <BookOpen className="w-3.5 h-3.5 text-brand-400 shrink-0" />
              <span className="font-semibold text-slate-300">Grounding Sources:</span>
              {kbArticles.map((kb) => (
                <span
                  key={kb.id}
                  className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] border border-white/5"
                >
                  {kb.title}
                </span>
              ))}
            </div>
          )}

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-white/5">
            <div className="flex items-center gap-3">
              <label className="text-xs text-slate-400">Set status after sending:</label>
              <select
                value={statusAfter}
                onChange={(e) => setStatusAfter(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5"
              >
                <option value="awaiting_customer">Awaiting Customer</option>
                <option value="resolved">Mark Resolved</option>
              </select>
            </div>

            <Button
              variant="success"
              size="md"
              loading={approving}
              icon={Send}
              onClick={handleApproveAndSend}
            >
              Approve & Send to Customer
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
