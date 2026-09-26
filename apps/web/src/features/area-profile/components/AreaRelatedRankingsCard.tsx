import Link from 'next/link';

import { formatUnitForDisplay } from "@stats47/data-configs/unit";
import { ArrowRight, TrendingDown, TrendingUp } from 'lucide-react';

import { RankBadge } from '@/components/atoms/RankBadge';
import { SectionCard } from '@/components/surface';

import { selectDistinctProfileItems } from '../utils';

import type { AreaProfileData } from '../types';

interface AreaRelatedRankingsCardProps {
  profile: AreaProfileData;
  /** strengths / weaknesses 各々で表示する件数 (default: 6) */
  limit?: number;
}

/**
 * area top ページ用「この県のトップ/ボトムランキング」カード
 *
 * 効果:
 * - area top (47 SSG、PR 高い) から ranking 詳細への内部リンク密度↑
 * - 47 × 12 = 564 internal links 追加 (GSC indexation 改善)
 * - ユーザーには「この県の特徴」を一目で示せる SEO 補強コンテンツ
 */
export function AreaRelatedRankingsCard({
  profile,
  limit = 6,
}: AreaRelatedRankingsCardProps) {
  const strengths = selectDistinctProfileItems(profile.strengths, limit);
  const weaknesses = selectDistinctProfileItems(profile.weaknesses, limit);

  if (strengths.length === 0 && weaknesses.length === 0) return null;

  return (
    <section aria-labelledby="area-highlights-title">
      <div className="mb-4">
        <h2
          id="area-highlights-title"
          className="text-xl font-bold text-foreground"
        >
          {profile.areaName}の特徴
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          全国順位が高い指標と低い指標を、代表値から確認できます。
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {/* TOP - 強み */}
        {strengths.length > 0 && (
          <SectionCard
            title={`${profile.areaName}が上位`}
            icon={<TrendingUp className="h-4 w-4 text-positive" />}
            headerAction={
              <Link
                href="/themes"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                テーマ一覧
                <ArrowRight className="h-3 w-3" />
              </Link>
            }
          >
            <ol className="space-y-1.5">
              {strengths.map((item, idx) => (
                <li
                  key={`${item.rankingKey}-${idx}`}
                  className="flex items-baseline gap-2"
                >
                  <RankBadge rank={item.rank} tone="positive" />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/ranking/${item.rankingKey}`}
                      className="line-clamp-1 text-sm font-medium leading-snug text-foreground hover:text-primary hover:underline"
                    >
                      {item.indicator}
                    </Link>
                    <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                      {item.value.toLocaleString('ja-JP')}
                      {formatUnitForDisplay(item.unit)}（{item.year}）
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </SectionCard>
        )}

        {/* BOTTOM - 弱み */}
        {weaknesses.length > 0 && (
          <SectionCard
            title={`${profile.areaName}が下位`}
            icon={<TrendingDown className="h-4 w-4 text-negative" />}
            headerAction={
              <Link
                href="/themes"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                テーマ一覧
                <ArrowRight className="h-3 w-3" />
              </Link>
            }
          >
            <ol className="space-y-1.5">
              {weaknesses.map((item, idx) => (
                <li
                  key={`${item.rankingKey}-${idx}`}
                  className="flex items-baseline gap-2"
                >
                  <RankBadge rank={item.rank} tone="negative" />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/ranking/${item.rankingKey}`}
                      className="line-clamp-1 text-sm font-medium leading-snug text-foreground hover:text-primary hover:underline"
                    >
                      {item.indicator}
                    </Link>
                    <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                      {item.value.toLocaleString('ja-JP')}
                      {formatUnitForDisplay(item.unit)}（{item.year}）
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </SectionCard>
        )}
      </div>
    </section>
  );
}
