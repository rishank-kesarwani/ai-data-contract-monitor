'use client';

import React from 'react';
import {
  Layers,
  GitBranch,
  Network,
  FileCheck,
  AlertOctagon,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { Contract, DriftReport, RegisteredConsumer, ApprovalRequest } from '../lib/types';

interface OverviewDashboardProps {
  contracts: Contract[];
  driftReports: DriftReport[];
  consumers: RegisteredConsumer[];
  approvals: ApprovalRequest[];
  onNavigateTab: (tab: string) => void;
  onSelectContract: (contractId: string) => void;
  onSelectDrift: (driftId: string) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  contracts,
  driftReports,
  consumers,
  approvals,
  onNavigateTab,
  onSelectContract,
  onSelectDrift,
}) => {
  const criticalDrifts = driftReports.filter((d) => d.overallSeverity === 'CRITICAL' && d.remediationStatus !== 'RESOLVED');
  const highDrifts = driftReports.filter((d) => d.overallSeverity === 'HIGH' && d.remediationStatus !== 'RESOLVED');
  const pendingApprovals = approvals.filter((a) => a.status === 'PENDING_REVIEW');

  const failingConsumersCount = driftReports
    .flatMap((d) => d.impactedConsumers || [])
    .filter((c) => c.status === 'FAILING').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Welcome & Health Summary Header */}
      <div
        className="glass-panel"
        style={{
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          background: 'linear-gradient(135deg, rgba(14, 23, 38, 0.8), rgba(19, 31, 51, 0.9))',
          borderLeft: '4px solid var(--accent-cyan)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#f8fafc', marginBottom: '0.35rem' }}>
              Data Contract & Schema Drift Operations Center
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '800px', lineHeight: 1.5 }}>
              Continuous schema and quality observability platform comparing live telemetry snapshots against approved data contracts.
              Automatically traces affected downstream consumers and coordinates approval-gated schema migrations.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={14} />
              AI Gate Enforcement Active
            </span>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
        }}
      >
        {/* Card 1: Registered Contracts */}
        <div
          className="glass-card"
          style={{ cursor: 'pointer' }}
          onClick={() => onNavigateTab('contracts')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
              Active Contracts
            </span>
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-cyan)' }}>
              <Layers size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.25rem' }}>
            {contracts.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>{new Set(contracts.map((c) => c.domain)).size} Business Domains</span>
            <span>•</span>
            <span style={{ color: 'var(--accent-cyan)' }}>View registry →</span>
          </div>
        </div>

        {/* Card 2: Active Drift Incidents */}
        <div
          className="glass-card"
          style={{ cursor: 'pointer', borderColor: criticalDrifts.length > 0 ? 'rgba(239, 68, 68, 0.4)' : undefined }}
          onClick={() => onNavigateTab('drift')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
              Schema Drifts
            </span>
            <div
              style={{
                padding: '0.5rem',
                borderRadius: '8px',
                background: criticalDrifts.length > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                color: criticalDrifts.length > 0 ? '#f87171' : '#34d399',
              }}
            >
              <GitBranch size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: criticalDrifts.length > 0 ? '#f87171' : '#f8fafc', marginBottom: '0.25rem' }}>
            {driftReports.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ color: criticalDrifts.length > 0 ? '#f87171' : '#34d399', fontWeight: 600 }}>
              {criticalDrifts.length} Critical, {highDrifts.length} High
            </span>
            <span>•</span>
            <span style={{ color: 'var(--accent-cyan)' }}>Inspect →</span>
          </div>
        </div>

        {/* Card 3: Downstream Impact */}
        <div
          className="glass-card"
          style={{ cursor: 'pointer' }}
          onClick={() => onNavigateTab('consumers')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
              Tracked Consumers
            </span>
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-indigo)' }}>
              <Network size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.25rem' }}>
            {consumers.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ color: failingConsumersCount > 0 ? '#f87171' : 'var(--text-muted)', fontWeight: failingConsumersCount > 0 ? 600 : 400 }}>
              {failingConsumersCount > 0 ? `${failingConsumersCount} Failing Pipelines` : 'All Pipelines Healthy'}
            </span>
            <span>•</span>
            <span style={{ color: 'var(--accent-cyan)' }}>Map →</span>
          </div>
        </div>

        {/* Card 4: Pending Approval Gates */}
        <div
          className="glass-card"
          style={{ cursor: 'pointer', borderColor: pendingApprovals.length > 0 ? 'rgba(245, 158, 11, 0.4)' : undefined }}
          onClick={() => onNavigateTab('proposals')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
              Approval Gates
            </span>
            <div
              style={{
                padding: '0.5rem',
                borderRadius: '8px',
                background: pendingApprovals.length > 0 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                color: pendingApprovals.length > 0 ? '#fbbf24' : '#34d399',
              }}
            >
              <FileCheck size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: pendingApprovals.length > 0 ? '#fbbf24' : '#f8fafc', marginBottom: '0.25rem' }}>
            {pendingApprovals.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>Awaiting human sign-off</span>
            <span>•</span>
            <span style={{ color: 'var(--accent-cyan)' }}>Review →</span>
          </div>
        </div>
      </div>

      {/* Critical Active Drift Alert Banner (if any) */}
      {criticalDrifts.length > 0 && (
        <div
          style={{
            background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.15), rgba(15, 23, 42, 0.95))',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertOctagon size={20} style={{ color: '#f87171' }} />
            <span style={{ fontWeight: 700, color: '#fca5a5', fontSize: '1rem' }}>
              Breaking Schema Drift Requiring Coordinated Remediation
            </span>
            <span className="badge badge-critical" style={{ marginLeft: 'auto' }}>
              {criticalDrifts.length} Incident(s)
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {criticalDrifts.map((drift) => (
              <div
                key={drift.id}
                style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.9rem' }}>
                    {drift.contractName}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {drift.categorySummary.breakingCount} breaking changes detected • {drift.impactedConsumers.length} affected consumers
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    onClick={() => {
                      onSelectDrift(drift.id);
                      onNavigateTab('drift');
                    }}
                    className="btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                  >
                    <span>View Diff & Quality Checks</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two Column Layout: Contracts Status & Recent Drift Events */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {/* Column 1: Monitored Contracts Overview */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
              Monitored Contracts
            </h2>
            <button
              onClick={() => onNavigateTab('contracts')}
              style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <span>View all</span>
              <ExternalLink size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {contracts.map((contract) => (
              <div
                key={contract.id}
                onClick={() => {
                  onSelectContract(contract.id);
                  onNavigateTab('contracts');
                }}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.92rem' }}>
                    {contract.name}
                  </div>
                  <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.1)', color: 'var(--accent-cyan)' }}>
                    v{contract.version}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Domain: {contract.domain} • Compatibility: {contract.compatibilityMode}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  <span>{contract.schema.length} fields defined</span>
                  <span>{contract.consumers.length} consumers mapped</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Recent Drift & Ingestion Activity */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
              Recent Drift History
            </h2>
            <button
              onClick={() => onNavigateTab('drift')}
              style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <span>Drift Explorer</span>
              <ExternalLink size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {driftReports.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)' }}>
                No drift evaluations recorded yet. Run a simulation scenario or ingest a snapshot.
              </div>
            ) : (
              driftReports.slice(0, 5).map((drift) => {
                const badgeClass =
                  drift.overallSeverity === 'CRITICAL'
                    ? 'badge-critical'
                    : drift.overallSeverity === 'HIGH'
                      ? 'badge-high'
                      : drift.overallSeverity === 'MEDIUM'
                        ? 'badge-medium'
                        : 'badge-low';

                return (
                  <div
                    key={drift.id}
                    onClick={() => {
                      onSelectDrift(drift.id);
                      onNavigateTab('drift');
                    }}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.875rem 1rem',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.88rem' }}>
                        {drift.contractName}
                      </span>
                      <span className={`badge ${badgeClass}`}>{drift.overallSeverity}</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {drift.changes.length} change(s) • Status: <strong style={{ color: drift.remediationStatus === 'RESOLVED' ? '#34d399' : '#fbbf24' }}>{drift.remediationStatus}</strong>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                      Detected: {new Date(drift.detectionTime).toLocaleString()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
