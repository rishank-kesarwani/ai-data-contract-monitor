import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Navigation } from './Navigation';
import { UserSession } from '../lib/types';

describe('Navigation Component', () => {
  const mockUser: UserSession = {
    id: 'user-1',
    username: 'admin',
    role: 'ADMIN',
  };

  const defaultProps = {
    activeTab: 'overview',
    onTabChange: jest.fn(),
    user: mockUser,
    onOpenAuthModal: jest.fn(),
    onLogout: jest.fn(),
    onResetDemo: jest.fn(),
    onOpenUploadModal: jest.fn(),
    onTriggerScenario: jest.fn(),
    pendingApprovalsCount: 2,
    criticalDriftCount: 1,
  };

  it('should render the brand title', () => {
    render(<Navigation {...defaultProps} />);
    expect(
      screen.getByText('AI Data Contract & Schema Drift Monitor'),
    ).toBeInTheDocument();
  });

  it('should trigger onTabChange when a navigation tab is clicked', () => {
    render(<Navigation {...defaultProps} />);
    const contractsTab = screen.getAllByText('Contracts Registry')[0];
    fireEvent.click(contractsTab);
    expect(defaultProps.onTabChange).toHaveBeenCalledWith('contracts');
  });

  it('should display critical drift and pending approval badges', () => {
    render(<Navigation {...defaultProps} />);
    expect(screen.getByText('1')).toBeInTheDocument(); // criticalDriftCount
    expect(screen.getByText('2')).toBeInTheDocument(); // pendingApprovalsCount
  });

  it('should render sign-in button when role is PUBLIC_VIEWER', () => {
    const publicUser: UserSession = {
      id: 'guest',
      username: 'Guest',
      role: 'PUBLIC_VIEWER',
    };
    render(<Navigation {...defaultProps} user={publicUser} />);
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });
});
