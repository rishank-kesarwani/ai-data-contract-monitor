import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MigrationProposalsService } from './migration-proposals.service';
import { CurrentUser } from '../../common/decorators';
import { UserSession } from '../../common/types';

import { IsNotEmpty, IsString } from 'class-validator';

class GenerateProposalDto {
  @IsString()
  @IsNotEmpty()
  driftReportId: string;
}

@ApiTags('Migration Proposals')
@Controller('proposals')
export class MigrationProposalsController {
  constructor(private readonly proposalsService: MigrationProposalsService) {}

  @Get()
  @ApiOperation({ summary: 'List migration proposals' })
  async findAll(@Query('contractId') contractId?: string) {
    return this.proposalsService.findAll(contractId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve specific migration proposal details' })
  async findOne(@Param('id') id: string) {
    return this.proposalsService.findOne(id);
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate AI-assisted migration proposal for a drift report' })
  async generate(
    @Body() dto: GenerateProposalDto,
    @CurrentUser() actor: UserSession,
  ) {
    return this.proposalsService.generate(dto.driftReportId, actor);
  }
}
