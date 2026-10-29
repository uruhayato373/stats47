'use client';

import { useEffect, useMemo, useState } from 'react';

import { PanelGrid, SectionCard } from '@stats47/components';
import { Button } from '@stats47/components/atoms/ui/button';
import { Slider } from '@stats47/components/atoms/ui/slider';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@stats47/components/atoms/ui/table';
import { geoMercator, geoPath } from 'd3-geo';
import { ListOrdered, Map as MapIcon, Pause, Play, Ruler } from 'lucide-react';
import { feature as topoFeature } from 'topojson-client';

import Link from '@/components/atoms/SiteLink';
import { STAT_VALUE_CLASS } from '@/components/surface';

import type {
  InfraCategory,
  InfraEventProperties,
  InfraLengthSeries,
  InfraPieceProperties,
} from '@stats47/gis/infra-history';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import type { GeometryCollection, Topology } from 'topojson-specification';

/** 表の 1 行 (地方・県)。total は years と同じ並び */
export interface InfraHistoryRow {
  readonly code: string;
  readonly name: string;
  readonly href: string;
  readonly total: readonly number[];
}

interface InfraHistoryExplorerProps {
  readonly networkLabel: string;
  readonly scopeName: string;
  readonly years: readonly number[];
  readonly categories: readonly InfraCategory[];
  readonly series: InfraLengthSeries;
  readonly rows: readonly InfraHistoryRow[];
  readonly rowsLabel: string;
  /** 表の地域の列の見出し (都道府県 / 府県) */
  readonly rowsColumnLabel: string;
  /** 地図の線 (同一オリジンの API) */
  readonly topologyUrl: string;
  /** 県境 (同一オリジンの API) */
  readonly boundaryUrl: string;
  /** 市区町村境界 (県の範囲だけ。同一オリジンの API) */
  readonly municipalityUrl: string | null;
  readonly prefCodes: readonly string[];
}

const MAP_WIDTH = 640;
const MAP_HEIGHT = 640;
const MAP_PADDING = 16;
/** 再生時の 1 年あたりの間隔 (ms) */
const PLAY_INTERVAL_MS = 280;
const PREF_CODE_PROPERTY = 'N03_007';

type LineFeature = Feature<Geometry, InfraPieceProperties>;
type EventFeature = Feature<Geometry, InfraEventProperties>;
type BoundaryFeature = Feature<Geometry, Record<string, string>>;

interface LoadedMap {
  readonly lines: readonly { readonly d: string; readonly props: InfraPieceProperties }[];
  /** 開通・延伸・廃止・短縮の強調線 (属性だけの変更は含まない) */
  readonly events: readonly { readonly d: string; readonly props: InfraEventProperties }[];
  readonly boundaries: readonly { readonly d: string; readonly code: string }[];
  /** 市区町村境界 (県の範囲だけ) */
  readonly municipalities: readonly string[];
}

function fetchTopology(url: string): Promise<Topology> {
  return fetch(url).then((res) => (res.ok ? (res.json() as Promise<Topology>) : Promise.reject(res.status)));
}

function firstObjectFeatures<P>(topology: Topology): Feature<Geometry, P>[] {
  const object = topology.objects[Object.keys(topology.objects)[0]];
  return (topoFeature(topology, object as GeometryCollection) as FeatureCollection<Geometry, P>).features;
}

