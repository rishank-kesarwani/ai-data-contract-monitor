'use client';

import React from 'react';
import { Sparkles, AlertTriangle, ShieldAlert, CheckCircle2, RotateCcw } from 'lucide-react';

interface DemoBannerProps {
  onTriggerScenario: (scenario: 'BREAKING' | 'QUALITY' | 'RISKY' | 'SAFE') => void;
  onResetDemo: () => void;
  loadingScenario: string | null;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({
  onTriggerScenario,
  onResetDemo,
  loadingScenario,
}) => {
  return (
    <div
      style={{
        background: 'linear-gradient(90deg, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.95))',
        borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
        padding: '0.6rem 1.25rem',
      }}
    >
      <div
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
        }}
      >
        {/* Banner Label & Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.2rem 0.55rem',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              color: 'var(--accent-cyan)',
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            <Sparkles size={13} />
            Demo Workspace Active
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Telemetry ingested from simulated Kafka CDC and synthetic samples. No production credentials or sensitive records required.
          </span>
        </div>

        {/* Quick Simulation Scenario Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
            Simulate Drift:
          </span>

          <button
            onClick={() => onTriggerScenario('BREAKING')}
            disabled={!!loadingScenario}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.3rem 0.65rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#fca5a5',
              cursor: loadingScenario ? 'wait' : 'pointer',
            }}
          >
            <ShieldAlert size={13} />
            <span>{loadingScenario === 'BREAKING' ? 'Simulating...' : 'Breaking Drift'}</span>
          </button>

          <button
            onClick={() => onTriggerScenario('QUALITY')}
            disabled={!!loadingScenario}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.3rem 0.65rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              color: '#fde047',
              cursor: loadingScenario ? 'wait' : 'pointer',
            }}
          >
            <AlertTriangle size={13} />
            <span>{loadingScenario === 'QUALITY' ? 'Simulating...' : 'Quality Drift'}</span>
          </button>

          <button
            onClick={() => onTriggerScenario('RISKY')}
            disabled={!!loadingScenario}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.3rem 0.65rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.35)',
              color: '#93c5fd',
              cursor: loadingScenario ? 'wait' : 'pointer',
            }}
          >
            <span>{loadingScenario === 'RISKY' ? 'Simulating...' : 'Risky Drift'}</span>
          </button>

          <button
            onClick={() => onTriggerScenario('SAFE')}
            disabled={!!loadingScenario}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.3rem 0.65rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#86efac',
              cursor: loadingScenario ? 'wait' : 'pointer',
            }}
          >
            <CheckCircle2 size={13} />
            <span>{loadingScenario === 'SAFE' ? 'Simulating...' : 'Safe Evolution'}</span>
          </button>

          <button
            onClick={onResetDemo}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.3rem 0.55rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
            }}
            title="Reset to clean baseline contracts"
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
};
