import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ConsumerCriticality, ConsumerInterface } from '../../../common/types';

export class CreateConsumerDto {
  @IsString()
  @IsNotEmpty()
  contractId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  team: string;

  @IsString()
  @IsNotEmpty()
  contact: string;

  @IsOptional()
  @IsString()
  tier?: 'TIER_1' | 'TIER_2' | 'TIER_3' = 'TIER_2';

  @IsOptional()
  @IsString()
  interfaceType?: ConsumerInterface = 'REST_API';

  @IsArray()
  @IsNotEmpty()
  consumedFields: string[];

  @IsOptional()
  @IsString()
  criticality?: ConsumerCriticality = 'DEGRADED';

  @IsOptional()
  @IsString()
  sla?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
