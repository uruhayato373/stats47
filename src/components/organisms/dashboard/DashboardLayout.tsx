'use client';

import React from 'react';
import { LayoutTemplate } from '@/types/dashboard';

interface DashboardLayoutProps {
  layout: LayoutTemplate;
  children: React.ReactNode;
}

export function DashboardLayout({ layout, children }: DashboardLayoutProps) {
  const { gridConfig } = layout;

  if (!gridConfig) {
    return <div className="space-y-4">{children}</div>;
  }

  return (
    <div
      className="dashboard-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${gridConfig.columns}, 1fr)`,
        gap: gridConfig.gap,
      }}
    >
      {children}
    </div>
  );
}
