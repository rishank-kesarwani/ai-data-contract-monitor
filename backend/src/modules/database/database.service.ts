import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ApprovalRequest,
  AuditLogEntry,
  Contract,
  DriftReport,
  MigrationProposal,
  RegisteredConsumer,
  SchemaSnapshot,
} from '../../common/types';
import { ContractDocument, ContractEntity } from './schemas/contract.schema';
import { SnapshotDocument, SnapshotEntity } from './schemas/snapshot.schema';
import { DriftReportDocument, DriftReportEntity } from './schemas/drift-report.schema';
import { ConsumerDocument, ConsumerEntity } from './schemas/consumer.schema';
import {
  MigrationProposalDocument,
  MigrationProposalEntity,
} from './schemas/migration-proposal.schema';
import { ApprovalDocument, ApprovalEntity } from './schemas/approval.schema';
import { AuditDocument, AuditEntity } from './schemas/audit.schema';

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);

  // In-memory fallbacks when MongoDB is not connected or in testing/local dev
  private readonly memoryContracts = new Map<string, Contract>();
  private readonly memorySnapshots = new Map<string, SchemaSnapshot>();
  private readonly memoryDriftReports = new Map<string, DriftReport>();
  private readonly memoryConsumers = new Map<string, RegisteredConsumer & { contractId: string }>();
  private readonly memoryProposals = new Map<string, MigrationProposal>();
  private readonly memoryApprovals = new Map<string, ApprovalRequest>();
  private readonly memoryAuditLogs: AuditLogEntry[] = [];

  constructor(
    @Optional()
    @InjectModel(ContractEntity.name)
    private readonly contractModel?: Model<ContractDocument>,

    @Optional()
    @InjectModel(SnapshotEntity.name)
    private readonly snapshotModel?: Model<SnapshotDocument>,

    @Optional()
    @InjectModel(DriftReportEntity.name)
    private readonly driftReportModel?: Model<DriftReportDocument>,

    @Optional()
    @InjectModel(ConsumerEntity.name)
    private readonly consumerModel?: Model<ConsumerDocument>,

    @Optional()
    @InjectModel(MigrationProposalEntity.name)
    private readonly proposalModel?: Model<MigrationProposalDocument>,

    @Optional()
    @InjectModel(ApprovalEntity.name)
    private readonly approvalModel?: Model<ApprovalDocument>,

    @Optional()
    @InjectModel(AuditEntity.name)
    private readonly auditModel?: Model<AuditDocument>,
  ) {
    if (this.isMongoActive()) {
      this.logger.log('DatabaseService initialized with MongoDB persistence layer.');
    } else {
      this.logger.log(
        'DatabaseService initialized with In-Memory repository fallback (zero-dependency / testing mode).',
      );
    }
  }

  isMongoActive(): boolean {
    return !!(this.contractModel && this.contractModel.db?.readyState === 1);
  }

  // ---------------------------------------------------------------------------
  // Contracts
  // ---------------------------------------------------------------------------
  async getContracts(domain?: string): Promise<Contract[]> {
    if (this.isMongoActive() && this.contractModel) {
      const query = domain ? { domain } : {};
      const docs = await this.contractModel.find(query).lean().exec();
      return docs as unknown as Contract[];
    }
    const list = Array.from(this.memoryContracts.values());
    return domain ? list.filter((c) => c.domain === domain) : list;
  }

  async getContractById(id: string): Promise<Contract | null> {
    if (this.isMongoActive() && this.contractModel) {
      const doc = await this.contractModel.findOne({ id }).lean().exec();
      return (doc as unknown as Contract) || null;
    }
    return this.memoryContracts.get(id) || null;
  }

  async saveContract(contract: Contract): Promise<Contract> {
    if (this.isMongoActive() && this.contractModel) {
      await this.contractModel.findOneAndUpdate(
        { id: contract.id },
        { $set: contract },
        { upsert: true, new: true },
      );
    }
    this.memoryContracts.set(contract.id, { ...contract });
    return contract;
  }

  async deleteContract(id: string): Promise<boolean> {
    if (this.isMongoActive() && this.contractModel) {
      await this.contractModel.deleteOne({ id }).exec();
    }
    return this.memoryContracts.delete(id);
  }

  // ---------------------------------------------------------------------------
  // Schema Snapshots
  // ---------------------------------------------------------------------------
  async getSnapshots(contractId?: string): Promise<SchemaSnapshot[]> {
    if (this.isMongoActive() && this.snapshotModel) {
      const query = contractId ? { contractId } : {};
      const docs = await this.snapshotModel.find(query).sort({ timestamp: -1 }).lean().exec();
      return docs as unknown as SchemaSnapshot[];
    }
    const list = Array.from(this.memorySnapshots.values());
    const filtered = contractId
      ? list.filter((s) => s.contractId === contractId)
      : list;
    return filtered.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  async getSnapshotById(id: string): Promise<SchemaSnapshot | null> {
    if (this.isMongoActive() && this.snapshotModel) {
      const doc = await this.snapshotModel.findOne({ id }).lean().exec();
      return (doc as unknown as SchemaSnapshot) || null;
    }
    return this.memorySnapshots.get(id) || null;
  }

  async saveSnapshot(snapshot: SchemaSnapshot): Promise<SchemaSnapshot> {
    if (this.isMongoActive() && this.snapshotModel) {
      await this.snapshotModel.findOneAndUpdate(
        { id: snapshot.id },
        { $set: snapshot },
        { upsert: true, new: true },
      );
    }
    this.memorySnapshots.set(snapshot.id, { ...snapshot });
    return snapshot;
  }

  // ---------------------------------------------------------------------------
  // Drift Reports
  // ---------------------------------------------------------------------------
  async getDriftReports(filter?: {
    contractId?: string;
    severity?: string;
    remediationStatus?: string;
  }): Promise<DriftReport[]> {
    if (this.isMongoActive() && this.driftReportModel) {
      const query: any = {};
      if (filter?.contractId) query.contractId = filter.contractId;
      if (filter?.severity) query.overallSeverity = filter.severity;
      if (filter?.remediationStatus) query.remediationStatus = filter.remediationStatus;

      const docs = await this.driftReportModel.find(query).sort({ detectionTime: -1 }).lean().exec();
      return docs as unknown as DriftReport[];
    }
    let list = Array.from(this.memoryDriftReports.values());
    if (filter?.contractId) {
      list = list.filter((d) => d.contractId === filter.contractId);
    }
    if (filter?.severity) {
      list = list.filter((d) => d.overallSeverity === filter.severity);
    }
    if (filter?.remediationStatus) {
      list = list.filter((d) => d.remediationStatus === filter.remediationStatus);
    }
    return list.sort((a, b) => b.detectionTime.localeCompare(a.detectionTime));
  }

  async getDriftReportById(id: string): Promise<DriftReport | null> {
    if (this.isMongoActive() && this.driftReportModel) {
      const doc = await this.driftReportModel.findOne({ id }).lean().exec();
      return (doc as unknown as DriftReport) || null;
    }
    return this.memoryDriftReports.get(id) || null;
  }

  async saveDriftReport(report: DriftReport): Promise<DriftReport> {
    if (this.isMongoActive() && this.driftReportModel) {
      await this.driftReportModel.findOneAndUpdate(
        { id: report.id },
        { $set: report },
        { upsert: true, new: true },
      );
    }
    this.memoryDriftReports.set(report.id, { ...report });
    return report;
  }

  // ---------------------------------------------------------------------------
  // Consumers
  // ---------------------------------------------------------------------------
  async getConsumers(contractId?: string): Promise<(RegisteredConsumer & { contractId: string })[]> {
    if (this.isMongoActive() && this.consumerModel) {
      const query = contractId ? { contractId } : {};
      const docs = await this.consumerModel.find(query).lean().exec();
      return docs as unknown as (RegisteredConsumer & { contractId: string })[];
    }
    const list = Array.from(this.memoryConsumers.values());
    return contractId ? list.filter((c) => c.contractId === contractId) : list;
  }

  async saveConsumer(consumer: RegisteredConsumer & { contractId: string }): Promise<RegisteredConsumer & { contractId: string }> {
    if (this.isMongoActive() && this.consumerModel) {
      await this.consumerModel.findOneAndUpdate(
        { id: consumer.id },
        { $set: consumer },
        { upsert: true, new: true },
      );
    }
    this.memoryConsumers.set(consumer.id, { ...consumer });
    return consumer;
  }

  // ---------------------------------------------------------------------------
  // Migration Proposals
  // ---------------------------------------------------------------------------
  async getProposals(contractId?: string): Promise<MigrationProposal[]> {
    if (this.isMongoActive() && this.proposalModel) {
      const query = contractId ? { contractId } : {};
      const docs = await this.proposalModel.find(query).sort({ createdAt: -1 }).lean().exec();
      return docs as unknown as MigrationProposal[];
    }
    const list = Array.from(this.memoryProposals.values());
    const filtered = contractId ? list.filter((p) => p.contractId === contractId) : list;
    return filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getProposalById(id: string): Promise<MigrationProposal | null> {
    if (this.isMongoActive() && this.proposalModel) {
      const doc = await this.proposalModel.findOne({ id }).lean().exec();
      return (doc as unknown as MigrationProposal) || null;
    }
    return this.memoryProposals.get(id) || null;
  }

  async saveProposal(proposal: MigrationProposal): Promise<MigrationProposal> {
    if (this.isMongoActive() && this.proposalModel) {
      await this.proposalModel.findOneAndUpdate(
        { id: proposal.id },
        { $set: proposal },
        { upsert: true, new: true },
      );
    }
    this.memoryProposals.set(proposal.id, { ...proposal });
    return proposal;
  }

  // ---------------------------------------------------------------------------
  // Approvals
  // ---------------------------------------------------------------------------
  async getApprovals(filter?: {
    contractId?: string;
    status?: string;
  }): Promise<ApprovalRequest[]> {
    if (this.isMongoActive() && this.approvalModel) {
      const query: any = {};
      if (filter?.contractId) query.contractId = filter.contractId;
      if (filter?.status) query.status = filter.status;
      const docs = await this.approvalModel.find(query).sort({ createdAt: -1 }).lean().exec();
      return docs as unknown as ApprovalRequest[];
    }
    let list = Array.from(this.memoryApprovals.values());
    if (filter?.contractId) {
      list = list.filter((a) => a.contractId === filter.contractId);
    }
    if (filter?.status) {
      list = list.filter((a) => a.status === filter.status);
    }
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getApprovalById(id: string): Promise<ApprovalRequest | null> {
    if (this.isMongoActive() && this.approvalModel) {
      const doc = await this.approvalModel.findOne({ id }).lean().exec();
      return (doc as unknown as ApprovalRequest) || null;
    }
    return this.memoryApprovals.get(id) || null;
  }

  async saveApproval(approval: ApprovalRequest): Promise<ApprovalRequest> {
    if (this.isMongoActive() && this.approvalModel) {
      await this.approvalModel.findOneAndUpdate(
        { id: approval.id },
        { $set: approval },
        { upsert: true, new: true },
      );
    }
    this.memoryApprovals.set(approval.id, { ...approval });
    return approval;
  }

  // ---------------------------------------------------------------------------
  // Audit Logs
  // ---------------------------------------------------------------------------
  async getAuditLogs(filter?: {
    resourceType?: string;
    resourceId?: string;
    limit?: number;
  }): Promise<AuditLogEntry[]> {
    const limit = filter?.limit || 100;
    if (this.isMongoActive() && this.auditModel) {
      const query: any = {};
      if (filter?.resourceType) query.resourceType = filter.resourceType;
      if (filter?.resourceId) query.resourceId = filter.resourceId;
      const docs = await this.auditModel.find(query).sort({ timestamp: -1 }).limit(limit).lean().exec();
      return docs as unknown as AuditLogEntry[];
    }
    let list = [...this.memoryAuditLogs];
    if (filter?.resourceType) {
      list = list.filter((l) => l.resourceType === filter.resourceType);
    }
    if (filter?.resourceId) {
      list = list.filter((l) => l.resourceId === filter.resourceId);
    }
    return list.sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, limit);
  }

  async saveAuditLog(entry: AuditLogEntry): Promise<AuditLogEntry> {
    if (this.isMongoActive() && this.auditModel) {
      try {
        const toSave = { ...entry, auditId: entry.id };
        await this.auditModel.create(toSave);
      } catch (err: any) {
        this.logger.warn(
          `Failed to persist audit log to MongoDB: ${err.message}. Retaining in memory audit log.`,
        );
      }
    }
    this.memoryAuditLogs.unshift({ ...entry });
    if (this.memoryAuditLogs.length > 500) {
      this.memoryAuditLogs.pop();
    }
    return entry;
  }

  // ---------------------------------------------------------------------------
  // Reset demo storage
  // ---------------------------------------------------------------------------
  async clearAllData(): Promise<void> {
    if (this.isMongoActive()) {
      if (this.contractModel) await this.contractModel.deleteMany({}).exec();
      if (this.snapshotModel) await this.snapshotModel.deleteMany({}).exec();
      if (this.driftReportModel) await this.driftReportModel.deleteMany({}).exec();
      if (this.consumerModel) await this.consumerModel.deleteMany({}).exec();
      if (this.proposalModel) await this.proposalModel.deleteMany({}).exec();
      if (this.approvalModel) await this.approvalModel.deleteMany({}).exec();
      if (this.auditModel) await this.auditModel.deleteMany({}).exec();
    }
    this.memoryContracts.clear();
    this.memorySnapshots.clear();
    this.memoryDriftReports.clear();
    this.memoryConsumers.clear();
    this.memoryProposals.clear();
    this.memoryApprovals.clear();
    this.memoryAuditLogs.length = 0;
  }
}
