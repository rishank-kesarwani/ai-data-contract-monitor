import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { MigrationPhase, SchemaField } from '../../../common/types';

export type MigrationProposalDocument = MigrationProposalEntity & Document;

@Schema({ collection: 'data_contract_proposals', timestamps: true })
export class MigrationProposalEntity {
  @Prop({ required: true, unique: true, index: true })
  id: string;

  @Prop({ required: true, index: true })
  driftReportId: string;

  @Prop({ required: true, index: true })
  contractId: string;

  @Prop({ required: true })
  currentVersion: string;

  @Prop({ required: true })
  proposedVersion: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  executiveSummary: string;

  @Prop({ required: true })
  rootCauseAnalysis: string;

  @Prop({ required: true })
  compatibilityImpact: string;

  @Prop({ type: Array, default: [] })
  phases: MigrationPhase[];

  @Prop({ type: Array, default: [] })
  proposedSchema: SchemaField[];

  @Prop({ type: Object, required: true })
  schemaDiff: {
    added: SchemaField[];
    removed: SchemaField[];
    modified: {
      field: string;
      before: Partial<SchemaField>;
      after: Partial<SchemaField>;
    }[];
  };

  @Prop({ type: Array, default: [] })
  codeSnippets: {
    language: string;
    title: string;
    code: string;
  }[];

  @Prop({ required: true, default: 'DETERMINISTIC_ENGINE' })
  generatedBy: 'AI_PLATFORM' | 'DETERMINISTIC_ENGINE';

  @Prop({ required: true, default: 'PENDING_REVIEW', index: true })
  approvalStatus: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED';
}

export const MigrationProposalSchema = SchemaFactory.createForClass(MigrationProposalEntity);
