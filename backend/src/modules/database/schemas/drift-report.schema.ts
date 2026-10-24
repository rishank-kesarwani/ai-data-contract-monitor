import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import {
  ConsumerImpact,
  DriftChange,
  DriftSeverity,
  QualityCheckResult,
  RemediationStatus,
} from '../../../common/types';

export type DriftReportDocument = DriftReportEntity & Document;

@Schema({ collection: 'data_contract_drift_reports', timestamps: true })
export class DriftReportEntity {
  @Prop({ required: true, unique: true, index: true })
  id: string;

  @Prop({ required: true, index: true })
  contractId: string;

  @Prop({ required: true })
  contractName: string;

  @Prop({ required: true, index: true })
  snapshotId: string;

  @Prop({ required: true })
  detectionTime: string;

  @Prop({ required: true, index: true })
  overallSeverity: DriftSeverity;

  @Prop({ type: Object, required: true })
  categorySummary: {
    breakingCount: number;
    riskyCount: number;
    nonBreakingCount: number;
  };

  @Prop({ required: true, default: 'DETECTED', index: true })
  remediationStatus: RemediationStatus;

  @Prop({ type: Array, default: [] })
  changes: DriftChange[];

  @Prop({ type: Array, default: [] })
  impactedConsumers: ConsumerImpact[];

  @Prop({ type: Array, default: [] })
  qualityChecks: QualityCheckResult[];

  @Prop()
  activeProposalId?: string;
}

export const DriftReportSchema = SchemaFactory.createForClass(DriftReportEntity);
