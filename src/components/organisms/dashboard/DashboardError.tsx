'use client';

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/atoms/ui/alert';
import { AlertCircle } from 'lucide-react';

interface DashboardErrorProps {
  error: Error;
}

export function DashboardError({ error }: DashboardErrorProps) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>エラーが発生しました</AlertTitle>
      <AlertDescription>
        ダッシュボードの読み込みに失敗しました。
        <br />
        {error.message}
      </AlertDescription>
    </Alert>
  );
}
