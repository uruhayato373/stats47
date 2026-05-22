/**
 * 鉄道駅 乗降客数マップ 一覧ページ。
 * 47 都道府県を最新年度の乗降客数合計順に並べ、各県のアニメ地図ページへリンクする。
 */
import Link from "next/link";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@stats47/components/atoms/ui/breadcrumb";
import { fetchFromR2AsJson } from "@stats47/r2-storage/server";

import type { StationPassengersIndex } from "@/features/station-passengers";

import type { Metadata } from "next";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "鉄道駅 乗降客数マップ（47都道府県） | 統計で見る都道府県",
  description:
    "全国47都道府県の鉄道駅を地図上にバブル表示。1日あたり乗降客数と2019〜2023年度の推移を可視化。国土数値情報「駅別乗降客数」を使用。",
  alternates: { canonical: "/station-passengers" },
};

const fmt = (n: number) => Math.round(n).toLocaleString("ja-JP");

export default async function StationPassengersIndexPage() {
  const index = await fetchFromR2AsJson<StationPassengersIndex>(
    "app/station-passengers/index.json",
  );
  const prefectures = index?.prefectures ?? [];
  const latestYear = index?.latestYear ?? 2023;

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">ホーム</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>鉄道駅 乗降客数マップ</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-2xl font-bold text-slate-900">
        鉄道駅 乗降客数マップ（47都道府県）
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        国土数値情報「駅別乗降客数」(S12) をもとに、各都道府県の鉄道駅を地図上に
        バブル表示します。都道府県をクリックすると {latestYear} 年度までの
        乗降客数の推移をアニメーションで確認できます。
      </p>

      <div className="mt-4">
        <Link
          href="/ranking/railway-passengers"
          className="text-sm font-bold text-teal-700 underline"
        >
          → 鉄道駅 乗降客数ランキング（都道府県別合計）を見る
        </Link>
      </div>

      <ol className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {prefectures.map((p, i) => (
          <li key={p.prefCode}>
            <Link
              href={`/station-passengers/${p.prefCode}`}
              className="flex items-center justify-between rounded-md border bg-white px-4 py-3 transition-shadow hover:shadow-md"
            >
              <span className="flex items-center gap-3">
                <span className="w-6 text-right font-bold text-teal-700">
                  {i + 1}
                </span>
                <span className="font-bold text-slate-900">{p.prefName}</span>
                <span className="text-xs text-muted-foreground">
                  {p.stationCount} 駅
                </span>
              </span>
              <span className="text-sm font-bold text-slate-700">
                {fmt(p.latestTotal)}
                <span className="ml-1 text-xs text-muted-foreground">
                  人/日
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>

      <p className="mt-6 text-xs text-muted-foreground">
        出典: 国土交通省 国土数値情報「駅別乗降客数」(S12)・「鉄道」(N02)。
        乗降客数が S12 に登録されている駅のみを集計しています。
      </p>
    </main>
  );
}
