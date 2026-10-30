import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Ticket,
  PlusCircle,
  MessageSquare,
  AlertTriangle,
  TrendingUp,
  Smile,
  Flame,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/axios';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { PageHeader } from '../components/layout/PageHeader';
import { Skeleton } from '../components/ui/Skeleton';
import { formatTimeAgo } from '../lib/formatters';

export const Dashboard = () => {
  const { user, isStaff, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [kpis, setKpis] = useState(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        if (isStaff) {
          // Fetch KPIs and urgent queue for staff
          const [kpisRes, ticketsRes] = await Promise.all([
            api.get('/analytics/overview').catch(() => ({ data: null })),
            api.get('/tickets?limit=8').catch(() => ({ data: { tickets: [] } })),
          ]);
          setKpis(kpisRes?.data || null);
          setTickets(ticketsRes?.data?.tickets || []);
        } else {
          // Fetch customer's own recent tickets
          const response = await api.get('/tickets?limit=8').catch(() => ({ data: { tickets: [] } }));
          setTickets(response?.data?.tickets || []);
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [isStaff]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.full_name || 'User'}!`}
        description={
          isStaff
            ? 'Unified CX operations console with real-time AI triage and churn prevention.'
            : 'Track your support inquiries or connect instantly with our AI Support Assistant.'
        }
        action={
          isStaff ? (
            <Link to="/tickets">
              <Button variant="primary" size="sm" icon={Ticket}>
                View All Tickets
              </Button>
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/chat">
                <Button variant="secondary" size="sm" icon={MessageSquare}>
                  AI Support Chat
                </Button>
              </Link>
              <Link to="/tickets/new">
                <Button variant="primary" size="sm" icon={PlusCircle}>
                  New Ticket
                </Button>
              </Link>
            </div>
          )
        }
      />

      {/* Staff KPI Summary Cards */}
      {isStaff && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Queue
              </span>
              <Ticket className="w-5 h-5 text-brand-400" />
            </div>
            {loading ? (
              <Skeleton className="h-8 w-16 mt-3" />
            ) : (
              <div className="mt-3">
                <span className="text-2xl sm:text-3xl font-extrabold text-white">
                  {kpis?.totalTickets ?? 0}
                </span>
                <span className="text-xs text-slate-400 ml-2">
                  ({kpis?.openTickets ?? 0} open)
                </span>
              </div>
            )}
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Avg Sentiment
              </span>
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            {loading ? (
              <Skeleton className="h-8 w-16 mt-3" />
            ) : (
              <div className="mt-3">
                <span
                  className={`text-2xl sm:text-3xl font-extrabold ${
                    (kpis?.avgSentimentScore ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {kpis?.avgSentimentScore !== undefined ? kpis.avgSentimentScore : '0.00'}
                </span>
                <span className="text-xs text-slate-400 ml-2">(-1 to +1)</span>
              </div>
            )}
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                CSAT Score
              </span>
              <Smile className="w-5 h-5 text-amber-400" />
            </div>
            {loading ? (
              <Skeleton className="h-8 w-16 mt-3" />
            ) : (
              <div className="mt-3">
                <span className="text-2xl sm:text-3xl font-extrabold text-white">
                  {kpis?.avgCsat ?? 'N/A'}
                </span>
                <span className="text-xs text-slate-400 ml-2">/ 5.0 stars</span>
              </div>
            )}
          </Card>

          <Card className="p-4 sm:p-5 border-rose-500/20 bg-rose-500/5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-300 uppercase tracking-wider">
                High Churn Risk
              </span>
              <Flame className="w-5 h-5 text-rose-400 animate-pulse" />
            </div>
            {loading ? (
              <Skeleton className="h-8 w-16 mt-3" />
            ) : (
              <div className="mt-3">
                <span className="text-2xl sm:text-3xl font-extrabold text-rose-400">
                  {kpis?.highChurnRiskCount ?? 0}
                </span>
                <span className="text-xs text-rose-300/80 ml-2">requiring urgent focus</span>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Recent Tickets Section */}
      <Card
        title={isStaff ? 'High-Priority Interaction Queue' : 'My Support Tickets'}
        description={
          isStaff
            ? 'Real-time feed sorted by urgency, sentiment, and churn risk.'
            : 'Track responses, provide ratings, and follow up on your requests.'
        }
        action={
          <Link
            to="/tickets"
            className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        }
      >
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-8 text-center space-y-3">
            <Ticket className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm text-slate-400 font-medium">No active tickets found.</p>
            {!isStaff && (
              <Link to="/tickets/new">
                <Button variant="primary" size="sm" icon={PlusCircle}>
                  Create your first ticket
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/5 -mx-5 -mb-5">
            {tickets.map((t) => {
              const urgency = t.analysis?.urgency || 'medium';
              const churn = t.analysis?.churn_risk ?? 0;

              return (
                <Link
                  key={t.id}
                  to={`/tickets/${t.id}`}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors block"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-slate-400">#{t.id.slice(0, 8)}</span>
                      <h4 className="text-sm font-semibold text-white truncate max-w-md">
                        {t.subject}
                      </h4>
                      <Badge
                        variant={
                          t.status === 'resolved'
                            ? 'success'
                            : t.status === 'open'
                            ? 'info'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {t.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                      <span className="capitalize">{t.domain.replace('_', ' ')}</span>
                      <span>•</span>
                      <span className="capitalize">{t.channel}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(t.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {/* Urgency Badge */}
                    <Badge
                      variant={
                        urgency === 'critical'
                          ? 'danger'
                          : urgency === 'high'
                          ? 'warning'
                          : 'default'
                      }
                      size="sm"
                      dot
                    >
                      {urgency.toUpperCase()}
                    </Badge>

                    {/* Churn Tag for staff */}
                    {isStaff && churn >= 50 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                        <Flame className="w-3 h-3 text-rose-400" />
                        {churn}% Churn
                      </span>
                    )}

                    <ArrowRight className="w-4 h-4 text-slate-500" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};
