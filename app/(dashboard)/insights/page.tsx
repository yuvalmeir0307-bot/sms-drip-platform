'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, MessageSquare, AlertCircle, CheckCircle, XCircle, Users } from 'lucide-react';

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

function MetricRow({ label, value, sub, icon: Icon, iconColor }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; iconColor: string;
}) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-gray-800 last:border-0">
      <div className={`p-2 rounded-lg bg-gray-800`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <div className="flex-1">
        <p className="text-sm text-white font-medium">{label}</p>
        {sub && <p className="text-xs text-gray-500">{sub}</p>}
      </div>
      <p className="text-lg font-bold text-white">{value}</p>
    </div>
  );
}

export default function InsightsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const d = data ?? ({} as Analytics);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-800 rounded w-40" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => <div key={i} className="h-64 bg-gray-800 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Insights</h1>
        <p className="text-sm text-gray-400 mt-1">Campaign analytics and performance metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Delivery */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">SMS Delivery</h2>
          <MetricRow label="Total Sent" value={d.totalMessages ?? 0} icon={MessageSquare} iconColor="text-blue-400" />
          <MetricRow label="Delivered" value={d.deliveredMessages ?? 0} sub={`${d.deliveryRate ?? 0}% rate`} icon={CheckCircle} iconColor="text-green-400" />
          <MetricRow label="Failed" value={d.failedMessages ?? 0} icon={XCircle} iconColor="text-red-400" />
          <MetricRow label="Sent Today" value={d.todayMessages ?? 0} sub="daily cap: 500" icon={TrendingUp} iconColor="text-indigo-400" />
        </div>

        {/* Engagement */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Engagement</h2>
          <MetricRow label="Total Leads" value={d.totalLeads ?? 0} icon={Users} iconColor="text-blue-400" />
          <MetricRow label="Replied" value={d.repliedLeads ?? 0} sub={`${d.replyRate ?? 0}% reply rate`} icon={MessageSquare} iconColor="text-green-400" />
          <MetricRow label="Qualified" value={d.qualifiedLeads ?? 0} sub="in nurture pool" icon={TrendingUp} iconColor="text-emerald-400" />
          <MetricRow label="Opted Out" value={d.optedOutLeads ?? 0} sub={`${d.optOutRate ?? 0}% opt-out rate`} icon={AlertCircle} iconColor="text-red-400" />
        </div>

        {/* Funnel */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 md:col-span-2">
          <h2 className="text-sm font-semibold text-white mb-5">Lead Funnel</h2>
          <div className="flex items-end gap-2 h-40">
            {[
              { label: 'Total', value: d.totalLeads ?? 0, color: 'bg-blue-600' },
              { label: 'Drip Active', value: d.activeLeads ?? 0, color: 'bg-indigo-600' },
              { label: 'Replied', value: d.repliedLeads ?? 0, color: 'bg-green-600' },
              { label: 'Qualified', value: d.qualifiedLeads ?? 0, color: 'bg-emerald-600' },
              { label: 'Opted Out', value: d.optedOutLeads ?? 0, color: 'bg-red-600' },
            ].map(({ label, value, color }) => {
              const max = d.totalLeads ?? 1;
              const pct = Math.max((value / Math.max(max, 1)) * 100, 4);
              return (
                <div key={label} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs font-semibold text-white">{value}</span>
                  <div className="w-full flex items-end" style={{ height: '120px' }}>
                    <div
                      className={`w-full rounded-t-md ${color} transition-all`}
                      style={{ height: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 text-center leading-tight">{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
