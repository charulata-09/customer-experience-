import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  Sparkles,
  Send,
  HelpCircle,
  Hash,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { api } from '../api/axios';
import { DOMAINS, CHANNELS } from '../lib/constants';

const ticketSchema = z.object({
  domain: z.string().min(1, 'Please select a business domain'),
  channel: z.string().min(1, 'Please select an intake channel'),
  subject: z
    .string()
    .trim()
    .min(5, 'Subject must be at least 5 characters')
    .max(120, 'Subject cannot exceed 120 characters'),
  message: z
    .string()
    .trim()
    .min(20, 'Message must be at least 20 characters')
    .max(3000, 'Message cannot exceed 3000 characters'),
  reference_id: z.string().trim().max(60).optional(),
  preferred_contact: z.enum(['email', 'phone', 'in_app']).default('email'),
});

export const NewTicket = () => {
  const navigate = useNavigate();
  const [analyzing, setAnalyzing] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      domain: 'ecommerce',
      channel: 'web',
      subject: '',
      message: '',
      reference_id: '',
      preferred_contact: 'email',
    },
  });

  const onSubmit = async (data) => {
    setAnalyzing(true);
    try {
      const response = await api.post('/tickets', data);
      if (response.data) {
        toast.success('Ticket submitted and analyzed by AI!');
        navigate(`/tickets/${response.data.id}`);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to submit ticket. Please check fields.');
      setAnalyzing(false);
    }
  };

  const fillTemplate = (preset) => {
    setValue('domain', preset.domain, { shouldValidate: true });
    setValue('subject', preset.subject, { shouldValidate: true });
    setValue('message', preset.message, { shouldValidate: true });
    setValue('reference_id', preset.reference_id, { shouldValidate: true });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Submit New Support Ticket"
        description="Our AI engine will instantly triage your issue, calculate priority, and route it to the right specialist."
      />

      {/* Quick Demo Scenarios / Presets */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
          Quick Test Scenarios (Click to auto-fill)
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() =>
              fillTemplate({
                domain: 'ecommerce',
                subject: 'Package marked delivered but never arrived — wedding tomorrow!',
                message:
                  'My expedited package #USPS-9821 was marked delivered at 3 PM today but my porch and building lobby are completely empty! I have a wedding tomorrow morning and this contains my attire. I need this located immediately or an urgent courier replacement sent right now!!',
                reference_id: 'ORD-982194',
              })
            }
            className="p-2.5 text-left rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-xs transition-colors"
          >
            <span className="font-semibold text-rose-300 block">Critical: Missing Delivery</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">High anger & urgent deadline</span>
          </button>

          <button
            type="button"
            onClick={() =>
              fillTemplate({
                domain: 'banking_fintech',
                subject: 'Duplicate charge of $489.00 on my debit card statement',
                message:
                  'I noticed two identical transactions of $489.00 from CloudHost on my checking account statement from yesterday. Only one was authorized. Please reverse the duplicate debit immediately and verify my card is safe.',
                reference_id: 'TXN-77401',
              })
            }
            className="p-2.5 text-left rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-xs transition-colors"
          >
            <span className="font-semibold text-amber-300 block">High: Duplicate Charge</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Financial dispute & security</span>
          </button>

          <button
            type="button"
            onClick={() =>
              fillTemplate({
                domain: 'saas',
                subject: 'How do I export team audit logs into S3 or CSV?',
                message:
                  'Hello, we are preparing for our annual SOC2 compliance audit. Could your team please point us to the documentation or API endpoints for automatically exporting user login audit logs into our AWS S3 bucket?',
                reference_id: 'WS-ENTERPRISE-12',
              })
            }
            className="p-2.5 text-left rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-xs transition-colors"
          >
            <span className="font-semibold text-emerald-300 block">Low: General Inquiry</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Technical documentation query</span>
          </button>
        </div>
      </div>

      <Card className="border border-brand-500/20 shadow-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Business Domain"
              options={DOMAINS}
              error={errors.domain?.message}
              {...register('domain')}
            />

            <Select
              label="Intake Channel"
              options={CHANNELS}
              error={errors.channel?.message}
              {...register('channel')}
            />
          </div>

          <Input
            label="Subject"
            placeholder="Brief summary of the issue (e.g. Order delivered to wrong address)"
            error={errors.subject?.message}
            {...register('subject')}
          />

          <Textarea
            label="Message Details"
            rows={6}
            placeholder="Please describe what happened, any error messages encountered, and the desired outcome..."
            error={errors.message?.message}
            {...register('message')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Reference ID (Optional)"
              placeholder="e.g. Order #12345, Account ID, or Flight PNR"
              icon={Hash}
              error={errors.reference_id?.message}
              {...register('reference_id')}
            />

            <Select
              label="Preferred Contact Method"
              options={[
                { value: 'email', label: 'Email Notification' },
                { value: 'phone', label: 'Phone Call' },
                { value: 'in_app', label: 'In-App Portal Only' },
              ]}
              error={errors.preferred_contact?.message}
              {...register('preferred_contact')}
            />
          </div>

          {/* AI Notice */}
          <div className="p-3.5 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center gap-3 text-xs text-brand-300">
            <Sparkles className="w-5 h-5 shrink-0 text-brand-400 animate-pulse" />
            <span>
              Our Google Gemini AI will inspect sentiment, urgency, and churn risk immediately upon submission.
            </span>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={analyzing}
              icon={Send}
              className="w-full sm:w-auto"
            >
              {analyzing ? 'Analyzing Interaction with Gemini AI...' : 'Submit Ticket for AI Triage'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
