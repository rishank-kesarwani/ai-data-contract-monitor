import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { SnapshotField } from '../../../common/types';

export class IngestSnapshotDto {
  @IsString()
  @IsNotEmpty()
  contractId: string;

  @IsString()
  @IsNotEmpty()
  source: string; // e.g. 'Manual Upload', 'Kafka Schema Registry', 'Snowflake CDC'

  @IsOptional()
  @IsString()
  environment?: 'production' | 'staging' | 'development' = 'production';

  @IsOptional()
  @IsString()
  version?: string;

  @IsNumber()
  @IsOptional()
  recordCountSampled?: number = 10000;

  @IsArray()
  @IsNotEmpty()
  fields: SnapshotField[];

  @IsOptional()
  rawJsonSchema?: Record<string, any>;

  @IsOptional()
  metadata?: Record<string, any>;
}
