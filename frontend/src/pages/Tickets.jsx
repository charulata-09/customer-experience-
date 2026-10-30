import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Ticket,
  Search,
  Filter,
  PlusCircle,
  Flame,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/axios';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { Pagination } from '../components/ui/Pagination';
import { EmptyState } from '../components/ui/EmptyState';
import { formatTimeAgo } from '../lib/formatters';
import { DOMAINS, CHANNELS, URGENCIES, SENTIMENTS, TICKET_STATUSES } from '../lib/constants';

export const Tickets = () => {
  const { user, isStaff } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Filter states
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [domain, setDomain] = useState(searchParams.get('domain') || '');
  const [urgency, setUrgency] = useState(searchParams.get('urgency') || '');
  const [channel, setChannel] = useState(searchParams.get('channel') || '');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '10');
      if (q) params.set('q', q);
      if (status) params.set('status', status);
      if (domain) params.set('domain', domain);
      if (urgency) params.set('urgency', urgency);
      if (channel) params.set('channel', channel);

      setSearchParams(params);

      const response = await api.get(`/tickets?${params.toString()}`);
      if (response?.data) {
        setTickets(response.data.tickets || []);
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      }
    } catch (err) {
      console.error('Failed to query tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [page, status, domain, urgency, channel]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTickets();
  };

  const resetFilters = () => {
    setQ('');
    setStatus('');
    setDomain('');
    setUrgency('');
    setChannel('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={isStaff ? 'Omnichannel Support Queue' : 'My Support Tickets'}
        description={
          isStaff
            ? 'Unified interaction list with real-time sentiment, category, and urgency prioritization.'
            : 'View, track, and interact with all your submitted support tickets.'
        }
        action={
          !isStaff && (
            <Link to="/tickets/new">
              <Button variant="primary" size="sm" icon={PlusCircle}>
                New Ticket
              </Button>
            </Link>
          )
        }
      />

      {/* Filter and Search Bar */}
      <Card className="p-4 sm:p-5 border border-white/5 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full">
            <Input
              placeholder="Search by subject or message content..."
              icon={Search}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Button type="submit" variant="secondary" size="md" icon={Filter} className="w-full sm:w-auto">
            Search
          </Button>
          {(q || status || domain || urgency || channel) && (
            <Button
              type="button"
              variant="ghost"
              size="md"
              icon={RotateCcw}
              onClick={resetFilters}
              className="text-xs text-slate-400"
            >
              Reset
            </Button>
          )}
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/5">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">All Statuses</option>
            {TICKET_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <select
            value={domain}
            onChange={(e) => {
              setDomain(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">All Domains</option>
            {DOMAINS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>

          <select
            value={urgency}
            onChange={(e) => {
              setUrgency(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">All Urgencies</option>
            {URGENCIES.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>

          <select
            value={channel}
            onChange={(e) => {
              setChannel(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">All Channels</option>
            {CHANNELS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Ticket List Table */}
      <Card className="border border-white/5 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <EmptyState
            icon={Ticket}
            title="No tickets found matching criteria"
            description="Try modifying your active filter selection or reset to view all interactions."
            actionLabel="Reset Filters"
            onAction={resetFilters}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-slate-900/50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Subject & Channel</th>
                  {isStaff && <th className="py-3.5 px-4">Customer</th>}
                  <th className="py-3.5 px-4">Domain</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Urgency</th>
                  <th className="py-3.5 px-4">Sentiment</th>
                  {isStaff && <th className="py-3.5 px-4">Churn</th>}
                  <th className="py-3.5 px-4 sm:px-6 text-right">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {tickets.map((t) => {
                  const urgency = t.analysis?.urgency || 'medium';
                  const sentiment = t.analysis?.sentiment || 'neutral';
                  const churn = t.analysis?.churn_risk ?? 0;

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                    >
                      <td className="py-4 px-4 sm:px-6 max-w-xs sm:max-w-md">
                        <Link to={`/tickets/${t.id}`} className="block">
                          <span className="font-mono text-xs text-slate-500">#{t.id.slice(0, 8)}</span>
                          <p className="font-semibold text-white group-hover:text-brand-300 transition-colors truncate">
                            {t.subject}
                          </p>
                          <span className="text-xs text-slate-400 capitalize inline-block mt-0.5">
                            via {t.channel}
                          </span>
                        </Link>
                      </td>

                      {isStaff && (
                        <td className="py-4 px-4 whitespace-nowrap">
                          <Link
                            to={`/customers/${t.customer_id}`}
                            className="text-xs font-medium text-slate-300 hover:text-brand-300 transition-colors"
                          >
                            {t.customer?.full_name || 'Customer'}
                          </Link>
                        </td>
                      )}

                      <td className="py-4 px-4 whitespace-nowrap text-xs text-slate-400 capitalize">
                        {t.domain.replace('_', ' ')}
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
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
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
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
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {sentiment.includes('positive') ? (
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                          ) : sentiment.includes('negative') ? (
                            <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                          ) : null}
                          <span
                            className={`text-xs capitalize font-medium ${
                              sentiment.includes('positive')
                                ? 'text-emerald-400'
                                : sentiment.includes('negative')
                                ? 'text-rose-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {sentiment.replace('_', ' ')}
                          </span>
                        </div>
                      </td>

                      {isStaff && (
                        <td className="py-4 px-4 whitespace-nowrap">
                          {churn >= 60 ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-400">
                              <Flame className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                              {churn}%
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">{churn}%</span>
                          )}
                        </td>
                      )}

                      <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap text-xs text-slate-400">
                        {formatTimeAgo(t.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 border-t border-white/5">
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      </Card>
    </div>
  );
};
