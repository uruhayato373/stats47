import {
  BUSINESS_PLAN_GEO_CONTENT_LIFECYCLE,
  BUSINESS_PLAN_M1_GEO_ANALYSES,
} from '@stats47/data-configs/business-plan';

import Link from '@/components/atoms/SiteLink';
import { LinkRowFrame, linkRowItemClass } from '@/components/navigation/StatisticsScopeNav';

import { isGeoCrossAnalysisSlug, GEO_CROSS_ANALYSIS_CONFIGS } from '@/features/geo-analysis/embedded';

import { navSurfaceProps } from '@/lib/analytics/events';

interface Props {
  themeKey: string;
  areaCode?: string;
  areaName?: string;
}

const GEO_ANALYSIS_SLUGS = new Set<string>(
  BUSINESS_PLAN_M1_GEO_ANALYSES.map((analysis) => analysis.slug)
);

/**
 * テーマに関係する空間分析への入口。分析の名前のリンクを 1 行に並べる (2026-11-14 オーナー決定)。
 * 旧: 分析ごとのカード (名前・その県の値・リンク) を並べていた。約 650px を使い、押されたのはテーマ全体で
 * 28 日に 2 回前後だった (2026-W45 の nav-click-surfaces)。値は分析のページが見せるので、ここでは読まない。
 */
export function ThemeGeoInsightsSection({ themeKey, areaCode, areaName }: Props) {
  const content = BUSINESS_PLAN_GEO_CONTENT_LIFECYCLE.filter(
    (item) =>
      GEO_ANALYSIS_SLUGS.has(item.analysisSlug) &&
      item.themeKeys.includes(themeKey)
  );
  if (content.length === 0) return null;

  const label = areaName ? `${areaName}の空間分析` : '関連する空間分析';
  const prefCode2 = areaCode?.slice(0, 2);
  return (
    <div className="mt-8 flex flex-col gap-1" {...navSurfaceProps('geo_analysis_list')}>
      <p className="text-sm font-medium text-foreground">{label}</p>
      <LinkRowFrame label={label} wrap>
        {content.map((item) => (
          <Link
            key={item.contentId}
            className={linkRowItemClass()}
            href={prefCode2 ? `${item.free.canonicalPath}/${prefCode2}/overlap` : item.free.canonicalPath}
          >
            {isGeoCrossAnalysisSlug(item.analysisSlug)
              ? GEO_CROSS_ANALYSIS_CONFIGS[item.analysisSlug].shortTitle
              : item.title}
          </Link>
        ))}
      </LinkRowFrame>
    </div>
  );
}
