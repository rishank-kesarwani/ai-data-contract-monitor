import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AiPlatformAdapter } from '../integrations/ai-platform.adapter';
import {
  ApprovalRequest,
  MigrationProposal,
  SchemaField,
  UserSession,
} from '../../common/types';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MigrationProposalsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly aiAdapter: AiPlatformAdapter,
  ) {}

  async findAll(contractId?: string): Promise<MigrationProposal[]> {
    return this.db.getProposals(contractId);
  }

  async findOne(id: string): Promise<MigrationProposal> {
    const proposal = await this.db.getProposalById(id);
    if (!proposal) {
      throw new NotFoundException(`Migration proposal with ID '${id}' not found`);
    }
    return proposal;
  }

  async generate(driftReportId: string, actor?: UserSession): Promise<MigrationProposal> {
    const driftReport = await this.db.getDriftReportById(driftReportId);
    if (!driftReport) {
      throw new NotFoundException(`Drift report with ID '${driftReportId}' not found`);
    }

    const contract = await this.db.getContractById(driftReport.contractId);
    if (!contract) {
      throw new NotFoundException(`Contract with ID '${driftReport.contractId}' not found`);
    }

    const snapshot = await this.db.getSnapshotById(driftReport.snapshotId);
    if (!snapshot) {
      throw new NotFoundException(`Snapshot with ID '${driftReport.snapshotId}' not found`);
    }

    // Synthesize proposed schema fields:
    // Take current contract fields, apply observed types from snapshot, and include safe added fields
    const currentFieldsMap = new Map(contract.schema.map((f) => [f.name, f]));
    const snapFieldsMap = new Map(snapshot.fields.map((f) => [f.name, f]));

    const proposedFields: SchemaField[] = [];

    // Fields present in snapshot
    for (const snapField of snapshot.fields) {
      const existing = currentFieldsMap.get(snapField.name);
      if (existing) {
        // Updated field
        proposedFields.push({
          ...existing,
          type: snapField.inferredType,
          nullable: snapField.nullable || existing.nullable,
          description: existing.description || `${snapField.name} attribute`,
        });
      } else {
        // Newly introduced field
        proposedFields.push({
          name: snapField.name,
          type: snapField.inferredType,
          nullable: snapField.nullable ?? true,
          required: false,
          description: `Newly ingested field from ${snapshot.source}`,
          defaultValue: null,
        });
      }
    }

    // Keep contract fields that were dropped (as deprecated/nullable) to allow backward compatibility window
    for (const [name, existing] of currentFieldsMap.entries()) {
      if (!snapFieldsMap.has(name)) {
        proposedFields.push({
          ...existing,
          nullable: true,
          required: false,
          description: `[DEPRECATED] Retained for backward compatibility: ${existing.description || ''}`,
        });
      }
    }

    const proposal = await this.aiAdapter.generateMigrationPlan(
      contract,
      driftReport,
      proposedFields,
    );

    await this.db.saveProposal(proposal);

    // Create an associated Approval Gate Request
    const approvalId = `appr_${uuidv4().substring(0, 8)}`;
    const approvalRequest: ApprovalRequest = {
      id: approvalId,
      proposalId: proposal.id,
      contractId: contract.id,
      driftReportId: driftReport.id,
      status: 'PENDING_REVIEW',
      requiredApprovals: contract.owner?.tier === 'TIER_1' ? 2 : 1,
      currentApprovals: 0,
      decisions: [],
      createdAt: new Date().toISOString(),
    };

    await this.db.saveApproval(approvalRequest);

    // Update drift report with proposal link and status
    await this.db.saveDriftReport({
      ...driftReport,
      activeProposalId: proposal.id,
      remediationStatus: 'MIGRATION_PROPOSED',
    });

    await this.db.saveAuditLog({
      id: `audit_${uuidv4().substring(0, 8)}`,
      timestamp: new Date().toISOString(),
      action: 'MIGRATION_PROPOSED',
      actorId: actor?.id || 'proposal-engine',
      actorName: actor?.username || 'AI Migration Planner',
      actorRole: actor?.role || 'SYSTEM',
      resourceType: 'PROPOSAL',
      resourceId: proposal.id,
      details: {
        contractId: contract.id,
        proposedVersion: proposal.proposedVersion,
        generatedBy: proposal.generatedBy,
        approvalId,
      },
    });

    return proposal;
  }
}
