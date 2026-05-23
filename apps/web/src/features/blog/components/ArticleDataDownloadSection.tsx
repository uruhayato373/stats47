import Link from "next/link";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@stats47/components/atoms/ui/card";
import { readRankingItemsByTagFromR2, getRankingTitle } from "@stats47/ranking/server";
import { isOk } from "@stats47/types";
import { Download } from "lucide-react";

interface ArticleDataDownloadSectionProps {
  /** 記事のタグキー (関連ランキング検索用) */
  tagKeys: string[];
  /** 表示する関連ランキング数 (default: 3) */
  limit?: number;
}

/**
 * 記事末「関連データ DL」セクション (マスタープラン § 5.3)
 *
 * 記事のタグから関連ランキングを引き、各ランキング詳細 (CSV ダウンロード可能) への
 * リンクをカード形式で表示する。
 *
 * デザイン:
 * - primary 配色の囲み + Download アイコン
 * - 「関連データを CSV でダウンロード」見出し
 * - 関連ランキング 3 件を縦並びでリスト
 * - 各リンクは ranking 詳細ページに飛び、そこで全年度 CSV をダウンロードできる
 */
export async function ArticleDataDownloadSection({
  tagKeys,
  limit = 3,
}: ArticleDataDownloadSectionProps) {
  if (tagKeys.length === 0) return null;

  const allResults = await Promise.all(
    tagKeys.map((tagKey) => readRankingItemsByTagFromR2(tagKey)),
  );

  const seen = new Set<string>();
  const rankings: { rankingKey: string; title: string }[] = [];

  for (const result of allResults) {
    if (!isOk(result)) continue;
    for (const item of result.data.rankingItems) {
      if (!item) continue;
      if (item.areaType !== "prefecture") continue;
      if (!seen.has(item.rankingKey) && rankings.length < limit) {
        seen.add(item.rankingKey);
        rankings.push({
          rankingKey: item.rankingKey,
          title: getRankingTitle(item),
        });
      }
    }
    if (rankings.length >= limit) break;
  }

  if (rankings.length === 0) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="py-4 px-4">
        <CardTitle className="flex items-center gap-2 text-base text-primary">
          <Download className="h-4 w-4" />
          関連データをダウンロード
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="mb-3 text-xs text-muted-foreground">
          記事で扱った統計データを CSV でダウンロードできます。47都道府県 × 全年度の時系列データを、クレジット表記すれば無料で商用利用可能。
        </p>
        <ul className="space-y-1.5">
          {rankings.map((ranking) => (
            <li key={ranking.rankingKey}>
              <Link
                href={`/ranking/${ranking.rankingKey}`}
                className="group flex items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm transition-colors hover:border-primary/40 hover:bg-card/80"
              >
                <span className="line-clamp-1 font-medium text-foreground">
                  {ranking.title}
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-primary group-hover:text-primary/80">
                  <Download className="h-3.5 w-3.5" />
                  CSV
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
