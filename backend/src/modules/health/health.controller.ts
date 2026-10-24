import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DatabaseService } from '../database/database.service';
import { Public } from '../../common/decorators';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly startTime = Date.now();

  constructor(private readonly dbService: DatabaseService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'System Health Check' })
  getHealth() {
    return {
      status: 'UP',
      application: 'AI Data Contract & Schema Drift Monitor',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      persistence: this.dbService.isMongoActive() ? 'MongoDB' : 'In-Memory Repository',
      environment: process.env.NODE_ENV || 'development',
    };
  }

  @Public()
  @Get('live')
  @ApiOperation({ summary: 'Kubernetes Liveness Probe' })
  getLive() {
    return { status: 'UP' };
  }

  @Public()
  @Get('ready')
  @ApiOperation({ summary: 'Kubernetes Readiness Probe' })
  getReady() {
    return {
      status: 'UP',
      database: this.dbService.isMongoActive() ? 'CONNECTED' : 'IN_MEMORY_READY',
    };
  }
}
