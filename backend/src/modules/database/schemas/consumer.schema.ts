import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ConsumerCriticality, ConsumerInterface } from '../../../common/types';

export type ConsumerDocument = ConsumerEntity & Document;

@Schema({ collection: 'consumers', timestamps: true })
export class ConsumerEntity {
  @Prop({ required: true, unique: true, index: true })
  id: string;

  @Prop({ required: true, index: true })
  contractId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  team: string;

  @Prop({ required: true })
  contact: string;

  @Prop({ required: true, default: 'TIER_2' })
  tier: 'TIER_1' | 'TIER_2' | 'TIER_3';

  @Prop({ required: true, default: 'REST_API' })
  interfaceType: ConsumerInterface;

  @Prop({ type: Array, default: [] })
  consumedFields: string[];

  @Prop({ required: true, default: 'DEGRADED' })
  criticality: ConsumerCriticality;

  @Prop()
  sla?: string;

  @Prop()
  description?: string;
}

export const ConsumerSchema = SchemaFactory.createForClass(ConsumerEntity);
