import { ApprovalsService } from './approvals.service';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ApprovalRequest, Contract, MigrationProposal, UserSession } from '../../common/types';

describe('ApprovalsService', () => {
  let service: ApprovalsService;
  let mockDb: any;
  let mockContractsService: any;
  let mockNotificationAdapter: any;

  beforeEach(() => {
    mockDb = {
      getApprovalById: jest.fn(),
      getProposalById: jest.fn(),
      getContractById: jest.fn(),
      getDriftReportById: jest.fn(),
      saveApproval: jest.fn(),
      saveProposal: jest.fn(),
      saveContract: jest.fn(),
      saveDriftReport: jest.fn(),
      saveAuditLog: jest.fn(),
      getApprovals: jest.fn(),
    };
    mockContractsService = {
      bumpVersion: jest.fn().mockResolvedValue({}),
    };
    mockNotificationAdapter = {
      sendAlert: jest.fn().mockResolvedValue(true),
    };

    service = new ApprovalsService(mockDb, mockContractsService, mockNotificationAdapter);
  });

  const baseApproval: ApprovalRequest = {
    id: 'appr-1',
    proposalId: 'prop-1',
    contractId: 'ct-1',
    driftReportId: 'drift-1',
    status: 'PENDING_REVIEW',
    requiredApprovals: 1,
    currentApprovals: 0,
    decisions: [],
    createdAt: '2026-01-01T00:00:00Z',
  };

  const baseProposal: MigrationProposal = {
    id: 'prop-1',
    driftReportId: 'drift-1',
    contractId: 'ct-1',
    currentVersion: '1.0.0',
    proposedVersion: '2.0.0',
    title: 'Major schema migration',
    executiveSummary: 'Summary',
    rootCauseAnalysis: 'Root cause',
    compatibilityImpact: 'Impact',
    phases: [],
    proposedSchema: [],
    schemaDiff: { added: [], removed: [], modified: [] },
    codeSnippets: [],
    generatedBy: 'DETERMINISTIC_ENGINE',
    createdAt: '2026-01-01T00:00:00Z',
    approvalStatus: 'PENDING_REVIEW',
  };

  const baseContract: Contract = {
    id: 'ct-1',
    name: 'Customer Orders',
    description: 'Contract',
    domain: 'Billing',
    status: 'ACTIVE',
    version: '1.0.0',
    owner: { team: 'Checkout', contact: 'chk@test.local', tier: 'TIER_1' },
    compatibilityMode: 'BACKWARD',
    isStrict: false,
    schema: [],
    consumers: [],
    versionHistory: [],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const adminActor: UserSession = {
    id: 'usr-admin',
    username: 'admin',
    role: 'ADMIN',
  };

  it('should approve proposal, bump contract version, and resolve drift', async () => {
    mockDb.getApprovalById.mockResolvedValue(baseApproval);
    mockDb.getProposalById.mockResolvedValue(baseProposal);
    mockDb.getContractById.mockResolvedValue(baseContract);
    mockDb.getDriftReportById.mockResolvedValue({ id: 'drift-1', impactedConsumers: [] });

    const result = await service.decide(
      'appr-1',
      { decision: 'APPROVE', comments: 'Verified dual-write plan and consumer readiness.' },
      adminActor,
    );

    expect(result.status).toBe('APPROVED');
    expect(result.currentApprovals).toBe(1);
    expect(mockContractsService.bumpVersion).toHaveBeenCalledWith(
      'ct-1',
      '2.0.0',
      expect.stringContaining('Approved schema evolution migration'),
      expect.any(Array),
      adminActor,
    );
    expect(mockNotificationAdapter.sendAlert).toHaveBeenCalled();
  });

  it('should reject decision if public viewer attempts approval', async () => {
    mockDb.getApprovalById.mockResolvedValue(baseApproval);
    const publicActor: UserSession = {
      id: 'usr-guest',
      username: 'guest',
      role: 'PUBLIC_VIEWER',
    };

    await expect(
      service.decide(
        'appr-1',
        { decision: 'APPROVE', comments: 'Trying to approve' },
        publicActor,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should reject further decisions once approval is already finalized', async () => {
    mockDb.getApprovalById.mockResolvedValue({
      ...baseApproval,
      status: 'APPROVED',
    });

    await expect(
      service.decide(
        'appr-1',
        { decision: 'REJECT', comments: 'Too late' },
        adminActor,
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
