'use client';

import { useState } from 'react';
import { Save, Info } from 'lucide-react';

const DRIP_TEMPLATES = [
  {
    step: 1,
    label: 'SMS 1 — Initial Outreach',
    default: `Hi [Name], this is [Sender]. I'm looking to buy a house in the area, can you get back to me?`,
  },
  {
    step: 2,
    label: 'SMS 2 — Same Day Follow-up',
    default: `Hi, can you help me with this? Are you available for a quick call today?`,
  },
  {
    step: 3,
    label: 'SMS 3 — License Trigger (Day 2)',
    default: `Hi [Name], I wanted to verify — are you still active with your license or not anymore?`,
  },
  {
    step: 4,
    label: 'SMS 4 — Retry (Day 3)',
    default: `Hi, trying again — did you get my earlier message? Would love to connect.`,
  },
  {
    step: 5,
    label: 'SMS 5 — Final Close (Day 4)',
    default: `Hey, maybe you missed this — I'm a serious cash buyer looking in your area. Let me know if you have anything or know someone.`,
  },
];

const NURTURE_TEMPLATES = [
  { step: 1, label: 'Touch 1 — Pulse Check (Day 7)', default: `Hi [Name], enjoyed talking last week. Anything interesting come up since?` },
  { step: 2, label: 'Touch 2 — Market Insight (Day 14-21)', default: `Hi [Name], what do you think about interest rates/the economy right now? Should I keep buying or wait?` },
  { step: 3, label: 'Touch 3 — Value Add (Day 30)', default: `Hi [Name], if you ever need a recommendation for a contractor or cleaner for your clients, let me know — happy to help.` },
  { step: 4, label: 'Touch 4 — Deal Ask (Day 45)', default: `By the way [Name], do you have anything dirty/neglected coming to market soon? I'm ready to buy cash.` },
];

function InputField({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
      />
    </div>
  );
}

function TextareaField({ label, value, onChange, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; rows?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
      />
      <p className="text-xs text-gray-600 mt-1">{value.length} chars · Use [Name] and [Sender] as placeholders</p>
    </div>
  );
}

export default function SettingsPage() {
  const [senderName, setSenderName] = useState('');
  const [messagingServiceSid, setMessagingServiceSid] = useState('');
  const [notionDbId, setNotionDbId] = useState('');
  const [quietStart, setQuietStart] = useState('21');
  const [quietEnd, setQuietEnd] = useState('8');
  const [dripTemplates, setDripTemplates] = useState<Record<number, string>>(
    Object.fromEntries(DRIP_TEMPLATES.map((t) => [t.step, t.default]))
  );
  const [nurtureTemplates, setNurtureTemplates] = useState<Record<number, string>>(
    Object.fromEntries(NURTURE_TEMPLATES.map((t) => [t.step, t.default]))
  );
  const [saved, setSaved] = useState(false);

  const save = () => {
    // In production, POST to /api/settings
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-8 space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-gray-400 mt-1">Configure Twilio, Notion, and campaign templates</p>
      </div>

      {/* Twilio */}
      <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white">Twilio Configuration</h2>
        <InputField label="Sender Name (Your Name)" value={senderName} onChange={setSenderName} placeholder="e.g. David" />
        <InputField label="Messaging Service SID" value={messagingServiceSid} onChange={setMessagingServiceSid} placeholder="MG..." />
        <div className="flex items-start gap-2 p-3 bg-blue-950 border border-blue-900 rounded-lg">
          <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-300">Twilio credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) are set via environment variables in Railway and Vercel, not stored here.</p>
        </div>
      </section>

      {/* Notion */}
      <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white">Notion CRM</h2>
        <InputField label="Notion Database ID" value={notionDbId} onChange={setNotionDbId} placeholder="32-char database ID from your Notion URL" />
        <p className="text-xs text-gray-500">The poller checks this database every 2 minutes for leads with Status = "Drip Active".</p>
      </section>

      {/* Quiet Hours */}
      <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white">Quiet Hours</h2>
        <div className="grid grid-cols-2 gap-4">
          <InputField label="No SMS after (24h)" value={quietStart} onChange={setQuietStart} type="number" placeholder="21" />
          <InputField label="Resume at (24h)" value={quietEnd} onChange={setQuietEnd} type="number" placeholder="8" />
        </div>
        <p className="text-xs text-gray-500">Checked at job execution time — no SMS sent outside this window regardless of when it was queued.</p>
      </section>

      {/* Drip Templates */}
      <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-white">Drip Campaign Templates</h2>
        {DRIP_TEMPLATES.map((t) => (
          <TextareaField
            key={t.step}
            label={t.label}
            value={dripTemplates[t.step] ?? t.default}
            onChange={(v) => setDripTemplates((prev) => ({ ...prev, [t.step]: v }))}
          />
        ))}
      </section>

      {/* Nurture Templates */}
      <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-white">Nurture Campaign Templates</h2>
        {NURTURE_TEMPLATES.map((t) => (
          <TextareaField
            key={t.step}
            label={t.label}
            value={nurtureTemplates[t.step] ?? t.default}
            onChange={(v) => setNurtureTemplates((prev) => ({ ...prev, [t.step]: v }))}
          />
        ))}
      </section>

      <button
        onClick={save}
        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <Save className="w-4 h-4" />
        {saved ? 'Saved!' : 'Save Settings'}
      </button>
    </div>
  );
}
