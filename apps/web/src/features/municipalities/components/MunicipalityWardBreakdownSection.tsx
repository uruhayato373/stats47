import { to2DigitPrefCode } from '@stats47/area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@stats47/components/atoms/ui/table';
import { formatUnitForDisplay } from '@stats47/data-configs/unit';
import { fetchMunicipalityTopologyForWardMode } from '@stats47/gis/server';
import { municipalityLeafName } from '@stats47/ranking';
import { formatValueWithPrecision, resolveValuePrecision } from '@stats47/utils';

import { SectionHeader } from '@/components/section';

import { MunicipalityCityMapClient } from './MunicipalityCityMapClient';

import type { CityDatabookWardBreakdown } from '@stats47/ranking/types';
import type { MetricPresentation, TopoJSONTopology } from '@stats47/types';

interface Props {
  breakdown: CityDatabookWardBreakdown;
  /** 5 桁の都道府県コード */
  prefectureCode: string;
  /** 「横浜市」の形 */
  cityShortName: string;
  /** 地図の色の方式 (人口の指標と同じ連続色) */
  visualization: MetricPresentation;
}

/** 地図で塗る指標 (内訳の先頭。データブックの見出しの並びで人口が先頭) */
function mapMetricKey(breakdown: CityDatabookWardBreakdown): string | undefined {
  return Object.keys(breakdown.metrics)[0];
}

/**
 * 政令指定都市を行政区に分けた内訳 (WardMode `split`。MUNI-DESIGNATED-CITY-WARDS-01)。
 * 行政区は基礎自治体ではないので、市区町村ランキングの順位には入れず、市の中の順位だけを出す。
 * 地図は R2 の分割版から、この市の行政区だけを描く。取得に失敗したら表だけを出す。
 */
export async function MunicipalityWardBreakdownSection({
  breakdown,
  prefectureCode,
  cityShortName,
  visualization,
}: Props) {
  const metricKeys = Object.keys(breakdown.metrics);
  const wardCodes = new Set(breakdown.wards.map((ward) => ward.areaCode));
  const topology = await fetchMunicipalityTopologyForWardMode(to2DigitPrefCode(prefectureCode), 'split')
    .then((split): TopoJSONTopology => ({
      ...split,
      objects: Object.fromEntries(
        Object.entries(split.objects).map(([name, collection]) => [
          name,
          {
            ...collection,
            geometries: collection.geometries.filter((geometry) =>
              wardCodes.has(String(geometry.properties?.N03_007 ?? ''))
            ),
          },
        ])
      ),
    }))
    .catch(() => null);

  const mapKey = mapMetricKey(breakdown);
  const mapMetric = mapKey ? breakdown.metrics[mapKey] : undefined;
  const nameOf = new Map(breakdown.wards.map((ward) => [ward.areaCode, municipalityLeafName(ward.areaName)]));
  const precisionOf = Object.fromEntries(
    metricKeys.map((key) => [key, resolveValuePrecision(breakdown.metrics[key]!.values.map((row) => row.value))])
  );
  const cellOf = (key: string, areaCode: string) =>
    breakdown.metrics[key]!.values.find((row) => row.areaCode === areaCode);

  return (
    <section aria-labelledby="city-wards" className="space-y-3">
      <SectionHeader
        title={<span id="city-wards">{cityShortName}の行政区の内訳</span>}
        action={`${breakdown.wards.length}区`}
        hideRule
        className="mb-0"
      />
      {topology && mapMetric && (
        <div className="border border-border p-2">
          <p className="mb-1 text-xs text-muted-foreground">
            {mapMetric.label}（{mapMetric.yearName}）
          </p>
          <MunicipalityCityMapClient
            topology={topology}
            points={mapMetric.values.map((row) => ({
              areaCode: row.areaCode,
              areaName: nameOf.get(row.areaCode) ?? row.areaCode,
              value: row.value,
              rank: row.cityRank,
            }))}
            unit={formatUnitForDisplay(mapMetric.unit)}
            visualization={visualization}
            hrefByCode={{}}
          />
        </div>
      )}
      <div className="overflow-x-auto border border-border">
        <Table>
          <TableHeader className="bg-muted/40 text-left text-xs text-muted-foreground">
            <TableRow>
              <TableHead>行政区</TableHead>
              {metricKeys.map((key) => (
                <TableHead key={key} className="text-right">
                  {breakdown.metrics[key]!.label}
                  <span className="block font-normal">{breakdown.metrics[key]!.yearName}</span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {breakdown.wards.map((ward) => (
              <TableRow key={ward.areaCode}>
                <TableCell className="font-medium">{nameOf.get(ward.areaCode)}</TableCell>
                {metricKeys.map((key) => {
                  const cell = cellOf(key, ward.areaCode);
                  const metric = breakdown.metrics[key]!;
                  return (
                    <TableCell key={key} className="text-right tabular-nums">
                      {cell ? (
                        <>
                          {formatValueWithPrecision(cell.value, precisionOf[key] ?? 0)} {formatUnitForDisplay(metric.unit)}
                          <span className="block text-xs text-muted-foreground">市内{cell.cityRank}位</span>
                        </>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">
        行政区は基礎自治体ではないため、市区町村ランキングの順位には含めず、市の中の順位だけを示しています。値は e-Stat の社会・人口統計体系の行政区の値で、年は{cityShortName}全体の値と同じです。
      </p>
    </section>
  );
}
