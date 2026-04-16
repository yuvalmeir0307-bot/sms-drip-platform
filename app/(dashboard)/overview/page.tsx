'use client';

import { useEffect, useState } from 'react';
import { MessageSquare, Users, TrendingUp, AlertCircle, Send, CheckCircle } from 'lucide-react';

interface Analytics {
  totalLeads: number;
  activeLeads: number;
  repliedLeads: number;
  qualifiedLeads: number;
  optedOutLeads: number;
  totalMessages: number;
  deliveredMessages: number;
  failedMessages: number;
  todayMessages: number;
  deliveryRate: number;
  replyRate: number;
  optOutRate: number;
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400">{label}</p>
          <p className="mt-1 text-2xl font-bold text-white">{value}</p>
          {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
        </div>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function OverviewPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-800 rounded w-48" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <div key={i} className="h-28 bg-gray-800 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  const stats = data ?? ({} as Analytics);

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Overview</h1>
        <p className="text-sm text-gray-400 mt-1">Real-time campaign performance</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Leads" value={stats.totalLeads ?? 0} icon={Users} color="bg-blue-600" />
        <StatCard label="Active in Drip" value={stats.activeLeads ?? 0} icon={Send} color="bg-indigo-600" />
        <StatCard label="Replied" value={stats.repliedLeads ?? 0} icon={MessageSquare} color="bg-green-600" />
        <StatCard label="Qualified" value={stats.qualifiedLeads ?? 0} icon={TrendingUp} color="bg-emerald-600" />
        <StatCard label="Sent Today" value={stats.todayMessages ?? 0} sub="of 500 daily cap" icon={Send} color="bg-violet-600" />
        <StatCard label="Delivery Rate" value={`${stats.deliveryRate ?? 0}%`} icon={CheckCircle} color="bg-cyan-600" />
        <StatCard label="Reply Rate" value={`${stats.replyRate ?? 0}%`} icon={TrendingUp} color="bg-teal-600" />
        <StatCard label="Opt-Outs" value={stats.optedOutLeads ?? 0} icon={AlertCircle} color="bg-red-600" />
      </div>

      {/* Daily cap bar */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-white">Daily Send Volume</span>
          <span className="text-sm text-gray-400">{stats.todayMessages ?? 0} / 500</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all"
            style={{ width: `${Math.min(((stats.todayMessages ?? 0) / 500) * 100, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">Twilio Messaging Service — rate limited to 10 SMS/min</p>
      </div>

      {/* Campaign status breakdown */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Pipeline Breakdown</h2>
        <div className="space-y-3">
          {[
            { label: 'Drip Active', count: stats.activeLeads ?? 0, color: 'bg-blue-500' },
            { label: 'Replied', count: stats.repliedLeads ?? 0, color: 'bg-green-500' },
            { label: 'Qualified / Nurture', count: stats.qualifiedLeads ?? 0, color: 'bg-emerald-500' },
            { label: 'Opted Out', count: stats.optedOutLeads ?? 0, color: 'bg-red-500' },
          ].map(({ label, count, color }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="text-sm text-gray-400 w-40">{label}</span>
              <div className="flex-1 bg-gray-800 rounded-full h-2">
                <div
                  className={`${color} h-2 rounded-full`}
                  style={{ width: `${Math.max((count / Math.max(stats.totalLeads ?? 1, 1)) * 100, 2)}%` }}
                />
              </div>
              <span className="text-sm text-white w-8 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
