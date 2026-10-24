import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApprovalDecisionRecord } from '../../../common/types';

export type ApprovalDocument = ApprovalEntity & Document;

@Schema({ collection: 'data_contract_approvals', timestamps: true })
export class ApprovalEntity {
  @Prop({ required: true, unique: true, index: true })
  id: string;

  @Prop({ required: true, index: true })
  proposalId: string;

  @Prop({ required: true, index: true })
  contractId: string;

  @Prop({ required: true, index: true })
  driftReportId: string;

  @Prop({ required: true, default: 'PENDING_REVIEW', index: true })
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED';

  @Prop({ required: true, default: 1 })
  requiredApprovals: number;

  @Prop({ required: true, default: 0 })
  currentApprovals: number;

  @Prop({ type: Array, default: [] })
  decisions: ApprovalDecisionRecord[];

  @Prop({ required: true })
  createdAt: string;

  @Prop()
  resolvedAt?: string;
}

export const ApprovalSchema = SchemaFactory.createForClass(ApprovalEntity);
