import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  Contract,
  FieldType,
  SchemaField,
  UserSession,
} from '../../common/types';
import {
  CreateContractDto,
  UpdateContractDto,
} from './dto/create-contract.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ContractsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(domain?: string): Promise<Contract[]> {
    return this.db.getContracts(domain);
  }

  async findOne(id: string): Promise<Contract> {
    const contract = await this.db.getContractById(id);
    if (!contract) {
      throw new NotFoundException(`Contract with ID '${id}' not found`);
    }
    return contract;
  }

  async create(dto: CreateContractDto, actor?: UserSession): Promise<Contract> {
    const id = `ct_${dto.name.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 24)}_${uuidv4().substring(0, 4)}`;
    const now = new Date().toISOString();

    const newContract: Contract = {
      id,
      name: dto.name,
      description: dto.description,
      domain: dto.domain,
      status: dto.status || 'ACTIVE',
      version: dto.version || '1.0.0',
      owner: dto.owner,
      compatibilityMode: dto.compatibilityMode || 'BACKWARD',
      isStrict: dto.isStrict ?? false,
      schema: dto.schema || [],
      consumers: dto.consumers || [],
      versionHistory: [
        {
          version: dto.version || '1.0.0',
          updatedAt: now,
          author: actor?.username || 'system',
          changeSummary: 'Initial contract specification',
          schemaSnapshot: dto.schema || [],
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    await this.db.saveContract(newContract);

    await this.db.saveAuditLog({
      id: `audit_${uuidv4().substring(0, 8)}`,
      timestamp: now,
      action: 'CONTRACT_CREATED',
      actorId: actor?.id || 'system',
      actorName: actor?.username || 'System Operator',
      actorRole: actor?.role || 'ADMIN',
      resourceType: 'CONTRACT',
      resourceId: id,
      details: {
        name: newContract.name,
        version: newContract.version,
        fieldsCount: newContract.schema.length,
      },
    });

    return newContract;
  }

  async update(
    id: string,
    dto: UpdateContractDto,
    actor?: UserSession,
  ): Promise<Contract> {
    const existing = await this.findOne(id);
    const now = new Date().toISOString();

    const updated: Contract = {
      ...existing,
      ...dto,
      owner: dto.owner || existing.owner,
      schema: dto.schema || existing.schema,
      consumers: dto.consumers || existing.consumers,
      updatedAt: now,
    };

    await this.db.saveContract(updated);

    await this.db.saveAuditLog({
      id: `audit_${uuidv4().substring(0, 8)}`,
      timestamp: now,
      action: 'CONTRACT_UPDATED',
      actorId: actor?.id || 'system',
      actorName: actor?.username || 'System Operator',
      actorRole: actor?.role || 'ADMIN',
      resourceType: 'CONTRACT',
      resourceId: id,
      details: {
        updatedFields: Object.keys(dto),
      },
    });

    return updated;
  }

  async bumpVersion(
    id: string,
    newVersion: string,
    changeSummary: string,
    newSchema?: SchemaField[],
    actor?: UserSession,
  ): Promise<Contract> {
    const existing = await this.findOne(id);
    const now = new Date().toISOString();
    const finalSchema = newSchema || existing.schema;

    const versionEntry = {
      version: newVersion,
      updatedAt: now,
      author: actor?.username || 'Operator Admin',
      changeSummary,
      schemaSnapshot: finalSchema,
    };

    const updated: Contract = {
      ...existing,
      version: newVersion,
      schema: finalSchema,
      updatedAt: now,
      versionHistory: [versionEntry, ...existing.versionHistory],
    };

    await this.db.saveContract(updated);

    await this.db.saveAuditLog({
      id: `audit_${uuidv4().substring(0, 8)}`,
      timestamp: now,
      action: 'CONTRACT_PUBLISHED',
      actorId: actor?.id || 'system',
      actorName: actor?.username || 'System Operator',
      actorRole: actor?.role || 'ADMIN',
      resourceType: 'CONTRACT',
      resourceId: id,
      details: {
        previousVersion: existing.version,
        newVersion,
        changeSummary,
      },
    });

    return updated;
  }

  async exportJsonSchema(id: string): Promise<Record<string, any>> {
    const contract = await this.findOne(id);
    const properties: Record<string, any> = {};
    const required: string[] = [];

    contract.schema.forEach((field) => {
      const prop: any = {
        type: this.mapFieldTypeToJsonSchema(field.type),
        description: field.description || `${field.name} attribute`,
      };

      if (field.nullable) {
        prop.type = Array.isArray(prop.type)
          ? [...prop.type, 'null']
          : [prop.type, 'null'];
      }

      if (field.required) {
        required.push(field.name);
      }

      if (field.constraints?.enum) {
        prop.enum = field.constraints.enum;
      }
      if (field.constraints?.pattern) {
        prop.pattern = field.constraints.pattern;
      }
      if (field.constraints?.minimum !== undefined) {
        prop.minimum = field.constraints.minimum;
      }
      if (field.constraints?.maximum !== undefined) {
        prop.maximum = field.constraints.maximum;
      }

      properties[field.name] = prop;
    });

    return {
      $schema: 'http://json-schema.org/draft-07/schema#',
      title: contract.name,
      description: contract.description,
      version: contract.version,
      type: 'object',
      properties,
      required,
      additionalProperties: !contract.isStrict,
    };
  }

  parseJsonSchema(jsonSchema: Record<string, any>): SchemaField[] {
    const properties = jsonSchema.properties || {};
    const requiredList = Array.isArray(jsonSchema.required)
      ? jsonSchema.required
      : [];

    const fields: SchemaField[] = [];

    for (const [name, def] of Object.entries<any>(properties)) {
      let isNullable = false;
      let rawType = def.type;

      if (Array.isArray(rawType)) {
        if (rawType.includes('null')) {
          isNullable = true;
          rawType = rawType.find((t: string) => t !== 'null');
        } else {
          rawType = rawType[0];
        }
      }

      const inferredType = this.mapJsonSchemaTypeToField(rawType);
      const isRequired = requiredList.includes(name);

      fields.push({
        name,
        type: inferredType,
        nullable: isNullable,
        required: isRequired,
        description: def.description || '',
        constraints: {
          pattern: def.pattern,
          minimum: def.minimum,
          maximum: def.maximum,
          enum: def.enum,
        },
      });
    }

    return fields;
  }

  async delete(id: string, actor?: UserSession): Promise<boolean> {
    await this.findOne(id);
    const success = await this.db.deleteContract(id);
    if (success) {
      await this.db.saveAuditLog({
        id: `audit_${uuidv4().substring(0, 8)}`,
        timestamp: new Date().toISOString(),
        action: 'SETTINGS_CHANGED',
        actorId: actor?.id || 'system',
        actorName: actor?.username || 'Operator',
        actorRole: actor?.role || 'ADMIN',
        resourceType: 'CONTRACT',
        resourceId: id,
        details: { action: 'DELETED_CONTRACT' },
      });
    }
    return success;
  }

  private mapFieldTypeToJsonSchema(type: FieldType): string {
    switch (type) {
      case 'integer':
        return 'integer';
      case 'float':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'object':
        return 'object';
      case 'array':
        return 'array';
      default:
        return 'string';
    }
  }

  private mapJsonSchemaTypeToField(type?: string): FieldType {
    switch (type) {
      case 'integer':
        return 'integer';
      case 'number':
        return 'float';
      case 'boolean':
        return 'boolean';
      case 'object':
        return 'object';
      case 'array':
        return 'array';
      default:
        return 'string';
    }
  }
}
