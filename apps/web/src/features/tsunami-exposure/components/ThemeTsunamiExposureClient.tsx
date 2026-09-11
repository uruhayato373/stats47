'use client';
import { Button } from '@stats47/components/atoms/ui/button';
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
  TSUNAMI_EXPOSURE_SOURCE as source,
  selectTsunamiCounty,
  tsunamiCoverage,
  tsunamiPopulation,
  tsunamiBands,
  type TsunamiSnapshot,
} from '@stats47/data-configs/theme-catalog';

import { ChartFooter } from '@/components/charts/ChartFooter';
import { ChartPanel } from '@/components/charts/ChartPanel';

import { useThemePrefecture } from '@/features/theme-dashboard';
const people = (n: number) =>
  tsunamiPopulation(n).toLocaleString('ja-JP', { maximumFractionDigits: 1 });
export function ThemeTsunamiExposureClient({
  snapshot,
}: {
  snapshot: TsunamiSnapshot;
}) {
  const { selectedPrefectureCode, setSelected } = useThemePrefecture();
  const row = selectTsunamiCounty(snapshot, selectedPrefectureCode),
    coverage = tsunamiCoverage(selectedPrefectureCode);
  const scenario = source.scenarios.find((s) => s.areaCode === row?.areaCode);
  const evidence = `${source.publicBaseUrl}/${source.r2Root}`;
  return (
    <div
      id={source.sectionKey}
      data-theme-component-key={source.sectionKey}
      data-data-state={row ? 'ready' : 'coverage'}
      data-area-code={selectedPrefectureCode ?? 'all'}
    >
      <ChartPanel
        title="津波の浸水深別にみる人口・公共施設"
        description={
          scenario
            ? `${row?.areaName} · ${scenario.label}`
            : '確認済みの想定条件を選んで確認できます'
        }
        contentClassName="min-w-0 space-y-4"
        footer={
          <ChartFooter
            sourceLinks={
              scenario
                ? [
                    { label: scenario.label, url: scenario.pageUrl },
                    { label: '想定の計算条件', url: scenario.methodUrl },
                    {
                      label: '国土数値情報・250mメッシュ別将来推計人口',
                      url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-mesh250r6.html',
                    },
                    {
                      label: '国土数値情報・市町村役場等及び公的集会施設',
                      url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-P05.html',
                    },
                  ]
                : [
                    {
                      label: '国土数値情報・津波浸水想定2024年版の提供範囲',
                      url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40-2024.html',
                    },
                  ]
            }
          />
        }
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          現在は{source.scenarios.length}
          都道府県の固定版の想定を集計しています。想定の年・波源・堤防条件が異なるため、全国合計や県別の安全順位は示していません。
        </p>
        {!row && (
          <>
            <p className="text-sm leading-relaxed" role="status">
              {coverage
                ? `${coverage.areaName}：${coverage.reason}`
                : '県を選ぶと、浸水深ごとの人口と施設数を確認できます。'}
            </p>
            <div className="flex flex-wrap gap-2">
              {source.scenarios.map((s) => (
                <Button
                  key={s.key}
                  variant="outline"
                  onClick={() => setSelected(s.areaCode)}
                >
                  {
                    source.coverage.find((a) => a.areaCode === s.areaCode)
                      ?.areaName
                  }
                  を確認
                </Button>
              ))}
            </div>
          </>
        )}
        {row && scenario && (
          <>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {scenario.model}。{scenario.modelCoverage}
              {scenario.historical
                ? 'このKSJ固定版は歴史的な想定を含み、現在の最新想定とは限りません。'
                : ''}
            </p>
            <Table aria-label={`${row.areaName}の津波浸水深別人口と公共施設`}>
              <TableCaption>
                人口は250mメッシュ中心で判定した近似です。施設は2022年4月の所在地を使用しています。人口は小数第1位に丸めています。
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">浸水深</TableHead>
                  <TableHead scope="col" className="text-right">
                    2020年人口
                    <br />
                    （人）
                  </TableHead>
                  <TableHead scope="col" className="text-right">
                    2050年推計人口
                    <br />
                    （人）
                  </TableHead>
                  <TableHead scope="col" className="text-right">
                    市町村役場等
                    <br />
                    （施設）
                  </TableHead>
                  <TableHead scope="col" className="text-right">
                    公的集会施設
                    <br />
                    （施設）
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  ...row.bands.map((b, i) => ({
                    ...b,
                    label: tsunamiBands(row.areaCode)[i].label,
                  })),
                  { key: 'total', ...row.total, label: '県全体の原典総数' },
                ].map((b) => (
                  <TableRow key={b.key} data-band={b.key}>
                    <TableHead scope="row">{b.label}</TableHead>
                    <TableCell className="text-right tabular-nums">
                      {people(b.population2020Units)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {people(b.population2050Units)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {b.administrativeFacilities.toLocaleString('ja-JP')}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {b.publicMeetingFacilities.toLocaleString('ja-JP')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="text-xs leading-relaxed text-muted-foreground">
              浸水ポリゴン非該当でも浸水が起こる可能性があります。東京都の非該当・未対象区分は浸水区域外の確定値ではありません。人口は被害人数の予測ではなく、施設は津波避難施設や避難容量ではありません。2050年の施設の存続や将来の津波を予測した値でもありません。
            </p>
          </>
        )}
        <details className="text-xs leading-relaxed text-muted-foreground">
          <summary className="cursor-pointer py-2 font-medium text-foreground">
            集計条件と再現情報
          </summary>
          <div className="space-y-2 pt-2">
            {scenario && <p>{scenario.conditions}</p>}
            <p>
              この集計は、国土数値情報・各都道府県の津波浸水想定をstats47が加工し、地点判定と集計を実施したものです。
            </p>
            {source.notes.map((note) => (
              <p key={note}>{note}</p>
            ))}
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              <a
                className="underline underline-offset-2"
                href={`${evidence}/manifest.json`}
                target="_blank"
                rel="noopener noreferrer"
              >
                入力・版・再現手順（JSON）
              </a>
              <a
                className="underline underline-offset-2"
                href={`${evidence}/verification.json`}
                target="_blank"
                rel="noopener noreferrer"
              >
                保存則の検算（JSON）
              </a>
              {row && (
                <a
                  className="underline underline-offset-2"
                  href={`${evidence}/pref/${row.areaCode.slice(0, 2)}.json`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {row.areaName}の地点別判定と途中集計（JSON）
                </a>
              )}
            </div>
          </div>
        </details>
      </ChartPanel>
    </div>
  );
}
