import { Module } from '@nestjs/common';
import { MigrationProposalsController } from './migration-proposals.controller';
import { MigrationProposalsService } from './migration-proposals.service';

@Module({
  controllers: [MigrationProposalsController],
  providers: [MigrationProposalsService],
  exports: [MigrationProposalsService],
})
export class MigrationProposalsModule {}
