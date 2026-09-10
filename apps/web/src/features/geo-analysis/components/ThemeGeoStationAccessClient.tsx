'use client';

import Link from 'next/link';

import { Button } from '@stats47/components/atoms/ui/button';
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

import { useThemePrefecture } from '@/features/theme-dashboard';

import { formatGeoValue } from '../lib/geo-cross-analysis';

import { GeoSpatialEvidenceExplorer } from './GeoSpatialEvidenceExplorer';

import type {
  GeoAnalysisEvidenceManifest,
  GeoAnalysisSnapshot,
} from '@stats47/gis';

interface Props {
  analysisId: string;
  snapshot: GeoAnalysisSnapshot;
  manifest: GeoAnalysisEvidenceManifest;
}

const slug = 'population-station-access';
const canonicalPath = `/geo/${slug}`;
const metricKeys = [
  'stationAccessShare2020',
  'stationAccessShare2050',
  'accessiblePopulation2050',
];

export function ThemeGeoStationAccessClient({
  analysisId,
  snapshot,
  manifest,
}: Props) {
  const { selectedPrefectureCode, setSelected } = useThemePrefecture();
  const selectedRow = snapshot.rows.find(
    (row) => row.areaCode === selectedPrefectureCode
  );
  const rows = selectedPrefectureCode
    ? snapshot.rows.filter((row) => row.areaCode === selectedPrefectureCode)
    : [...snapshot.rows].sort((a, b) => a.areaCode.localeCompare(b.areaCode));
  const metrics = metricKeys.flatMap((key) =>
    snapshot.metrics.filter((metric) => metric.key === key)
  );

  return (
    <div className="space-y-4">
      {selectedRow ? (
        <GeoSpatialEvidenceExplorer
          slug={slug}
          analysisId={analysisId}
          dataVersion={snapshot.dataVersion}
          initialPrefCode={selectedRow.areaCode.slice(0, 2)}
          initialView="overlap"
          manifest={manifest}
          fixedPrefecture
          syncUrl={false}
        />
      ) : null}
      <SurfaceSection>
        <SectionHeader
          title={
            selectedRow
              ? `${selectedRow.areaName}の駅800m圏人口`
              : '47都道府県の駅800m圏人口'
          }
          description="駅の位置を固定し、駅代表点から直線800m以内に中心がある1kmメッシュの人口を比較します。2050年は将来推計人口です。"
          hideRule
        />
        <Table aria-label="駅800m圏人口の都道府県別集計">
          <TableHeader>
            <TableRow>
              <TableHead scope="col" className="whitespace-nowrap">
                都道府県
              </TableHead>
              {metrics.map((metric) => (
                <TableHead key={metric.key} scope="col" className="text-right">
                  {metric.label}
                </TableHead>
              ))}
              <TableHead scope="col" className="whitespace-nowrap">
                検算
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.areaCode}>
                <TableHead scope="row" className="whitespace-nowrap">
                  {selectedRow ? (
                    row.areaName
                  ) : (
                    <Button
                      variant="link"
                      className="h-11 p-0"
                      onClick={() => setSelected(row.areaCode, row.areaName)}
                      aria-label={`${row.areaName}の地図を表示`}
                    >
                      {row.areaName}
                    </Button>
                  )}
                </TableHead>
                {metrics.map((metric) => (
                  <TableCell
                    key={metric.key}
                    className="whitespace-nowrap text-right tabular-nums"
                  >
                    {formatGeoValue(metric, row.values[metric.key])}
                  </TableCell>
                ))}
                <TableCell className="whitespace-nowrap">
                  <Link
                    className="inline-flex min-h-11 items-center text-primary underline"
                    href={`/geo/data/${slug}/${row.areaCode.slice(0, 2)}`}
                    aria-label={`${row.areaName}の地点・検算データ`}
                  >
                    地点・検算データ
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          道路網・高低差・運行本数は含みません。バス圏、医療施設への距離、国が定義する交通空白を示す値ではありません。
          県別の途中データと集計を照合済み（
          {manifest.quality.conservationChecks}/47県）。
        </p>
        <nav
          aria-label="駅アクセスの分析と出典"
          className="mt-3 flex flex-wrap gap-4 text-sm text-primary underline"
        >
          <Link href={canonicalPath}>駅アクセスの分析詳細を見る</Link>
          <Link href={`${canonicalPath}#methods`}>
            一次資料・取得記録・判定方法
          </Link>
        </nav>
        <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
          {snapshot.sources.map((source) => (
            <li key={`${source.datasetId}-${source.version}`}>
              <a
                className="text-primary underline"
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {source.name}
              </a>
              （{source.license}）
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          国土数値情報をもとにstats47が空間演算・集計。原典の初回取得日時は未記録です。
          対象版と検証記録は分析詳細で確認できます。
        </p>
      </SurfaceSection>
    </div>
  );
}
