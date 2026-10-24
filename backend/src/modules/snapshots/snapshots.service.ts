import { Injectable, NotFoundException } from '@nestjs/common';
import crypto from 'crypto';
import { DatabaseService } from '../database/database.service';
import {
  SchemaSnapshot,
  SnapshotField,
  UserSession,
} from '../../common/types';
import { IngestSnapshotDto } from './dto/ingest-snapshot.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SnapshotsService {
  constructor(private readonly db: DatabaseService) {}

  async ingest(
    dto: IngestSnapshotDto,
    actor?: UserSession,
  ): Promise<SchemaSnapshot> {
    const contract = await this.db.getContractById(dto.contractId);
    if (!contract) {
      throw new NotFoundException(
        `Target contract with ID '${dto.contractId}' not found. Cannot ingest snapshot.`,
      );
    }

    // Sanitize sample data: strip sensitive records, mask potential PII in sample values
    const sanitizedFields: SnapshotField[] = dto.fields.map((field) => {
      const nullCount = field.nullCount || 0;
      const totalSampled = dto.recordCountSampled || 10000;
      const nullRate =
        field.nullRate !== undefined
          ? field.nullRate
          : Number((nullCount / totalSampled).toFixed(4));

      // Sanitize sample values (no sensitive emails, tokens or raw strings > 40 chars)
      const safeSamples = (field.sampleValues || []).slice(0, 5).map((val) => {
        if (typeof val === 'string') {
          if (val.includes('@')) {
            const [u, d] = val.split('@');
            return `${u.slice(0, 2)}***@${d}`;
          }
          return val.length > 32 ? `${val.slice(0, 32)}...` : val;
        }
        return val;
      });

      return {
        ...field,
        nullCount,
        nullRate,
        sampleValues: safeSamples,
      };
    });

    // Compute deterministic checksum of schema structure
    const schemaFingerprint = sanitizedFields
      .map((f) => `${f.name}:${f.inferredType}:${f.nullable}`)
      .sort()
      .join('|');
    const checksum = crypto
      .createHash('sha256')
      .update(schemaFingerprint)
      .digest('hex');

    const id = `snap_${dto.contractId.replace(/^ct_/, '').substring(0, 16)}_${Date.now()}`;
    const timestamp = new Date().toISOString();

    const snapshot: SchemaSnapshot = {
      id,
      contractId: dto.contractId,
      version: dto.version || `${contract.version}-snap-${Date.now().toString().slice(-4)}`,
      source: dto.source,
      environment: dto.environment || 'production',
      timestamp,
      recordCountSampled: dto.recordCountSampled || 10000,
      fieldCount: sanitizedFields.length,
      fields: sanitizedFields,
      rawJsonSchema: dto.rawJsonSchema,
      checksum,
      metadata: dto.metadata || {},
    };

    await this.db.saveSnapshot(snapshot);

    await this.db.saveAuditLog({
      id: `audit_${uuidv4().substring(0, 8)}`,
      timestamp,
      action: 'SNAPSHOT_INGESTED',
      actorId: actor?.id || 'connector',
      actorName: actor?.username || 'Schema Ingestion Connector',
      actorRole: actor?.role || 'SYSTEM',
      resourceType: 'SNAPSHOT',
      resourceId: id,
      details: {
        contractId: dto.contractId,
        source: dto.source,
        fieldCount: sanitizedFields.length,
        checksum,
      },
    });

    return snapshot;
  }

  async findAll(contractId?: string): Promise<SchemaSnapshot[]> {
    return this.db.getSnapshots(contractId);
  }

  async findOne(id: string): Promise<SchemaSnapshot> {
    const snap = await this.db.getSnapshotById(id);
    if (!snap) {
      throw new NotFoundException(`Snapshot with ID '${id}' not found`);
    }
    return snap;
  }
}
