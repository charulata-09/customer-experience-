import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Sparkles,
  Printer,
  Calendar,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Clock,
  Layers,
} from 'lucide-react';
import { api } from '../api/axios';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { formatDate } from '../lib/formatters';

export const Insights = () => {
  const [periodStart, setPeriodStart] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [periodEnd, setPeriodEnd] = useState(new Date().toISOString().slice(0, 10));

  const [generating, setGenerating] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [reports, setReports] = useState([]);
  const [activeReport, setActiveReport] = useState(null);

  const fetchReports = async () => {
    setLoadingList(true);
    try {
      const response = await api.get('/insights');
      if (response?.data) {
        setReports(response.data);
        if (response.data.length > 0 && !activeReport) {
          // Open latest report by default
          const detail = await api.get(`/insights/${response.data[0].id}`);
          setActiveReport(detail?.data || null);
        }
      }
    } catch (err) {
      console.error('Failed to list insight reports:', err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const response = await api.post('/insights/generate', {
        period_start: periodStart,
        period_end: periodEnd,
      });

      if (response?.data) {
        setActiveReport(response.data);
        toast.success('Executive AI insight report generated!');
        await fetchReports();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to generate insight report.');
    } finally {
      setGenerating(false);
    }
  };

  const selectReport = async (id) => {
    try {
      const response = await api.get(`/insights/${id}`);
      if (response?.data) {
        setActiveReport(response.data);
      }
    } catch (err) {
      toast.error('Failed to load selected report');
    }
  };

  const reportData = activeReport?.report;

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <PageHeader
          title="AI Executive Insight Generator"
          description="Aggregate thousands of interactions to synthesize pain points, root-cause hypotheses, and prioritized recommendations."
          action={
            activeReport && (
              <Button
                variant="secondary"
                size="sm"
                icon={Printer}
                onClick={() => window.print()}
              >
                Print / Export PDF
              </Button>
            )
          }
        />
      </div>

      {/* Generator Form Bar */}
      <Card className="p-4 sm:p-5 border border-brand-500/20 print:hidden">
        <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row items-end gap-3">
          <div className="w-full sm:w-48 space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Start Date
            </label>
            <input
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="w-full sm:w-48 space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              End Date
            </label>
            <input
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={generating}
            icon={Sparkles}
            className="w-full sm:w-auto"
          >
            {generating ? 'Synthesizing with Gemini AI...' : 'Generate New Insight Report'}
          </Button>
        </form>
      </Card>

      {/* Layout Grid: Historical Archive & Active Report */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Historical Archive List */}
        <div className="lg:col-span-1 space-y-3 print:hidden">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Archived Reports
          </h3>
          {loadingList ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : reports.length === 0 ? (
            <Card className="p-4 text-center text-xs text-slate-500">
              No reports generated yet
            </Card>
          ) : (
            <div className="space-y-2">
              {reports.map((r) => (
                <button
                  key={r.id}
                  onClick={() => selectReport(r.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    activeReport?.id === r.id
                      ? 'bg-brand-600/20 border-brand-500 text-white shadow-md'
                      : 'bg-slate-900/60 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <span className="text-xs font-semibold text-white block">
                    {r.period_start} → {r.period_end}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Generated {formatDate(r.created_at)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Active Report Document */}
        <div className="lg:col-span-3">
          {!activeReport ? (
            <Card className="p-12 text-center text-slate-400">
              Select or generate an insight report to view executive findings.
            </Card>
          ) : (
            <div className="space-y-6 print:space-y-4">
              {/* Report Header Card */}
              <Card className="border border-brand-500/20 p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
                  <div>
                    <span className="text-xs font-mono text-brand-400 uppercase tracking-widest font-semibold">
                      Executive CX Journey Report
                    </span>
                    <h2 className="text-2xl font-extrabold text-white tracking-tight mt-1">
                      Platform Insights: {activeReport.period_start} to {activeReport.period_end}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Generated on {formatDate(activeReport.created_at)} • Grounded by Google Gemini
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Trend:</span>
                    <Badge
                      variant={
                        reportData?.overall_health === 'improving'
                          ? 'success'
                          : reportData?.overall_health === 'stable'
                          ? 'info'
                          : 'danger'
                      }
                      size="md"
                      dot
                    >
                      {reportData?.overall_health?.toUpperCase() || 'STABLE'}
                    </Badge>
                  </div>
                </div>

                {/* Executive Summary */}
                <div className="mt-6">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Executive Summary
                  </h3>
                  <p className="text-base text-slate-200 leading-relaxed font-medium bg-slate-900/60 p-4 rounded-xl border border-white/5">
                    {reportData?.executive_summary}
                  </p>
                </div>

                {/* Pain Points */}
                {reportData?.pain_points?.length > 0 && (
                  <div className="mt-8 space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Identified Friction & Pain Points
                    </h3>
                    <div className="space-y-3">
                      {reportData.pain_points.map((pt, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl bg-slate-900/40 border border-white/5 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-white">{pt.title}</h4>
                            <Badge
                              variant={
                                pt.severity === 'critical'
                                  ? 'danger'
                                  : pt.severity === 'high'
                                  ? 'warning'
                                  : 'default'
                              }
                              size="sm"
                            >
                              {pt.severity?.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-300">
                            <strong className="text-slate-400">Evidence:</strong> {pt.evidence}
                          </p>
                          <p className="text-xs text-slate-400 italic">
                            <strong className="text-slate-400 not-italic">Root-Cause Hypothesis:</strong>{' '}
                            {pt.root_cause_hypothesis}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {reportData?.recommendations?.length > 0 && (
                  <div className="mt-8 space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Prioritized Operational Recommendations
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {reportData.recommendations.map((rec, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl bg-brand-950/20 border border-brand-500/20 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-brand-300">
                              {rec.owner_suggestion}
                            </span>
                            <Badge
                              variant={rec.effort === 'low' ? 'success' : 'warning'}
                              size="sm"
                            >
                              Effort: {rec.effort}
                            </Badge>
                          </div>
                          <p className="text-sm font-semibold text-white">{rec.action}</p>
                          <p className="text-xs text-slate-300">
                            <strong className="text-slate-400">Impact:</strong> {rec.expected_outcome}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* KB Gaps */}
                {reportData?.kb_gaps?.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-white/5">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                      <BookOpen className="w-4 h-4 text-brand-400" />
                      Recommended Knowledge Base Additions
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
                      {reportData.kb_gaps.map((gap, idx) => (
                        <li key={idx}>{gap}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
