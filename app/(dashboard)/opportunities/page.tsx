'use client';

import { useEffect, useState } from 'react';
import { Phone, MessageSquare } from 'lucide-react';

const PIPELINE_STAGES = [
  { status: 'REPLIED', label: 'Replied', color: 'border-green-500', bg: 'bg-green-950' },
  { status: 'QUALIFIED', label: 'Qualified', color: 'border-emerald-500', bg: 'bg-emerald-950' },
  { status: 'FOLLOW_UP_POOL', label: 'Nurture Pool', color: 'border-teal-500', bg: 'bg-teal-950' },
  { status: 'DEAL_SENT', label: 'Deal Sent', color: 'border-purple-500', bg: 'bg-purple-950' },
  { status: 'DEAL_UNDER_REVIEW', label: 'Under Review', color: 'border-yellow-500', bg: 'bg-yellow-950' },
  { status: 'CLOSED_WON', label: 'Closed Won', color: 'border-green-400', bg: 'bg-green-900' },
  { status: 'CLOSED_LOST', label: 'Closed Lost', color: 'border-red-500', bg: 'bg-red-950' },
];

interface Lead {
  id: string;
  name: string;
  phone: string;
  status: string;
  repliedAt: string | null;
  lastContactAt: string | null;
  messages: { body: string; createdAt: string }[];
}

export default function OpportunitiesPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const oppStatuses = ['REPLIED', 'QUALIFIED', 'FOLLOW_UP_POOL', 'DEAL_SENT', 'DEAL_UNDER_REVIEW', 'CLOSED_WON', 'CLOSED_LOST'];
    Promise.all(
      oppStatuses.map((s) =>
        fetch(`/api/leads?status=${s}&limit=50`).then((r) => r.json())
      )
    ).then((results) => {
      setLeads(results.flatMap((r) => r.leads ?? []));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const byStatus = (status: string) => leads.filter((l) => l.status === status);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-800 rounded w-48" />
          <div className="flex gap-4 overflow-x-auto pb-4">
            {[...Array(7)].map((_, i) => <div key={i} className="w-64 h-80 bg-gray-800 rounded-xl flex-shrink-0" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Opportunities</h1>
        <p className="text-sm text-gray-400 mt-1">Deal pipeline — {leads.length} active opportunities</p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map(({ status, label, color, bg }) => {
          const stageLeads = byStatus(status);
          return (
            <div
              key={status}
              className={`flex-shrink-0 w-64 rounded-xl border-t-2 ${color} bg-gray-900 border border-gray-800 border-t-2`}
            >
              <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
                <span className="text-sm font-semibold text-white">{label}</span>
                <span className="text-xs bg-gray-800 text-gray-400 rounded-full px-2 py-0.5">{stageLeads.length}</span>
              </div>
              <div className="p-3 space-y-2 max-h-96 overflow-y-auto">
                {stageLeads.length === 0 ? (
                  <p className="text-xs text-gray-600 text-center py-4">No leads</p>
                ) : stageLeads.map((lead) => (
                  <div key={lead.id} className={`${bg} rounded-lg p-3 border border-gray-700`}>
                    <p className="text-sm font-medium text-white">{lead.name}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Phone className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-400 font-mono">{lead.phone}</span>
                    </div>
                    {lead.messages[0] && (
                      <div className="flex items-start gap-1 mt-2">
                        <MessageSquare className="w-3 h-3 text-gray-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-gray-500 line-clamp-2">{lead.messages[0].body}</p>
                      </div>
                    )}
                    {lead.repliedAt && (
                      <p className="text-xs text-gray-600 mt-2">
                        Replied {new Date(lead.repliedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
