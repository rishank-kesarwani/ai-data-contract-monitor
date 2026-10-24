import axios from 'axios';
import {
  ApprovalRequest,
  AuditLogEntry,
  Contract,
  DriftReport,
  MigrationProposal,
  RegisteredConsumer,
  SchemaSnapshot,
  UserSession,
} from './types';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor to inject Bearer token from localStorage if available
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const api = {
  // Auth
  async login(username: string, pass: string): Promise<{ access_token: string; user: UserSession }> {
    const res = await apiClient.post('/auth/login', { username, password: pass });
    if (res.data?.access_token && typeof window !== 'undefined') {
      localStorage.setItem('auth_token', res.data.access_token);
      localStorage.setItem('user_session', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  async logout(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_session');
    }
  },

  async getProfile(): Promise<{ authenticated: boolean; user: UserSession }> {
    try {
      const res = await apiClient.get('/auth/me');
      return res.data;
    } catch {
      return {
        authenticated: false,
        user: { id: 'public-viewer', username: 'Guest Viewer', role: 'PUBLIC_VIEWER' },
      };
    }
  },

  async getPublicStatus(): Promise<{ publicAccessEnabled: boolean; mode: string; description: string }> {
    const res = await apiClient.get('/auth/status');
    return res.data;
  },

  // Contracts
  async getContracts(domain?: string): Promise<Contract[]> {
    const res = await apiClient.get('/contracts', { params: domain ? { domain } : {} });
    return res.data;
  },

  async getContract(id: string): Promise<Contract> {
    const res = await apiClient.get(`/contracts/${id}`);
    return res.data;
  },

  async createContract(dto: Partial<Contract>): Promise<Contract> {
    const res = await apiClient.post('/contracts', dto);
    return res.data;
  },

  async updateContract(id: string, dto: Partial<Contract>): Promise<Contract> {
    const res = await apiClient.put(`/contracts/${id}`, dto);
    return res.data;
  },

  async deleteContract(id: string): Promise<{ success: boolean }> {
    const res = await apiClient.delete(`/contracts/${id}`);
    return res.data;
  },

  async exportJsonSchema(id: string): Promise<Record<string, any>> {
    const res = await apiClient.get(`/contracts/${id}/json-schema`);
    return res.data;
  },

  async importJsonSchema(name: string, jsonSchema: Record<string, any>): Promise<any> {
    const res = await apiClient.post('/contracts/import-json-schema', { name, jsonSchema });
    return res.data;
  },

  // Snapshots
  async getSnapshots(contractId?: string): Promise<SchemaSnapshot[]> {
    const res = await apiClient.get('/snapshots', { params: contractId ? { contractId } : {} });
    return res.data;
  },

  async ingestSnapshot(dto: any): Promise<SchemaSnapshot> {
    const res = await apiClient.post('/snapshots/ingest', dto);
    return res.data;
  },

  // Drift
  async getDriftReports(params?: {
    contractId?: string;
    severity?: string;
    remediationStatus?: string;
  }): Promise<DriftReport[]> {
    const res = await apiClient.get('/drift', { params });
    return res.data;
  },

  async getDriftReport(id: string): Promise<DriftReport> {
    const res = await apiClient.get(`/drift/${id}`);
    return res.data;
  },

  async evaluateDrift(contractId: string, snapshotId: string): Promise<DriftReport> {
    const res = await apiClient.post('/drift/evaluate', { contractId, snapshotId });
    return res.data;
  },

  // Consumers
  async getConsumers(contractId?: string): Promise<RegisteredConsumer[]> {
    const res = await apiClient.get('/consumers', { params: contractId ? { contractId } : {} });
    return res.data;
  },

  async registerConsumer(dto: any): Promise<RegisteredConsumer> {
    const res = await apiClient.post('/consumers', dto);
    return res.data;
  },

  // Migration Proposals
  async getProposals(contractId?: string): Promise<MigrationProposal[]> {
    const res = await apiClient.get('/proposals', { params: contractId ? { contractId } : {} });
    return res.data;
  },

  async getProposal(id: string): Promise<MigrationProposal> {
    const res = await apiClient.get(`/proposals/${id}`);
    return res.data;
  },

  async generateProposal(driftReportId: string): Promise<MigrationProposal> {
    const res = await apiClient.post('/proposals/generate', { driftReportId });
    return res.data;
  },

  // Approvals
  async getApprovals(params?: { contractId?: string; status?: string }): Promise<ApprovalRequest[]> {
    const res = await apiClient.get('/approvals', { params });
    return res.data;
  },

  async getApproval(id: string): Promise<ApprovalRequest> {
    const res = await apiClient.get(`/approvals/${id}`);
    return res.data;
  },

  async submitDecision(
    id: string,
    decision: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES',
    comments: string,
  ): Promise<ApprovalRequest> {
    const res = await apiClient.post(`/approvals/${id}/decide`, { decision, comments });
    return res.data;
  },

  // Audit
  async getAuditLogs(params?: { resourceType?: string; resourceId?: string; limit?: number }): Promise<AuditLogEntry[]> {
    const res = await apiClient.get('/audit', { params });
    return res.data;
  },

  // Demo Sandbox
  async getScenarios(): Promise<any[]> {
    const res = await apiClient.get('/demo/scenarios');
    return res.data;
  },

  async triggerScenario(key: string): Promise<any> {
    const res = await apiClient.post(`/demo/scenario/${key}`);
    return res.data;
  },

  async resetDemo(): Promise<any> {
    const res = await apiClient.post('/demo/reset');
    return res.data;
  },
};
