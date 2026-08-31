import Link from 'next/link';

import { BUSINESS_PLAN_GEO_CONTENT_LIFECYCLE } from '@stats47/data-configs/business-plan';

import { SectionHeader } from '@/components/section';
import { SurfaceCard, SurfaceSection } from '@/components/surface';

import { formatGeoValue, isGeoCrossAnalysisSlug } from '../lib/geo-cross-analysis';
import { loadGeoAnalysisManifest } from '../lib/load-geo-analysis-evidence';
import { loadGeoAnalysisSnapshot } from '../lib/load-geo-analysis-snapshot';

interface Props {
  areaCode: string;
  areaName: string;
}

export async function AreaGeoInsightsSection({ areaCode, areaName }: Props) {
  const prefCode2 = areaCode.slice(0, 2);
  const candidates = BUSINESS_PLAN_GEO_CONTENT_LIFECYCLE.filter((item) =>
    isGeoCrossAnalysisSlug(item.analysisSlug)
  );
  const resolved = await Promise.all(
    candidates.map(async (item) => {
      if (!isGeoCrossAnalysisSlug(item.analysisSlug)) return null;
      const [snapshot, manifest] = await Promise.all([
        loadGeoAnalysisSnapshot(item.analysisSlug),
        loadGeoAnalysisManifest(item.analysisSlug),
      ]);
      const row = snapshot?.rows.find((candidate) => candidate.areaCode === areaCode);
      const metric = snapshot?.metrics.find(
        (candidate) => candidate.key === snapshot.primaryMetricKey
      );
      if (!snapshot || !manifest || !row || !metric) return null;
      return { item, snapshot, manifest, row, metric };
    })
  );
  const items = resolved.filter((item) => item !== null);
  if (items.length === 0) return null;

  return (
    <SurfaceSection>
      <SectionHeader
        title={`${areaName}の空間分析`}
        description="人口・住まい・防災・交通を、都道府県平均だけでなく公式GISレイヤーの重なりから確認します。"
        hideRule
      />
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {items.map(({ item, row, metric, manifest }) => (
          <SurfaceCard key={item.contentId}>
            <p className="text-xs text-muted-foreground">
              保存則 {manifest.quality.conservationChecks}/47
            </p>
            <h3 className="mt-1 font-bold">{item.title}</h3>
            <p className="mt-3 text-lg font-bold tabular-nums">
              {formatGeoValue(metric, row.values[metric.key])}
            </p>
            <p className="text-xs text-muted-foreground">全国{row.rank}位</p>
            <div className="mt-4 space-y-1 text-sm">
              <Link
                className="block font-medium text-primary underline"
                href={`${item.free.canonicalPath}?pref=${prefCode2}#article-data`}
              >
                地図と結論を見る
              </Link>
              <Link
                className="block text-primary underline"
                href={`/geo/data/${item.analysisSlug}/${prefCode2}`}
              >
                県別の制作データを見る
              </Link>
            </div>
          </SurfaceCard>
        ))}
      </div>
    </SurfaceSection>
  );
}
