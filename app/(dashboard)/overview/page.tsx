'use client';

import { useEffect, useState } from 'react';

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

const PIPELINE = [
  { key: 'activeLeads',    label: 'DRIP ACTIVE',  color: 'var(--accent)' },
  { key: 'repliedLeads',   label: 'REPLIED',       color: 'var(--green)' },
  { key: 'qualifiedLeads', label: 'QUALIFIED',     color: 'var(--teal)' },
  { key: 'optedOutLeads',  label: 'OPTED OUT',     color: 'var(--red)' },
];

function Metric({ code, label, value, unit, accent = false }: {
  code: string; label: string; value: string | number; unit?: string; accent?: boolean;
}) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: `1px solid ${accent ? 'var(--accent-dim)' : 'var(--border)'}`,
      borderRadius: '8px',
      padding: '18px 20px',
      position: 'relative',
      overflow: 'hidden',
      animation: 'fadeUp 0.4s ease forwards',
    }}>
      {accent && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
          background: 'var(--accent)',
        }} />
      )}
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.1em',
        color: accent ? 'var(--accent)' : 'var(--text-muted)', marginBottom: '10px',
      }}>
        {code} · {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
        <span style={{
          fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 700,
          color: accent ? 'var(--accent)' : 'var(--text-primary)', lineHeight: 1,
          letterSpacing: '-0.03em',
        }}>
          {value}
        </span>
        {unit && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

export default function OverviewPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const load = () =>
      fetch('/api/analytics')
        .then(r => r.json())
        .then(d => { setData(d); setLoading(false); })
        .catch(() => setLoading(false));
    load();
    const id = setInterval(() => { load(); setTick(t => t + 1); }, 30_000);
    return () => clearInterval(id);
  }, []);

  const d = data ?? ({} as Analytics);
  const capPct = Math.min(((d.todayMessages ?? 0) / 500) * 100, 100);

  if (loading) return (
    <div style={{ padding: '40px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px' }}>
      {[...Array(8)].map((_, i) => (
        <div key={i} style={{ height: '100px', background: 'var(--bg-surface)', borderRadius: '8px', opacity: 0.5 }} />
      ))}
    </div>
  );

  return (
    <div style={{ padding: '36px 40px', maxWidth: '1200px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--accent)', letterSpacing: '0.12em', marginBottom: '6px' }}>
            COMMAND CENTER
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)', margin: 0 }}>
            Overview
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="blink" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-secondary)', letterSpacing: '0.08em' }}>
            LIVE · AUTO-REFRESH 30s
          </span>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '24px' }}>
        <Metric code="M01" label="TOTAL LEADS"   value={d.totalLeads ?? 0} />
        <Metric code="M02" label="DRIP ACTIVE"   value={d.activeLeads ?? 0} accent />
        <Metric code="M03" label="REPLIED"        value={d.repliedLeads ?? 0} />
        <Metric code="M04" label="QUALIFIED"      value={d.qualifiedLeads ?? 0} />
        <Metric code="M05" label="SENT TODAY"     value={d.todayMessages ?? 0} unit="/ 500" />
        <Metric code="M06" label="DELIVERY RATE"  value={`${d.deliveryRate ?? 0}`} unit="%" />
        <Metric code="M07" label="REPLY RATE"     value={`${d.replyRate ?? 0}`} unit="%" />
        <Metric code="M08" label="OPTED OUT"      value={d.optedOutLeads ?? 0} />
      </div>

      {/* Daily Cap Bar */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px',
        padding: '20px 24px', marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.1em', color: 'var(--text-secondary)' }}>
            DAILY THROUGHPUT
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: capPct > 80 ? 'var(--red)' : 'var(--accent)' }}>
            {d.todayMessages ?? 0} / 500 MSG
          </span>
        </div>
        <div style={{ position: 'relative', height: '6px', background: 'var(--bg-raised)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: `${capPct}%`,
            background: capPct > 80 ? 'var(--red)' : 'var(--accent)',
            borderRadius: '3px',
            transition: 'width 0.6s ease',
            boxShadow: capPct > 0 ? `0 0 8px ${capPct > 80 ? 'var(--red)' : 'var(--accent)'}66` : 'none',
          }} />
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)', marginTop: '8px', letterSpacing: '0.05em' }}>
          RATE LIMITED — 10 SMS/MIN · TWILIO MESSAGING SERVICE
        </div>
      </div>

      {/* Pipeline Funnel */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px',
        padding: '20px 24px',
      }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: '18px' }}>
          LEAD PIPELINE
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {PIPELINE.map(({ key, label, color }) => {
            const count = (d as unknown as Record<string, number>)[key] ?? 0;
            const pct = d.totalLeads ? (count / d.totalLeads) * 100 : 0;
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', width: '90px', letterSpacing: '0.06em' }}>
                  {label}
                </span>
                <div style={{ flex: 1, height: '4px', background: 'var(--bg-raised)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${Math.max(pct, pct > 0 ? 1 : 0)}%`,
                    background: color, borderRadius: '2px',
                    boxShadow: `0 0 6px ${color}66`,
                    transition: 'width 0.8s ease',
                  }} />
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-primary)', width: '32px', textAlign: 'right' }}>
                  {count}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', width: '36px', textAlign: 'right' }}>
                  {pct.toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
