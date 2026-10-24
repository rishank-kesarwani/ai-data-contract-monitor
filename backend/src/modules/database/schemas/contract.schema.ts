import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import {
  CompatibilityMode,
  ContractOwner,
  ContractStatus,
  ContractVersionEntry,
  RegisteredConsumer,
  SchemaField,
} from '../../../common/types';

export type ContractDocument = ContractEntity & Document;

@Schema({ collection: 'contracts', timestamps: true })
export class ContractEntity {
  @Prop({ required: true, unique: true, index: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, index: true })
  domain: string;

  @Prop({ required: true, default: 'ACTIVE', index: true })
  status: ContractStatus;

  @Prop({ required: true, default: '1.0.0' })
  version: string;

  @Prop({ type: Object, required: true })
  owner: ContractOwner;

  @Prop({ required: true, default: 'BACKWARD' })
  compatibilityMode: CompatibilityMode;

  @Prop({ default: false })
  isStrict: boolean;

  @Prop({ type: Array, default: [] })
  schema: SchemaField[];

  @Prop({ type: Array, default: [] })
  consumers: RegisteredConsumer[];

  @Prop({ type: Array, default: [] })
  versionHistory: ContractVersionEntry[];

  @Prop()
  lastEvaluatedAt?: string;

  @Prop()
  activeDriftId?: string;
}

export const ContractSchema = SchemaFactory.createForClass(ContractEntity);
