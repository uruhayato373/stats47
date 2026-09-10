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
import { SHELTER_APPLICABILITY_SOURCE as source } from '@stats47/data-configs/theme-catalog';

import { ChartFooter } from '@/components/charts/ChartFooter';
import { ChartPanel } from '@/components/charts/ChartPanel';

import { useThemePrefecture } from '@/features/theme-dashboard';

import {
  selectShelterApplicability,
  type ShelterApplicabilitySnapshot,
} from '../lib/shelter-applicability-snapshot';

const format = (n: number) => n.toLocaleString('ja-JP');
export function ThemeShelterApplicabilityClient({
  snapshot,
}: {
  snapshot: ShelterApplicabilitySnapshot;
}) {
  const { selectedPrefectureCode } = useThemePrefecture();
  const row = selectShelterApplicability(snapshot, selectedPrefectureCode);
  return (
    <div
      className="min-w-0"
      data-theme-component-key="shelter-applicability"
      data-data-state={row ? 'ready' : 'unavailable'}
      data-area-code={selectedPrefectureCode ?? '00000'}
    >
      <ChartPanel
        title="災害の種類と指定緊急避難場所"
        description={`${row?.areaName ?? '地域未確認'} · 2026年9月11日取得 · 掲載件数（共通ID）`}
        contentClassName="min-w-0 space-y-4"
        footer={<ChartFooter source={source.title} sourceLink={source.url} />}
      >
        {!row ? (
          <p role="status" className="text-sm text-muted-foreground">
            選択した地域を確認できません。
          </p>
        ) : (
          <>
            <p className="text-sm leading-relaxed">
              指定緊急避難場所は、災害の危険から緊急的に避難する場所です。
              公開データの{format(row.emergency.facilities)}
              件について、災害種別ごとの指定を示します。
              この地域の最新DB更新日は{row.latestDatabaseUpdate}
              です。指定日・開設日ではありません。
            </p>
            <Table
              aria-label={`${row.areaName}の指定緊急避難場所と災害種別`}
              className="min-w-96"
              containerClassName="min-w-0 max-w-full max-h-96"
            >
              <TableCaption>
                各行の母数は指定緊急避難場所の掲載
                {format(row.emergency.facilities)}件です。
                複数の災害に該当する場所があるため、災害種別の件数は合算しません。
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">災害の種類</TableHead>
                  {['該当', '非該当', '不明'].map((label) => (
                    <TableHead key={label} scope="col" className="text-right">
                      {label}（件）
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {row.emergency.hazards.map((h, i) => (
                  <TableRow key={h.key} data-hazard-key={h.key}>
                    <TableHead scope="row" className="whitespace-normal">
                      {source.hazards[i]!.label}
                    </TableHead>
                    <TableCell
                      className="text-right tabular-nums"
                      data-applicable={h.applicable}
                    >
                      {format(h.applicable)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {format(h.notApplicable)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {format(h.unknown)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="text-xs leading-relaxed text-muted-foreground">
              原典の「1」を該当、空欄を非該当として集計しています。本取得分に不明の記号はありません。
              非該当は、安全・危険の判定を意味しません。
            </p>
            <Table
              aria-label={`${row.areaName}の指定避難所の掲載件数`}
              className="min-w-96"
              containerClassName="min-w-0 max-w-full"
            >
              <TableCaption>
                指定避難所は被災者等が一定期間滞在する施設です。指定緊急避難場所とは別に集計します。
                災害種別の集計は対象外（この原典には属性がありません）。
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">指定避難所の区分</TableHead>
                  <TableHead scope="col" className="text-right">
                    掲載件数（件）
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  ['一般避難所', row.shelter.general],
                  ['福祉避難所', row.shelter.welfare],
                  ['指定避難所の合計', row.shelter.facilities],
                ].map(([label, n]) => (
                  <TableRow key={label}>
                    <TableHead scope="row">{label}</TableHead>
                    <TableCell className="text-right tabular-nums">
                      {format(Number(n))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="text-xs leading-relaxed text-muted-foreground">
              この地域の公開一覧は{format(row.coverage.catalogMunicipalities)}
              自治体等です。 両方を公開：{format(row.coverage.bothPublished)}
              、緊急避難場所のみ：{format(row.coverage.emergencyOnlyPublished)}
              、 避難所のみ：{format(row.coverage.shelterOnlyPublished)}
              、未登録：{format(row.coverage.notPublished)}。
              未掲載施設を0件とは扱わず、掲載件数を全指定施設の総数とも扱いません。
            </p>
          </>
        )}
        <p className="text-sm leading-relaxed">
          原典は随時更新されます。最新でない情報や未掲載の施設があります。実際の利用時は、災害種別と自治体の最新の指定状況・開設情報を確認してください。
          <a
            href={source.confirmationUrl}
            className="underline underline-offset-4"
            target="_blank"
            rel="noopener noreferrer"
          >
            国土地理院の指定避難場所・避難所の案内
          </a>
          {' / '}
          <a
            href={source.url}
            className="underline underline-offset-4"
            target="_blank"
            rel="noopener noreferrer"
          >
            自治体別の公表・更新状況
          </a>
        </p>
        <details className="text-xs leading-relaxed text-muted-foreground">
          <summary className="cursor-pointer">集計対象と出典の注意事項</summary>
          <ul className="mt-2 space-y-1">
            {source.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
          <a
            href={source.notesUrl}
            className="underline underline-offset-4"
            target="_blank"
            rel="noopener noreferrer"
          >
            原典の利用上の注意
          </a>
          {' / '}
          <a
            href={source.licenseUrl}
            className="underline underline-offset-4"
            target="_blank"
            rel="noopener noreferrer"
          >
            国土地理院コンテンツ利用規約
          </a>
        </details>
      </ChartPanel>
    </div>
  );
}
