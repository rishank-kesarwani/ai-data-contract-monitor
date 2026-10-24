import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { SnapshotField } from '../../../common/types';

export type SnapshotDocument = SnapshotEntity & Document;

@Schema({ collection: 'data_contract_snapshots', timestamps: true })
export class SnapshotEntity {
  @Prop({ required: true, unique: true, index: true })
  id: string;

  @Prop({ required: true, index: true })
  contractId: string;

  @Prop({ required: true })
  version: string;

  @Prop({ required: true })
  source: string;

  @Prop({ required: true, default: 'production' })
  environment: 'production' | 'staging' | 'development';

  @Prop({ required: true })
  timestamp: string;

  @Prop({ required: true, default: 0 })
  recordCountSampled: number;

  @Prop({ required: true, default: 0 })
  fieldCount: number;

  @Prop({ type: Array, default: [] })
  fields: SnapshotField[];

  @Prop({ type: Object })
  rawJsonSchema?: Record<string, any>;

  @Prop({ required: true })
  checksum: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export const SnapshotSchema = SchemaFactory.createForClass(SnapshotEntity);
