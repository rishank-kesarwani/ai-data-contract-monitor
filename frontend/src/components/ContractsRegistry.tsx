'use client';

import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Search,
  Filter,
  FileCode,
  Users,
  History,
  Shield,
  Trash2,
  Check,
  Copy,
  Download,
  X,
  ExternalLink,
} from 'lucide-react';
import { Contract, FieldType, SchemaField } from '../lib/types';
import { api } from '../lib/api';

interface ContractsRegistryProps {
  contracts: Contract[];
  onRefresh: () => void;
  selectedContractId?: string;
}

export const ContractsRegistry: React.FC<ContractsRegistryProps> = ({
  contracts,
  onRefresh,
  selectedContractId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');
  const [activeContract, setActiveContract] = useState<Contract | null>(
    selectedContractId ? contracts.find((c) => c.id === selectedContractId) || null : null,
  );
  const [jsonSchemaModalOpen, setJsonSchemaModalOpen] = useState(false);
  const [jsonSchemaContent, setJsonSchemaContent] = useState<string>('');
  const [newContractModalOpen, setNewContractModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // New Contract Form State
  const [newContract, setNewContract] = useState({
    name: '',
    description: '',
    domain: 'Billing & Payments',
    compatibilityMode: 'BACKWARD' as const,
    isStrict: false,
    ownerTeam: '',
    ownerContact: '',
    ownerTier: 'TIER_1' as const,
    fields: [
      {
        name: 'id',
        type: 'string' as FieldType,
        nullable: false,
        required: true,
        description: 'Primary identifier',
      },
    ],
  });

  const domains = ['ALL', ...Array.from(new Set(contracts.map((c) => c.domain)))];

  const filteredContracts = contracts.filter((c) => {
    const matchesDomain = selectedDomain === 'ALL' || c.domain === selectedDomain;
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.schema.some((f) => f.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesDomain && matchesSearch;
  });

  const handleExportJsonSchema = async (contract: Contract) => {
    try {
      const schema = await api.exportJsonSchema(contract.id);
      setJsonSchemaContent(JSON.stringify(schema, null, 2));
      setJsonSchemaModalOpen(true);
    } catch (err: any) {
      alert(`Failed to export schema: ${err.message}`);
    }
  };

  const handleCopySchema = () => {
    navigator.clipboard.writeText(jsonSchemaContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddField = () => {
    setNewContract((prev) => ({
      ...prev,
      fields: [
        ...prev.fields,
        {
          name: `field_${prev.fields.length + 1}`,
          type: 'string' as FieldType,
          nullable: true,
          required: false,
          description: '',
        },
      ],
    }));
  };

  const handleRemoveField = (index: number) => {
    setNewContract((prev) => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index),
    }));
  };

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContract.name) return;

    try {
      await api.createContract({
        name: newContract.name,
        description: newContract.description,
        domain: newContract.domain,
        compatibilityMode: newContract.compatibilityMode,
        isStrict: newContract.isStrict,
        owner: {
          team: newContract.ownerTeam || 'Platform Team',
          contact: newContract.ownerContact || 'owner@company.internal',
          tier: newContract.ownerTier,
        },
        schema: newContract.fields,
      });
      setNewContractModalOpen(false);
      setActionMessage('Data contract successfully registered.');
      setTimeout(() => setActionMessage(null), 3000);
      onRefresh();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header and Controls */}
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
            Data Contracts Registry
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Authoritative contracts specifying schemas, nullability, constraints, ownership, and compatibility rules.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => setNewContractModalOpen(true)}
            className="btn-primary"
            style={{ fontSize: '0.85rem' }}
          >
            <Plus size={16} />
            <span>Register New Contract</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#86efac', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
          {actionMessage}
        </div>
      )}

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
        {/* Search Input */}
        <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}
          />
          <input
            type="text"
            placeholder="Search contracts by name, field, or domain..."
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

        {/* Domain Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
          <Filter size={15} style={{ color: 'var(--text-dim)', marginRight: '0.2rem' }} />
          {domains.map((dom) => (
            <button
              key={dom}
              onClick={() => setSelectedDomain(dom)}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 600,
                background: selectedDomain === dom ? 'rgba(56, 189, 248, 0.2)' : 'var(--bg-surface)',
                color: selectedDomain === dom ? 'var(--accent-cyan)' : 'var(--text-muted)',
                border: selectedDomain === dom ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid var(--border-subtle)',
                whiteSpace: 'nowrap',
              }}
            >
              {dom}
            </button>
          ))}
        </div>
      </div>

      {/* Contracts Table / Stack View */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div className="table-responsive-wrapper">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.85rem 1.25rem' }}>Contract Name & Domain</th>
                <th style={{ padding: '0.85rem 1rem' }}>Version</th>
                <th style={{ padding: '0.85rem 1rem' }}>Compatibility</th>
                <th style={{ padding: '0.85rem 1rem' }}>Owner / SLA</th>
                <th style={{ padding: '0.85rem 1rem' }}>Fields</th>
                <th style={{ padding: '0.85rem 1rem' }}>Consumers</th>
                <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)' }}>
                    No data contracts found matching the filter.
                  </td>
                </tr>
              ) : (
                filteredContracts.map((contract) => (
                  <tr
                    key={contract.id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background 0.15s',
                    }}
                    className="contract-row"
                  >
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <div
                        onClick={() => setActiveContract(contract)}
                        style={{ fontWeight: 600, color: '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        <span>{contract.name}</span>
                        {contract.isStrict && (
                          <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', background: 'rgba(168, 85, 247, 0.2)', color: '#d8b4fe', borderRadius: '4px' }}>
                            STRICT
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        {contract.domain} • ID: <span style={{ fontFamily: 'var(--font-mono)' }}>{contract.id}</span>
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className="badge badge-info" style={{ fontFamily: 'var(--font-mono)' }}>
                        v{contract.version}
                      </span>
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          background: 'rgba(99, 102, 241, 0.12)',
                          color: '#a5b4fc',
                          fontWeight: 600,
                        }}
                      >
                        {contract.compatibilityMode}
                      </span>
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: 500, color: 'var(--text-main)' }}>
                        {contract.owner?.team || 'Core Platform'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                        Tier: {contract.owner?.tier || 'TIER_1'}
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        {contract.schema.length}
                      </span>
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span
                        style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: 'var(--radius-full)',
                          background: 'rgba(255, 255, 255, 0.05)',
                          fontSize: '0.75rem',
                        }}
                      >
                        {contract.consumers.length} mapped
                      </span>
                    </td>

                    <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <button
                          onClick={() => setActiveContract(contract)}
                          className="btn-secondary"
                          style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                          title="Inspect contract fields, nullability, and consumers"
                        >
                          Inspect
                        </button>
                        <button
                          onClick={() => handleExportJsonSchema(contract)}
                          className="btn-secondary"
                          style={{ fontSize: '0.75rem', padding: '0.35rem 0.55rem' }}
                          title="Export JSON Schema"
                        >
                          <FileCode size={14} style={{ color: 'var(--accent-cyan)' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contract Detail Modal */}
      {activeContract && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 100,
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
              maxWidth: '880px',
              maxHeight: '90vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc' }}>
                    {activeContract.name}
                  </h3>
                  <span className="badge badge-info">v{activeContract.version}</span>
                  <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc' }}>
                    {activeContract.compatibilityMode}
                  </span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {activeContract.description}
                </p>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                  Domain: {activeContract.domain} • Owner: {activeContract.owner?.team} ({activeContract.owner?.contact})
                </div>
              </div>

              <button
                onClick={() => setActiveContract(null)}
                style={{ padding: '0.5rem', color: 'var(--text-dim)', borderRadius: 'var(--radius-sm)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Schema Definition Fields Table */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Schema Specification ({activeContract.schema.length} fields)
                </h4>
                <button
                  onClick={() => handleExportJsonSchema(activeContract)}
                  className="btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                >
                  <FileCode size={13} />
                  <span>JSON Schema</span>
                </button>
              </div>

              <div className="table-responsive-wrapper" style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead style={{ background: 'rgba(255, 255, 255, 0.02)', color: 'var(--text-dim)' }}>
                    <tr>
                      <th style={{ padding: '0.6rem 0.75rem' }}>Field Name</th>
                      <th style={{ padding: '0.6rem 0.75rem' }}>Type</th>
                      <th style={{ padding: '0.6rem 0.75rem' }}>Nullability</th>
                      <th style={{ padding: '0.6rem 0.75rem' }}>Required</th>
                      <th style={{ padding: '0.6rem 0.75rem' }}>Constraints & Rules</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeContract.schema.map((field) => (
                      <tr key={field.name} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '0.6rem 0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                          {field.name}
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
                            {field.type}
                          </span>
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem' }}>
                          {field.nullable ? (
                            <span style={{ color: 'var(--text-muted)' }}>Nullable</span>
                          ) : (
                            <span style={{ color: '#fbbf24', fontWeight: 600 }}>NOT NULL</span>
                          )}
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem' }}>
                          {field.required ? (
                            <span style={{ color: '#f87171', fontWeight: 600 }}>Required</span>
                          ) : (
                            <span style={{ color: 'var(--text-dim)' }}>Optional</span>
                          )}
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {field.constraints ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                              {field.constraints.pattern && (
                                <span style={{ padding: '0.1rem 0.35rem', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>
                                  regex: {field.constraints.pattern}
                                </span>
                              )}
                              {field.constraints.enum && (
                                <span style={{ padding: '0.1rem 0.35rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '4px' }}>
                                  enum: [{field.constraints.enum.join(', ')}]
                                </span>
                              )}
                              {field.constraints.maxNullRate !== undefined && (
                                <span style={{ padding: '0.1rem 0.35rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '4px' }}>
                                  maxNull: {(field.constraints.maxNullRate * 100).toFixed(0)}%
                                </span>
                              )}
                              {field.constraints.isPii && (
                                <span style={{ padding: '0.1rem 0.35rem', background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', borderRadius: '4px', fontWeight: 600 }}>
                                  PII
                                </span>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-dim)' }}>None</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Registered Downstream Consumers */}
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                Downstream Consumers ({activeContract.consumers.length} registered)
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {activeContract.consumers.map((cons) => (
                  <div
                    key={cons.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.75rem',
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.85rem' }}>
                        {cons.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        Team: {cons.team} • SLA: {cons.sla || cons.interfaceType} • Tier: {cons.tier}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                      {cons.consumedFields.map((f) => (
                        <span
                          key={f}
                          style={{
                            padding: '0.1rem 0.4rem',
                            borderRadius: '4px',
                            background: 'rgba(56, 189, 248, 0.1)',
                            color: 'var(--accent-cyan)',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.7rem',
                          }}
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Version History Changelog */}
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                Version History & Audit Log
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {activeContract.versionHistory.map((vh, idx) => (
                  <div
                    key={idx}
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>v{vh.version}</span>
                    <span>{vh.changeSummary}</span>
                    <span style={{ color: 'var(--text-dim)', marginLeft: 'auto' }}>
                      {new Date(vh.updatedAt).toLocaleDateString()} by {vh.author}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* JSON Schema Export Modal */}
      {jsonSchemaModalOpen && (
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
              maxWidth: '680px',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              padding: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileCode size={20} style={{ color: 'var(--accent-cyan)' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
                  Draft-07 Standard JSON Schema Export
                </h3>
              </div>
              <button onClick={() => setJsonSchemaModalOpen(false)} style={{ color: 'var(--text-dim)' }}>
                <X size={20} />
              </button>
            </div>

            <pre className="code-block" style={{ maxHeight: '420px', overflowY: 'auto' }}>
              <code>{jsonSchemaContent}</code>
            </pre>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button onClick={handleCopySchema} className="btn-primary" style={{ fontSize: '0.8rem' }}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Copied to Clipboard' : 'Copy JSON Schema'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register New Contract Modal */}
      {newContractModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <form
            onSubmit={handleCreateContract}
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '720px',
              maxHeight: '90vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              padding: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>
                Register New Data Contract
              </h3>
              <button
                type="button"
                onClick={() => setNewContractModalOpen(false)}
                style={{ color: 'var(--text-dim)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>CONTRACT NAME</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Payment Transactions Stream"
                  value={newContract.name}
                  onChange={(e) => setNewContract({ ...newContract, name: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff', marginTop: '0.2rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>DOMAIN</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fintech & Ledger"
                  value={newContract.domain}
                  onChange={(e) => setNewContract({ ...newContract, domain: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff', marginTop: '0.2rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>COMPATIBILITY MODE</label>
                <select
                  value={newContract.compatibilityMode}
                  onChange={(e) => setNewContract({ ...newContract, compatibilityMode: e.target.value as any })}
                  style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff', marginTop: '0.2rem' }}
                >
                  <option value="BACKWARD">BACKWARD (Recommended)</option>
                  <option value="FORWARD">FORWARD</option>
                  <option value="FULL">FULL (Strict bidirectional)</option>
                  <option value="NONE">NONE (Unchecked)</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>DESCRIPTION</label>
              <textarea
                rows={2}
                placeholder="Business purpose, freshness expectations, and producer guarantees..."
                value={newContract.description}
                onChange={(e) => setNewContract({ ...newContract, description: e.target.value })}
                style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff', marginTop: '0.2rem' }}
              />
            </div>

            {/* Field Builder */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#f8fafc', fontWeight: 700 }}>
                  Schema Fields ({newContract.fields.length})
                </label>
                <button
                  type="button"
                  onClick={handleAddField}
                  className="btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                >
                  <Plus size={13} />
                  <span>Add Field</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {newContract.fields.map((f, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: 'rgba(255, 255, 255, 0.02)',
                      padding: '0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Field name"
                      value={f.name}
                      onChange={(e) => {
                        const updated = [...newContract.fields];
                        updated[i].name = e.target.value;
                        setNewContract({ ...newContract, fields: updated });
                      }}
                      style={{ flex: 1, minWidth: '120px', padding: '0.4rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '4px', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
                    />

                    <select
                      value={f.type}
                      onChange={(e) => {
                        const updated = [...newContract.fields];
                        updated[i].type = e.target.value as FieldType;
                        setNewContract({ ...newContract, fields: updated });
                      }}
                      style={{ padding: '0.4rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '4px', color: '#fff', fontSize: '0.8rem' }}
                    >
                      <option value="string">string</option>
                      <option value="integer">integer</option>
                      <option value="float">float</option>
                      <option value="boolean">boolean</option>
                      <option value="timestamp">timestamp</option>
                      <option value="object">object</option>
                      <option value="array">array</option>
                    </select>

                    <label style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)' }}>
                      <input
                        type="checkbox"
                        checked={f.required}
                        onChange={(e) => {
                          const updated = [...newContract.fields];
                          updated[i].required = e.target.checked;
                          setNewContract({ ...newContract, fields: updated });
                        }}
                      />
                      <span>Required</span>
                    </label>

                    <label style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)' }}>
                      <input
                        type="checkbox"
                        checked={f.nullable}
                        onChange={(e) => {
                          const updated = [...newContract.fields];
                          updated[i].nullable = e.target.checked;
                          setNewContract({ ...newContract, fields: updated });
                        }}
                      />
                      <span>Nullable</span>
                    </label>

                    {newContract.fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveField(i)}
                        style={{ color: '#f87171', padding: '0.3rem' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={() => setNewContractModalOpen(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Register Contract
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
