import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Info, Database } from 'lucide-react';
import TabNavigation from '../TabNavigation';

describe('TabNavigation Rendering Tests', () => {
  const mockOnTabChange = vi.fn();

  const mockTabs = [
    { id: 'overview', label: '概要', icon: Info, count: 5 },
    { id: 'data', label: 'データ', icon: Database, count: 12 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all tabs', () => {
    render(
      <TabNavigation
        tabs={mockTabs}
        activeTab="overview"
        onTabChange={mockOnTabChange}
      />
    );

    expect(screen.getByText('概要')).toBeInTheDocument();
    expect(screen.getByText('データ')).toBeInTheDocument();
  });

  it('should render count badges', () => {
    render(
      <TabNavigation
        tabs={mockTabs}
        activeTab="overview"
        onTabChange={mockOnTabChange}
      />
    );

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('should call onTabChange when tab is clicked', () => {
    render(
      <TabNavigation
        tabs={mockTabs}
        activeTab="overview"
        onTabChange={mockOnTabChange}
      />
    );

    fireEvent.click(screen.getByText('データ'));
    expect(mockOnTabChange).toHaveBeenCalledWith('data');
  });
});
