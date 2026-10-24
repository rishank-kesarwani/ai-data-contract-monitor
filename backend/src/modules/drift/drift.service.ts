import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { QualityChecksService } from '../quality-checks/quality-checks.service';
import { ConsumersService } from '../consumers/consumers.service';
import { NotificationAdapter } from '../integrations/notification.adapter';
import {
  DriftCategory,
  DriftChange,
  DriftReport,
  DriftSeverity,
  FieldType,
  RemediationStatus,
  UserSession,
} from '../../common/types';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DriftService {
  private readonly logger = new Logger(DriftService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly qualityChecksService: QualityChecksService,
    private readonly consumersService: ConsumersService,
    private readonly notificationAdapter: NotificationAdapter,
  ) {}

  async findAll(filter?: {
    contractId?: string;
    severity?: string;
    remediationStatus?: string;
  }): Promise<DriftReport[]> {
    return this.db.getDriftReports(filter);
  }

  async findOne(id: string): Promise<DriftReport> {
    const report = await this.db.getDriftReportById(id);
    if (!report) {
      throw new NotFoundException(`Drift report with ID '${id}' not found`);
    }
    return report;
  }

  async evaluate(
    contractId: string,
    snapshotId: string,
    actor?: UserSession,
  ): Promise<DriftReport> {
    const contract = await this.db.getContractById(contractId);
    if (!contract) {
      throw new NotFoundException(`Contract with ID '${contractId}' not found`);
    }

    const snapshot = await this.db.getSnapshotById(snapshotId);
    if (!snapshot) {
      throw new NotFoundException(`Snapshot with ID '${snapshotId}' not found`);
    }

    const contractFieldMap = new Map(contract.schema.map((f) => [f.name, f]));
    const snapshotFieldMap = new Map(snapshot.fields.map((f) => [f.name, f]));

    const changes: DriftChange[] = [];
    const driftedFieldNames: string[] = [];

    // 1. Detect Removed or Incompatible Fields
    for (const [name, contractField] of contractFieldMap.entries()) {
      const snapField = snapshotFieldMap.get(name);

      if (!snapField) {
        // Field was in contract, but is missing in snapshot
        driftedFieldNames.push(name);
        const isBreaking =
          contract.compatibilityMode !== 'NONE' &&
          (contractField.required || contract.compatibilityMode === 'BACKWARD' || contract.compatibilityMode === 'FULL');

        const category: DriftCategory = isBreaking ? 'BREAKING' : 'POTENTIALLY_RISKY';
        const severity: DriftSeverity = isBreaking ? 'CRITICAL' : 'HIGH';

        changes.push({
          id: `chg_${uuidv4().substring(0, 8)}`,
          field: name,
          category,
          severity,
          changeType: 'FIELD_REMOVED',
          contractValue: `${contractField.type} (Required: ${contractField.required})`,
          observedValue: 'MISSING',
          description: `Field '${name}' was defined in approved contract but was dropped in upstream payload.`,
          impactScore: isBreaking ? 95 : 60,
          affectedConsumers: [],
        });
        continue;
      }

      // Check Type compatibility
      if (snapField.inferredType !== contractField.type) {
        driftedFieldNames.push(name);
        const isWidening =
          (contractField.type === 'integer' && snapField.inferredType === 'float') ||
          (contractField.type === 'integer' && snapField.inferredType === 'string');

        const category: DriftCategory = isWidening ? 'POTENTIALLY_RISKY' : 'BREAKING';
        const severity: DriftSeverity = isWidening ? 'MEDIUM' : 'CRITICAL';

        changes.push({
          id: `chg_${uuidv4().substring(0, 8)}`,
          field: name,
          category,
          severity,
          changeType: 'TYPE_CHANGED',
          contractValue: contractField.type,
          observedValue: snapField.inferredType,
          description: `Field '${name}' type drifted from '${contractField.type}' to '${snapField.inferredType}'.`,
          impactScore: isWidening ? 50 : 90,
          affectedConsumers: [],
        });
      }

      // Check Nullability tightening or violation
      if (
        !contractField.nullable &&
        snapField.nullRate > (contractField.constraints?.maxNullRate || 0.0)
      ) {
        driftedFieldNames.push(name);
        changes.push({
          id: `chg_${uuidv4().substring(0, 8)}`,
          field: name,
          category: 'BREAKING',
          severity: 'HIGH',
          changeType: 'NULLABILITY_VIOLATED',
          contractValue: 'NOT NULL (max nulls: 0%)',
          observedValue: `${(snapField.nullRate * 100).toFixed(1)}% nulls`,
          description: `Field '${name}' is non-nullable in contract, but payload exhibited ${(snapField.nullRate * 100).toFixed(1)}% null values.`,
          impactScore: 75,
          affectedConsumers: [],
        });
      }
    }

    // 2. Detect Added Fields (Non-breaking or Risky depending on contract strictness)
    for (const snapField of snapshot.fields) {
      if (!contractFieldMap.has(snapField.name)) {
        driftedFieldNames.push(snapField.name);

        const isStrict =
          contract.isStrict ||
          contract.compatibilityMode === 'FULL' ||
          contract.compatibilityMode === 'FORWARD';

        const category: DriftCategory = isStrict
          ? 'POTENTIALLY_RISKY'
          : 'NON_BREAKING';
        const severity: DriftSeverity = isStrict ? 'MEDIUM' : 'LOW';

        changes.push({
          id: `chg_${uuidv4().substring(0, 8)}`,
          field: snapField.name,
          category,
          severity,
          changeType: isStrict ? 'UNEXPECTED_FIELD' : 'FIELD_ADDED',
          contractValue: 'UNDECLARED',
          observedValue: `${snapField.inferredType} (nullRate: ${(snapField.nullRate * 100).toFixed(1)}%)`,
          description: isStrict
            ? `New undeclared field '${snapField.name}' detected in payload under strict compatibility policy.`
            : `New optional field '${snapField.name}' added to producer schema. Safe non-breaking evolution.`,
          impactScore: isStrict ? 40 : 15,
          affectedConsumers: [],
        });
      }
    }

    // 3. Run Quality Checks
    const qualityChecks = this.qualityChecksService.evaluateChecks(
      contract,
      snapshot,
    );

    // 4. Calculate Consumer Impact (only for fields that drifted)
    const impactedConsumers = this.consumersService.calculateConsumerImpact(
      contract,
      driftedFieldNames,
    );

    // Map affected consumers back to individual changes
    changes.forEach((chg) => {
      chg.affectedConsumers = impactedConsumers
        .filter((c) => c.impactedFields.includes(chg.field))
        .map((c) => c.consumerId);
    });

    // 5. Aggregate Summary & Severity
    const breakingCount = changes.filter((c) => c.category === 'BREAKING').length;
    const riskyCount = changes.filter((c) => c.category === 'POTENTIALLY_RISKY').length;
    const nonBreakingCount = changes.filter((c) => c.category === 'NON_BREAKING').length;

    let overallSeverity: DriftSeverity = 'INFO';
    const hasBlockingConsumer = impactedConsumers.some((c) => c.status === 'FAILING');

    if (breakingCount > 0 && hasBlockingConsumer) {
      overallSeverity = 'CRITICAL';
    } else if (breakingCount > 0) {
      overallSeverity = 'HIGH';
    } else if (riskyCount > 0 || qualityChecks.some((q) => !q.passed && q.severity === 'HIGH')) {
      overallSeverity = 'MEDIUM';
    } else if (nonBreakingCount > 0) {
      overallSeverity = 'LOW';
    }

    const reportId = `drift_${contract.id.replace(/^ct_/, '').substring(0, 16)}_${Date.now()}`;
    const detectionTime = new Date().toISOString();

    const report: DriftReport = {
      id: reportId,
      contractId: contract.id,
      contractName: contract.name,
      snapshotId: snapshot.id,
      detectionTime,
      overallSeverity,
      categorySummary: {
        breakingCount,
        riskyCount,
        nonBreakingCount,
      },
      remediationStatus:
        breakingCount > 0 || riskyCount > 0 ? 'DETECTED' : 'RESOLVED',
      changes,
      impactedConsumers,
      qualityChecks,
    };

    await this.db.saveDriftReport(report);

    // Update contract's active drift pointer and evaluation timestamp
    await this.db.saveContract({
      ...contract,
      activeDriftId: report.id,
      lastEvaluatedAt: detectionTime,
      updatedAt: detectionTime,
    });

    // Dispatch alert if drift is CRITICAL or HIGH
    if (overallSeverity === 'CRITICAL' || overallSeverity === 'HIGH') {
      await this.notificationAdapter.sendAlert({
        title: `Schema Drift Detected: ${contract.name}`,
        message: `${breakingCount} breaking changes, ${riskyCount} risky changes detected against contract ${contract.version}.`,
        severity: overallSeverity,
        contractName: contract.name,
        affectedConsumersCount: impactedConsumers.length,
      });
    }

    await this.db.saveAuditLog({
      id: `audit_${uuidv4().substring(0, 8)}`,
      timestamp: detectionTime,
      action: 'DRIFT_DETECTED',
      actorId: actor?.id || 'drift-engine',
      actorName: actor?.username || 'Drift Detection Engine',
      actorRole: actor?.role || 'SYSTEM',
      resourceType: 'DRIFT',
      resourceId: reportId,
      details: {
        contractId: contract.id,
        severity: overallSeverity,
        breakingCount,
        riskyCount,
        impactedConsumersCount: impactedConsumers.length,
      },
    });

    return report;
  }
}
