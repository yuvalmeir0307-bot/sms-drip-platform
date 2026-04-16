'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Target, BarChart3, Settings, Zap } from 'lucide-react';

const NAV = [
  { href: '/overview',      label: 'Overview',      icon: LayoutDashboard },
  { href: '/contacts',      label: 'Contacts',       icon: Users },
  { href: '/opportunities', label: 'Opportunities',  icon: Target },
  { href: '/insights',      label: 'Insights',       icon: BarChart3 },
  { href: '/settings',      label: 'Settings',       icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-base)', overflow: 'hidden' }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside style={{
        width: '240px',
        flexShrink: 0,
        background: 'var(--sidebar-bg)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}>

        {/* Logo */}
        <div style={{
          padding: '28px 20px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 0 0 4px rgba(59,130,246,0.2)',
            }}>
              <Zap size={16} color="#fff" fill="#fff" />
            </div>
            <div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '16px',
                letterSpacing: '-0.02em',
                color: '#ffffff',
                lineHeight: 1.2,
              }}>
                DRIP/OS
              </div>
              <div style={{
                fontFamily: 'var(--font-body)',
                fontSize: '11px',
                fontWeight: 500,
                color: 'var(--text-sidebar)',
                letterSpacing: '0.01em',
                marginTop: '1px',
              }}>
                SMS Platform
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {NAV.map(({ href, label, icon: Icon }, idx) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="slide-in"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  background: active ? 'var(--sidebar-active)' : 'transparent',
                  borderLeft: active ? '3px solid var(--accent)' : '3px solid transparent',
                  transition: 'background 0.15s, border-color 0.15s',
                  animationDelay: `${idx * 40}ms`,
                  animationFillMode: 'both',
                }}
                onMouseEnter={e => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--sidebar-hover)';
                }}
                onMouseLeave={e => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                <Icon
                  size={16}
                  color={active ? '#ffffff' : 'var(--text-sidebar)'}
                  style={{ flexShrink: 0 }}
                />
                <span style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '13px',
                  fontWeight: active ? 600 : 500,
                  color: active ? 'var(--text-sidebar-active)' : 'var(--text-sidebar)',
                  letterSpacing: '-0.01em',
                }}>
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span
              className="blink"
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--green)',
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: 'var(--text-sidebar)',
              letterSpacing: '0.04em',
            }}>
              RE WHOLESALE · v1.0.0
            </span>
          </div>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <main
        style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-base)' }}
        className="fade-up"
      >
        {children}
      </main>
    </div>
  );
}
