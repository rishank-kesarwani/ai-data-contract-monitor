'use client';

import React, { useState } from 'react';
import { History, Filter, Search, Shield, Eye } from 'lucide-react';
import { AuditLogEntry } from '../lib/types';

interface AuditTrailProps {
  auditLogs: AuditLogEntry[];
}

export const AuditTrail: React.FC<AuditTrailProps> = ({ auditLogs }) => {
  const [resourceFilter, setResourceFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeLog, setActiveLog] = useState<AuditLogEntry | null>(null);

  const filteredLogs = auditLogs.filter((log) => {
    const matchesResource = resourceFilter === 'ALL' || log.resourceType === resourceFilter;
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resourceId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesResource && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc' }}>
          Governance & Audit Ledger
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Tamper-evident log recording all schema ingestions, drift evaluations, operator approvals, and version promotions.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '0.75rem 1.25rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}
          />
          <input
            type="text"
            placeholder="Search audit trail by actor, action, or resource ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.55rem 0.85rem 0.55rem 2.5rem',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-main)',
              fontSize: '0.85rem',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflowX: 'auto' }}>
          <Filter size={15} style={{ color: 'var(--text-dim)', marginRight: '0.2rem' }} />
          {['ALL', 'CONTRACT', 'DRIFT', 'PROPOSAL', 'APPROVAL', 'SNAPSHOT'].map((res) => (
            <button
              key={res}
              onClick={() => setResourceFilter(res)}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 600,
                background: resourceFilter === res ? 'rgba(56, 189, 248, 0.2)' : 'var(--bg-surface)',
                color: resourceFilter === res ? 'var(--accent-cyan)' : 'var(--text-muted)',
                border: resourceFilter === res ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid var(--border-subtle)',
              }}
            >
              {res}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div className="table-responsive-wrapper">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.85rem 1.25rem' }}>Timestamp</th>
                <th style={{ padding: '0.85rem 1rem' }}>Action</th>
                <th style={{ padding: '0.85rem 1rem' }}>Actor</th>
                <th style={{ padding: '0.85rem 1rem' }}>Target Resource</th>
                <th style={{ padding: '0.85rem 1rem' }}>Correlation Trace</th>
                <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)' }}>
                    No audit log records found matching the filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    style={{ borderBottom: '1px solid var(--border-subtle)' }}
                    className="audit-row"
                  >
                    <td style={{ padding: '0.85rem 1.25rem', color: 'var(--text-dim)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          padding: '0.2rem 0.5rem',
                          borderRadius: 'var(--radius-full)',
                          background:
                            log.action.includes('APPROVED') || log.action.includes('PUBLISHED')
                              ? 'rgba(16, 185, 129, 0.15)'
                              : log.action.includes('DRIFT')
                                ? 'rgba(239, 68, 68, 0.15)'
                                : 'rgba(56, 189, 248, 0.15)',
                          color:
                            log.action.includes('APPROVED') || log.action.includes('PUBLISHED')
                              ? '#86efac'
                              : log.action.includes('DRIFT')
                                ? '#fca5a5'
                                : '#93c5fd',
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.85rem' }}>
                        {log.actorName}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                        Role: {log.actorRole}
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                        {log.resourceType}: {log.resourceId}
                      </span>
                    </td>

                    <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                      {log.correlationId || 'internal-trace'}
                    </td>

                    <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                      <button
                        onClick={() => setActiveLog(log)}
                        className="btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.55rem' }}
                      >
                        <Eye size={13} />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Detail Modal */}
      {activeLog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 110,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '600px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={18} style={{ color: 'var(--accent-cyan)' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
                  Audit Event Details
                </h3>
              </div>
              <button onClick={() => setActiveLog(null)} style={{ color: 'var(--text-dim)' }}>
                ✕
              </button>
            </div>

            <pre className="code-block" style={{ maxHeight: '350px', overflowY: 'auto' }}>
              <code>{JSON.stringify(activeLog, null, 2)}</code>
            </pre>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setActiveLog(null)} className="btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
