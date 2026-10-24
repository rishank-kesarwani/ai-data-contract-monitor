import { Module, DynamicModule, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseService } from './database.service';
import { ContractEntity, ContractSchema } from './schemas/contract.schema';
import { SnapshotEntity, SnapshotSchema } from './schemas/snapshot.schema';
import { DriftReportEntity, DriftReportSchema } from './schemas/drift-report.schema';
import { ConsumerEntity, ConsumerSchema } from './schemas/consumer.schema';
import {
  MigrationProposalEntity,
  MigrationProposalSchema,
} from './schemas/migration-proposal.schema';
import { ApprovalEntity, ApprovalSchema } from './schemas/approval.schema';
import { AuditEntity, AuditSchema } from './schemas/audit.schema';

@Global()
@Module({})
export class DatabaseModule {
  static forRoot(): DynamicModule {
    const mongoUri = process.env.MONGODB_URI;
    const hasMongo = typeof mongoUri === 'string' && mongoUri.trim().length > 0;

    const imports: any[] = [];

    if (hasMongo) {
      imports.push(
        MongooseModule.forRoot(mongoUri, {
          serverSelectionTimeoutMS: 3000,
          connectTimeoutMS: 3000,
        }),
        MongooseModule.forFeature([
          { name: ContractEntity.name, schema: ContractSchema },
          { name: SnapshotEntity.name, schema: SnapshotSchema },
          { name: DriftReportEntity.name, schema: DriftReportSchema },
          { name: ConsumerEntity.name, schema: ConsumerSchema },
          { name: MigrationProposalEntity.name, schema: MigrationProposalSchema },
          { name: ApprovalEntity.name, schema: ApprovalSchema },
          { name: AuditEntity.name, schema: AuditSchema },
        ]),
      );
    }

    return {
      module: DatabaseModule,
      imports,
      providers: [DatabaseService],
      exports: [DatabaseService],
    };
  }
}
