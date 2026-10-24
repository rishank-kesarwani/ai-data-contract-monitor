import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DriftService } from './drift.service';
import { CurrentUser } from '../../common/decorators';
import { UserSession } from '../../common/types';

import { IsNotEmpty, IsString } from 'class-validator';

class EvaluateDriftDto {
  @IsString()
  @IsNotEmpty()
  contractId: string;

  @IsString()
  @IsNotEmpty()
  snapshotId: string;
}

@ApiTags('Schema & Quality Drift')
@Controller('drift')
export class DriftController {
  constructor(private readonly driftService: DriftService) {}

  @Get()
  @ApiOperation({ summary: 'List drift reports with optional severity and contract filters' })
  async findAll(
    @Query('contractId') contractId?: string,
    @Query('severity') severity?: string,
    @Query('remediationStatus') remediationStatus?: string,
  ) {
    return this.driftService.findAll({ contractId, severity, remediationStatus });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve full drift report by ID' })
  async findOne(@Param('id') id: string) {
    return this.driftService.findOne(id);
  }

  @Post('evaluate')
  @ApiOperation({ summary: 'Trigger drift evaluation between contract and schema snapshot' })
  async evaluate(
    @Body() dto: EvaluateDriftDto,
    @CurrentUser() actor: UserSession,
  ) {
    return this.driftService.evaluate(dto.contractId, dto.snapshotId, actor);
  }
}
