'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Target, BarChart3, Settings, Zap } from 'lucide-react';

const NAV = [
  { href: '/overview',       label: 'Overview',       icon: LayoutDashboard, code: '01' },
  { href: '/contacts',       label: 'Contacts',       icon: Users,           code: '02' },
  { href: '/opportunities',  label: 'Opportunities',  icon: Target,          code: '03' },
  { href: '/insights',       label: 'Insights',       icon: BarChart3,       code: '04' },
  { href: '/settings',       label: 'Settings',       icon: Settings,        code: '05' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-base)', overflow: 'hidden' }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="scanlines" style={{
        position: 'relative',
        width: '220px',
        flexShrink: 0,
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
      }}>

        {/* Logo */}
        <div style={{
          padding: '24px 20px 20px',
          borderBottom: '1px solid var(--border-dim)',
          position: 'relative',
          zIndex: 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '6px',
              background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Zap size={14} color="#000" fill="#000" />
            </div>
            <span style={{
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '16px',
              letterSpacing: '-0.02em', color: 'var(--text-primary)',
            }}>
              DRIP/OS
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '38px' }}>
            <span className="blink" style={{
              width: '5px', height: '5px', borderRadius: '50%',
              background: 'var(--green)', display: 'inline-block',
            }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
              SYSTEM ONLINE
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', position: 'relative', zIndex: 1 }}>
          {NAV.map(({ href, label, icon: Icon, code }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 10px', marginBottom: '2px', borderRadius: '6px',
                textDecoration: 'none',
                background: active ? 'var(--accent-glow)' : 'transparent',
                border: active ? '1px solid var(--accent-dim)' : '1px solid transparent',
                transition: 'all 0.15s',
              }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.08em',
                  color: active ? 'var(--accent)' : 'var(--text-muted)',
                  width: '16px', flexShrink: 0,
                }}>{code}</span>
                <Icon size={13} color={active ? 'var(--accent)' : 'var(--text-secondary)'} />
                <span style={{
                  fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: active ? 600 : 400,
                  color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                  letterSpacing: '-0.01em',
                }}>{label}</span>
                {active && (
                  <span style={{
                    marginLeft: 'auto', width: '4px', height: '4px', borderRadius: '50%',
                    background: 'var(--accent)', flexShrink: 0,
                  }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{
          padding: '14px 20px', borderTop: '1px solid var(--border-dim)',
          position: 'relative', zIndex: 1,
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
            RE WHOLESALE · v1.0.0
          </div>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-base)' }} className="fade-up">
        {children}
      </main>
    </div>
  );
}