function useInfraMap(
  topologyUrl: string,
  boundaryUrl: string,
  municipalityUrl: string | null,
  prefCodes: readonly string[],
  isNational: boolean,
): { map: LoadedMap | null; failed: boolean } {
  const prefKey = prefCodes.join(',');
  // 読み込み結果は要求ごとの key と一緒に持ち、別の範囲の古い結果を表示しない (effect 内で同期的に消さない)
  const requestKey = `${topologyUrl}|${boundaryUrl}|${municipalityUrl}|${prefKey}|${isNational}`;
  const [loaded, setLoaded] = useState<{ key: string; map: LoadedMap | null; failed: boolean } | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchTopology(topologyUrl),
      fetchTopology(boundaryUrl),
      // 市区町村境界は補助。取れなくても路線網は描く
      municipalityUrl ? fetchTopology(municipalityUrl).catch(() => null) : Promise.resolve(null),
    ])
      .then(([lineTopo, boundaryTopo, municipalityTopo]) => {
        if (cancelled) return;
        const lineCollection = topoFeature(
          lineTopo,
          lineTopo.objects.lines as GeometryCollection<InfraPieceProperties>,
        ) as FeatureCollection<Geometry, InfraPieceProperties>;
        const eventFeatures = lineTopo.objects.events
          ? (
              topoFeature(
                lineTopo,
                lineTopo.objects.events as GeometryCollection<InfraEventProperties>,
              ) as FeatureCollection<Geometry, InfraEventProperties>
            ).features
          : [];
        const allBoundaries = firstObjectFeatures<Record<string, string>>(boundaryTopo);
        const wanted = new Set(prefKey.split(','));
        const scopeBoundaries = allBoundaries.filter((f) => wanted.has(String(f.properties[PREF_CODE_PROPERTY])));
        // 縮尺は全年の路線の広がりで決める。県境で決めると東京都の小笠原諸島などで本土が小さくなる。
        // 路線が 1 本も無い範囲だけ県境で決める
        const fitTarget: FeatureCollection = {
          type: 'FeatureCollection',
          features: lineCollection.features.length > 0 ? lineCollection.features : scopeBoundaries,
        };
        const projection = geoMercator().fitExtent(
          [
            [MAP_PADDING, MAP_PADDING],
            [MAP_WIDTH - MAP_PADDING, MAP_HEIGHT - MAP_PADDING],
          ],
          fitTarget,
        );
        const path = geoPath(projection);
        const drawBoundaries: BoundaryFeature[] = isNational ? allBoundaries : scopeBoundaries;
        setLoaded({
          key: requestKey,
          failed: false,
          map: {
            lines: lineCollection.features
              .map((f: LineFeature) => ({ d: path(f) ?? '', props: f.properties }))
              .filter((line) => line.d !== ''),
            events: eventFeatures
              .map((f: EventFeature) => ({ d: path(f) ?? '', props: f.properties }))
              .filter((line) => line.d !== ''),
            boundaries: drawBoundaries
              .map((f) => ({ d: path(f) ?? '', code: String(f.properties[PREF_CODE_PROPERTY]) }))
              .filter((b) => b.d !== ''),
            municipalities: municipalityTopo
              ? firstObjectFeatures<Record<string, string>>(municipalityTopo)
                  .map((f) => path(f) ?? '')
                  .filter((d) => d !== '')
              : [],
          },
        });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ key: requestKey, map: null, failed: true });
      });
    return () => {
      cancelled = true;
    };
  }, [requestKey, topologyUrl, boundaryUrl, municipalityUrl, prefKey, isNational]);

  const current = loaded?.key === requestKey ? loaded : null;
  return { map: current?.map ?? null, failed: current?.failed ?? false };
}

function formatKm(value: number): string {
  return `${Math.round(value).toLocaleString('ja-JP')} km`;
}

function formatDiff(value: number): string {
  const rounded = Math.round(value);
  if (rounded === 0) return '±0 km';
  return `${rounded > 0 ? '+' : '−'}${Math.abs(rounded).toLocaleString('ja-JP')} km`;
}

