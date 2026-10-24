import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DriftMonitor } from './DriftMonitor';
import { DriftReport } from '../lib/types';

describe('DriftMonitor Component', () => {
  const mockDriftReports: DriftReport[] = [
    {
      id: 'drift-1',
      contractId: 'ct-orders',
      contractName: 'Customer Orders Stream',
      snapshotId: 'snap-1',
      detectionTime: '2026-10-24T10:00:00Z',
      overallSeverity: 'CRITICAL',
      categorySummary: {
        breakingCount: 1,
        riskyCount: 0,
        nonBreakingCount: 0,
      },
      remediationStatus: 'DETECTED',
      changes: [
        {
          id: 'chg-1',
          field: 'total_amount',
          category: 'BREAKING',
          severity: 'CRITICAL',
          changeType: 'FIELD_REMOVED',
          contractValue: 'float',
          observedValue: 'MISSING',
          description: "Required field 'total_amount' dropped from payload.",
          impactScore: 95,
          affectedConsumers: ['cons-bi'],
        },
      ],
      impactedConsumers: [
        {
          consumerId: 'cons-bi',
          consumerName: 'Revenue BI',
          team: 'Finance',
          contact: 'bi@test.com',
          interfaceType: 'SQL_VIEW',
          criticality: 'BLOCKING',
          impactedFields: ['total_amount'],
          riskSummary: 'Pipeline broken',
          status: 'FAILING',
        },
      ],
      qualityChecks: [
        {
          id: 'qc-1',
          checkType: 'NULL_RATE',
          field: 'customer_email',
          passed: true,
          severity: 'INFO',
          threshold: '0%',
          observed: '0%',
          message: 'Null rate healthy',
          timestamp: '2026-10-24T10:00:00Z',
        },
      ],
    },
  ];

  const defaultProps = {
    driftReports: mockDriftReports,
    onNavigateTab: jest.fn(),
    onRefresh: jest.fn(),
    onSelectProposal: jest.fn(),
  };

  it('should render the drift reports list and active report details', () => {
    render(<DriftMonitor {...defaultProps} />);
    expect(screen.getAllByText('Customer Orders Stream').length).toBeGreaterThan(0);
    expect(screen.getByText('CRITICAL DRIFT')).toBeInTheDocument();
    expect(screen.getByText('total_amount')).toBeInTheDocument();
    expect(screen.getByText("Required field 'total_amount' dropped from payload.")).toBeInTheDocument();
  });

  it('should display the affected consumer pill badge on the drifted field', () => {
    render(<DriftMonitor {...defaultProps} />);
    expect(screen.getByText('cons-bi')).toBeInTheDocument();
  });

  it('should display quality checks in the scorecard', () => {
    render(<DriftMonitor {...defaultProps} />);
    expect(screen.getByText('customer_email')).toBeInTheDocument();
    expect(screen.getByText('Null rate healthy')).toBeInTheDocument();
  });
});
