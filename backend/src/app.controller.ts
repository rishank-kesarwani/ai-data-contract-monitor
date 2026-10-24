import { Controller, Get, Head } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from './common/decorators';

@ApiTags('Root')
@Controller()
export class AppController {
  @Public()
  @Get()
  @Head()
  @ApiOperation({ summary: 'Service Root & Discovery' })
  getRoot() {
    return {
      status: 'UP',
      application: 'AI Data Contract & Schema Drift Monitor',
      version: '1.0.0',
      apiPrefix: '/api/v1',
      documentation: '/docs',
      health: '/health',
      timestamp: new Date().toISOString(),
    };
  }
}
