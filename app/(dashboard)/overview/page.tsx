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
  { key: 'activeLeads',    label: 'Drip Active', color: 'var(--accent)' },
  { key: 'repliedLeads',   label: 'Replied',     color: 'var(--green)' },
  { key: 'qualifiedLeads', label: 'Qualified',   color: 'var(--teal)' },
  { key: 'optedOutLeads',  label: 'Opted Out',   color: 'var(--red)' },
];

/* ── KPI Card ─────────────────────────────────────────────────────── */
function KpiCard({
  label,
  value,
  unit,
  sublabel,
  accentBorder = false,
  hero = false,
}: {
  label: string;
  value: string | number;
  unit?: string;
  sublabel?: string;
  accentBorder?: boolean;
  hero?: boolean;
}) {
  if (hero) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
        borderRadius: '12px',
        padding: '22px 24px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 14px rgba(59,130,246,0.35)',
        animation: 'fadeUp 0.4s ease forwards',
      }}>
        {/* subtle pattern overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.7)',
          marginBottom: '10px',
        }}>
          {label}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '36px',
            fontWeight: 800,
            color: '#ffffff',
            lineHeight: 1,
            letterSpacing: '-0.03em',
          }}>
            {value}
          </span>
          {unit && (
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'rgba(255,255,255,0.6)',
            }}>
              {unit}
            </span>
          )}
        </div>
        {sublabel && (
          <div style={{
            fontFamily: 'var(--font-body)',
            fontSize: '12px',
            color: 'rgba(255,255,255,0.6)',
            marginTop: '6px',
            fontWeight: 500,
          }}>
            {sublabel}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '22px 24px',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
      animation: 'fadeUp 0.4s ease forwards',
      borderLeft: accentBorder ? '4px solid var(--accent)' : '1px solid var(--border)',
    }}>
      <div style={{
        fontFamily: 'var(--font-body)',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        marginBottom: '10px',
      }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: '32px',
          fontWeight: 800,
          color: 'var(--text-primary)',
          lineHeight: 1,
          letterSpacing: '-0.03em',
        }}>
          {value}
        </span>
        {unit && (
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            color: 'var(--text-muted)',
          }}>
            {unit}
          </span>
        )}
      </div>
      {sublabel && (
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: '12px',
          color: 'var(--text-muted)',
          marginTop: '6px',
          fontWeight: 500,
        }}>
          {sublabel}
        </div>
      )}
    </div>
  );
}

/* ── Loading Skeleton ─────────────────────────────────────────────── */
function LoadingSkeleton() {
  return (
    <div style={{ padding: '36px 40px', maxWidth: '1200px' }}>
      {/* Header skeleton */}
      <div style={{ marginBottom: '32px' }}>
        <div className="skeleton" style={{ width: '120px', height: '14px', marginBottom: '10px' }} />
        <div className="skeleton" style={{ width: '200px', height: '28px' }} />
      </div>
      {/* KPI grid skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: '110px', borderRadius: '12px' }} />
        ))}
      </div>
      {/* Bar cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="skeleton" style={{ height: '90px', borderRadius: '12px' }} />
        <div className="skeleton" style={{ height: '160px', borderRadius: '12px' }} />
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────── */
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

  if (loading) return <LoadingSkeleton />;

  const d = data ?? ({} as Analytics);
  const capPct = Math.min(((d.todayMessages ?? 0) / 500) * 100, 100);

  return (
    <div style={{ padding: '36px 40px', maxWidth: '1200px' }}>

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginBottom: '32px',
      }}>
        <div>
          <div style={{
            fontFamily: 'var(--font-body)',
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--accent)',
            marginBottom: '6px',
          }}>
            Dashboard
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '28px',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--text-primary)',
            margin: 0,
            lineHeight: 1.2,
          }}>
            Overview
          </h1>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            color: 'var(--text-secondary)',
            margin: '4px 0 0',
            fontWeight: 400,
          }}>
            Real-time campaign performance
          </p>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '8px 14px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        }}>
          <span
            className="blink"
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: 'var(--green)',
              display: 'inline-block',
              flexShrink: 0,
            }}
          />
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: '12px',
            fontWeight: 500,
            color: 'var(--text-secondary)',
          }}>
            Live · refreshes every 30s
          </span>
        </div>
      </div>

      {/* ── KPI Grid ──────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
        marginBottom: '20px',
      }}>
        <KpiCard label="Total Leads"   value={d.totalLeads ?? 0} />
        <KpiCard label="Drip Active"   value={d.activeLeads ?? 0}    hero />
        <KpiCard label="Replied"       value={d.repliedLeads ?? 0}   accentBorder />
        <KpiCard label="Qualified"     value={d.qualifiedLeads ?? 0} />
        <KpiCard
          label="Sent Today"
          value={d.todayMessages ?? 0}
          unit="/ 500"
          sublabel="Daily cap"
        />
        <KpiCard
          label="Delivery Rate"
          value={`${d.deliveryRate ?? 0}`}
          unit="%"
          sublabel="Messages delivered"
        />
        <KpiCard
          label="Reply Rate"
          value={`${d.replyRate ?? 0}`}
          unit="%"
          sublabel="Leads replied"
        />
        <KpiCard
          label="Opted Out"
          value={d.optedOutLeads ?? 0}
          sublabel={`${d.optOutRate ?? 0}% opt-out rate`}
        />
      </div>

      {/* ── Daily Cap Bar ─────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '22px 24px',
        marginBottom: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '14px',
        }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '2px',
            }}>
              Daily Throughput
            </div>
            <div style={{
              fontFamily: 'var(--font-body)',
              fontSize: '12px',
              color: 'var(--text-muted)',
              fontWeight: 400,
            }}>
              Rate limited — 10 SMS/min via Twilio
            </div>
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            fontWeight: 500,
            color: capPct > 80 ? 'var(--red)' : 'var(--accent)',
            background: capPct > 80 ? '#fee2e2' : 'var(--accent-glow)',
            padding: '4px 12px',
            borderRadius: '6px',
          }}>
            {d.todayMessages ?? 0} / 500
          </div>
        </div>
        <div style={{
          position: 'relative',
          height: '8px',
          background: 'var(--bg-raised)',
          borderRadius: '99px',
          overflow: 'hidden',
          border: '1px solid var(--border)',
        }}>
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${capPct}%`,
            background: capPct > 80
              ? 'linear-gradient(90deg, var(--red), #f87171)'
              : 'linear-gradient(90deg, #2563eb, var(--accent))',
            borderRadius: '99px',
            transition: 'width 0.6s ease',
          }} />
        </div>
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: '12px',
          color: 'var(--text-muted)',
          marginTop: '8px',
          fontWeight: 500,
        }}>
          {capPct.toFixed(0)}% of daily limit used
        </div>
      </div>

      {/* ── Pipeline Funnel ───────────────────────────────────────────── */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '22px 24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}>
          <div style={{
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}>
            Lead Pipeline
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--text-muted)',
          }}>
            {d.totalLeads ?? 0} total
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {PIPELINE.map(({ key, label, color }) => {
            const count = (d as unknown as Record<string, number>)[key] ?? 0;
            const pct = d.totalLeads ? (count / d.totalLeads) * 100 : 0;
            return (
              <div key={key}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: color,
                      flexShrink: 0,
                    }} />
                    <span style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: 'var(--text-secondary)',
                    }}>
                      {label}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                    }}>
                      {pct.toFixed(0)}%
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '14px',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      minWidth: '32px',
                      textAlign: 'right',
                    }}>
                      {count}
                    </span>
                  </div>
                </div>
                <div style={{
                  height: '6px',
                  background: 'var(--bg-raised)',
                  borderRadius: '99px',
                  overflow: 'hidden',
                  border: '1px solid var(--border-dim)',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.max(pct, pct > 0 ? 0.5 : 0)}%`,
                    background: color,
                    borderRadius: '99px',
                    transition: 'width 0.8s ease',
                    opacity: 0.85,
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
