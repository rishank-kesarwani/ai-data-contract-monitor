import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ContractsService } from '../contracts/contracts.service';
import { NotificationAdapter } from '../integrations/notification.adapter';
import {
  ApprovalRequest,
  UserSession,
} from '../../common/types';
import { SubmitApprovalDecisionDto } from './dto/decision.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ApprovalsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly contractsService: ContractsService,
    private readonly notificationAdapter: NotificationAdapter,
  ) {}

  async findAll(filter?: {
    contractId?: string;
    status?: string;
  }): Promise<ApprovalRequest[]> {
    return this.db.getApprovals(filter);
  }

  async findOne(id: string): Promise<ApprovalRequest> {
    const appr = await this.db.getApprovalById(id);
    if (!appr) {
      throw new NotFoundException(`Approval request with ID '${id}' not found`);
    }
    return appr;
  }

  async decide(
    approvalId: string,
    dto: SubmitApprovalDecisionDto,
    actor?: UserSession,
  ): Promise<ApprovalRequest> {
    const approval = await this.findOne(approvalId);

    if (approval.status !== 'PENDING_REVIEW' && approval.status !== 'CHANGES_REQUESTED') {
      throw new BadRequestException(
        `Approval request is already finalized with status '${approval.status}'. No further decisions allowed.`,
      );
    }

    if (!actor || actor.role === 'PUBLIC_VIEWER') {
      throw new ForbiddenException(
        'Operator authentication required to submit contract change approval decisions.',
      );
    }

    const proposal = await this.db.getProposalById(approval.proposalId);
    if (!proposal) {
      throw new NotFoundException(`Associated proposal '${approval.proposalId}' not found.`);
    }

    const contract = await this.db.getContractById(approval.contractId);
    if (!contract) {
      throw new NotFoundException(`Associated contract '${approval.contractId}' not found.`);
    }

    const now = new Date().toISOString();

    const decisionRecord = {
      reviewerId: actor.id,
      reviewerName: actor.username,
      reviewerRole: actor.role,
      decision: dto.decision,
      comments: dto.comments,
      decidedAt: now,
    };

    const decisions = [...approval.decisions, decisionRecord];
    let newStatus: ApprovalRequest['status'] = approval.status;
    let currentApprovals = approval.currentApprovals;

    if (dto.decision === 'APPROVE') {
      currentApprovals += 1;
      if (currentApprovals >= approval.requiredApprovals) {
        newStatus = 'APPROVED';
      }
    } else if (dto.decision === 'REJECT') {
      newStatus = 'REJECTED';
    } else if (dto.decision === 'REQUEST_CHANGES') {
      newStatus = 'CHANGES_REQUESTED';
    }

    const updatedApproval: ApprovalRequest = {
      ...approval,
      currentApprovals,
      status: newStatus,
      decisions,
      resolvedAt: newStatus === 'APPROVED' || newStatus === 'REJECTED' ? now : undefined,
    };

    await this.db.saveApproval(updatedApproval);

    // Update Proposal Status
    await this.db.saveProposal({
      ...proposal,
      approvalStatus: newStatus,
    });

    // If fully APPROVED, publish contract change and resolve drift report!
    if (newStatus === 'APPROVED') {
      // 1. Promote contract version and schema
      await this.contractsService.bumpVersion(
        contract.id,
        proposal.proposedVersion,
        `Approved schema evolution migration (${proposal.currentVersion} → ${proposal.proposedVersion}): ${proposal.title}`,
        proposal.proposedSchema,
        actor,
      );

      // 2. Resolve Drift Report
      const drift = await this.db.getDriftReportById(approval.driftReportId);
      if (drift) {
        await this.db.saveDriftReport({
          ...drift,
          remediationStatus: 'RESOLVED',
        });
      }

      // 3. Clear active drift pointer on contract
      await this.db.saveContract({
        ...contract,
        version: proposal.proposedVersion,
        schema: proposal.proposedSchema,
        activeDriftId: undefined,
        updatedAt: now,
      });

      // 4. Alert Notification Service
      await this.notificationAdapter.sendAlert({
        title: `Contract Approved & Published: ${contract.name} (${proposal.proposedVersion})`,
        message: `Schema change approved by ${actor.username}. Contract promoted to version ${proposal.proposedVersion}.`,
        severity: 'INFO',
        contractName: contract.name,
        affectedConsumersCount: drift ? drift.impactedConsumers.length : 0,
      });
    }

    await this.db.saveAuditLog({
      id: `audit_${uuidv4().substring(0, 8)}`,
      timestamp: now,
      action: newStatus === 'APPROVED' ? 'APPROVAL_RESOLVED' : 'APPROVAL_SUBMITTED',
      actorId: actor.id,
      actorName: actor.username,
      actorRole: actor.role,
      resourceType: 'APPROVAL',
      resourceId: approval.id,
      details: {
        decision: dto.decision,
        comments: dto.comments,
        resultingStatus: newStatus,
        contractId: contract.id,
        proposedVersion: proposal.proposedVersion,
      },
    });

    return updatedApproval;
  }
}
