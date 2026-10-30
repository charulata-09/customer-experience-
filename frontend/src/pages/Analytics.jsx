import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Ticket,
  Smile,
  Flame,
  Clock,
  Layers,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
} from 'lucide-react';
import { api } from '../api/axios';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';

const URGENCY_COLORS = {
  low: '#10b981',
  medium: '#3b82f6',
  high: '#f59e0b',
  critical: '#f43f5e',
};

const CHANNEL_COLORS = ['#6366f1', '#06b6d4', '#ec4899', '#8b5cf6', '#10b981'];

export const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState(null);
  const [trend, setTrend] = useState([]);
  const [categories, setCategories] = useState([]);
  const [urgency, setUrgency] = useState([]);
  const [channels, setChannels] = useState([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const [kpiRes, trendRes, catRes, urgRes, chanRes] = await Promise.all([
          api.get('/analytics/overview'),
          api.get('/analytics/sentiment-trend'),
          api.get('/analytics/categories'),
          api.get('/analytics/urgency'),
          api.get('/analytics/channels'),
        ]);

        setKpis(kpiRes?.data || null);
        setTrend(trendRes?.data || []);
        setCategories(catRes?.data || []);
        setUrgency(urgRes?.data || []);
        setChannels(chanRes?.data || []);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Experience Analytics"
        description="Holistic performance metrics, sentiment velocity, and channel distribution intelligence."
      />

      {/* KPI Highlights Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Volume
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
              <p className="text-[11px] text-slate-400 mt-1">Interactions tracked</p>
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
              <p className="text-[11px] text-slate-400 mt-1">Scale -1.0 to +1.0</p>
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
              <p className="text-[11px] text-slate-400 mt-1">Based on resolved tickets</p>
            </div>
          )}
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Avg Resolution
            </span>
            <Clock className="w-5 h-5 text-blue-400" />
          </div>
          {loading ? (
            <Skeleton className="h-8 w-16 mt-3" />
          ) : (
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-white">
                {kpis?.avgResolutionHours ?? 0}h
              </span>
              <p className="text-[11px] text-slate-400 mt-1">Mean turnaround time</p>
            </div>
          )}
        </Card>

        <Card className="p-4 sm:p-5 border-rose-500/20 bg-rose-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-300 uppercase tracking-wider">
              High Churn Risk
            </span>
            <Flame className="w-5 h-5 text-rose-400" />
          </div>
          {loading ? (
            <Skeleton className="h-8 w-16 mt-3" />
          ) : (
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-rose-400">
                {kpis?.highChurnRiskCount ?? 0}
              </span>
              <p className="text-[11px] text-rose-300/80 mt-1">Churn risk ≥ 70%</p>
            </div>
          )}
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment Trend Chart */}
        <Card
          title="Sentiment Velocity Over Time"
          description="Average customer emotional sentiment trend"
          className="border border-white/5"
        >
          {loading ? (
            <Skeleton className="h-72 w-full" />
          ) : trend.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-xs text-slate-500">
              No trend data available
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                  <YAxis domain={[-1, 1]} stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgSentiment"
                    stroke="#6366f1"
                    strokeWidth={3}
                    dot={{ fill: '#6366f1', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Categories Bar Chart */}
        <Card
          title="Interactions by Category"
          description="Volume breakdown across detected problem domains"
          className="border border-white/5"
        >
          {loading ? (
            <Skeleton className="h-72 w-full" />
          ) : categories.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-xs text-slate-500">
              No category data available
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categories}
                  margin={{ top: 10, right: 20, left: -20, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="category"
                    stroke="#64748b"
                    fontSize={10}
                    tickFormatter={(val) => val.replace('_', ' ')}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" fill="#818cf8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Urgency Donut Chart */}
        <Card
          title="Urgency Distribution"
          description="Severity balance across incoming queues"
          className="border border-white/5"
        >
          {loading ? (
            <Skeleton className="h-72 w-full" />
          ) : urgency.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-xs text-slate-500">
              No urgency data available
            </div>
          ) : (
            <div className="h-72 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={urgency}
                    dataKey="count"
                    nameKey="urgency"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                  >
                    {urgency.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={URGENCY_COLORS[entry.urgency] || '#6366f1'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    formatter={(val) => <span className="text-xs text-slate-300 capitalize">{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Channel Mix Pie Chart */}
        <Card
          title="Omnichannel Intake Mix"
          description="Distribution by communication origin"
          className="border border-white/5"
        >
          {loading ? (
            <Skeleton className="h-72 w-full" />
          ) : channels.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-xs text-slate-500">
              No channel data available
            </div>
          ) : (
            <div className="h-72 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={channels}
                    dataKey="count"
                    nameKey="channel"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                  >
                    {channels.map((entry, index) => (
                      <Cell
                        key={`channel-${index}`}
                        fill={CHANNEL_COLORS[index % CHANNEL_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    formatter={(val) => <span className="text-xs text-slate-300 capitalize">{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
