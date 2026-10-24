import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import configuration from './config/configuration';
import { validate } from './config/env.validation';
import { DatabaseModule } from './modules/database/database.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { ContractsModule } from './modules/contracts/contracts.module';
import { SnapshotsModule } from './modules/snapshots/snapshots.module';
import { DriftModule } from './modules/drift/drift.module';
import { QualityChecksModule } from './modules/quality-checks/quality-checks.module';
import { ConsumersModule } from './modules/consumers/consumers.module';
import { MigrationProposalsModule } from './modules/migration-proposals/migration-proposals.module';
import { ApprovalsModule } from './modules/approvals/approvals.module';
import { AuditModule } from './modules/audit/audit.module';
import { DemoModule } from './modules/demo/demo.module';
import { PublicAccessGuard } from './common/guards/public-access.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
    }),
    ThrottlerModule.forRootAsync({
      useFactory: () => [
        {
          ttl: 60000,
          limit: 200,
        },
      ],
    }),
    DatabaseModule.forRoot(),
    IntegrationsModule,
    AuthModule,
    HealthModule,
    ContractsModule,
    SnapshotsModule,
    DriftModule,
    QualityChecksModule,
    ConsumersModule,
    MigrationProposalsModule,
    ApprovalsModule,
    AuditModule,
    DemoModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: PublicAccessGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
