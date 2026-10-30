import React from 'react';
import {
  Sparkles,
  AlertTriangle,
  Flame,
  TrendingDown,
  TrendingUp,
  Tag,
  RefreshCw,
  Layers,
  HeartHandshake,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatPercent } from '../../lib/formatters';

export const AnalysisPanel = ({ analysis, onReanalyze, reanalyzing = false, isStaff = false }) => {
  if (!analysis) {
    return (
      <Card title="AI Interaction Analysis" className="border border-white/5">
        <div className="py-6 text-center space-y-2">
          <Sparkles className="w-6 h-6 text-brand-400 mx-auto animate-pulse" />
          <p className="text-xs text-slate-400">Analysis pending or being generated...</p>
        </div>
      </Card>
    );
  }

  const {
    sentiment,
    sentiment_score,
    intent,
    category,
    urgency,
    churn_risk,
    emotions = [],
    key_entities = [],
    summary,
    escalate,
    escalation_reason,
  } = analysis;

  const sentimentColor =
    sentiment === 'very_positive' || sentiment === 'positive'
      ? 'text-emerald-400'
      : sentiment === 'neutral'
      ? 'text-slate-300'
      : 'text-rose-400';

  const churnColor =
    churn_risk >= 70
      ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
      : churn_risk >= 40
      ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
      : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';

  return (
    <Card
      title="AI Triage & Sentiment Analysis"
      description="Real-time multi-dimensional evaluation powered by Gemini 2.5 Flash"
      action={
        isStaff && (
          <Button
            variant="ghost"
            size="sm"
            icon={RefreshCw}
            loading={reanalyzing}
            onClick={onReanalyze}
            className="text-xs text-slate-400 hover:text-white"
          >
            Re-analyze
          </Button>
        )
      }
      className="border border-brand-500/20 shadow-xl"
    >
      {/* Escalation Alert */}
      {escalate && (
        <div className="mb-5 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-rose-300 uppercase tracking-wider">
              High Priority Escalation Flagged
            </p>
            <p className="text-xs text-rose-200/90 mt-0.5">
              {escalation_reason ||
                'Critical urgency detected due to security, financial risk, or explicit churn hazard.'}
            </p>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="mb-5 p-3 rounded-xl bg-slate-900/60 border border-white/5">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
          Executive Summary
        </p>
        <p className="text-sm text-slate-200 leading-relaxed font-medium">"{summary}"</p>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {/* Sentiment */}
        <div className="p-3 rounded-xl bg-slate-900/40 border border-white/5">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Sentiment
          </span>
          <div className="flex items-center gap-1.5">
            {sentiment_score >= 0 ? (
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-400" />
            )}
            <span className={`text-sm font-bold capitalize ${sentimentColor}`}>
              {sentiment.replace('_', ' ')}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            Score: {Number(sentiment_score).toFixed(2)}
          </span>
        </div>

        {/* Urgency */}
        <div className="p-3 rounded-xl bg-slate-900/40 border border-white/5">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Urgency
          </span>
          <Badge
            variant={
              urgency === 'critical'
                ? 'danger'
                : urgency === 'high'
                ? 'warning'
                : urgency === 'medium'
                ? 'info'
                : 'success'
            }
            size="sm"
            dot
          >
            {urgency.toUpperCase()}
          </Badge>
        </div>

        {/* Churn Risk */}
        <div className="p-3 rounded-xl bg-slate-900/40 border border-white/5">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Churn Risk
          </span>
          <div className="flex items-center gap-1">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-bold text-white">{churn_risk}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                churn_risk >= 70 ? 'bg-rose-500' : churn_risk >= 40 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${churn_risk}%` }}
            />
          </div>
        </div>

        {/* Intent */}
        <div className="p-3 rounded-xl bg-slate-900/40 border border-white/5">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Intent
          </span>
          <span className="text-xs font-semibold text-brand-300 capitalize">
            {intent.replace('_', ' ')}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5 capitalize truncate">
            {category.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Emotion Chips */}
      {emotions.length > 0 && (
        <div className="mb-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Detected Emotions
          </span>
          <div className="flex flex-wrap gap-1.5">
            {emotions.map((emo) => (
              <span
                key={emo}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 capitalize"
              >
                <Tag className="w-3 h-3 text-brand-400" />
                {emo}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Key Entities */}
      {key_entities.length > 0 && (
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Identified Entities
          </span>
          <div className="flex flex-wrap gap-2">
            {key_entities.map((entity, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-white/5 text-xs text-slate-400"
              >
                <span className="text-slate-500 font-mono text-[10px] uppercase">{entity.type}:</span>
                <span className="text-slate-200 font-mono font-medium">{entity.value}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
