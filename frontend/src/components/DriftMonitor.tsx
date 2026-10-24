'use client';

import React, { useState } from 'react';
import {
  GitBranch,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Filter,
  Check,
  XCircle,
  FileCheck,
} from 'lucide-react';
import { DriftReport, DriftSeverity } from '../lib/types';
import { api } from '../lib/api';

interface DriftMonitorProps {
  driftReports: DriftReport[];
  selectedDriftId?: string;
  onNavigateTab: (tab: string) => void;
  onRefresh: () => void;
  onSelectProposal: (proposalId: string) => void;
}

export const DriftMonitor: React.FC<DriftMonitorProps> = ({
  driftReports,
  selectedDriftId,
  onNavigateTab,
  onRefresh,
  onSelectProposal,
}) => {
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [activeDrift, setActiveDrift] = useState<DriftReport | null>(
    selectedDriftId
      ? driftReports.find((d) => d.id === selectedDriftId) || driftReports[0] || null
      : driftReports[0] || null,
  );
  const [generatingProposal, setGeneratingProposal] = useState(false);

  // Sync if selectedDriftId changes
  React.useEffect(() => {
    if (selectedDriftId) {
      const match = driftReports.find((d) => d.id === selectedDriftId);
      if (match) setActiveDrift(match);
    } else if (!activeDrift && driftReports.length > 0) {
      setActiveDrift(driftReports[0]);
    }
  }, [selectedDriftId, driftReports, activeDrift]);

  const filteredReports = driftReports.filter((d) => {
    if (severityFilter === 'ALL') return true;
    if (severityFilter === 'RESOLVED') return d.remediationStatus === 'RESOLVED';
    return d.overallSeverity === severityFilter && d.remediationStatus !== 'RESOLVED';
  });

  const handleGenerateProposal = async (driftReportId: string) => {
    try {
      setGeneratingProposal(true);
      const proposal = await api.generateProposal(driftReportId);
      onRefresh();
      onSelectProposal(proposal.id);
      onNavigateTab('proposals');
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setGeneratingProposal(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Title & Filter Controls */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc' }}>
            Schema & Quality Drift Monitor
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Automated diff detection comparing active contracts against versioned snapshot telemetry.
          </p>
        </div>

        {/* Severity Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflowX: 'auto' }}>
          <Filter size={15} style={{ color: 'var(--text-dim)', marginRight: '0.2rem' }} />
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'RESOLVED'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 600,
                background: severityFilter === sev ? 'rgba(56, 189, 248, 0.2)' : 'var(--bg-surface)',
                color: severityFilter === sev ? 'var(--accent-cyan)' : 'var(--text-muted)',
                border: severityFilter === sev ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid var(--border-subtle)',
              }}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Reports List (Left) + Detail & Diff (Right) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Drift Reports List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredReports.length === 0 ? (
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)' }}>
              No drift events matching the current severity filter.
            </div>
          ) : (
            filteredReports.map((drift) => {
              const isSelected = activeDrift?.id === drift.id;
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
                  onClick={() => setActiveDrift(drift)}
                  className="glass-card"
                  style={{
                    cursor: 'pointer',
                    borderColor: isSelected ? 'var(--accent-cyan)' : undefined,
                    boxShadow: isSelected ? 'var(--border-glow)' : undefined,
                    background: isSelected ? 'rgba(25, 40, 66, 0.9)' : undefined,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.95rem' }}>
                      {drift.contractName}
                    </div>
                    <span className={`badge ${badgeClass}`}>{drift.overallSeverity}</span>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    Status: <strong style={{ color: drift.remediationStatus === 'RESOLVED' ? '#34d399' : '#fbbf24' }}>{drift.remediationStatus}</strong> • Snapshot: <span style={{ fontFamily: 'var(--font-mono)' }}>{drift.snapshotId.substring(0, 14)}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    <span>
                      {drift.categorySummary.breakingCount} Breaking, {drift.categorySummary.riskyCount} Risky
                    </span>
                    <span>{new Date(drift.detectionTime).toLocaleTimeString()}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Active Drift Report Diff & Quality Scorecard */}
        {activeDrift ? (
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                    {activeDrift.contractName}
                  </h3>
                  <span
                    className={`badge ${
                      activeDrift.overallSeverity === 'CRITICAL'
                        ? 'badge-critical'
                        : activeDrift.overallSeverity === 'HIGH'
                          ? 'badge-high'
                          : 'badge-medium'
                    }`}
                  >
                    {activeDrift.overallSeverity} DRIFT
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Evaluated at: {new Date(activeDrift.detectionTime).toLocaleString()} • Contract ID: <span style={{ fontFamily: 'var(--font-mono)' }}>{activeDrift.contractId}</span>
                </div>
              </div>

              {/* Action Button: Generate AI Proposal */}
              {activeDrift.remediationStatus !== 'RESOLVED' && (
                <button
                  onClick={() => handleGenerateProposal(activeDrift.id)}
                  disabled={generatingProposal}
                  className="btn-primary"
                  style={{ fontSize: '0.85rem' }}
                >
                  <Sparkles size={16} />
                  <span>{generatingProposal ? 'Synthesizing with AI...' : 'Propose Migration Plan'}</span>
                </button>
              )}
            </div>

            {/* Changes Summary Pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ padding: '0.6rem 0.85rem', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-sm)', flex: 1, minWidth: '120px' }}>
                <div style={{ fontSize: '0.7rem', color: '#fca5a5', fontWeight: 700, textTransform: 'uppercase' }}>BREAKING CHANGES</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f87171' }}>{activeDrift.categorySummary.breakingCount}</div>
              </div>

              <div style={{ padding: '0.6rem 0.85rem', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 'var(--radius-sm)', flex: 1, minWidth: '120px' }}>
                <div style={{ fontSize: '0.7rem', color: '#fde047', fontWeight: 700, textTransform: 'uppercase' }}>RISKY CHANGES</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24' }}>{activeDrift.categorySummary.riskyCount}</div>
              </div>

              <div style={{ padding: '0.6rem 0.85rem', background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: 'var(--radius-sm)', flex: 1, minWidth: '120px' }}>
                <div style={{ fontSize: '0.7rem', color: '#93c5fd', fontWeight: 700, textTransform: 'uppercase' }}>NON-BREAKING</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#60a5fa' }}>{activeDrift.categorySummary.nonBreakingCount}</div>
              </div>
            </div>

            {/* Interactive Schema Diff View */}
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.75rem' }}>
                Observed Schema Diff
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {activeDrift.changes.length === 0 ? (
                  <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.08)', borderRadius: 'var(--radius-sm)', color: '#86efac', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={16} />
                    <span>No structural schema deviations detected. Snapshot perfectly matches active contract.</span>
                  </div>
                ) : (
                  activeDrift.changes.map((change) => {
                    const isBreaking = change.category === 'BREAKING';
                    const isRisky = change.category === 'POTENTIALLY_RISKY';

                    const borderCol = isBreaking ? 'var(--diff-del-border)' : isRisky ? 'var(--diff-mod-border)' : 'var(--diff-add-border)';
                    const bgCol = isBreaking ? 'var(--diff-del-bg)' : isRisky ? 'var(--diff-mod-bg)' : 'var(--diff-add-bg)';
                    const textCol = isBreaking ? 'var(--diff-del-text)' : isRisky ? 'var(--diff-mod-text)' : 'var(--diff-add-text)';
                    const symbol = isBreaking ? '-' : isRisky ? '~' : '+';

                    return (
                      <div
                        key={change.id}
                        style={{
                          background: bgCol,
                          border: `1px solid ${borderCol}`,
                          borderRadius: 'var(--radius-md)',
                          padding: '0.85rem 1rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.35rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: textCol, fontSize: '1.1rem' }}>
                              {symbol}
                            </span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#f8fafc', fontSize: '0.95rem' }}>
                              {change.field}
                            </span>
                            <span style={{ fontSize: '0.72rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(0,0,0,0.3)', color: textCol, fontWeight: 600 }}>
                              {change.changeType}
                            </span>
                          </div>
                          <span className={`badge ${isBreaking ? 'badge-critical' : isRisky ? 'badge-medium' : 'badge-low'}`}>
                            {change.category}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                          {change.description}
                        </div>

                        <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', display: 'flex', gap: '1rem', marginTop: '0.2rem' }}>
                          <span>Contract: <strong style={{ color: '#e2e8f0' }}>{JSON.stringify(change.contractValue)}</strong></span>
                          <span>Observed: <strong style={{ color: textCol }}>{JSON.stringify(change.observedValue)}</strong></span>
                        </div>

                        {change.affectedConsumers.length > 0 && (
                          <div style={{ marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.7rem', color: '#f87171', fontWeight: 600 }}>AFFECTS:</span>
                            {change.affectedConsumers.map((cid) => (
                              <span
                                key={cid}
                                style={{
                                  fontSize: '0.7rem',
                                  padding: '0.1rem 0.45rem',
                                  borderRadius: 'var(--radius-full)',
                                  background: 'rgba(239, 68, 68, 0.25)',
                                  color: '#fca5a5',
                                  fontWeight: 600,
                                }}
                              >
                                {cid}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Quality Checks Scorecard */}
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.75rem' }}>
                Data Quality Checks Scorecard ({activeDrift.qualityChecks.length} checks)
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                {activeDrift.qualityChecks.map((qc) => (
                  <div
                    key={qc.id}
                    style={{
                      background: qc.passed ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.08)',
                      border: `1px solid ${qc.passed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.3)'}`,
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {qc.passed ? (
                          <Check size={14} style={{ color: '#34d399' }} />
                        ) : (
                          <XCircle size={14} style={{ color: '#f87171' }} />
                        )}
                        <span style={{ fontWeight: 600, fontSize: '0.82rem', color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                          {qc.field}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                        {qc.checkType}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: qc.passed ? 'var(--text-muted)' : '#fca5a5' }}>
                      {qc.message}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Threshold: {qc.threshold}</span>
                      <span>Observed: {qc.observed}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)' }}>
            Select a drift report on the left to inspect detailed schema diffs and data quality checks.
          </div>
        )}
      </div>
    </div>
  );
};
