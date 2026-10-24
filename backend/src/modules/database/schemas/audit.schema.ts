import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AuditDocument = AuditEntity & Document;

@Schema({ collection: 'data_contract_audit_logs', timestamps: true })
export class AuditEntity {
  @Prop({ required: true, unique: true, index: true })
  id: string;

  @Prop({ required: false, index: true, sparse: true })
  auditId?: string;

  @Prop({ required: true, index: true })
  timestamp: string;

  @Prop({ required: true, index: true })
  action: string;

  @Prop({ required: true })
  actorId: string;

  @Prop({ required: true })
  actorName: string;

  @Prop({ required: true })
  actorRole: string;

  @Prop({ required: true, index: true })
  resourceType: string;

  @Prop({ required: true, index: true })
  resourceId: string;

  @Prop({ type: Object, default: {} })
  details: Record<string, any>;

  @Prop()
  ipAddress?: string;

  @Prop()
  correlationId?: string;
}

export const AuditSchema = SchemaFactory.createForClass(AuditEntity);
