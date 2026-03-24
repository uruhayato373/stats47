/**
 * 調査名一覧ページ（Server Component）
 *
 * `/survey` でアクセスされ、全調査の一覧を表示。
 */

import Link from "next/link";
import type { Metadata } from "next";

import { isOk } from "@stats47/types";
import {
  listSurveys,
} from "@stats47/ranking/server";
import { getDrizzle, rankingItems } from "@stats47/database/server";
import { eq, count } from "drizzle-orm";

import { generateOGMetadata } from "@/lib/metadata/og-generator";

export const revalidate = 86400;

export function generateMetadata(): Metadata {
  const title = "調査別ランキング一覧 | 統計で見る都道府県";
  const description =
    "政府統計調査ごとの都道府県別ランキング一覧。国勢調査、家計調査、人口動態統計など、各調査のデータを活用したランキングを閲覧できます。";

  return {
    title,
    description,
    alternates: { canonical: "/survey" },
    ...generateOGMetadata({ title, description, imageUrl: "/og-image.jpg" }),
  };
}

export default async function SurveyIndexPage() {
  const surveysResult = await listSurveys();
  const surveys = isOk(surveysResult) ? surveysResult.data : [];

  // 各調査のランキング件数を取得
  let countMap = new Map<string, number>();
  try {
    const db = getDrizzle();
    const countRows = await db
      .select({
        surveyId: rankingItems.surveyId,
        count: count(),
      })
      .from(rankingItems)
      .where(eq(rankingItems.isActive, true))
      .groupBy(rankingItems.surveyId);

    countMap = new Map(
      countRows.filter((r) => r.surveyId !== null).map((r) => [r.surveyId!, r.count])
    );
  } catch {
    // D1 バインディングが利用できない場合（ビルド時等）は空のマップで続行
  }

  // ssds は件数が多いが実質「分類不明」なので末尾に移動
  const sortedSurveys = surveys.filter((s) => {
    const count = countMap.get(s.id) ?? 0;
    return count > 0;
  });

  return (
    <div className="container mx-auto px-4 py-6 text-foreground">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">調査別ランキング一覧</h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          政府統計調査ごとに、都道府県別ランキングを分類しています。各調査をクリックすると、その調査データに基づくランキングの一覧を閲覧できます。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedSurveys.map((survey) => {
          const count = countMap.get(survey.id) ?? 0;
          return (
            <Link
              key={survey.id}
              href={`/survey/${survey.id}`}
              className="block bg-card border rounded-lg p-4 shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-base truncate">
                    {survey.name}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {survey.organization}
                  </p>
                </div>
                <span className="ml-2 shrink-0 bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded">
                  {count}件
                </span>
              </div>
              {survey.description && (
                <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {survey.description}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
