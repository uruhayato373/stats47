'use client';

import { useMemo, useState } from 'react';

import { Button } from '@stats47/components/atoms/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@stats47/components/atoms/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@stats47/components/atoms/ui/table';


import { SectionHeader } from '@/components/section';
import { SurfaceSection } from '@/components/surface';


import {
  trackGeoCompareAdd,
  trackGeoRegionSelect,
} from '@/lib/analytics/events';

import { formatGeoValue, type GeoAnalysisSnapshot } from '../lib/geo-cross-analysis';


interface Props {
  analysisId: string;
  comparisonLimit: number;
  mapTitle: string;
  mapSubtitle: string;
  snapshot: GeoAnalysisSnapshot;
}

const NONE = '__none__';

export function GeoCrossAnalysisExplorer({
  analysisId,
  comparisonLimit,
  mapTitle,
  mapSubtitle,
  snapshot,
}: Props) {
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [comparisonCodes, setComparisonCodes] = useState<string[]>([]);
  const common = {
    analysisId,
    analysisSlug: snapshot.slug,
    geography: 'prefecture' as const,
    dataVersion: snapshot.dataVersion,
  };
  const selected =
    snapshot.rows.find((row) => row.areaCode === selectedCode) ?? null;
  const comparisons = useMemo(
    () =>
      comparisonCodes
        .map((code) => snapshot.rows.find((row) => row.areaCode === code))
        .filter((row): row is GeoAnalysisSnapshot['rows'][number] =>
          Boolean(row)
        ),
    [comparisonCodes, snapshot.rows]
  );

  const selectFromList = (code: string) => {
    const next = code === NONE ? null : code;
    setSelectedCode(next);
    if (next) trackGeoRegionSelect({ ...common, areaCode: next });
  };

  const addComparison = () => {
    if (
      !selectedCode ||
      comparisonCodes.includes(selectedCode) ||
      comparisonCodes.length >= comparisonLimit
    ) {
      return;
    }
    const next = [...comparisonCodes, selectedCode];
    setComparisonCodes(next);
    trackGeoCompareAdd({
      ...common,
      areaCode: selectedCode,
      comparisonSize: next.length,
    });
  };

  const primaryMetric = snapshot.metrics.find(
    (metric) => metric.key === snapshot.primaryMetricKey
  );

  return (
    <div className="space-y-6">
      <SectionHeader title={mapTitle} description={mapSubtitle} hideRule />

      <SurfaceSection aria-labelledby="geo-cross-compare-title">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="geo-cross-compare-title" className="text-lg font-bold">
              都道府県を最大{comparisonLimit}件で比較
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              一覧から県を選び、比較リストへ追加してください。詳しい場所は上の県内地図で確認できます。
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select value={selectedCode ?? NONE} onValueChange={selectFromList}>
              <SelectTrigger
                className="w-full sm:w-48"
                aria-label="都道府県を選択"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>都道府県を選択</SelectItem>
                {[...snapshot.rows]
                  .sort((a, b) => a.areaCode.localeCompare(b.areaCode))
                  .map((row) => (
                    <SelectItem key={row.areaCode} value={row.areaCode}>
                      {row.areaName}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              onClick={addComparison}
              disabled={
                !selectedCode ||
                comparisonCodes.includes(selectedCode) ||
                comparisonCodes.length >= comparisonLimit
              }
            >
              比較へ追加
            </Button>
          </div>
        </div>

        {selected && primaryMetric ? (
          <p className="mt-4 text-sm">
            選択中: <strong>{selected.areaName}</strong>{' '}
            {formatGeoValue(
              primaryMetric,
              selected.values[snapshot.primaryMetricKey]
            )}
          </p>
        ) : null}

        {comparisons.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>都道府県</TableHead>
                  {snapshot.metrics.map((metric) => (
                    <TableHead key={metric.key} className="text-right">
                      {metric.label}
                    </TableHead>
                  ))}
                  <TableHead className="w-20">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparisons.map((row) => (
                  <TableRow key={row.areaCode}>
                    <TableCell className="font-medium">
                      {row.areaName}
                    </TableCell>
                    {snapshot.metrics.map((metric) => (
                      <TableCell
                        key={metric.key}
                        className="text-right tabular-nums"
                      >
                        {formatGeoValue(metric, row.values[metric.key])}
                      </TableCell>
                    ))}
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setComparisonCodes((current) =>
                            current.filter((code) => code !== row.areaCode)
                          )
                        }
                      >
                        外す
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            比較リストはまだ空です。
          </p>
        )}
      </SurfaceSection>
    </div>
  );
}
