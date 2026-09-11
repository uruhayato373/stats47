import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@stats47/components/atoms/ui/table';

import type { GeoLandslidePrefDetail, GeoLandslideCounts } from '@stats47/gis';
const n = (v: number, scale = 1) =>
  (v / scale).toLocaleString('ja-JP', { maximumFractionDigits: 4 });
export function GeoLandslideAudit({
  detail,
}: {
  detail: GeoLandslidePrefDetail;
}) {
  if (detail.status !== 'available')
    return <p role="status">{detail.reason} 欠測は0として扱いません。</p>;
  const s = detail.summary,
    groups: [string, GeoLandslideCounts, number][] = [
      ['人口（人）', s, 10000],
      ['市町村役場等（施設）', s.facilities.administrative, 1],
      ['公的集会施設（施設）', s.facilities.meeting, 1],
    ];
  return (
    <div className="space-y-4">
      <p className="text-sm">
        各行は「入力面外＋警戒のみ＋特別」の排他的な3区分で、同じ分母へ戻ります。特別警戒面を優先表示しますが、警戒面への包含は仮定しません。
      </p>
      <div className="min-w-0 overflow-x-auto">
        <Table aria-label="土砂災害曝露の保存則">
          <TableHeader>
            <TableRow>
              <TableHead>対象</TableHead>
              <TableHead>入力面外</TableHead>
              <TableHead>警戒のみ</TableHead>
              <TableHead>特別警戒</TableHead>
              <TableHead>元の分母</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map(([label, g, scale]) => (
              <TableRow key={label}>
                <TableHead scope="row">{label}</TableHead>
                {g.exclusiveScaled.map((v, i) => (
                  <TableCell key={i} className="text-right tabular-nums">
                    {n(v, scale)}
                  </TableCell>
                ))}
                <TableCell className="text-right tabular-nums">
                  {n(g.totalScaled, scale)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="min-w-0 overflow-x-auto">
        <Table aria-label="現象別人口、重複あり">
          <TableHeader>
            <TableRow>
              <TableHead>現象</TableHead>
              <TableHead>警戒面人口</TableHead>
              <TableHead>特別警戒面人口</TableHead>
              <TableHead>和集合人口</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {['急傾斜地の崩壊', '土石流', '地すべり'].map((name, i) => (
              <TableRow key={name}>
                <TableHead scope="row">{name}</TableHead>
                <TableCell>{n(s.warningPhenomenonScaled[i]!, 10000)}</TableCell>
                <TableCell>{n(s.specialPhenomenonScaled[i]!, 10000)}</TableCell>
                <TableCell>{n(s.phenomenonScaled[i]!, 10000)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">
        現象間には重複があります。合算しないでください。特別警戒面内・警戒面外のメッシュ人口：
        {n(s.redOutsideWarningScaled, 10000)}人。
      </p>
      <p className="text-sm">
        格子全体が単一区域群内の人口 {n(s.lowerScaled, 10000)}
        人／いずれかの入力面と交差する格子人口 {n(s.upperScaled, 10000)}
        人。これは位置不明による感度であり信頼区間ではありません。境界と交差し、全体包含を確認できない格子人口は{' '}
        {n(s.boundaryScaled, 10000)}人です。
      </p>
      <p className="text-xs text-muted-foreground">
        原典メッシュ {n(s.rawRecords)}行＝正人口 {n(s.records)}行＋人口0{' '}
        {n(s.zeroRecords)}行。自県以外の入力面にも包含された人口メッシュ{' '}
        {n(s.crossSourcePrefectureRecords)}行。原典SHICODEを保持しています。
      </p>
    </div>
  );
}
