import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AuditLogEntry } from '../../common/types';

@Injectable()
export class AuditService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(filter?: {
    resourceType?: string;
    resourceId?: string;
    limit?: number;
  }): Promise<AuditLogEntry[]> {
    return this.db.getAuditLogs(filter);
  }
}
