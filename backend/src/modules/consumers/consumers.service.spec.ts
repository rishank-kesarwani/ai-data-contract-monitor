import { ConsumersService } from './consumers.service';
import { Contract } from '../../common/types';

describe('ConsumersService', () => {
  let service: ConsumersService;
  let mockDbService: any;

  beforeEach(() => {
    mockDbService = {
      getConsumers: jest.fn(),
      getContractById: jest.fn(),
      saveConsumer: jest.fn(),
      saveContract: jest.fn(),
      saveAuditLog: jest.fn(),
    };
    service = new ConsumersService(mockDbService);
  });

  const contract: Contract = {
    id: 'ct-order',
    name: 'Orders Contract',
    description: 'Order events',
    domain: 'Billing',
    status: 'ACTIVE',
    version: '1.0.0',
    owner: { team: 'Checkout', contact: 'chk@test.local', tier: 'TIER_1' },
    compatibilityMode: 'BACKWARD',
    isStrict: false,
    schema: [],
    consumers: [
      {
        id: 'cons-1',
        name: 'Financial Ledger',
        team: 'Finance',
        contact: 'fin@test.local',
        tier: 'TIER_1',
        interfaceType: 'SQL_VIEW',
        consumedFields: ['order_id', 'amount', 'tax'],
        criticality: 'BLOCKING',
      },
      {
        id: 'cons-2',
        name: 'Recommendation AI',
        team: 'ML',
        contact: 'ml@test.local',
        tier: 'TIER_3',
        interfaceType: 'BATCH_ETL',
        consumedFields: ['items', 'categories'],
        criticality: 'DEGRADED',
      },
    ],
    versionHistory: [],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  it('should identify impacted consumer when consumed field drifts', () => {
    const driftedFields = ['amount']; // consumed by Financial Ledger
    const impact = service.calculateConsumerImpact(contract, driftedFields);

    expect(impact.length).toBe(1);
    expect(impact[0].consumerId).toBe('cons-1');
    expect(impact[0].status).toBe('FAILING');
    expect(impact[0].impactedFields).toContain('amount');
  });

  it('should not include consumers whose consumed fields have not drifted', () => {
    const driftedFields = ['shipping_address']; // neither consumer uses this
    const impact = service.calculateConsumerImpact(contract, driftedFields);

    expect(impact.length).toBe(0);
  });

  it('should differentiate degraded from blocking consumer impact', () => {
    const driftedFields = ['items']; // consumed by Recommendation AI (DEGRADED)
    const impact = service.calculateConsumerImpact(contract, driftedFields);

    expect(impact.length).toBe(1);
    expect(impact[0].consumerId).toBe('cons-2');
    expect(impact[0].status).toBe('DEGRADED');
  });
});
