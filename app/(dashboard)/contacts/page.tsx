'use client';

import { useEffect, useState } from 'react';
import { Search, RefreshCw, Play, Pause } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  NEW_LEAD: 'bg-gray-700 text-gray-300',
  DRIP_ACTIVE: 'bg-blue-900 text-blue-300',
  REPLIED: 'bg-green-900 text-green-300',
  QUALIFIED: 'bg-emerald-900 text-emerald-300',
  FOLLOW_UP_POOL: 'bg-teal-900 text-teal-300',
  DEAL_SENT: 'bg-purple-900 text-purple-300',
  DEAL_UNDER_REVIEW: 'bg-yellow-900 text-yellow-300',
  CLOSED_WON: 'bg-green-800 text-green-200',
  CLOSED_LOST: 'bg-red-900 text-red-300',
};

const STATUS_LABELS: Record<string, string> = {
  NEW_LEAD: 'New Lead',
  DRIP_ACTIVE: 'Drip Active',
  REPLIED: 'Replied',
  QUALIFIED: 'Qualified',
  FOLLOW_UP_POOL: 'Nurture',
  DEAL_SENT: 'Deal Sent',
  DEAL_UNDER_REVIEW: 'Under Review',
  CLOSED_WON: 'Closed Won',
  CLOSED_LOST: 'Closed Lost',
};

interface Lead {
  id: string;
  name: string;
  phone: string;
  status: string;
  campaignType: string;
  enrolledAt: string | null;
  lastContactAt: string | null;
  optedOut: boolean;
  campaignState: { currentStep: number; isPaused: boolean; isActive: boolean } | null;
  messages: { body: string; createdAt: string }[];
}

export default function ContactsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [enrolling, setEnrolling] = useState<string | null>(null);

  const fetchLeads = (status = statusFilter) => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '100' });
    if (status) params.set('status', status);
    fetch(`/api/leads?${params}`)
      .then((r) => r.json())
      .then((d) => { setLeads(d.leads); setTotal(d.total); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchLeads(); }, [statusFilter]);

  const enroll = async (leadId: string, campaignType: 'DRIP' | 'NURTURE') => {
    setEnrolling(leadId);
    await fetch('/api/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId, campaignType }),
    });
    setEnrolling(null);
    fetchLeads();
  };

  const filtered = leads.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search)
  );

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Contacts</h1>
          <p className="text-sm text-gray-400 mt-1">{total} total leads</p>
        </div>
        <button
          onClick={() => fetchLeads()}
          className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-sm text-white rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or phone..."
            className="w-full pl-9 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
        >
          <option value="">All Statuses</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Phone</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Step</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Last Contact</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Last Message</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No contacts found</td></tr>
              ) : filtered.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-white">
                    {lead.name}
                    {lead.optedOut && <span className="ml-2 text-xs bg-red-900 text-red-300 px-1.5 py-0.5 rounded">Opted Out</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-300 font-mono">{lead.phone}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${STATUS_COLORS[lead.status] ?? 'bg-gray-700 text-gray-300'}`}>
                      {STATUS_LABELS[lead.status] ?? lead.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {lead.campaignState ? (
                      <span className="flex items-center gap-1">
                        {lead.campaignState.isPaused ? <Pause className="w-3 h-3 text-yellow-400" /> : <Play className="w-3 h-3 text-green-400" />}
                        {lead.campaignType === 'DRIP' ? `Drip ${lead.campaignState.currentStep}/5` : `Nurture ${lead.campaignState.currentStep}`}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {lead.lastContactAt ? new Date(lead.lastContactAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs max-w-xs truncate">
                    {lead.messages[0]?.body ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!lead.optedOut && lead.status === 'QUALIFIED' && (
                      <button
                        onClick={() => enroll(lead.id, 'NURTURE')}
                        disabled={enrolling === lead.id}
                        className="text-xs px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-md transition-colors disabled:opacity-50"
                      >
                        {enrolling === lead.id ? '...' : 'Start Nurture'}
                      </button>
                    )}
                    {!lead.optedOut && lead.status === 'NEW_LEAD' && (
                      <button
                        onClick={() => enroll(lead.id, 'DRIP')}
                        disabled={enrolling === lead.id}
                        className="text-xs px-2.5 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded-md transition-colors disabled:opacity-50"
                      >
                        {enrolling === lead.id ? '...' : 'Start Drip'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
