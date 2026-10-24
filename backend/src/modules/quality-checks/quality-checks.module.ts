import { Module } from '@nestjs/common';
import { QualityChecksController } from './quality-checks.controller';
import { QualityChecksService } from './quality-checks.service';
import { ContractsModule } from '../contracts/contracts.module';
import { SnapshotsModule } from '../snapshots/snapshots.module';

@Module({
  imports: [ContractsModule, SnapshotsModule],
  controllers: [QualityChecksController],
  providers: [QualityChecksService],
  exports: [QualityChecksService],
})
export class QualityChecksModule {}
