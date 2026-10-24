import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApprovalsService } from './approvals.service';
import { SubmitApprovalDecisionDto } from './dto/decision.dto';
import { CurrentUser } from '../../common/decorators';
import { UserSession } from '../../common/types';

@ApiTags('Approval Gates & Governance')
@Controller('approvals')
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Get()
  @ApiOperation({ summary: 'List approval requests' })
  async findAll(
    @Query('contractId') contractId?: string,
    @Query('status') status?: string,
  ) {
    return this.approvalsService.findAll({ contractId, status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve specific approval request details' })
  async findOne(@Param('id') id: string) {
    return this.approvalsService.findOne(id);
  }

  @Post(':id/decide')
  @ApiOperation({ summary: 'Submit human approval decision (APPROVE, REJECT, REQUEST_CHANGES)' })
  async decide(
    @Param('id') id: string,
    @Body() dto: SubmitApprovalDecisionDto,
    @CurrentUser() actor: UserSession,
  ) {
    return this.approvalsService.decide(id, dto, actor);
  }
}
