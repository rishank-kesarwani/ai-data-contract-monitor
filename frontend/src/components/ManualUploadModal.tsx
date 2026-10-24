'use client';

import React, { useState } from 'react';
import { UploadCloud, X, Check, AlertCircle } from 'lucide-react';
import { Contract, FieldType, SnapshotField } from '../lib/types';
import { api } from '../lib/api';

interface ManualUploadModalProps {
  contracts: Contract[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (driftId?: string) => void;
}

export const ManualUploadModal: React.FC<ManualUploadModalProps> = ({
  contracts,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedContractId, setSelectedContractId] = useState<string>(
    contracts[0]?.id || '',
  );
  const [uploadFormat, setUploadFormat] = useState<'JSON_PAYLOAD' | 'JSON_SCHEMA'>('JSON_PAYLOAD');
  const [payloadText, setPayloadText] = useState<string>(`{
  "order_id": "ord_a1b2c3d4",
  "customer_id": "cust_9981",
  "customer_email": "jane***@corp.net",
  "total_amount": 149.95,
  "currency": "USD",
  "items_count": 3,
  "order_status": "CONFIRMED",
  "created_at": "2026-10-24T12:00:00Z"
}`);
  const [sourceLabel, setSourceLabel] = useState('Manual Telemetry Upload (Developer Console)');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const parsed = JSON.parse(payloadText);
      const fields: SnapshotField[] = [];

      if (uploadFormat === 'JSON_PAYLOAD') {
        const record = Array.isArray(parsed) ? parsed[0] : parsed;
        for (const [key, val] of Object.entries(record)) {
          let inferredType: FieldType = 'string';
          if (typeof val === 'number') {
            inferredType = Number.isInteger(val) ? 'integer' : 'float';
          } else if (typeof val === 'boolean') {
            inferredType = 'boolean';
          } else if (typeof val === 'object' && val !== null) {
            inferredType = Array.isArray(val) ? 'array' : 'object';
          }

          fields.push({
            name: key,
            inferredType,
            nullable: val === null,
            nullCount: val === null ? 1 : 0,
            nullRate: val === null ? 1.0 : 0.0,
            sampleValues: [val as any],
          });
        }
      } else {
        // JSON Schema format
        const properties = parsed.properties || {};
        for (const [name, def] of Object.entries<any>(properties)) {
          let type: FieldType = 'string';
          if (def.type === 'integer') type = 'integer';
          else if (def.type === 'number') type = 'float';
          else if (def.type === 'boolean') type = 'boolean';
          else if (def.type === 'object') type = 'object';
          else if (def.type === 'array') type = 'array';

          fields.push({
            name,
            inferredType: type,
            nullable: Array.isArray(def.type) ? def.type.includes('null') : false,
            nullCount: 0,
            nullRate: 0.0,
            sampleValues: ['sample_value'],
          });
        }
      }

      // 1. Ingest Snapshot
      const snapshot = await api.ingestSnapshot({
        contractId: selectedContractId,
        source: sourceLabel,
        environment: 'staging',
        recordCountSampled: 1000,
        fields,
        rawJsonSchema: uploadFormat === 'JSON_SCHEMA' ? parsed : undefined,
      });

      // 2. Evaluate Drift immediately
      const drift = await api.evaluateDrift(selectedContractId, snapshot.id);

      onSuccess(drift.id);
      onClose();
    } catch (err: any) {
      setError(`Failed to parse or ingest payload: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
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
      <form
        onSubmit={handleUpload}
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '680px',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UploadCloud size={20} style={{ color: 'var(--accent-cyan)' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
              Manual Schema & Telemetry Snapshot Ingestion
            </h3>
          </div>
          <button type="button" onClick={onClose} style={{ color: 'var(--text-dim)' }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
          Paste a sample JSON payload or standard JSON Schema to evaluate against your data contracts.
          Metadata is automatically sanitized to protect any sensitive production attributes.
        </p>

        {error && (
          <div style={{ padding: '0.65rem 0.85rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>TARGET DATA CONTRACT</label>
            <select
              value={selectedContractId}
              onChange={(e) => setSelectedContractId(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff', marginTop: '0.2rem' }}
            >
              {contracts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (v{c.version})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>INPUT FORMAT</label>
            <select
              value={uploadFormat}
              onChange={(e) => setUploadFormat(e.target.value as any)}
              style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff', marginTop: '0.2rem' }}
            >
              <option value="JSON_PAYLOAD">Sample JSON Payload / Record</option>
              <option value="JSON_SCHEMA">Standard JSON Schema (Draft-07)</option>
            </select>
          </div>
        </div>

        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>SOURCE CONNECTOR IDENTIFIER</label>
          <input
            type="text"
            value={sourceLabel}
            onChange={(e) => setSourceLabel(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff', marginTop: '0.2rem' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>JSON CONTENT</label>
          <textarea
            rows={8}
            value={payloadText}
            onChange={(e) => setPayloadText(e.target.value)}
            style={{
              width: '100%',
              padding: '0.65rem',
              background: '#05080f',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--accent-cyan)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              marginTop: '0.2rem',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Evaluating Drift...' : 'Ingest & Compare Schema'}
          </button>
        </div>
      </form>
    </div>
  );
};