export function InfraHistoryExplorer({
  networkLabel,
  scopeName,
  years,
  categories,
  series,
  rows,
  rowsLabel,
  rowsColumnLabel,
  topologyUrl,
  boundaryUrl,
  municipalityUrl,
  prefCodes,
}: InfraHistoryExplorerProps) {
  const first = years[0];
  const last = years[years.length - 1];
  const [year, setYear] = useState(last);
  const [isPlaying, setIsPlaying] = useState(false);
  const { map, failed } = useInfraMap(topologyUrl, boundaryUrl, municipalityUrl, prefCodes, prefCodes.length === 47);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setYear((current) => {
        if (current >= last) {
          setIsPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, PLAY_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [isPlaying, last]);

  const colorOf = useMemo(
    () => new Map(categories.map((category) => [category.code, category.color])),
    [categories],
  );
  const index = year - first;
  const total = series.total[index] ?? 0;
  const previous = index > 0 ? (series.total[index - 1] ?? 0) : 0;

  const visible = useMemo(() => {
    if (!map) return { active: [], opened: [], closed: [] };
    return {
      active: map.lines.filter((line) => line.props.s <= year && year <= line.props.e),
      // 強調は生成時に判定した開通・延伸 / 廃止・短縮だけ。記録の付け替え (名前の変更など) は含まない
      opened: map.events.filter((event) => event.props.y === year && (event.props.k === 'open' || event.props.k === 'extend')),
      closed: map.events.filter((event) => event.props.y === year && (event.props.k === 'close' || event.props.k === 'shorten')),
    };
  }, [map, year]);

  const rankedRows = useMemo(
    () =>
      [...rows]
        .map((row) => ({ ...row, value: row.total[index] ?? 0 }))
        .sort((a, b) => b.value - a.value || a.code.localeCompare(b.code)),
    [rows, index],
  );
  const maxTotal = Math.max(...series.total, 1);

  const handlePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    if (year >= last) setYear(first);
    setIsPlaying(true);
  };

  const scopeTitle = `${year}年の${scopeName}の${networkLabel}網`;

  return (
    <PanelGrid className="@lg:grid-cols-3">
      <SectionCard
        title={scopeTitle}
        icon={<MapIcon />}
        headingAs="h2"
        className="@lg:col-span-2"
        bodyClassName="space-y-3"
      >
        <div className="relative">
          <svg
            viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
            className="h-auto w-full"
            role="img"
            aria-label={scopeTitle}
          >
            {map?.boundaries.map((boundary) => (
              <path
                key={boundary.code + boundary.d.length}
                d={boundary.d}
                fill="var(--color-muted)"
                stroke="var(--color-border)"
                strokeWidth={0.6}
              />
            ))}
            {map?.municipalities.map((d, i) => (
              <path
                key={`municipality-${i}`}
                d={d}
                fill="none"
                stroke="var(--color-muted-foreground)"
                strokeWidth={0.4}
                opacity={0.45}
              />
            ))}
            {visible.closed.map((line, i) => (
              <path
                key={`closed-${i}`}
                d={line.d}
                fill="none"
                stroke="var(--color-foreground)"
                strokeWidth={2}
                strokeDasharray="4 3"
                opacity={0.85}
              />
            ))}
            {visible.active.map((line, i) => (
              <path
                key={`active-${i}`}
                d={line.d}
                fill="none"
                stroke={colorOf.get(line.props.c) ?? 'var(--color-foreground)'}
                strokeWidth={1.3}
                strokeLinecap="round"
              />
            ))}
            {visible.opened.map((line, i) => (
              <g key={`opened-${i}`}>
                <path d={line.d} fill="none" stroke="var(--color-background)" strokeWidth={5} strokeLinecap="round" />
                <path d={line.d} fill="none" stroke="var(--color-destructive)" strokeWidth={2.6} strokeLinecap="round" />
              </g>
            ))}
          </svg>
          {!map && (
            <p className="absolute inset-0 grid place-items-center text-muted-foreground">
              {failed ? '地図データを読み込めませんでした。' : '地図データを読み込んでいます…'}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handlePlay}
            aria-label={isPlaying ? '再生を止める' : `${first}年から再生する`}
          >
            {isPlaying ? <Pause /> : <Play />}
          </Button>
          <Slider
            min={first}
            max={last}
            step={1}
            value={year}
            onValueChange={(value) => {
              setIsPlaying(false);
              setYear(Array.isArray(value) ? value[0] : value);
            }}
            aria-label="表示する年"
            className="flex-1"
          />
          <span className="w-14 text-right tabular-nums text-muted-foreground">{year}年</span>
        </div>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <li className="flex items-center gap-1.5">
            <span className="inline-block h-1 w-5 rounded-none bg-destructive" aria-hidden />
            この年に開通・延伸
          </li>
          <li className="flex items-center gap-1.5">
            <span className="inline-block w-5 border-t-2 border-dashed border-foreground" aria-hidden />
            この年に廃止・短縮
          </li>
        </ul>
      </SectionCard>

      <SectionCard title="延長と種別の内訳" icon={<Ruler />} headingAs="h2" bodyClassName="space-y-3">
        <div>
          <p className="text-muted-foreground">{year}年の延長</p>
          <p className={STAT_VALUE_CLASS}>{formatKm(total)}</p>
          <p className="tabular-nums text-muted-foreground">
            前年から {index > 0 ? formatDiff(total - previous) : '—'}
          </p>
        </div>
        <svg viewBox="0 0 300 64" className="h-16 w-full" aria-hidden>
          <polyline
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth={2}
            points={series.total
              .map((value, i) => `${(i / Math.max(years.length - 1, 1)) * 296 + 2},${62 - (value / maxTotal) * 58}`)
              .join(' ')}
          />
          <circle
            cx={(index / Math.max(years.length - 1, 1)) * 296 + 2}
            cy={62 - (total / maxTotal) * 58}
            r={4}
            fill="var(--color-destructive)"
          />
        </svg>
        <ul className="space-y-1.5">
          {categories.map((category) => {
            const value = series.byCategory[category.code]?.[index] ?? 0;
            return (
              <li key={category.code} className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="inline-block h-1 w-4 shrink-0 rounded-none" style={{ background: category.color }} aria-hidden />
                  <span className="truncate">{category.label}</span>
                </span>
                <span className="tabular-nums text-muted-foreground">{formatKm(value)}</span>
              </li>
            );
          })}
        </ul>
      </SectionCard>

      {rankedRows.length > 0 && (
        <SectionCard
          title={`${rowsLabel}の延長（${year}年）`}
          icon={<ListOrdered />}
          headingAs="h2"
          className="@lg:col-span-3"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14 text-right!">順位</TableHead>
                <TableHead>{rowsColumnLabel}</TableHead>
                <TableHead className="text-right!">延長</TableHead>
                <TableHead className="text-right!">前年から</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rankedRows.map((row, i) => (
                <TableRow key={row.code}>
                  <TableCell className="text-right tabular-nums text-muted-foreground">{i + 1}</TableCell>
                  <TableCell>
                    <Link href={row.href} className="hover:underline">
                      {row.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatKm(row.value)}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {index > 0 ? formatDiff(row.value - (row.total[index - 1] ?? 0)) : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SectionCard>
      )}
    </PanelGrid>
  );
}
