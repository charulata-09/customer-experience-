import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  User,
  Heart,
  Flame,
  Sparkles,
  Ticket,
  Clock,
  ArrowLeft,
  Mail,
  Phone,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Gift,
} from 'lucide-react';
import { api } from '../api/axios';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { formatDate, formatTimeAgo } from '../lib/formatters';

export const Customer360 = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [customerData, setCustomerData] = useState(null);
  const [generating, setGenerating] = useState(false);

  const fetchCustomer = async () => {
    try {
      const response = await api.get(`/customers/${id}/profile`);
      if (response?.data) {
        setCustomerData(response.data);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to fetch customer profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  const handleGenerateRecommendations = async () => {
    setGenerating(true);
    try {
      const response = await api.post(`/customers/${id}/recommendations`);
      if (response?.data) {
        toast.success('AI Next-Best-Action recommendations updated!');
        await fetchCustomer();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to generate recommendations.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="lg:col-span-2 h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!customerData?.profile) {
    return (
      <div className="text-center py-12 space-y-4">
        <h2 className="text-xl font-bold text-white">Customer Profile Not Found</h2>
        <Link to="/tickets">
          <Button variant="primary" size="sm" icon={ArrowLeft}>
            Back to Queue
          </Button>
        </Link>
      </div>
    );
  }

  const { profile, stats, tickets = [], csat = [], latestRecommendations } = customerData;
  const recData = latestRecommendations?.recommendations;
  const healthScore = recData?.health_score ?? (stats.avgSentiment >= 0 ? 82 : 45);
  const riskLevel = recData?.risk_level ?? (healthScore < 50 ? 'high' : healthScore < 75 ? 'medium' : 'low');

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/tickets"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-3 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to tickets</span>
        </Link>
        <PageHeader
          title={`Customer 360°: ${profile.full_name}`}
          description={`Customer ID: ${profile.id} • Registered ${formatDate(profile.created_at)}`}
          badge={
            <Badge
              variant={riskLevel === 'high' ? 'danger' : riskLevel === 'medium' ? 'warning' : 'success'}
              size="md"
              dot
            >
              {riskLevel.toUpperCase()} RISK
            </Badge>
          }
          action={
            <Button
              variant="primary"
              size="sm"
              loading={generating}
              icon={Sparkles}
              onClick={handleGenerateRecommendations}
            >
              {latestRecommendations ? 'Refresh Recommendations' : 'Generate Next-Best-Action'}
            </Button>
          }
        />
      </div>

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Relationship Health */}
        <Card title="Relationship Health & Value" className="border border-brand-500/20 text-center p-6">
          <div className="relative inline-flex items-center justify-center my-4">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="52"
                stroke="currentColor"
                strokeWidth="10"
                className="text-slate-800"
                fill="transparent"
              />
              <circle
                cx="64"
                cy="64"
                r="52"
                stroke="currentColor"
                strokeWidth="10"
                className={`transition-all duration-1000 ${
                  healthScore >= 75
                    ? 'text-emerald-500'
                    : healthScore >= 50
                    ? 'text-amber-500'
                    : 'text-rose-500'
                }`}
                strokeDasharray="326.7"
                strokeDashoffset={326.7 - (326.7 * healthScore) / 100}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-extrabold text-white">{healthScore}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                Score
              </span>
            </div>
          </div>

          <p className="text-sm font-semibold text-white">
            {recData?.headline || 'Customer interaction history actively tracked by AI.'}
          </p>

          <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-white/5 text-center">
            <div>
              <span className="text-lg font-bold text-white">{stats.totalTickets}</span>
              <p className="text-[10px] text-slate-400">Total Tickets</p>
            </div>
            <div>
              <span
                className={`text-lg font-bold ${
                  stats.avgSentiment >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {stats.avgSentiment}
              </span>
              <p className="text-[10px] text-slate-400">Avg Sentiment</p>
            </div>
            <div>
              <span className="text-lg font-bold text-amber-400">{stats.avgCsat}</span>
              <p className="text-[10px] text-slate-400">CSAT Rating</p>
            </div>
          </div>
        </Card>

        {/* AI Next-Best-Action Recommendations */}
        <div className="lg:col-span-2">
          <Card
            title="AI Recommended Next-Best-Actions"
            description="Personalized engagement steps tailored to this customer's journey history"
            className="border border-brand-500/20 h-full"
          >
            {!recData?.recommendations || recData.recommendations.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <Sparkles className="w-8 h-8 text-brand-400 mx-auto animate-pulse" />
                <p className="text-sm text-slate-400 font-medium">
                  No recommendation cached yet for this customer.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  loading={generating}
                  onClick={handleGenerateRecommendations}
                >
                  Generate AI Recommendations
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recData.recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-2 hover:border-brand-500/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-brand-600/30 text-brand-300 font-bold text-xs flex items-center justify-center">
                          {rec.priority}
                        </span>
                        <h4 className="text-sm font-semibold text-white">{rec.action}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="brand" size="sm">
                          {rec.channel?.toUpperCase()}
                        </Badge>
                        {rec.needs_approval && (
                          <Badge variant="warning" size="sm">
                            Needs Approval
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                      <span>
                        <strong className="text-slate-300">Timing:</strong> {rec.timing}
                      </span>
                      <span>
                        <strong className="text-slate-300">Expected Impact:</strong>{' '}
                        {rec.expected_impact}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Interaction History Timeline */}
      <Card
        title="Interaction History Timeline"
        description="Chronological record of all tickets raised across web, chat, email, and social"
      >
        {tickets.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No interactions recorded.</p>
        ) : (
          <div className="space-y-4">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="p-4 rounded-xl bg-slate-900/40 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">#{t.id.slice(0, 8)}</span>
                    <Link
                      to={`/tickets/${t.id}`}
                      className="text-sm font-semibold text-white hover:text-brand-300 transition-colors"
                    >
                      {t.subject}
                    </Link>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="capitalize">{t.domain.replace('_', ' ')}</span>
                    <span>•</span>
                    <span className="capitalize">Channel: {t.channel}</span>
                    <span>•</span>
                    <span>{formatDate(t.created_at)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant={t.status === 'resolved' ? 'success' : 'default'}
                    size="sm"
                  >
                    {t.status.toUpperCase()}
                  </Badge>
                  {t.analysis?.urgency && (
                    <Badge
                      variant={t.analysis.urgency === 'critical' ? 'danger' : 'default'}
                      size="sm"
                    >
                      {t.analysis.urgency.toUpperCase()}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
