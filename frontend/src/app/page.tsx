'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Navigation } from '../components/Navigation';
import { DemoBanner } from '../components/DemoBanner';
import { OverviewDashboard } from '../components/OverviewDashboard';
import { ContractsRegistry } from '../components/ContractsRegistry';
import { DriftMonitor } from '../components/DriftMonitor';
import { ConsumerImpactMap } from '../components/ConsumerImpactMap';
import { MigrationReview } from '../components/MigrationReview';
import { AuditTrail } from '../components/AuditTrail';
import { ManualUploadModal } from '../components/ManualUploadModal';
import { AuthModal } from '../components/AuthModal';
import { api } from '../lib/api';
import {
  ApprovalRequest,
  AuditLogEntry,
  Contract,
  DriftReport,
  MigrationProposal,
  RegisteredConsumer,
  UserSession,
} from '../lib/types';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [driftReports, setDriftReports] = useState<DriftReport[]>([]);
  const [consumers, setConsumers] = useState<RegisteredConsumer[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [proposals, setProposals] = useState<MigrationProposal[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [user, setUser] = useState<UserSession>({
    id: 'public-viewer',
    username: 'Guest Viewer',
    role: 'PUBLIC_VIEWER',
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingScenario, setLoadingScenario] = useState<string | null>(null);

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // Selected drilldown pointers
  const [selectedContractId, setSelectedContractId] = useState<string | undefined>(undefined);
  const [selectedDriftId, setSelectedDriftId] = useState<string | undefined>(undefined);
  const [selectedProposalId, setSelectedProposalId] = useState<string | undefined>(undefined);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [c, d, cons, a, propsList, aud, prof] = await Promise.all([
        api.getContracts().catch(() => []),
        api.getDriftReports().catch(() => []),
        api.getConsumers().catch(() => []),
        api.getApprovals().catch(() => []),
        api.getProposals().catch(() => []),
        api.getAuditLogs().catch(() => []),
        api.getProfile().catch(() => ({
          authenticated: false,
          user: { id: 'public-viewer', username: 'Guest Viewer', role: 'PUBLIC_VIEWER' as const },
        })),
      ]);

      setContracts(c);
      setDriftReports(d);
      setConsumers(cons);
      setApprovals(a);
      setProposals(propsList);
      setAuditLogs(aud);
      if (prof?.user) setUser(prof.user);
    } catch (err: any) {
      setError(err.message || 'Unable to load workspace data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = async () => {
    await api.logout();
    setUser({
      id: 'public-viewer',
      username: 'Guest Viewer',
      role: 'PUBLIC_VIEWER',
    });
    fetchData();
  };

  const handleTriggerScenario = async (scenario: 'BREAKING' | 'QUALITY' | 'RISKY' | 'SAFE') => {
    try {
      setLoadingScenario(scenario);
      const res = await api.triggerScenario(scenario);
      await fetchData();
      if (res?.driftReport?.id) {
        setSelectedDriftId(res.driftReport.id);
        setActiveTab('drift');
      }
    } catch (err: any) {
      alert(`Simulation failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoadingScenario(null);
    }
  };

  const handleResetDemo = async () => {
    try {
      setLoading(true);
      await api.resetDemo();
      await fetchData();
      setActiveTab('overview');
    } catch (err: any) {
      alert(`Reset failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const criticalDriftCount = driftReports.filter(
    (d) => d.overallSeverity === 'CRITICAL' && d.remediationStatus !== 'RESOLVED',
  ).length;

  const pendingApprovalsCount = approvals.filter(
    (a) => a.status === 'PENDING_REVIEW',
  ).length;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation Header */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        user={user}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        onResetDemo={handleResetDemo}
        onOpenUploadModal={() => setUploadModalOpen(true)}
        onTriggerScenario={handleTriggerScenario}
        pendingApprovalsCount={pendingApprovalsCount}
        criticalDriftCount={criticalDriftCount}
      />

      {/* Demo Sandbox Banner */}
      <DemoBanner
        onTriggerScenario={handleTriggerScenario}
        onResetDemo={handleResetDemo}
        loadingScenario={loadingScenario}
      />

      {/* Main Content Area */}
      <main
        style={{
          flex: 1,
          maxWidth: '1440px',
          width: '100%',
          margin: '0 auto',
          padding: '1.5rem 1.25rem 3rem',
        }}
      >
        {/* Loading Spinner */}
        {loading && (
          <div
            style={{
              padding: '4rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              color: 'var(--text-dim)',
            }}
          >
            <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-cyan)' }} />
            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Loading contract telemetry & drift graphs...</div>
          </div>
        )}

        {/* Global Error Banner */}
        {error && !loading && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              padding: '1rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              color: '#fca5a5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <AlertCircle size={18} />
              <span style={{ fontSize: '0.88rem' }}>Backend connection notice: {error}</span>
            </div>
            <button
              onClick={fetchData}
              className="btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Active Tab View */}
        {!loading && (
          <>
            {activeTab === 'overview' && (
              <OverviewDashboard
                contracts={contracts}
                driftReports={driftReports}
                consumers={consumers}
                approvals={approvals}
                onNavigateTab={setActiveTab}
                onSelectContract={(id) => {
                  setSelectedContractId(id);
                  setActiveTab('contracts');
                }}
                onSelectDrift={(id) => {
                  setSelectedDriftId(id);
                  setActiveTab('drift');
                }}
              />
            )}

            {activeTab === 'contracts' && (
              <ContractsRegistry
                contracts={contracts}
                onRefresh={fetchData}
                selectedContractId={selectedContractId}
              />
            )}

            {activeTab === 'drift' && (
              <DriftMonitor
                driftReports={driftReports}
                selectedDriftId={selectedDriftId}
                onNavigateTab={setActiveTab}
                onRefresh={fetchData}
                onSelectProposal={(id) => {
                  setSelectedProposalId(id);
                  setActiveTab('proposals');
                }}
              />
            )}

            {activeTab === 'consumers' && (
              <ConsumerImpactMap
                contracts={contracts}
                driftReports={driftReports}
                consumers={consumers}
              />
            )}

            {activeTab === 'proposals' && (
              <MigrationReview
                proposals={proposals}
                approvals={approvals}
                selectedProposalId={selectedProposalId}
                user={user}
                onRefresh={fetchData}
                onOpenAuthModal={() => setAuthModalOpen(true)}
              />
            )}

            {activeTab === 'audit' && <AuditTrail auditLogs={auditLogs} />}
          </>
        )}
      </main>

      {/* Manual Upload Modal */}
      <ManualUploadModal
        contracts={contracts}
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={(driftId) => {
          fetchData();
          if (driftId) {
            setSelectedDriftId(driftId);
            setActiveTab('drift');
          }
        }}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(loggedUser) => {
          setUser(loggedUser);
          fetchData();
        }}
      />
    </div>
  );
}
