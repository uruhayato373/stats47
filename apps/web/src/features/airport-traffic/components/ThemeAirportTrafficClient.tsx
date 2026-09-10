'use client';

import { lookupArea } from '@stats47/area';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@stats47/components/atoms/ui/table';
import { AIRPORT_TRAFFIC_SOURCE } from '@stats47/data-configs/theme-catalog';

import { ChartFooter } from '@/components/charts/ChartFooter';
import { ChartPanel } from '@/components/charts/ChartPanel';

import { useThemePrefecture } from '@/features/theme-dashboard';

import {
  selectAirports,
  type AirportTrafficSnapshot,
} from '../lib/airport-traffic-snapshot';

const format = (value: number) => value.toLocaleString('ja-JP');
export function ThemeAirportTrafficClient({
  snapshot,
}: {
  snapshot: AirportTrafficSnapshot;
}) {
  const { selectedPrefectureCode, selectedAreaName } = useThemePrefecture();
  const rows = selectAirports(snapshot, selectedPrefectureCode);
  const area = selectedPrefectureCode ? selectedAreaName : '全国';
  const validArea =
    selectedPrefectureCode === null || !!lookupArea(selectedPrefectureCode);
  return (
    <div
      className="min-w-0"
      data-theme-component-key="airport-traffic"
      data-data-state={
        !validArea ? 'unavailable' : rows.length ? 'ready' : 'no-airports'
      }
      data-area-code={selectedPrefectureCode ?? '00000'}
    >
      <ChartPanel
        title="空港別の旅客と貨物"
        description={`2025年（暦年・確定値） · ${area} · ${rows.length}空港 · 旅客：人、貨物：トン`}
        contentClassName="min-w-0 space-y-4"
        footer={
          <ChartFooter
            source={AIRPORT_TRAFFIC_SOURCE.title}
            sourceLink={AIRPORT_TRAFFIC_SOURCE.files[0].url}
          />
        }
      >
        {!validArea ? (
          <p role="status" className="text-sm text-muted-foreground">
            選択した地域を確認できません。
          </p>
        ) : rows.length === 0 ? (
          <p role="status" className="text-sm text-muted-foreground">
            {selectedAreaName}
            には、この原表の対象空港がありません。県民の航空利用がゼロという意味ではありません。
          </p>
        ) : (
          <>
            {!selectedPrefectureCode && (
              <p className="text-sm">
                96空港合計：旅客{format(snapshot.national.passengers.total)}
                人、貨物{format(snapshot.national.cargo.total)}
                トン。ヘリポートを除き、複数県にまたがる空港も1回だけ集計しています。
              </p>
            )}
            <Table
              aria-label={`${area}の空港別旅客取扱い`}
              className="min-w-96"
              containerClassName="min-w-0 max-w-full max-h-96"
            >
              <TableCaption>
                旅客は乗客・降客・国際線通過客の延べ取扱い（人）。国際線の通過客は国際線合計の内数です。
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">空港・所在地</TableHead>
                  {['国内線', '国際線', 'うち通過客', '合計'].map((label) => (
                    <TableHead key={label} scope="col" className="text-right">
                      {label}（人）
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow
                    key={row.airportName}
                    data-airport-name={row.airportName}
                  >
                    <TableHead scope="row" className="whitespace-normal">
                      {row.airportName}
                      <span className="block text-xs font-normal text-muted-foreground">
                        {row.areaCodes
                          .map((code) => lookupArea(code)?.areaName)
                          .join('・')}
                        {row.areaCodes.length > 1 ? '（複数県にまたがる）' : ''}
                      </span>
                    </TableHead>
                    {[
                      row.passengers.domesticTotal,
                      row.passengers.internationalTotal,
                      row.passengers.internationalTransit,
                      row.passengers.total,
                    ].map((n, i) => (
                      <TableCell
                        key={i}
                        className="text-right tabular-nums"
                        data-passenger-value={n}
                      >
                        {format(n)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Table
              aria-label={`${area}の空港別貨物取扱い`}
              className="min-w-96"
              containerClassName="min-w-0 max-w-full max-h-96"
            >
              <TableCaption>
                貨物は積込・取卸の合計（トン）。郵便取扱量は含みません。
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">空港</TableHead>
                  {['国内線', '国際線', '合計'].map((label) => (
                    <TableHead key={label} scope="col" className="text-right">
                      {label}（トン）
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow
                    key={row.airportName}
                    data-cargo-airport-name={row.airportName}
                  >
                    <TableHead scope="row">{row.airportName}</TableHead>
                    {[
                      row.cargo.domesticTotal,
                      row.cargo.internationalTotal,
                      row.cargo.total,
                    ].map((n, i) => (
                      <TableCell
                        key={i}
                        className="text-right tabular-nums"
                        data-cargo-value={n}
                      >
                        {format(n)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
        <ul className="space-y-1 text-xs leading-relaxed text-muted-foreground">
          {snapshot.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </ChartPanel>
    </div>
  );
}
