'use client';

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@stats47/components/atoms/ui/table';
import {
  EARTHQUAKE_EXPOSURE_SOURCE,
  selectEarthquakePopulationRow,
  type EarthquakePopulationSnapshot,
} from '@stats47/data-configs/theme-catalog';

import { ChartFooter } from '@/components/charts/ChartFooter';
import { ChartPanel } from '@/components/charts/ChartPanel';

import { useThemePrefecture } from '@/features/theme-dashboard';

const source = EARTHQUAKE_EXPOSURE_SOURCE;
const formatPeople = (n: number) =>
  n.toLocaleString('ja-JP', { maximumFractionDigits: 1 });
const formatPercent = (n: number, total: number) =>
  ((n / total) * 100).toLocaleString('ja-JP', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export function ThemeEarthquakeExposureClient({
  snapshot,
}: {
  snapshot: EarthquakePopulationSnapshot;
}) {
  const { selectedPrefectureCode } = useThemePrefecture();
  const row = selectEarthquakePopulationRow(snapshot, selectedPrefectureCode);
  if (!row) return <p role="status">選択した地域の集計を取得できません。</p>;
  const area = selectedPrefectureCode
    ? row.areaName
    : '全国（47都道府県の合計）';
  const evidenceRoot = `${source.publicBaseUrl}/${source.r2Root}`;
  const rows = [
    ...row.bands.map((b) => ({
      ...b,
      label: source.bands.find((def) => def.key === b.key)!.label,
    })),
    { key: 'unmatched', ...row.unmatched, label: '地震動データなし' },
  ];
  return (
    <div
      id="earthquake-population"
      data-theme-component-key={source.sectionKey}
      data-data-state="ready"
      data-area-code={row.areaCode}
    >
      <ChartPanel
        title="地震動の震度帯別にみる地域人口"
        description={`${area} · 地震動は2024年基準、人口は2020年・2050年推計`}
        contentClassName="min-w-0 space-y-4"
        footer={
          <ChartFooter
            sourceLinks={[
              {
                label: '防災科学技術研究所 J-SHIS 2024年版',
                url: source.hazard.pageUrl,
              },
              {
                label: '国土数値情報 250mメッシュ別将来推計人口',
                url: source.population.pageUrl,
              },
            ]}
          />
        }
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          各地点で30年間に3%の確率で超える地震動の水準ごとに、地域人口を集計しています。
        </p>
        <Table aria-label={`${area}の震度帯別人口`}>
          <TableCaption>
            各年の総人口を分母にした割合です。人口は小数第1位まで表示し、丸めにより合計が一致しない場合があります。
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">震度帯</TableHead>
              <TableHead scope="col" className="text-right">
                2020年人口
                <br />
                （人・割合）
              </TableHead>
              <TableHead scope="col" className="text-right">
                2050年推計人口
                <br />
                （人・割合）
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((b) => (
              <TableRow key={b.key} data-band={b.key}>
                <TableHead scope="row">{b.label}</TableHead>
                <TableCell
                  className="text-right tabular-nums"
                  data-population2020={b.population2020}
                >
                  {formatPeople(b.population2020)}
                  <span className="block text-xs text-muted-foreground">
                    {formatPercent(b.population2020, row.total.population2020)}%
                  </span>
                </TableCell>
                <TableCell
                  className="text-right tabular-nums"
                  data-population2050={b.population2050}
                >
                  {formatPeople(b.population2050)}
                  <span className="block text-xs text-muted-foreground">
                    {formatPercent(b.population2050, row.total.population2050)}%
                  </span>
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableHead scope="row">総人口</TableHead>
              <TableCell className="text-right tabular-nums">
                {formatPeople(row.total.population2020)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatPeople(row.total.population2050)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <p className="text-xs leading-relaxed text-muted-foreground">
          同じ2024年基準の地震動に人口を重ねた比較です。特定の地震の被害人数や2050年の地震を予測した値ではありません。住宅棟数・建築時期の分布は含みません。
        </p>
        <details className="text-xs leading-relaxed text-muted-foreground">
          <summary className="cursor-pointer py-2 font-medium text-foreground">
            集計方法と再現情報
          </summary>
          <div className="space-y-2 pt-2">
            <p>
              250mメッシュの格子番号で地震動と人口を対応させ、県別に合算しています。「地震動データなし」は安全と判定した人口ではありません。
            </p>
            <p>
              原典の配布条件に沿い、公開する途中集計は県別の震度帯人口です。
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              <a
                className="underline underline-offset-2"
                href={`${evidenceRoot}/manifest.json`}
                target="_blank"
                rel="noopener noreferrer"
              >
                出典・版・再現手順（JSON）
              </a>
              <a
                className="underline underline-offset-2"
                href={`${evidenceRoot}/verification.json`}
                target="_blank"
                rel="noopener noreferrer"
              >
                検算記録（JSON）
              </a>
              {selectedPrefectureCode && (
                <a
                  className="underline underline-offset-2"
                  href={`${evidenceRoot}/pref/${selectedPrefectureCode.slice(0, 2)}.json`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {row.areaName}の途中集計（JSON）
                </a>
              )}
            </div>
          </div>
        </details>
      </ChartPanel>
    </div>
  );
}
