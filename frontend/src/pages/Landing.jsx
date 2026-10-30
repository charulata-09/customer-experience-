import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Bot,
  BarChart,
  CheckCircle2,
  Lock,
  Globe2,
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export const Landing = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-brand-500 selection:text-white">
      {/* Navigation Header */}
      <nav className="h-20 border-b border-white/5 px-6 sm:px-12 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center text-white shadow-lg shadow-brand-500/30">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">CX Copilot</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link to="/register">
            <Button variant="primary" size="sm" icon={ArrowRight}>
              Get Started Free
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 pt-16 pb-24 sm:pt-24 sm:pb-32 max-w-5xl mx-auto text-center overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-brand-500/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-xs font-semibold text-brand-300 mb-8">
          <Zap className="w-3.5 h-3.5" />
          <span>Powered by Google Gemini 2.5 Flash SDK</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Turn Support Friction Into{' '}
          <span className="bg-gradient-to-r from-brand-400 via-indigo-300 to-teal-300 bg-clip-text text-transparent">
            Customer Loyalty
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
          Omnichannel customer experience platform that triages inquiries in seconds, detects churn risk,
          drafts brand-safe personalized replies, and arms leadership with actionable journey insights.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/register" className="w-full sm:w-auto">
            <Button variant="primary" size="lg" icon={ArrowRight} className="w-full sm:w-auto">
              Start Free Trial
            </Button>
          </Link>
          <Link to="/login" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto">
              Explore Demo Logins
            </Button>
          </Link>
        </div>

        {/* Value Badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Sub-10s AI Triage & Emotion Detection</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-brand-400" />
            <span>PostgreSQL Row Level Security (RLS)</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-teal-400" />
            <span>Omnichannel (Web, Chat, Email, Social)</span>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="px-6 py-20 max-w-7xl mx-auto border-t border-white/5">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Engineered for Modern High-Growth Support Teams
          </h2>
          <p className="text-slate-400 text-sm mt-3">
            Combine the intelligence of Google Gemini with human-in-the-loop review to scale your operations safely.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-8 rounded-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white">Intelligent Triage & Churn Risk</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Every incoming interaction is analyzed for sentiment, intent, domain category, and churn risk probability (0–100) before reaching an agent.
            </p>
          </div>

          <div className="glass-card p-8 rounded-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white">Brand-Grounded Reply Drafting</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Draft responses in 4 distinct tones grounded strictly in your Knowledge Base. Support agents review, edit, and approve replies with one click.
            </p>
          </div>

          <div className="glass-card p-8 rounded-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <BarChart className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white">Executive AI Insights & CSAT</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Generate periodic CX insight reports highlighting root causes, pain point clusters, and owner-assignable recommendations with effort scores.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-xs text-slate-500">
        <p>© 2025 CX Copilot. Built with React, Vite, Node.js, Supabase RLS, and Google Gemini SDK.</p>
      </footer>
    </div>
  );
};
