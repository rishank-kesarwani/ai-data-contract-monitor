'use client';

import React, { useState } from 'react';
import {
  FileCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  Copy,
  Check,
  ShieldCheck,
  Code2,
  Calendar,
  Lock,
} from 'lucide-react';
import { ApprovalRequest, MigrationProposal, UserSession } from '../lib/types';
import { api } from '../lib/api';

interface MigrationReviewProps {
  proposals: MigrationProposal[];
  approvals: ApprovalRequest[];
  selectedProposalId?: string;
  user: UserSession;
  onRefresh: () => void;
  onOpenAuthModal: () => void;
}

export const MigrationReview: React.FC<MigrationReviewProps> = ({
  proposals,
  approvals,
  selectedProposalId,
  user,
  onRefresh,
  onOpenAuthModal,
}) => {
  const [activeProposal, setActiveProposal] = useState<MigrationProposal | null>(
    selectedProposalId
      ? proposals.find((p) => p.id === selectedProposalId) || proposals[0] || null
      : proposals[0] || null,
  );
  const [decisionComment, setDecisionComment] = useState('');
  const [copiedSnippetIndex, setCopiedSnippetIndex] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync activeProposal if selectedProposalId changes
  React.useEffect(() => {
    if (selectedProposalId) {
      const match = proposals.find((p) => p.id === selectedProposalId);
      if (match) setActiveProposal(match);
    } else if (!activeProposal && proposals.length > 0) {
      setActiveProposal(proposals[0]);
    }
  }, [selectedProposalId, proposals, activeProposal]);

  const activeApproval = approvals.find((a) => a.proposalId === activeProposal?.id);

  const handleCopySnippet = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippetIndex(idx);
    setTimeout(() => setCopiedSnippetIndex(null), 2000);
  };

  const handleDecision = async (decision: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES') => {
    if (!activeApproval) return;
    if (user.role === 'PUBLIC_VIEWER') {
      onOpenAuthModal();
      return;
    }

    try {
      setSubmitting(true);
      await api.submitDecision(
        activeApproval.id,
        decision,
        decisionComment || (decision === 'APPROVE' ? 'Approved after reviewing schema diff and consumer readiness.' : 'Decision submitted.'),
      );
      setSuccessMessage(`Decision [${decision}] successfully recorded.`);
      setTimeout(() => setSuccessMessage(null), 3500);
      setDecisionComment('');
      onRefresh();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Title */}
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc' }}>
          AI Migration Proposals & Approval Gates
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Explainable, evidence-based migration plans with phase-by-phase rollouts, code snippets, and mandatory human review.
        </p>
      </div>

      {successMessage && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#86efac', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
          {successMessage}
        </div>
      )}

      {/* Main Grid: Proposals List (Left) + Detailed Plan & Approval Gate (Right) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Proposals List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {proposals.length === 0 ? (
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)' }}>
              No migration proposals generated yet. Head to the Drift Monitor to generate a proposal for any active drift.
            </div>
          ) : (
            proposals.map((prop) => {
              const isSelected = activeProposal?.id === prop.id;
              const approval = approvals.find((a) => a.proposalId === prop.id);
              const status = approval?.status || prop.approvalStatus;

              return (
                <div
                  key={prop.id}
                  onClick={() => setActiveProposal(prop)}
                  className="glass-card"
                  style={{
                    cursor: 'pointer',
                    borderColor: isSelected ? 'var(--accent-cyan)' : undefined,
                    background: isSelected ? 'rgba(25, 40, 66, 0.9)' : undefined,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.92rem' }}>
                      {prop.title}
                    </div>
                    <span
                      className={`badge ${
                        status === 'APPROVED'
                          ? 'badge-info'
                          : status === 'REJECTED'
                            ? 'badge-critical'
                            : 'badge-medium'
                      }`}
                      style={{ fontSize: '0.68rem' }}
                    >
                      {status}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    Version Transition: <strong style={{ color: 'var(--accent-cyan)' }}>{prop.currentVersion} → {prop.proposedVersion}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Sparkles size={12} style={{ color: prop.generatedBy === 'AI_PLATFORM' ? 'var(--accent-indigo)' : 'var(--accent-cyan)' }} />
                      {prop.generatedBy}
                    </span>
                    <span>{new Date(prop.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Detailed Proposal & Human Approval Gate */}
        {activeProposal ? (
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Header */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.25rem' }}>
                    {activeProposal.title}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Contract Target: <strong style={{ color: '#fff' }}>{activeProposal.contractId}</strong> • Version Promotion: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>{activeProposal.currentVersion} → {activeProposal.proposedVersion}</span>
                  </div>
                </div>

                <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc' }}>
                  <Sparkles size={13} style={{ marginRight: '0.3rem' }} />
                  {activeProposal.generatedBy}
                </span>
              </div>
            </div>

            {/* Executive Summary & Root Cause */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  EXECUTIVE SUMMARY
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                  {activeProposal.executiveSummary}
                </p>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  ROOT CAUSE ANALYSIS
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                  {activeProposal.rootCauseAnalysis}
                </p>
              </div>
            </div>

            {/* Phased Migration Plan */}
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.75rem' }}>
                Phased Rollout Plan ({activeProposal.phases.length} Phases)
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {activeProposal.phases.map((phase) => (
                  <div
                    key={phase.phaseNumber}
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem',
                    }}
                  >
                    <div style={{ fontWeight: 700, color: 'var(--accent-cyan)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                      {phase.phaseName}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                      {phase.objective}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '0.5rem' }}>
                      {phase.actions.map((act, i) => (
                        <div key={i} style={{ fontSize: '0.78rem', color: 'var(--text-main)', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                          <span style={{ color: 'var(--accent-emerald)' }}>✓</span>
                          <span>{act}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ fontSize: '0.72rem', color: '#fca5a5', background: 'rgba(239, 68, 68, 0.08)', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)' }}>
                      <strong>Rollback Strategy:</strong> {phase.rollbackPlan}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Generated Code Snippets */}
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Code2 size={18} style={{ color: 'var(--accent-cyan)' }} />
                <span>Automated Migration Scripts</span>
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {activeProposal.codeSnippets.map((snip, idx) => (
                  <div key={idx} style={{ background: '#05080f', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.85rem', background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        {snip.title} ({snip.language.toUpperCase()})
                      </span>
                      <button
                        onClick={() => handleCopySnippet(snip.code, idx)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: 'var(--accent-cyan)' }}
                      >
                        {copiedSnippetIndex === idx ? <Check size={13} /> : <Copy size={13} />}
                        <span>{copiedSnippetIndex === idx ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre style={{ padding: '0.85rem', margin: 0, overflowX: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#e2e8f0', lineHeight: 1.45 }}>
                      <code>{snip.code}</code>
                    </pre>
                  </div>
                ))}
              </div>
            </div>

            {/* Human Approval Gate Box */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9))',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={20} style={{ color: 'var(--accent-cyan)' }} />
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: '#f8fafc' }}>
                    Human Approval Gate
                  </span>
                </div>

                {activeApproval && (
                  <span className="badge badge-info">
                    Approvals: {activeApproval.currentApprovals} / {activeApproval.requiredApprovals}
                  </span>
                )}
              </div>

              {/* Past Review Decisions */}
              {activeApproval && activeApproval.decisions.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
                    AUDIT OF RECORDED DECISIONS:
                  </div>
                  {activeApproval.decisions.map((dec, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '0.45rem 0.65rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(0,0,0,0.25)',
                        fontSize: '0.78rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>
                        <strong style={{ color: '#fff' }}>{dec.reviewerName}</strong> ({dec.reviewerRole}):{' '}
                        <span style={{ color: dec.decision === 'APPROVE' ? '#34d399' : '#f87171', fontWeight: 600 }}>
                          [{dec.decision}]
                        </span>{' '}
                        &ldquo;{dec.comments}&rdquo;
                      </span>
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>
                        {new Date(dec.decidedAt).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Decision Input Controls */}
              {activeApproval?.status === 'PENDING_REVIEW' || activeApproval?.status === 'CHANGES_REQUESTED' ? (
                user.role === 'PUBLIC_VIEWER' ? (
                  <div style={{ padding: '1rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fde047', fontSize: '0.85rem' }}>
                      <Lock size={16} />
                      <span>Operator or Data Owner sign-in required to approve or publish migrations.</span>
                    </div>
                    <button onClick={onOpenAuthModal} className="btn-primary" style={{ fontSize: '0.8rem' }}>
                      Sign In to Review
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <textarea
                      rows={2}
                      placeholder="Enter review decision rationale, consumer sync confirmation, or requested changes..."
                      value={decisionComment}
                      onChange={(e) => setDecisionComment(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.6rem',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        color: '#fff',
                        fontSize: '0.85rem',
                      }}
                    />

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleDecision('APPROVE')}
                        disabled={submitting}
                        className="btn-primary"
                        style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff' }}
                      >
                        <CheckCircle2 size={16} />
                        <span>Approve & Publish Changes</span>
                      </button>

                      <button
                        onClick={() => handleDecision('REQUEST_CHANGES')}
                        disabled={submitting}
                        className="btn-secondary"
                        style={{ color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.4)' }}
                      >
                        <AlertCircle size={16} />
                        <span>Request Changes</span>
                      </button>

                      <button
                        onClick={() => handleDecision('REJECT')}
                        disabled={submitting}
                        className="btn-danger"
                      >
                        <XCircle size={16} />
                        <span>Reject Migration</span>
                      </button>
                    </div>
                  </div>
                )
              ) : (
                <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-sm)', color: '#86efac', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={16} />
                  <span>
                    Approval cycle finalized with status: <strong>{activeApproval?.status}</strong>. Contract version successfully promoted.
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)' }}>
            Select a migration proposal on the left to review the explanation and approval gate.
          </div>
        )}
      </div>
    </div>
  );
};
