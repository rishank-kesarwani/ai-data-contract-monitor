import { Module } from '@nestjs/common';
import { DemoController } from './demo.controller';
import { DemoService } from './demo.service';
import { SnapshotsModule } from '../snapshots/snapshots.module';
import { DriftModule } from '../drift/drift.module';

@Module({
  imports: [SnapshotsModule, DriftModule],
  controllers: [DemoController],
  providers: [DemoService],
  exports: [DemoService],
})
export class DemoModule {}
