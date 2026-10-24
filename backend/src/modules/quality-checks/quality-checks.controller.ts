import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { QualityChecksService } from './quality-checks.service';
import { ContractsService } from '../contracts/contracts.service';
import { SnapshotsService } from '../snapshots/snapshots.service';

import { IsNotEmpty, IsString } from 'class-validator';

class EvaluateChecksDto {
  @IsString()
  @IsNotEmpty()
  contractId: string;

  @IsString()
  @IsNotEmpty()
  snapshotId: string;
}

@ApiTags('Data Quality Checks')
@Controller('quality-checks')
export class QualityChecksController {
  constructor(
    private readonly qualityChecksService: QualityChecksService,
    private readonly contractsService: ContractsService,
    private readonly snapshotsService: SnapshotsService,
  ) {}

  @Post('evaluate')
  @ApiOperation({ summary: 'Run configurable data-quality checks against snapshot' })
  async evaluate(@Body() dto: EvaluateChecksDto) {
    const contract = await this.contractsService.findOne(dto.contractId);
    const snapshot = await this.snapshotsService.findOne(dto.snapshotId);
    return this.qualityChecksService.evaluateChecks(contract, snapshot);
  }
}
