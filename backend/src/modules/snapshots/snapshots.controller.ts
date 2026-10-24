import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SnapshotsService } from './snapshots.service';
import { IngestSnapshotDto } from './dto/ingest-snapshot.dto';
import { CurrentUser } from '../../common/decorators';
import { UserSession } from '../../common/types';

@ApiTags('Schema Snapshots')
@Controller('snapshots')
export class SnapshotsController {
  constructor(private readonly snapshotsService: SnapshotsService) {}

  @Post('ingest')
  @ApiOperation({ summary: 'Ingest a versioned schema snapshot and sanitized sample metadata' })
  async ingest(
    @Body() dto: IngestSnapshotDto,
    @CurrentUser() actor: UserSession,
  ) {
    return this.snapshotsService.ingest(dto, actor);
  }

  @Get()
  @ApiOperation({ summary: 'List schema snapshots' })
  async findAll(@Query('contractId') contractId?: string) {
    return this.snapshotsService.findAll(contractId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve specific schema snapshot' })
  async findOne(@Param('id') id: string) {
    return this.snapshotsService.findOne(id);
  }
}
