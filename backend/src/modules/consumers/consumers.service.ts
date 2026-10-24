import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  ConsumerImpact,
  Contract,
  RegisteredConsumer,
  UserSession,
} from '../../common/types';
import { CreateConsumerDto } from './dto/create-consumer.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ConsumersService {
  constructor(private readonly db: DatabaseService) {}

  async findByContract(contractId: string): Promise<RegisteredConsumer[]> {
    const list = await this.db.getConsumers(contractId);
    return list;
  }

  async findAll(): Promise<(RegisteredConsumer & { contractId: string })[]> {
    return this.db.getConsumers();
  }

  async register(
    dto: CreateConsumerDto,
    actor?: UserSession,
  ): Promise<RegisteredConsumer> {
    const contract = await this.db.getContractById(dto.contractId);
    if (!contract) {
      throw new NotFoundException(`Contract with ID '${dto.contractId}' not found`);
    }

    const consumer: RegisteredConsumer & { contractId: string } = {
      id: `cons_${dto.name.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 16)}_${uuidv4().substring(0, 4)}`,
      contractId: dto.contractId,
      name: dto.name,
      team: dto.team,
      contact: dto.contact,
      tier: dto.tier || 'TIER_2',
      interfaceType: dto.interfaceType || 'REST_API',
      consumedFields: dto.consumedFields,
      criticality: dto.criticality || 'DEGRADED',
      sla: dto.sla,
      description: dto.description,
    };

    await this.db.saveConsumer(consumer);

    // Also sync to contract.consumers array
    const updatedConsumers = [...contract.consumers.filter((c) => c.id !== consumer.id), consumer];
    await this.db.saveContract({
      ...contract,
      consumers: updatedConsumers,
      updatedAt: new Date().toISOString(),
    });

    await this.db.saveAuditLog({
      id: `audit_${uuidv4().substring(0, 8)}`,
      timestamp: new Date().toISOString(),
      action: 'CONTRACT_UPDATED',
      actorId: actor?.id || 'system',
      actorName: actor?.username || 'Operator',
      actorRole: actor?.role || 'ADMIN',
      resourceType: 'CONTRACT',
      resourceId: dto.contractId,
      details: {
        action: 'REGISTERED_CONSUMER',
        consumerName: consumer.name,
        consumedFields: consumer.consumedFields,
      },
    });

    return consumer;
  }

  calculateConsumerImpact(
    contract: Contract,
    driftedFields: string[],
  ): ConsumerImpact[] {
    const consumers = contract.consumers || [];
    const driftedSet = new Set(driftedFields);

    return consumers
      .map((consumer) => {
        const impactedFields = consumer.consumedFields.filter((f) =>
          driftedSet.has(f),
        );

        if (impactedFields.length === 0) {
          return {
            consumerId: consumer.id,
            consumerName: consumer.name,
            team: consumer.team,
            contact: consumer.contact,
            interfaceType: consumer.interfaceType,
            criticality: consumer.criticality,
            impactedFields: [],
            riskSummary: 'No consumed fields altered by this schema drift.',
            status: 'UNAFFECTED' as const,
          };
        }

        const isBlocking = consumer.criticality === 'BLOCKING' || consumer.tier === 'TIER_1';
        const status = isBlocking ? ('FAILING' as const) : ('DEGRADED' as const);

        const riskSummary = isBlocking
          ? `BLOCKING FAILURE: Consumer '${consumer.name}' (${consumer.team}) actively depends on [${impactedFields.join(', ')}] via ${consumer.interfaceType}. Pipeline ingestion will break.`
          : `DEGRADED PERFORMANCE: Consumer '${consumer.name}' (${consumer.team}) consumes [${impactedFields.join(', ')}]. Non-critical features or downstream dashboards may report missing data.`;

        return {
          consumerId: consumer.id,
          consumerName: consumer.name,
          team: consumer.team,
          contact: consumer.contact,
          interfaceType: consumer.interfaceType,
          criticality: consumer.criticality,
          impactedFields,
          riskSummary,
          status,
        };
      })
      .filter((impact) => impact.status !== 'UNAFFECTED'); // only show affected consumers when relationship is known
  }
}
