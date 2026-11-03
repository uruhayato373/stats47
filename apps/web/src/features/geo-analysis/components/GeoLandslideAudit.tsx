
import { ValueTable } from '@/components/surface';

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
        <ValueTable
          scrollRegion
          ariaLabel="土砂災害曝露の合計の検算"
          columns={[
            { key: 'label', header: '対象', rowHeader: true },
            { key: 'outside', header: '入力面外' },
            { key: 'warningOnly', header: '警戒のみ' },
            { key: 'special', header: '特別警戒' },
            { key: 'total', header: '元の分母' },
          ]}
          rows={groups.map(([label, g, scale]) => ({
            key: label,
            cells: [label, ...g.exclusiveScaled.map((v) => n(v, scale)), n(g.totalScaled, scale)],
          }))}
        />
      </div>
      <div className="min-w-0 overflow-x-auto">
        <ValueTable
          scrollRegion
          ariaLabel="現象別人口、重複あり"
          columns={[
            { key: 'name', header: '現象', rowHeader: true },
            { key: 'warning', header: '警戒面人口' },
            { key: 'special', header: '特別警戒面人口' },
            { key: 'union', header: '和集合人口' },
          ]}
          rows={['急傾斜地の崩壊', '土石流', '地すべり'].map((name, i) => ({
            key: name,
            cells: [
              name,
              n(s.warningPhenomenonScaled[i]!, 10000),
              n(s.specialPhenomenonScaled[i]!, 10000),
              n(s.phenomenonScaled[i]!, 10000),
            ],
          }))}
        />
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
