import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  CompatibilityMode,
  ContractOwner,
  ContractStatus,
  RegisteredConsumer,
  SchemaField,
} from '../../../common/types';

export class CreateContractDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  domain: string;

  @IsOptional()
  @IsString()
  status?: ContractStatus = 'ACTIVE';

  @IsOptional()
  @IsString()
  version?: string = '1.0.0';

  @IsObject()
  @IsNotEmpty()
  owner: ContractOwner;

  @IsOptional()
  @IsString()
  compatibilityMode?: CompatibilityMode = 'BACKWARD';

  @IsOptional()
  @IsBoolean()
  isStrict?: boolean = false;

  @IsArray()
  @IsNotEmpty()
  schema: SchemaField[];

  @IsOptional()
  @IsArray()
  consumers?: RegisteredConsumer[] = [];
}

export class UpdateContractDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  domain?: string;

  @IsOptional()
  @IsString()
  status?: ContractStatus;

  @IsOptional()
  @IsObject()
  owner?: ContractOwner;

  @IsOptional()
  @IsString()
  compatibilityMode?: CompatibilityMode;

  @IsOptional()
  @IsBoolean()
  isStrict?: boolean;

  @IsOptional()
  @IsArray()
  schema?: SchemaField[];

  @IsOptional()
  @IsArray()
  consumers?: RegisteredConsumer[];
}

export class ImportJsonSchemaDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsObject()
  @IsNotEmpty()
  jsonSchema: Record<string, any>;
}
