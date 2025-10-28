'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/ui/card';
import { MetricCardConfig, MetricData } from '@/types/dashboard';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';

interface MetricCardWidgetProps {
  data: MetricData;
  config: MetricCardConfig;
}

export function MetricCardWidget({ data, config }: MetricCardWidgetProps) {
  const {
    title,
    unit,
    color = 'blue',
    showTrend = true,
    decimalPlaces = 0,
    formatting,
  } = config;

  // データが存在しない場合のフォールバック
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">データ取得中...</div>
        </CardContent>
      </Card>
    );
  }

  const { value, previousValue, trend, changePercent } = data;

  // 値のフォーマット
  const formattedValue = formatting?.thousandsSeparator
    ? value.toLocaleString('ja-JP', {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      })
    : value.toFixed(decimalPlaces);

  // トレンドアイコン
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  // 色のマッピング
  const colorClass = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    orange: 'text-orange-600',
    red: 'text-red-600',
    teal: 'text-teal-600',
  }[color] || 'text-blue-600';

  const trendColorClass =
    trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${colorClass}`}>
          {formatting?.prefix}
          {formattedValue}
          {formatting?.suffix}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{unit}</p>

        {showTrend && changePercent !== undefined && (
          <div className={`flex items-center gap-1 mt-2 text-xs ${trendColorClass}`}>
            <TrendIcon className="w-3 h-3" />
            <span>
              {Math.abs(changePercent).toFixed(1)}% 前年比
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
