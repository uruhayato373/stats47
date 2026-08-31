import Link from 'next/link';

import { BUSINESS_PLAN_GEO_CONTENT_LIFECYCLE } from '@stats47/data-configs/business-plan';

import { SectionHeader } from '@/components/section';
import { SurfaceCard, SurfaceSection } from '@/components/surface';

import {
  formatGeoValue,
  isGeoCrossAnalysisSlug,
  loadGeoAnalysisSnapshot,
} from '@/features/geo-analysis';

interface Props {
  themeKey: string;
  areaCode?: string;
  areaName?: string;
}

export async function ThemeGeoInsightsSection({
  themeKey,
  areaCode,
  areaName,
}: Props) {
  const content = BUSINESS_PLAN_GEO_CONTENT_LIFECYCLE.filter((item) =>
    item.themeKeys.includes(themeKey)
  );
  if (content.length === 0) return null;

  const cards = await Promise.all(
    content.map(async (item) => {
      if (!isGeoCrossAnalysisSlug(item.analysisSlug)) {
        return { item, snapshot: null, row: null, metric: null };
      }
      const snapshot = await loadGeoAnalysisSnapshot(item.analysisSlug);
      const metric = snapshot?.metrics.find(
        (candidate) => candidate.key === snapshot.primaryMetricKey
      );
      const row = areaCode
        ? snapshot?.rows.find((candidate) => candidate.areaCode === areaCode) ?? null
        : snapshot?.rows[0] ?? null;
      return { item, snapshot, row, metric: metric ?? null };
    })
  );

  return (
    <SurfaceSection className="mt-8">
      <SectionHeader
        title={areaName ? `${areaName}を空間分析で読む` : '関連する空間分析'}
        description="テーマ指標の概況に加え、公式GISレイヤーを重ねた分析を確認できます。計算・途中データ・限界は各Geoページへ集約しています。"
        hideRule
      />
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ item, snapshot, row, metric }) => {
          const prefCode2 = areaCode?.slice(0, 2);
          const href = prefCode2
            ? `${item.free.canonicalPath}?pref=${prefCode2}#article-data`
            : item.free.canonicalPath;
          return (
            <SurfaceCard key={item.contentId}>
              <p className="text-xs font-medium text-muted-foreground">
                {snapshot ? '検算済み空間分析' : 'Geo分析の入口'}
              </p>
              <h3 className="mt-1 font-bold leading-snug">{item.title}</h3>
              {snapshot && row && metric ? (
                <p className="mt-3 text-sm">
                  {areaName ?? row.areaName}:{' '}
                  <strong>{formatGeoValue(metric, row.values[metric.key])}</strong>
                  {!areaName ? `（全国${row.rank}位）` : ''}
                </p>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  将来人口を後続のGIS掛け合わせ分析の基準として確認します。
                </p>
              )}
              <Link className="mt-4 inline-block text-sm font-medium text-primary underline" href={href}>
                地図・方法・制作データを見る
              </Link>
            </SurfaceCard>
          );
        })}
      </div>
    </SurfaceSection>
  );
}
