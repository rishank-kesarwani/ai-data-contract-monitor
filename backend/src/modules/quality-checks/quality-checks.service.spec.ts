import { QualityChecksService } from './quality-checks.service';
import { Contract, SchemaSnapshot } from '../../common/types';

describe('QualityChecksService', () => {
  let service: QualityChecksService;

  beforeEach(() => {
    service = new QualityChecksService();
  });

  const baseContract: Contract = {
    id: 'ct-test',
    name: 'Test Contract',
    description: 'Testing quality checks',
    domain: 'Testing',
    status: 'ACTIVE',
    version: '1.0.0',
    owner: { team: 'QA', contact: 'qa@test.local', tier: 'TIER_2' },
    compatibilityMode: 'BACKWARD',
    isStrict: true,
    schema: [
      {
        name: 'user_id',
        type: 'string',
        nullable: false,
        required: true,
        constraints: { maxNullRate: 0.0 },
      },
      {
        name: 'age',
        type: 'integer',
        nullable: true,
        required: false,
        constraints: { minimum: 18, maximum: 120, maxNullRate: 0.1 },
      },
      {
        name: 'status',
        type: 'string',
        nullable: false,
        required: true,
        constraints: { enum: ['ACTIVE', 'INACTIVE'] },
      },
    ],
    consumers: [],
    versionHistory: [],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  it('should pass all checks for clean snapshot', () => {
    const snapshot: SchemaSnapshot = {
      id: 'snap-1',
      contractId: 'ct-test',
      version: '1.0.0',
      source: 'test',
      environment: 'production',
      timestamp: '2026-01-01T00:00:00Z',
      recordCountSampled: 1000,
      fieldCount: 3,
      fields: [
        {
          name: 'user_id',
          inferredType: 'string',
          nullable: false,
          nullCount: 0,
          nullRate: 0.0,
          sampleValues: ['usr-1', 'usr-2'],
        },
        {
          name: 'age',
          inferredType: 'integer',
          nullable: true,
          nullCount: 50,
          nullRate: 0.05,
          sampleValues: [25, 40],
          observedMin: 20,
          observedMax: 65,
        },
        {
          name: 'status',
          inferredType: 'string',
          nullable: false,
          nullCount: 0,
          nullRate: 0.0,
          sampleValues: ['ACTIVE', 'INACTIVE'],
        },
      ],
      checksum: 'chk123',
    };

    const results = service.evaluateChecks(baseContract, snapshot);
    const failures = results.filter((r) => !r.passed);
    expect(failures.length).toBe(0);
  });

  it('should fail when null rate exceeds threshold', () => {
    const snapshot: SchemaSnapshot = {
      id: 'snap-2',
      contractId: 'ct-test',
      version: '1.0.0',
      source: 'test',
      environment: 'production',
      timestamp: '2026-01-01T00:00:00Z',
      recordCountSampled: 1000,
      fieldCount: 3,
      fields: [
        {
          name: 'user_id',
          inferredType: 'string',
          nullable: true,
          nullCount: 150,
          nullRate: 0.15, // 15% nulls when 0% allowed
          sampleValues: ['usr-1'],
        },
        {
          name: 'age',
          inferredType: 'integer',
          nullable: false,
          nullCount: 0,
          nullRate: 0.0,
          sampleValues: [30],
        },
        {
          name: 'status',
          inferredType: 'string',
          nullable: false,
          nullCount: 0,
          nullRate: 0.0,
          sampleValues: ['ACTIVE'],
        },
      ],
      checksum: 'chk123',
    };

    const results = service.evaluateChecks(baseContract, snapshot);
    const nullFailure = results.find((r) => r.field === 'user_id' && r.checkType === 'NULL_RATE');
    expect(nullFailure).toBeDefined();
    expect(nullFailure?.passed).toBe(false);
    expect(nullFailure?.severity).toBe('CRITICAL');
  });

  it('should fail when values violate enum constraint', () => {
    const snapshot: SchemaSnapshot = {
      id: 'snap-3',
      contractId: 'ct-test',
      version: '1.0.0',
      source: 'test',
      environment: 'production',
      timestamp: '2026-01-01T00:00:00Z',
      recordCountSampled: 1000,
      fieldCount: 3,
      fields: [
        {
          name: 'user_id',
          inferredType: 'string',
          nullable: false,
          nullCount: 0,
          nullRate: 0.0,
          sampleValues: ['usr-1'],
        },
        {
          name: 'age',
          inferredType: 'integer',
          nullable: false,
          nullCount: 0,
          nullRate: 0.0,
          sampleValues: [30],
        },
        {
          name: 'status',
          inferredType: 'string',
          nullable: false,
          nullCount: 0,
          nullRate: 0.0,
          sampleValues: ['ACTIVE', 'SUSPENDED'], // SUSPENDED is not in enum ['ACTIVE', 'INACTIVE']
        },
      ],
      checksum: 'chk123',
    };

    const results = service.evaluateChecks(baseContract, snapshot);
    const enumFailure = results.find(
      (r) => r.field === 'status' && r.checkType === 'VALUE_CONSTRAINT',
    );
    expect(enumFailure).toBeDefined();
    expect(enumFailure?.passed).toBe(false);
  });

  it('should flag unexpected fields when contract is strict', () => {
    const snapshot: SchemaSnapshot = {
      id: 'snap-4',
      contractId: 'ct-test',
      version: '1.0.0',
      source: 'test',
      environment: 'production',
      timestamp: '2026-01-01T00:00:00Z',
      recordCountSampled: 1000,
      fieldCount: 4,
      fields: [
        {
          name: 'user_id',
          inferredType: 'string',
          nullable: false,
          nullCount: 0,
          nullRate: 0.0,
          sampleValues: ['usr-1'],
        },
        {
          name: 'age',
          inferredType: 'integer',
          nullable: false,
          nullCount: 0,
          nullRate: 0.0,
          sampleValues: [30],
        },
        {
          name: 'status',
          inferredType: 'string',
          nullable: false,
          nullCount: 0,
          nullRate: 0.0,
          sampleValues: ['ACTIVE'],
        },
        {
          name: 'unauthorized_meta',
          inferredType: 'string',
          nullable: false,
          nullCount: 0,
          nullRate: 0.0,
          sampleValues: ['hack'],
        },
      ],
      checksum: 'chk123',
    };

    const results = service.evaluateChecks(baseContract, snapshot);
    const unexpected = results.find(
      (r) => r.field === 'unauthorized_meta' && r.checkType === 'UNEXPECTED_FIELD',
    );
    expect(unexpected).toBeDefined();
    expect(unexpected?.passed).toBe(false);
  });
});
