import { Module } from '@nestjs/common';
import { DriftController } from './drift.controller';
import { DriftService } from './drift.service';
import { QualityChecksModule } from '../quality-checks/quality-checks.module';
import { ConsumersModule } from '../consumers/consumers.module';

@Module({
  imports: [QualityChecksModule, ConsumersModule],
  controllers: [DriftController],
  providers: [DriftService],
  exports: [DriftService],
})
export class DriftModule {}
