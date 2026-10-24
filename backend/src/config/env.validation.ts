import { plainToInstance } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @IsOptional()
  PORT: number = 4000;

  @IsString()
  @IsOptional()
  API_PREFIX: string = 'api/v1';

  @IsString()
  @IsOptional()
  CORS_ORIGIN: string = '*';

  @IsString()
  @IsOptional()
  PUBLIC_ACCESS_ENABLE: string = 'false';

  @IsString()
  @IsOptional()
  JWT_SECRET: string = 'dev-data-contract-monitor-jwt-secret-key-32-chars-min';

  @IsString()
  @IsOptional()
  SERVICE_API_KEY: string = 'default-service-key-change-in-production';

  @IsString()
  @IsOptional()
  OPERATOR_ADMIN_PASSWORD: string = 'AdminDataContract2026!';

  @IsString()
  @IsOptional()
  MONGODB_URI?: string;

  @IsString()
  @IsOptional()
  REDIS_URL?: string;

  @IsString()
  @IsOptional()
  AI_PLATFORM_URL?: string = 'https://ai-platform.onrender.com';

  @IsString()
  @IsOptional()
  AI_PLATFORM_API_KEY?: string;

  @IsString()
  @IsOptional()
  NOTIFICATION_SERVICE_URL?: string = 'https://notification-service.onrender.com';

  @IsString()
  @IsOptional()
  NOTIFICATION_SERVICE_API_KEY?: string;

  @IsString()
  @IsOptional()
  ALERT_EMAIL_RECIPIENT?: string = 'data-platform-oncall@company.internal';
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(`Environment validation failed: ${errors.toString()}`);
  }
  return validatedConfig;
}
