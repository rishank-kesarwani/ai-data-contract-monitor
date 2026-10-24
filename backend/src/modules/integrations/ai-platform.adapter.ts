import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  Contract,
  DriftReport,
  MigrationProposal,
  SchemaField,
} from '../../common/types';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AiPlatformAdapter {
  private readonly logger = new Logger(AiPlatformAdapter.name);

  constructor(private readonly configService: ConfigService) {}

  async generateMigrationPlan(
    contract: Contract,
    driftReport: DriftReport,
    proposedFields: SchemaField[],
  ): Promise<MigrationProposal> {
    const aiUrl = this.configService.get<string>('aiPlatform.url');
    const aiKey = this.configService.get<string>('aiPlatform.apiKey');

    // Attempt AI Platform generation if configured
    if (aiUrl && aiKey && aiKey.trim().length > 0) {
      try {
        this.logger.log(`Calling Shared Railway AI Platform at ${aiUrl}/api/v1/ai/chat`);
        const response = await axios.post(
          `${aiUrl.replace(/\/+$/, '')}/api/v1/ai/chat`,
          {
            applicationId: 'ai-data-contract-schema-drift-monitor',
            tenantId: 'data-engineering',
            message: `Analyze the schema drift on contract '${contract.name}' (${contract.id}).
Current version: ${contract.version}. Compatibility mode: ${contract.compatibilityMode}.
Drift Summary: ${driftReport.categorySummary.breakingCount} breaking changes, ${driftReport.categorySummary.riskyCount} risky changes.
Changes: ${JSON.stringify(driftReport.changes)}
Impacted Consumers: ${JSON.stringify(driftReport.impactedConsumers)}
Please provide an executive summary, root cause analysis, migration phases, and SQL/TypeScript code migration snippets.`,
            systemInstruction:
              'You are a Principal Data Platform Architect and Schema Evolution Specialist. Format your analysis into clear, structured sections: Executive Summary, Root Cause, Phased Migration Steps, and Code Snippets.',
          },
          {
            headers: {
              'x-api-key': aiKey,
              'Content-Type': 'application/json',
            },
            timeout: 8000,
          },
        );

        if (response.data && (response.data.text || response.data.response)) {
          const content = response.data.text || response.data.response;
          return this.synthesizeProposalFromAI(
            contract,
            driftReport,
            proposedFields,
            content,
            'AI_PLATFORM',
          );
        }
      } catch (err: any) {
        this.logger.warn(
          `AI Platform request failed (${err.message}). Seamlessly engaging built-in deterministic schema evolution engine.`,
        );
      }
    }

    // Deterministic Rule-Based Fallback Engine
    return this.generateDeterministicProposal(
      contract,
      driftReport,
      proposedFields,
    );
  }

  private generateDeterministicProposal(
    contract: Contract,
    driftReport: DriftReport,
    proposedFields: SchemaField[],
  ): MigrationProposal {
    const isBreaking = driftReport.categorySummary.breakingCount > 0;
    const isRisky = driftReport.categorySummary.riskyCount > 0;

    // Calculate version bump
    const [major, minor, patch] = contract.version.split('.').map((n) => parseInt(n, 10) || 0);
    const proposedVersion = isBreaking
      ? `${major + 1}.0.0`
      : isRisky
        ? `${major}.${minor + 1}.0`
        : `${major}.${minor}.${patch + 1}`;

    const diff = this.computeSchemaDiff(contract.schema, proposedFields);

    const title = isBreaking
      ? `Major Breaking Evolution (${contract.version} → ${proposedVersion}) for ${contract.name}`
      : `Backward-Compatible Migration (${contract.version} → ${proposedVersion}) for ${contract.name}`;

    const breakingFields = driftReport.changes
      .filter((c) => c.category === 'BREAKING')
      .map((c) => c.field);
    const riskyFields = driftReport.changes
      .filter((c) => c.category === 'POTENTIALLY_RISKY')
      .map((c) => c.field);

    const execSummary = `Schema drift detected on contract '${contract.name}' (${contract.domain} domain). ${
      isBreaking
        ? `Contains ${driftReport.categorySummary.breakingCount} breaking change(s) requiring a coordinated dual-write or migration window across ${driftReport.impactedConsumers.length} registered downstream consumer(s).`
        : 'Changes are backward-compatible and safe for progressive rollout with automated contract version promotion.'
    }`;

    const rootCause = breakingFields.length > 0
      ? `Upstream producers emitted schema alterations to [${breakingFields.join(', ')}] without an approved schema deprecation window. Incompatible types or dropped attributes were detected.`
      : riskyFields.length > 0
        ? `Upstream producers introduced unannounced fields [${riskyFields.join(', ')}] or tightened constraints without notifying downstream subscribers.`
        : 'Upstream schema evolved with non-breaking field additions or optional attribute expansions.';

    const phases = [
      {
        phaseNumber: 1,
        phaseName: 'Phase 1: Dual-Write & Producer Adaptation',
        objective: 'Ensure producer emits compatible payload attributes while maintaining legacy compatibility.',
        actions: [
          'Publish adapter or dual-write layer in upstream service producer.',
          'Inject fallback defaults for any new required attributes.',
          'Monitor data quality validation telemetry on stage/canary topics.',
        ],
        rollbackPlan: 'Revert upstream producer deployment or route messages to previous schema version envelope.',
      },
      {
        phaseNumber: 2,
        phaseName: 'Phase 2: Downstream Consumer Migration',
        objective: `Update ${driftReport.impactedConsumers.length} affected consumer pipelines before legacy schema retirement.`,
        actions: driftReport.impactedConsumers.map(
          (c) =>
            `Migrate ${c.consumerName} (${c.team}, SLA: ${c.interfaceType}) to consume updated attributes [${c.impactedFields.join(', ')}].`,
        ),
        rollbackPlan: 'Downstream consumers can switch back to dual-read legacy fields until migration completion.',
      },
      {
        phaseNumber: 3,
        phaseName: 'Phase 3: Formal Contract Promotion & Deprecation Cleanup',
        objective: `Promote contract to active version ${proposedVersion} and retire old schema version.`,
        actions: [
          `Promote contract '${contract.name}' to version ${proposedVersion} upon operator approval.`,
          'Archive previous schema snapshot to audit registry.',
          'Verify all downstream consumer health checks are passing.',
        ],
        rollbackPlan: 'Execute approval reject to roll back contract status to prior approved version.',
      },
    ];

    const codeSnippets = [
      {
        language: 'sql',
        title: 'PostgreSQL / Snowflake Table Evolution DDL',
        code: this.generateSqlMigration(contract.name, diff),
      },
      {
        language: 'typescript',
        title: 'TypeScript Interface Contract Definition',
        code: this.generateTypeScriptContract(contract.name, proposedFields),
      },
    ];

    return {
      id: `prop_${uuidv4().substring(0, 8)}`,
      driftReportId: driftReport.id,
      contractId: contract.id,
      currentVersion: contract.version,
      proposedVersion,
      title,
      executiveSummary: execSummary,
      rootCauseAnalysis: rootCause,
      compatibilityImpact: `Compatibility Mode: ${contract.compatibilityMode}. Evaluated Impact: ${driftReport.overallSeverity}.`,
      phases,
      proposedSchema: proposedFields,
      schemaDiff: diff,
      codeSnippets,
      generatedBy: 'DETERMINISTIC_ENGINE',
      createdAt: new Date().toISOString(),
      approvalStatus: 'PENDING_REVIEW',
    };
  }

  private synthesizeProposalFromAI(
    contract: Contract,
    driftReport: DriftReport,
    proposedFields: SchemaField[],
    aiContent: string,
    source: 'AI_PLATFORM',
  ): MigrationProposal {
    // Generate deterministic baseline and overlay AI narrative
    const base = this.generateDeterministicProposal(
      contract,
      driftReport,
      proposedFields,
    );
    base.generatedBy = source;
    base.executiveSummary = `${aiContent.substring(0, 300)}...`;
    base.rootCauseAnalysis = `AI-Synthesized Root Cause: ${aiContent.substring(0, 500)}`;
    return base;
  }

  private computeSchemaDiff(
    current: SchemaField[],
    proposed: SchemaField[],
  ): MigrationProposal['schemaDiff'] {
    const currentMap = new Map(current.map((f) => [f.name, f]));
    const proposedMap = new Map(proposed.map((f) => [f.name, f]));

    const added: SchemaField[] = [];
    const removed: SchemaField[] = [];
    const modified: MigrationProposal['schemaDiff']['modified'] = [];

    for (const [name, propField] of proposedMap.entries()) {
      if (!currentMap.has(name)) {
        added.push(propField);
      } else {
        const curField = currentMap.get(name)!;
        if (
          curField.type !== propField.type ||
          curField.nullable !== propField.nullable ||
          curField.required !== propField.required
        ) {
          modified.push({
            field: name,
            before: {
              type: curField.type,
              nullable: curField.nullable,
              required: curField.required,
            },
            after: {
              type: propField.type,
              nullable: propField.nullable,
              required: propField.required,
            },
          });
        }
      }
    }

    for (const [name, curField] of currentMap.entries()) {
      if (!proposedMap.has(name)) {
        removed.push(curField);
      }
    }

    return { added, removed, modified };
  }

  private generateSqlMigration(
    contractName: string,
    diff: MigrationProposal['schemaDiff'],
  ): string {
    const tableName = contractName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const statements: string[] = [`-- Migration DDL for table: ${tableName}`];

    diff.added.forEach((f) => {
      const sqlType = this.mapToSqlType(f.type);
      const nullability = f.nullable ? '' : ' NOT NULL DEFAULT 0';
      statements.push(`ALTER TABLE ${tableName} ADD COLUMN ${f.name} ${sqlType}${nullability};`);
    });

    diff.modified.forEach((m) => {
      if (m.after.type) {
        const sqlType = this.mapToSqlType(m.after.type as any);
        statements.push(`ALTER TABLE ${tableName} ALTER COLUMN ${m.field} TYPE ${sqlType};`);
      }
      if (m.after.nullable !== undefined) {
        statements.push(
          `ALTER TABLE ${tableName} ALTER COLUMN ${m.field} ${
            m.after.nullable ? 'DROP NOT NULL' : 'SET NOT NULL'
          };`,
        );
      }
    });

    diff.removed.forEach((f) => {
      statements.push(
        `-- Warning: Dropping field consumed by downstream views\n-- ALTER TABLE ${tableName} DROP COLUMN ${f.name};`,
      );
    });

    return statements.join('\n');
  }

  private generateTypeScriptContract(
    contractName: string,
    fields: SchemaField[],
  ): string {
    const typeName = contractName
      .split(/[^a-zA-Z0-9]/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join('');

    const lines = [`export interface ${typeName}Payload {`];
    fields.forEach((f) => {
      const opt = f.required ? '' : '?';
      const tsType = this.mapToTsType(f.type);
      const nullable = f.nullable ? ' | null' : '';
      lines.push(`  ${f.name}${opt}: ${tsType}${nullable};`);
    });
    lines.push('}');
    return lines.join('\n');
  }

  private mapToSqlType(type: string): string {
    switch (type) {
      case 'integer':
        return 'BIGINT';
      case 'float':
        return 'NUMERIC(14, 4)';
      case 'boolean':
        return 'BOOLEAN';
      case 'timestamp':
        return 'TIMESTAMP WITH TIME ZONE';
      case 'object':
      case 'array':
        return 'JSONB';
      default:
        return 'VARCHAR(255)';
    }
  }

  private mapToTsType(type: string): string {
    switch (type) {
      case 'integer':
      case 'float':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'timestamp':
      case 'date':
        return 'string';
      case 'object':
        return 'Record<string, unknown>';
      case 'array':
        return 'unknown[]';
      default:
        return 'string';
    }
  }
}
