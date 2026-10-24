'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Activity,
  Layers,
  GitBranch,
  Network,
  FileCheck,
  History,
  LogIn,
  LogOut,
  Menu,
  X,
  PlayCircle,
  RotateCcw,
  UploadCloud,
} from 'lucide-react';
import { UserSession } from '../lib/types';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  user: UserSession;
  onOpenAuthModal: () => void;
  onLogout: () => void;
  onResetDemo: () => void;
  onOpenUploadModal: () => void;
  onTriggerScenario: (scenario: 'BREAKING' | 'QUALITY' | 'RISKY' | 'SAFE') => void;
  pendingApprovalsCount: number;
  criticalDriftCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  user,
  onOpenAuthModal,
  onLogout,
  onResetDemo,
  onOpenUploadModal,
  onTriggerScenario,
  pendingApprovalsCount,
  criticalDriftCount,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scenariosOpen, setScenariosOpen] = useState(false);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'contracts', label: 'Contracts Registry', icon: Layers },
    {
      id: 'drift',
      label: 'Drift Monitor',
      icon: GitBranch,
      badge: criticalDriftCount > 0 ? criticalDriftCount : undefined,
      badgeType: 'critical',
    },
    { id: 'consumers', label: 'Consumer Impact', icon: Network },
    {
      id: 'proposals',
      label: 'AI Migrations',
      icon: FileCheck,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
      badgeType: 'pending',
    },
    { id: 'audit', label: 'Audit Trail', icon: History },
  ];

  const handleTabClick = (id: string) => {
    onTabChange(id);
    setMobileMenuOpen(false);
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(8, 12, 21, 0.92)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '0.75rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        {/* Brand Logo & Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(99, 102, 241, 0.2))',
              border: '1px solid var(--border-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--border-glow)',
            }}
          >
            <ShieldCheck size={24} style={{ color: 'var(--accent-cyan)' }} />
          </div>
          <div>
            <div
              style={{
                fontSize: '1rem',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                background: 'linear-gradient(90deg, #f8fafc, #38bdf8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: 1.2,
              }}
            >
              AI Data Contract & Schema Drift Monitor
            </div>
            <div
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-dim)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span>Vercel + Render</span>
              <span>•</span>
              <span style={{ color: 'var(--accent-emerald)' }}>● Verified Integrations</span>
            </div>
          </div>
        </div>

        {/* Desktop Nav Items */}
        <nav
          style={{
            display: 'none',
            alignItems: 'center',
            gap: '0.25rem',
          }}
          className="desktop-nav"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.875rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                  background: isActive ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                  border: isActive ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid transparent',
                  position: 'relative',
                }}
              >
                <Icon size={16} style={{ color: isActive ? 'var(--accent-cyan)' : 'var(--text-dim)' }} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    style={{
                      padding: '0.1rem 0.4rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      background: item.badgeType === 'critical' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)',
                      color: item.badgeType === 'critical' ? '#fca5a5' : '#fde047',
                      border: `1px solid ${item.badgeType === 'critical' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(245, 158, 11, 0.5)'}`,
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Action Controls & Session */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Quick Scenario Selector Dropdown */}
          <div style={{ position: 'relative' }} className="desktop-scenario-dropdown">
            <button
              onClick={() => setScenariosOpen(!scenariosOpen)}
              className="btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.45rem 0.75rem' }}
              title="Simulate Schema & Quality Drift Scenarios"
            >
              <PlayCircle size={15} style={{ color: 'var(--accent-cyan)' }} />
              <span className="hide-on-mobile">Simulate Drift</span>
            </button>
            {scenariosOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '110%',
                  width: '260px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-md)',
                  padding: '0.5rem',
                  zIndex: 100,
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', padding: '0.25rem 0.5rem', fontWeight: 600 }}>
                  CHOOSE DRIFT SCENARIO
                </div>
                <button
                  onClick={() => {
                    onTriggerScenario('BREAKING');
                    setScenariosOpen(false);
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    color: '#fca5a5',
                    background: 'rgba(239, 68, 68, 0.08)',
                    marginBottom: '0.25rem',
                    display: 'block',
                  }}
                >
                  ⚡ Breaking Drift (Dropped & Type Drift)
                </button>
                <button
                  onClick={() => {
                    onTriggerScenario('QUALITY');
                    setScenariosOpen(false);
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    color: '#fde047',
                    background: 'rgba(245, 158, 11, 0.08)',
                    marginBottom: '0.25rem',
                    display: 'block',
                  }}
                >
                  ⚠️ Quality Drift (23.4% Nulls & Enum)
                </button>
                <button
                  onClick={() => {
                    onTriggerScenario('RISKY');
                    setScenariosOpen(false);
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    color: '#93c5fd',
                    background: 'rgba(59, 130, 246, 0.08)',
                    marginBottom: '0.25rem',
                    display: 'block',
                  }}
                >
                  🔍 Risky Drift (Strict Undeclared Fields)
                </button>
                <button
                  onClick={() => {
                    onTriggerScenario('SAFE');
                    setScenariosOpen(false);
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    color: '#86efac',
                    background: 'rgba(16, 185, 129, 0.08)',
                    display: 'block',
                  }}
                >
                  ✅ Safe Evolution (Optional Fields)
                </button>
              </div>
            )}
          </div>

          {/* Upload Schema Snapshot Button */}
          <button
            onClick={onOpenUploadModal}
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.75rem' }}
            title="Upload custom schema snapshot or sample JSON payload"
          >
            <UploadCloud size={15} style={{ color: 'var(--accent-indigo)' }} />
            <span className="hide-on-mobile">Upload Schema</span>
          </button>

          {/* Reset Demo Button */}
          <button
            onClick={onResetDemo}
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.65rem' }}
            title="Reset demo workspace to pristine initial contracts"
          >
            <RotateCcw size={15} />
          </button>

          {/* User Session Profile / Auth Modal */}
          {user.role === 'PUBLIC_VIEWER' ? (
            <button
              onClick={onOpenAuthModal}
              className="btn-primary"
              style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
              title="Sign in as Operator or Data Owner"
            >
              <LogIn size={15} />
              <span>Sign In</span>
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={onOpenAuthModal}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.35rem 0.75rem',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.78rem',
                  color: '#86efac',
                }}
              >
                <span>●</span>
                <span style={{ fontWeight: 600 }}>{user.username}</span>
                <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>({user.role})</span>
              </button>
              <button
                onClick={onLogout}
                className="btn-secondary"
                style={{ padding: '0.45rem 0.6rem' }}
                title="Sign out to Public Viewer mode"
              >
                <LogOut size={14} style={{ color: 'var(--text-dim)' }} />
              </button>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-menu-btn"
            style={{
              padding: '0.5rem',
              color: 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          style={{
            background: 'var(--bg-surface)',
            borderTop: '1px solid var(--border-subtle)',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
          className="mobile-drawer"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: isActive ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                  color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                  fontSize: '0.95rem',
                  fontWeight: isActive ? 600 : 500,
                  width: '100%',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Icon size={18} style={{ color: isActive ? 'var(--accent-cyan)' : 'var(--text-dim)' }} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    style={{
                      padding: '0.1rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.75rem',
                      background: item.badgeType === 'critical' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)',
                      color: item.badgeType === 'critical' ? '#fca5a5' : '#fde047',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
