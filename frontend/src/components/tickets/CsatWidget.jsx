import React, { useState } from 'react';
import { Star, CheckCircle2, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { api } from '../../api/axios';
import { formatDate } from '../../lib/formatters';

export const CsatWidget = ({ ticketId, existingCsat, onCsatSubmitted }) => {
  const [rating, setRating] = useState(existingCsat?.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(existingCsat?.comment || '');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(!!existingCsat);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a star rating from 1 to 5');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post(`/tickets/${ticketId}/csat`, {
        rating,
        comment,
      });
      if (response.data) {
        setSubmitted(true);
        toast.success('Thank you for rating your customer experience!');
        if (onCsatSubmitted) onCsatSubmitted(response.data);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to submit satisfaction rating.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="border border-emerald-500/20 bg-emerald-950/15">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">CSAT Feedback Submitted</h4>
            <div className="flex items-center gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                  }`}
                />
              ))}
              <span className="text-xs text-slate-400 ml-2">({rating} / 5 stars)</span>
            </div>
            {comment && <p className="text-xs text-slate-300 mt-1 italic">"{comment}"</p>}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="How was your resolution experience?"
      description="Your feedback helps us continuously elevate our customer experience."
      className="border border-brand-500/20"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Rate Resolution (1–5 Stars)
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => {
              const active = (hoverRating || rating) >= star;
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 rounded-lg transition-transform hover:scale-110 focus:outline-none"
                  aria-label={`Rate ${star} star`}
                >
                  <Star
                    className={`w-7 h-7 transition-colors ${
                      active
                        ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                        : 'text-slate-700 hover:text-slate-500'
                    }`}
                  />
                </button>
              );
            })}
            <span className="text-sm font-semibold text-slate-300 ml-3">
              {hoverRating || rating ? `${hoverRating || rating} / 5` : 'Select rating'}
            </span>
          </div>
        </div>

        <Textarea
          placeholder="Share any additional feedback or comments (optional)..."
          rows={2}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <div className="flex justify-end">
          <Button type="submit" variant="primary" size="sm" loading={submitting}>
            Submit CSAT Feedback
          </Button>
        </div>
      </form>
    </Card>
  );
};
