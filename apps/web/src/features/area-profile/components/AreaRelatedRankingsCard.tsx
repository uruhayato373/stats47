import Link from "next/link";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@stats47/components/atoms/ui/card";
import { ArrowRight, TrendingDown, TrendingUp } from "lucide-react";

import type { AreaProfileData } from "../types";

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
  const strengths = profile.strengths.slice(0, limit);
  const weaknesses = profile.weaknesses.slice(0, limit);

  if (strengths.length === 0 && weaknesses.length === 0) return null;

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {/* TOP - 強み */}
      {strengths.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 py-4 px-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <CardTitle className="text-base">
                {profile.areaName}が上位
              </CardTitle>
            </div>
            <Link
              href="/themes"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              テーマ一覧
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-3">
            <ol className="space-y-1.5">
              {strengths.map((item, idx) => (
                <li
                  key={`${item.rankingKey}-${idx}`}
                  className="flex items-baseline gap-2"
                >
                  <span className="inline-flex h-5 w-7 shrink-0 items-center justify-center rounded bg-emerald-50 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                    {item.rank}位
                  </span>
                  <Link
                    href={`/ranking/${item.rankingKey}`}
                    className="line-clamp-1 text-sm font-medium leading-snug text-foreground hover:text-primary hover:underline"
                  >
                    {item.indicator}
                  </Link>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* BOTTOM - 弱み */}
      {weaknesses.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 py-4 px-5">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-rose-600" />
              <CardTitle className="text-base">
                {profile.areaName}が下位
              </CardTitle>
            </div>
            <Link
              href="/themes"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              テーマ一覧
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-3">
            <ol className="space-y-1.5">
              {weaknesses.map((item, idx) => (
                <li
                  key={`${item.rankingKey}-${idx}`}
                  className="flex items-baseline gap-2"
                >
                  <span className="inline-flex h-5 w-7 shrink-0 items-center justify-center rounded bg-rose-50 text-[10px] font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-400">
                    {item.rank}位
                  </span>
                  <Link
                    href={`/ranking/${item.rankingKey}`}
                    className="line-clamp-1 text-sm font-medium leading-snug text-foreground hover:text-primary hover:underline"
                  >
                    {item.indicator}
                  </Link>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
