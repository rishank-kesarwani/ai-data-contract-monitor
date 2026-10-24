import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { DriftService } from '../drift/drift.service';
import { SnapshotsService } from '../snapshots/snapshots.service';
import {
  Contract,
  RegisteredConsumer,
  SchemaField,
  SnapshotField,
} from '../../common/types';

@Injectable()
export class DemoService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DemoService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly snapshotsService: SnapshotsService,
    private readonly driftService: DriftService,
  ) {}

  async onApplicationBootstrap() {
    // Seed initial demo data if empty
    const existing = await this.db.getContracts();
    if (existing.length === 0) {
      this.logger.log('Seeding initial demo workspace data...');
      await this.seedDemoWorkspace();
    }
  }

  async seedDemoWorkspace(): Promise<{ contractsCount: number; message: string }> {
    await this.db.clearAllData();

    // 1. Contract: Customer Orders Stream
    const ordersContract: Contract = {
      id: 'ct_orders_stream',
      name: 'Customer Orders Event Stream',
      description: 'Canonical event stream of checkout purchases, billing totals, and order lifecycles.',
      domain: 'Checkout & Payments',
      status: 'ACTIVE',
      version: '1.2.0',
      owner: {
        team: 'Checkout Platform',
        contact: 'checkout-oncall@company.internal',
        tier: 'TIER_1',
        serviceName: 'order-processing-svc',
      },
      compatibilityMode: 'BACKWARD',
      isStrict: false,
      schema: [
        {
          name: 'order_id',
          type: 'string',
          nullable: false,
          required: true,
          description: 'Unique UUIDv4 order identifier',
          constraints: { pattern: '^ord_[a-zA-Z0-9]{8,16}$', isUnique: true },
        },
        {
          name: 'customer_id',
          type: 'string',
          nullable: false,
          required: true,
          description: 'Reference to customer account',
        },
        {
          name: 'customer_email',
          type: 'string',
          nullable: false,
          required: true,
          description: 'Customer contact email for billing receipts',
          constraints: { maxNullRate: 0.0, isPii: true },
        },
        {
          name: 'total_amount',
          type: 'float',
          nullable: false,
          required: true,
          description: 'Final order total in major currency units',
          constraints: { minimum: 0.01, maximum: 50000.0 },
        },
        {
          name: 'currency',
          type: 'string',
          nullable: false,
          required: true,
          description: 'Three-letter ISO currency code',
          constraints: { enum: ['USD', 'EUR', 'GBP', 'CAD'] },
        },
        {
          name: 'items_count',
          type: 'integer',
          nullable: false,
          required: true,
          description: 'Total number of items in order',
          constraints: { minimum: 1, maximum: 500 },
        },
        {
          name: 'order_status',
          type: 'string',
          nullable: false,
          required: true,
          description: 'Lifecycle state of the purchase',
          constraints: { enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'CANCELLED'] },
        },
        {
          name: 'created_at',
          type: 'timestamp',
          nullable: false,
          required: true,
          description: 'UTC ISO-8601 timestamp of order creation',
        },
      ],
      consumers: [
        {
          id: 'cons_rev_bi',
          name: 'Executive Revenue BI Dashboard',
          team: 'Data Analytics & Finance',
          contact: 'finance-bi@company.internal',
          tier: 'TIER_1',
          interfaceType: 'SQL_VIEW',
          consumedFields: ['order_id', 'total_amount', 'currency', 'created_at'],
          criticality: 'BLOCKING',
          sla: 'Real-time query sync (max 5s lag)',
          description: 'PowerBI and Snowflake reporting pipelines feeding daily financial statements.',
        },
        {
          id: 'cons_fraud_engine',
          name: 'Real-Time Fraud Detection Engine',
          team: 'Risk & Trust',
          contact: 'fraud-team@company.internal',
          tier: 'TIER_1',
          interfaceType: 'EVENT_STREAM',
          consumedFields: ['order_id', 'customer_id', 'customer_email', 'total_amount', 'currency'],
          criticality: 'BLOCKING',
          sla: 'Kafka P99 < 50ms latency',
          description: 'Evaluates transaction velocity and blocks high-risk payment attempts.',
        },
        {
          id: 'cons_warehouse_dispatch',
          name: 'Warehouse Logistics Dispatcher',
          team: 'Fulfillment & Logistics',
          contact: 'logistics-ops@company.internal',
          tier: 'TIER_2',
          interfaceType: 'BATCH_ETL',
          consumedFields: ['order_id', 'items_count', 'order_status', 'created_at'],
          criticality: 'DEGRADED',
          sla: '15-minute batch sync',
          description: 'Directs fulfillment routing and barcode generation.',
        },
      ],
      versionHistory: [
        {
          version: '1.0.0',
          updatedAt: '2026-08-15T10:00:00Z',
          author: 'Alice Chen (Principal Architect)',
          changeSummary: 'Initial production contract baseline',
          schemaSnapshot: [],
        },
        {
          version: '1.2.0',
          updatedAt: '2026-09-20T14:30:00Z',
          author: 'Alice Chen (Principal Architect)',
          changeSummary: 'Added currency enum constraint and items_count',
          schemaSnapshot: [],
        },
      ],
      createdAt: '2026-08-15T10:00:00Z',
      updatedAt: '2026-09-20T14:30:00Z',
    };

    // 2. Contract: User Profile & Authentication Events
    const userContract: Contract = {
      id: 'ct_user_identity',
      name: 'User Profile & Identity Events',
      description: 'Stream of identity logins, permission changes, and security tier migrations.',
      domain: 'Identity & Access',
      status: 'ACTIVE',
      version: '2.0.0',
      owner: {
        team: 'Identity Platform',
        contact: 'identity-sec@company.internal',
        tier: 'TIER_1',
        serviceName: 'auth-core-svc',
      },
      compatibilityMode: 'FULL',
      isStrict: true,
      schema: [
        {
          name: 'user_id',
          type: 'string',
          nullable: false,
          required: true,
          description: 'Unique user UUID',
        },
        {
          name: 'username',
          type: 'string',
          nullable: false,
          required: true,
          description: 'Alphanumeric display handle',
        },
        {
          name: 'email',
          type: 'string',
          nullable: false,
          required: true,
          description: 'Primary verified email',
          constraints: { isPii: true, maxNullRate: 0.0 },
        },
        {
          name: 'mfa_enabled',
          type: 'boolean',
          nullable: false,
          required: true,
          description: 'Two-factor authentication compliance flag',
        },
        {
          name: 'subscription_tier',
          type: 'string',
          nullable: false,
          required: true,
          description: 'Account billing tier',
          constraints: { enum: ['FREE', 'PRO', 'ENTERPRISE'] },
        },
        {
          name: 'last_login_at',
          type: 'timestamp',
          nullable: true,
          required: false,
          description: 'Timestamp of last authentication event',
        },
      ],
      consumers: [
        {
          id: 'cons_auth_gateway',
          name: 'API Edge Gateway Authorizer',
          team: 'Infrastructure',
          contact: 'edge-gateway@company.internal',
          tier: 'TIER_1',
          interfaceType: 'REST_API',
          consumedFields: ['user_id', 'mfa_enabled', 'subscription_tier'],
          criticality: 'BLOCKING',
          sla: 'Synchronous edge validation',
        },
        {
          id: 'cons_growth_segmenter',
          name: 'Growth & Lifecycle Messaging',
          team: 'Marketing Tech',
          contact: 'growth-eng@company.internal',
          tier: 'TIER_3',
          interfaceType: 'BATCH_ETL',
          consumedFields: ['user_id', 'subscription_tier', 'last_login_at'],
          criticality: 'DEGRADED',
        },
      ],
      versionHistory: [
        {
          version: '2.0.0',
          updatedAt: '2026-09-01T08:00:00Z',
          author: 'David SRE Lead',
          changeSummary: 'MFA compliance enforcement migration',
          schemaSnapshot: [],
        },
      ],
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-09-01T08:00:00Z',
    };

    // 3. Contract: Inventory Stock Ledger
    const inventoryContract: Contract = {
      id: 'ct_inventory_stock',
      name: 'Warehouse Stock Ledger Stream',
      description: 'Physical inventory availability, reserve levels, and warehouse restocking signals.',
      domain: 'Supply Chain',
      status: 'ACTIVE',
      version: '1.0.0',
      owner: {
        team: 'Supply Chain Engineering',
        contact: 'inventory-dev@company.internal',
        tier: 'TIER_2',
        serviceName: 'inventory-svc',
      },
      compatibilityMode: 'BACKWARD',
      isStrict: false,
      schema: [
        {
          name: 'sku_id',
          type: 'string',
          nullable: false,
          required: true,
          description: 'Stock keeping unit identifier',
        },
        {
          name: 'warehouse_id',
          type: 'string',
          nullable: false,
          required: true,
          description: 'Regional distribution center ID',
        },
        {
          name: 'available_units',
          type: 'integer',
          nullable: false,
          required: true,
          description: 'Units available for immediate allocation',
          constraints: { minimum: 0 },
        },
        {
          name: 'reserved_units',
          type: 'integer',
          nullable: false,
          required: true,
          description: 'Units held for unfulfilled orders',
          constraints: { minimum: 0 },
        },
        {
          name: 'updated_at',
          type: 'timestamp',
          nullable: false,
          required: true,
          description: 'Timestamp of count ledger update',
        },
      ],
      consumers: [
        {
          id: 'cons_storefront_stock',
          name: 'Storefront Cart Stock Validator',
          team: 'Storefront Experience',
          contact: 'storefront@company.internal',
          tier: 'TIER_1',
          interfaceType: 'REST_API',
          consumedFields: ['sku_id', 'available_units'],
          criticality: 'BLOCKING',
          sla: 'Real-time reservation check',
        },
      ],
      versionHistory: [
        {
          version: '1.0.0',
          updatedAt: '2026-10-01T12:00:00Z',
          author: 'Kenji Logistics',
          changeSummary: 'Initial inventory contract',
          schemaSnapshot: [],
        },
      ],
      createdAt: '2026-10-01T12:00:00Z',
      updatedAt: '2026-10-01T12:00:00Z',
    };

    await this.db.saveContract(ordersContract);
    await this.db.saveContract(userContract);
    await this.db.saveContract(inventoryContract);

    // Save consumers into consumer repository as well
    for (const c of [...ordersContract.consumers, ...userContract.consumers, ...inventoryContract.consumers]) {
      const contractId = ordersContract.consumers.some((x) => x.id === c.id)
        ? ordersContract.id
        : userContract.consumers.some((x) => x.id === c.id)
          ? userContract.id
          : inventoryContract.id;
      await this.db.saveConsumer({ ...c, contractId });
    }

    // Ingest a clean baseline snapshot for Customer Orders Stream
    const cleanSnapshot = await this.snapshotsService.ingest({
      contractId: 'ct_orders_stream',
      source: 'Kafka Topic (order-events.v1) CDC Mirror',
      environment: 'production',
      recordCountSampled: 25000,
      fields: ordersContract.schema.map((f) => ({
        name: f.name,
        inferredType: f.type,
        nullable: f.nullable,
        nullCount: 0,
        nullRate: 0.0,
        sampleValues:
          f.type === 'float'
            ? [49.99, 129.5, 14.0]
            : f.type === 'integer'
              ? [1, 3, 5]
              : f.name === 'order_id'
                ? ['ord_9f81a7b2', 'ord_4c29d01e']
                : f.name === 'currency'
                  ? ['USD', 'EUR']
                  : f.name === 'order_status'
                    ? ['CONFIRMED', 'SHIPPED']
                    : ['safe_sample'],
        observedMin: f.type === 'float' ? 5.0 : undefined,
        observedMax: f.type === 'float' ? 850.0 : undefined,
      })),
    });

    await this.driftService.evaluate(ordersContract.id, cleanSnapshot.id);

    return {
      contractsCount: 3,
      message: 'Demo workspace initialized with realistic contracts, consumers, and baseline snapshot.',
    };
  }

  async runScenario(scenarioKey: 'BREAKING' | 'QUALITY' | 'RISKY' | 'SAFE'): Promise<any> {
    switch (scenarioKey) {
      case 'BREAKING':
        return this.triggerBreakingScenario();
      case 'QUALITY':
        return this.triggerQualityViolationScenario();
      case 'RISKY':
        return this.triggerRiskyDriftScenario();
      case 'SAFE':
        return this.triggerSafeEvolutionScenario();
      default:
        throw new Error(`Unknown scenario key: ${scenarioKey}`);
    }
  }

  private async triggerBreakingScenario() {
    const contract = await this.db.getContractById('ct_orders_stream');
    if (!contract) throw new Error('Contract ct_orders_stream not found');

    // Simulate upstream breaking changes:
    // 1. total_amount field dropped completely!
    // 2. currency type changed from string to integer (e.g. ISO code 840)
    // This affects Executive Revenue BI Dashboard and Real-Time Fraud Engine (both BLOCKING)!
    const driftedFields: SnapshotField[] = contract.schema
      .filter((f) => f.name !== 'total_amount')
      .map((f) => {
        if (f.name === 'currency') {
          return {
            name: 'currency',
            inferredType: 'integer' as const,
            nullable: false,
            nullCount: 0,
            nullRate: 0.0,
            sampleValues: [840, 978, 826], // numeric currency codes
          };
        }
        return {
          name: f.name,
          inferredType: f.type,
          nullable: f.nullable,
          nullCount: 0,
          nullRate: 0.0,
          sampleValues: [f.defaultValue || 'sample'],
        };
      });

    const snapshot = await this.snapshotsService.ingest({
      contractId: contract.id,
      source: 'Simulated Debezium CDC (Staging Order Service v2-beta)',
      environment: 'staging',
      recordCountSampled: 15000,
      fields: driftedFields,
      metadata: { scenario: 'BREAKING_DROPPED_TOTAL_AND_TYPE_CHANGE' },
    });

    const driftReport = await this.driftService.evaluate(contract.id, snapshot.id);
    return {
      scenario: 'BREAKING',
      title: 'Breaking Schema Drift: Dropped Required Field & Incompatible Type Change',
      description:
        "The upstream producer dropped 'total_amount' and changed 'currency' from string to integer. Evaluated as CRITICAL severity because 2 Tier-1 blocking downstream consumers (Revenue BI Dashboard and Fraud Detection Engine) consume these exact fields.",
      driftReport,
    };
  }

  private async triggerQualityViolationScenario() {
    const contract = await this.db.getContractById('ct_orders_stream');
    if (!contract) throw new Error('Contract ct_orders_stream not found');

    // Simulate high null rate violation on mandatory customer_email column (23.4% nulls when 0% allowed)
    // plus out-of-enum status values ('CHARGEBACK', 'DISPUTED')
    const fields: SnapshotField[] = contract.schema.map((f) => {
      if (f.name === 'customer_email') {
        return {
          name: 'customer_email',
          inferredType: 'string' as const,
          nullable: true,
          nullCount: 3510,
          nullRate: 0.234, // 23.4% nulls!
          sampleValues: ['us***@example.com', 'bi***@corp.net'],
        };
      }
      if (f.name === 'order_status') {
        return {
          name: 'order_status',
          inferredType: 'string' as const,
          nullable: false,
          nullCount: 0,
          nullRate: 0.0,
          sampleValues: ['CONFIRMED', 'CHARGEBACK', 'DISPUTED'],
        };
      }
      return {
        name: f.name,
        inferredType: f.type,
        nullable: f.nullable,
        nullCount: 0,
        nullRate: 0.0,
        sampleValues: ['valid_val'],
      };
    });

    const snapshot = await this.snapshotsService.ingest({
      contractId: contract.id,
      source: 'Production Ingestion Telemetry (Data Quality Monitor)',
      environment: 'production',
      recordCountSampled: 15000,
      fields,
      metadata: { scenario: 'QUALITY_NULL_RATE_AND_ENUM_VIOLATION' },
    });

    const driftReport = await this.driftService.evaluate(contract.id, snapshot.id);
    return {
      scenario: 'QUALITY',
      title: 'Data Quality Drift: Null Rate Violation & Disallowed Enum Statuses',
      description:
        "Null rate on non-nullable 'customer_email' surged to 23.4% (contract limit is 0.0%), and observed status values contained unapproved enums ['CHARGEBACK', 'DISPUTED']. Evaluated as HIGH severity.",
      driftReport,
    };
  }

  private async triggerRiskyDriftScenario() {
    const contract = await this.db.getContractById('ct_user_identity');
    if (!contract) throw new Error('Contract ct_user_identity not found');

    // Strict identity contract with FULL compatibility mode receives undeclared fields
    const fields: SnapshotField[] = [
      ...contract.schema.map((f) => ({
        name: f.name,
        inferredType: f.type,
        nullable: f.nullable,
        nullCount: 0,
        nullRate: 0.0,
        sampleValues: ['val'],
      })),
      {
        name: 'device_fingerprint_hash',
        inferredType: 'string' as const,
        nullable: false,
        nullCount: 0,
        nullRate: 0.0,
        sampleValues: ['fp_a819cd8271e'],
      },
      {
        name: 'ip_geo_country',
        inferredType: 'string' as const,
        nullable: true,
        nullCount: 120,
        nullRate: 0.012,
        sampleValues: ['US', 'DE', 'JP'],
      },
    ];

    const snapshot = await this.snapshotsService.ingest({
      contractId: contract.id,
      source: 'Auth Gateway Canary Envoy Filter',
      environment: 'staging',
      recordCountSampled: 10000,
      fields,
      metadata: { scenario: 'RISKY_UNDECLARED_ATTRIBUTES' },
    });

    const driftReport = await this.driftService.evaluate(contract.id, snapshot.id);
    return {
      scenario: 'RISKY',
      title: 'Potentially Risky Drift: Undeclared Fields in Strict Contract',
      description:
        "Upstream auth producer emitted new fields ['device_fingerprint_hash', 'ip_geo_country']. Because this contract specifies 'FULL' compatibility with strict mode enabled, unexpected fields require schema registration.",
      driftReport,
    };
  }

  private async triggerSafeEvolutionScenario() {
    const contract = await this.db.getContractById('ct_orders_stream');
    if (!contract) throw new Error('Contract ct_orders_stream not found');

    // Safe backward-compatible addition: optional loyalty_points_earned and coupon_code
    const fields: SnapshotField[] = [
      ...contract.schema.map((f) => ({
        name: f.name,
        inferredType: f.type,
        nullable: f.nullable,
        nullCount: 0,
        nullRate: 0.0,
        sampleValues: [f.defaultValue || 'sample'],
      })),
      {
        name: 'loyalty_points_earned',
        inferredType: 'integer' as const,
        nullable: true,
        nullCount: 450,
        nullRate: 0.045,
        sampleValues: [100, 250, 0],
      },
      {
        name: 'coupon_code',
        inferredType: 'string' as const,
        nullable: true,
        nullCount: 8200,
        nullRate: 0.82,
        sampleValues: ['SPRING26', 'WELCOME10'],
      },
    ];

    const snapshot = await this.snapshotsService.ingest({
      contractId: contract.id,
      source: 'Checkout Service PR-408 Deployment Snapshot',
      environment: 'staging',
      recordCountSampled: 10000,
      fields,
      metadata: { scenario: 'SAFE_BACKWARD_COMPATIBLE_EVOLUTION' },
    });

    const driftReport = await this.driftService.evaluate(contract.id, snapshot.id);
    return {
      scenario: 'SAFE',
      title: 'Safe Backward-Compatible Evolution: Added Optional Fields',
      description:
        "Added optional attributes 'loyalty_points_earned' and 'coupon_code'. All existing fields and types remain intact. Evaluated as LOW severity non-breaking evolution.",
      driftReport,
    };
  }
}
