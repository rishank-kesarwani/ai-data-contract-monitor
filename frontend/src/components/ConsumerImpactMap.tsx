'use client';

import React, { useState } from 'react';
import {
  Network,
  AlertTriangle,
  CheckCircle2,
  Server,
  Database,
  Radio,
  FileSpreadsheet,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { Contract, DriftReport, RegisteredConsumer } from '../lib/types';

interface ConsumerImpactMapProps {
  contracts: Contract[];
  driftReports: DriftReport[];
  consumers: RegisteredConsumer[];
}

export const ConsumerImpactMap: React.FC<ConsumerImpactMapProps> = ({
  contracts,
  driftReports,
  consumers,
}) => {
  const [selectedContractId, setSelectedContractId] = useState<string>(
    contracts[0]?.id || '',
  );
  const [selectedField, setSelectedField] = useState<string | null>(null);

  const activeContract = contracts.find((c) => c.id === selectedContractId) || contracts[0];
  const activeDrift = driftReports.find(
    (d) => d.contractId === activeContract?.id && d.remediationStatus !== 'RESOLVED',
  );

  const contractConsumers = consumers.filter((c) =>
    activeContract?.consumers.some((ac) => ac.id === c.id),
  );

  // Drifted fields in active contract
  const driftedFieldNames = new Set(activeDrift?.changes.map((c) => c.field) || []);

  const getInterfaceIcon = (type: string) => {
    switch (type) {
      case 'EVENT_STREAM':
        return <Radio size={14} style={{ color: 'var(--accent-cyan)' }} />;
      case 'SQL_VIEW':
        return <Database size={14} style={{ color: 'var(--accent-indigo)' }} />;
      case 'BATCH_ETL':
        return <FileSpreadsheet size={14} style={{ color: 'var(--accent-purple)' }} />;
      default:
        return <Server size={14} style={{ color: 'var(--accent-emerald)' }} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header and Contract Selector */}
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
            Consumer Dependency & Impact Topology
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Direct field-level lineage mapping downstream consumers against active contracts and detected drifts.
          </p>
        </div>

        {/* Contract Selector Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflowX: 'auto' }}>
          {contracts.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setSelectedContractId(c.id);
                setSelectedField(null);
              }}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.78rem',
                fontWeight: 600,
                background: selectedContractId === c.id ? 'rgba(56, 189, 248, 0.2)' : 'var(--bg-surface)',
                color: selectedContractId === c.id ? 'var(--accent-cyan)' : 'var(--text-muted)',
                border: selectedContractId === c.id ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid var(--border-subtle)',
                whiteSpace: 'nowrap',
              }}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Active Contract Info Bar */}
      {activeContract && (
        <div
          className="glass-panel"
          style={{
            padding: '1rem 1.25rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '1rem' }}>
              {activeContract.name} (v{activeContract.version})
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Owner: {activeContract.owner?.team} • Compatibility: {activeContract.compatibilityMode} • {activeContract.schema.length} contracted fields
            </div>
          </div>

          <div>
            {activeDrift ? (
              <span className="badge badge-critical" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <ShieldAlert size={14} />
                Active Drift: {activeDrift.categorySummary.breakingCount} Breaking Changes
              </span>
            ) : (
              <span className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <CheckCircle2 size={14} />
                No Active Drift (All Consumers Healthy)
              </span>
            )}
          </div>
        </div>
      )}

      {/* Topology Graph / Visual Representation */}
      <div
        className="glass-panel"
        style={{
          padding: '1.5rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2rem',
          alignItems: 'start',
        }}
      >
        {/* Column 1: Contract Schema Fields */}
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Contracted Fields ({activeContract?.schema.length || 0})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {activeContract?.schema.map((f) => {
              const isDrifted = driftedFieldNames.has(f.name);
              const isSelected = selectedField === f.name;

              return (
                <div
                  key={f.name}
                  onClick={() => setSelectedField(isSelected ? null : f.name)}
                  style={{
                    padding: '0.55rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: isSelected
                      ? 'rgba(56, 189, 248, 0.2)'
                      : isDrifted
                        ? 'rgba(239, 68, 68, 0.12)'
                        : 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${
                      isSelected
                        ? 'var(--accent-cyan)'
                        : isDrifted
                          ? 'rgba(239, 68, 68, 0.4)'
                          : 'var(--border-subtle)'
                    }`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: isDrifted ? '#f87171' : '#34d399',
                      }}
                    />
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.82rem', color: isDrifted ? '#fca5a5' : '#f8fafc' }}>
                      {f.name}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                    {f.type}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 2: Downstream Consumers & Field-Level Lineage */}
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Registered Consumers ({contractConsumers.length})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {contractConsumers.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                No downstream consumers registered for this contract.
              </div>
            ) : (
              contractConsumers.map((consumer) => {
                const consumedDriftedFields = consumer.consumedFields.filter((f) =>
                  driftedFieldNames.has(f),
                );
                const isFailing = consumedDriftedFields.length > 0 && (consumer.criticality === 'BLOCKING' || consumer.tier === 'TIER_1');
                const isDegraded = consumedDriftedFields.length > 0 && !isFailing;
                const isHealthy = consumedDriftedFields.length === 0;

                const highlightsSelectedField = selectedField && consumer.consumedFields.includes(selectedField);

                return (
                  <div
                    key={consumer.id}
                    className="glass-card"
                    style={{
                      borderColor: highlightsSelectedField
                        ? 'var(--accent-cyan)'
                        : isFailing
                          ? 'rgba(239, 68, 68, 0.45)'
                          : isDegraded
                            ? 'rgba(245, 158, 11, 0.45)'
                            : undefined,
                      background: isFailing
                        ? 'rgba(239, 68, 68, 0.08)'
                        : isDegraded
                          ? 'rgba(245, 158, 11, 0.08)'
                          : undefined,
                      boxShadow: highlightsSelectedField ? 'var(--border-glow)' : undefined,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        {getInterfaceIcon(consumer.interfaceType)}
                        <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.92rem' }}>
                          {consumer.name}
                        </span>
                      </div>
                      <span
                        className={`badge ${
                          isFailing ? 'badge-critical' : isDegraded ? 'badge-medium' : 'badge-info'
                        }`}
                        style={{ fontSize: '0.68rem' }}
                      >
                        {isFailing ? 'FAILING' : isDegraded ? 'DEGRADED' : 'HEALTHY'}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.45rem' }}>
                      Team: {consumer.team} ({consumer.contact}) • SLA: {consumer.sla || consumer.interfaceType}
                    </div>

                    {isFailing && (
                      <div style={{ padding: '0.45rem 0.6rem', background: 'rgba(239, 68, 68, 0.15)', borderRadius: 'var(--radius-sm)', color: '#fca5a5', fontSize: '0.75rem', marginBottom: '0.5rem', lineHeight: 1.4 }}>
                        🚨 <strong>BLOCKING OUTAGE:</strong> Upstream field drift on [
                        {consumedDriftedFields.join(', ')}] violates pipeline contract.
                      </div>
                    )}

                    {isDegraded && (
                      <div style={{ padding: '0.45rem 0.6rem', background: 'rgba(245, 158, 11, 0.15)', borderRadius: 'var(--radius-sm)', color: '#fde047', fontSize: '0.75rem', marginBottom: '0.5rem', lineHeight: 1.4 }}>
                        ⚠️ <strong>DEGRADED:</strong> Non-critical field drift on [
                        {consumedDriftedFields.join(', ')}].
                      </div>
                    )}

                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                        Consumed Fields Lineage:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {consumer.consumedFields.map((f) => {
                          const fieldHasDrift = driftedFieldNames.has(f);
                          const isMatch = selectedField === f;

                          return (
                            <span
                              key={f}
                              onClick={() => setSelectedField(f)}
                              style={{
                                padding: '0.15rem 0.45rem',
                                borderRadius: '4px',
                                fontFamily: 'var(--font-mono)',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                background: isMatch
                                  ? 'var(--accent-cyan)'
                                  : fieldHasDrift
                                    ? 'rgba(239, 68, 68, 0.3)'
                                    : 'rgba(255, 255, 255, 0.05)',
                                color: isMatch ? '#030712' : fieldHasDrift ? '#fca5a5' : 'var(--text-muted)',
                                border: fieldHasDrift ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid transparent',
                                cursor: 'pointer',
                              }}
                            >
                              {f}
                            </span>
                          );
                        })}
                      </div>
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
