import { DriftService } from './drift.service';
import { Contract, SchemaSnapshot } from '../../common/types';

describe('DriftService', () => {
  let service: DriftService;
  let mockDb: any;
  let mockQualityChecks: any;
  let mockConsumers: any;
  let mockNotification: any;

  beforeEach(() => {
    mockDb = {
      getContractById: jest.fn(),
      getSnapshotById: jest.fn(),
      saveDriftReport: jest.fn(),
      saveContract: jest.fn(),
      saveAuditLog: jest.fn(),
      getDriftReports: jest.fn(),
      getDriftReportById: jest.fn(),
    };
    mockQualityChecks = {
      evaluateChecks: jest.fn().mockReturnValue([]),
    };
    mockConsumers = {
      calculateConsumerImpact: jest.fn().mockReturnValue([]),
    };
    mockNotification = {
      sendAlert: jest.fn().mockResolvedValue(true),
    };

    service = new DriftService(
      mockDb,
      mockQualityChecks,
      mockConsumers,
      mockNotification,
    );
  });

  const baseContract: Contract = {
    id: 'ct-orders',
    name: 'Customer Orders',
    description: 'Orders stream',
    domain: 'Billing',
    status: 'ACTIVE',
    version: '1.0.0',
    owner: { team: 'Checkout', contact: 'chk@test.local', tier: 'TIER_1' },
    compatibilityMode: 'BACKWARD',
    isStrict: false,
    schema: [
      {
        name: 'order_id',
        type: 'string',
        nullable: false,
        required: true,
      },
      {
        name: 'total_amount',
        type: 'float',
        nullable: false,
        required: true,
      },
    ],
    consumers: [],
    versionHistory: [],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  it('should detect BREAKING drift when a required contracted field is removed', async () => {
    mockDb.getContractById.mockResolvedValue(baseContract);
    const snapshot: SchemaSnapshot = {
      id: 'snap-breaking',
      contractId: 'ct-orders',
      version: '1.0.0',
      source: 'kafka',
      environment: 'production',
      timestamp: '2026-01-01T00:00:00Z',
      recordCountSampled: 1000,
      fieldCount: 1,
      fields: [
        {
          name: 'order_id',
          inferredType: 'string',
          nullable: false,
          nullCount: 0,
          nullRate: 0.0,
          sampleValues: ['ord-1'],
        },
        // 'total_amount' is removed!
      ],
      checksum: 'chk-1',
    };
    mockDb.getSnapshotById.mockResolvedValue(snapshot);

    const report = await service.evaluate('ct-orders', 'snap-breaking');

    expect(report.categorySummary.breakingCount).toBe(1);
    expect(report.changes.some((c) => c.field === 'total_amount' && c.category === 'BREAKING')).toBe(true);
    expect(mockNotification.sendAlert).toHaveBeenCalled();
  });

  it('should detect NON_BREAKING evolution when an optional field is added', async () => {
    mockDb.getContractById.mockResolvedValue(baseContract);
    const snapshot: SchemaSnapshot = {
      id: 'snap-safe',
      contractId: 'ct-orders',
      version: '1.0.0',
      source: 'kafka',
      environment: 'production',
      timestamp: '2026-01-01T00:00:00Z',
      recordCountSampled: 1000,
      fieldCount: 3,
      fields: [
        {
          name: 'order_id',
          inferredType: 'string',
          nullable: false,
          nullCount: 0,
          nullRate: 0.0,
          sampleValues: ['ord-1'],
        },
        {
          name: 'total_amount',
          inferredType: 'float',
          nullable: false,
          nullCount: 0,
          nullRate: 0.0,
          sampleValues: [99.9],
        },
        {
          name: 'discount_code', // newly added optional field
          inferredType: 'string',
          nullable: true,
          nullCount: 500,
          nullRate: 0.5,
          sampleValues: ['PROMO26'],
        },
      ],
      checksum: 'chk-2',
    };
    mockDb.getSnapshotById.mockResolvedValue(snapshot);

    const report = await service.evaluate('ct-orders', 'snap-safe');

    expect(report.categorySummary.breakingCount).toBe(0);
    expect(report.categorySummary.nonBreakingCount).toBe(1);
    expect(report.overallSeverity).toBe('LOW');
  });
});
