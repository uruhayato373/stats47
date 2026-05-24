import Link from "next/link";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@stats47/components/atoms/ui/breadcrumb";

import {
  HighwayTimelineMap,
  loadHighwayStats,
} from "@/features/highway-history";

import type { Metadata } from "next";

export const revalidate = 604800;

export const metadata: Metadata = {
  title: "日本の高速道路 時系列マップ｜1962〜2020 年表",
  description:
    "1962年の名神部分開通から2020年まで、日本の高速道路ネットワークが58年でどう広がったかを年別マップで可視化。マイルストーン年 (1965 名神/1969 東名/1985 関越/2005 圏央道) から該当年に直接ジャンプできます。",
  alternates: { canonical: "/maps/highway-timeline" },
};

const YEAR_END = 2020;

export default async function HighwayTimelineIndexPage() {
  const stats = await loadHighwayStats();

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">ホーム</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>高速道路 時系列マップ</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">
          Highway Timeline
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          日本の高速道路 時系列マップ ({stats.yearStart}→{stats.yearEnd})
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          1962年の名神部分開通から2020年まで、日本の高速道路ネットワークが
          <strong className="mx-1 text-amber-700">
            58年で {stats.totalKm.toLocaleString("ja-JP")} km
          </strong>
          に広がった軌跡を年別マップで確認できます。
        </p>
      </header>

      <section className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat
          label="累計距離 (2020)"
          value={stats.totalKm.toLocaleString("ja-JP")}
          unit="km"
        />
        <Stat
          label="累計区間"
          value={stats.totalSections.toLocaleString("ja-JP")}
          unit="区間"
        />
        <Stat label="期間" value={`${stats.totalYears}`} unit="年" />
      </section>

      <section className="mb-6">
        <h2 className="mb-3 text-lg font-bold text-slate-900">
          2020年時点のネットワーク
        </h2>
        <HighwayTimelineMap year={YEAR_END} />
      </section>

      <section className="mb-6 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-lg font-bold text-slate-900">マイルストーン年</h2>
        <ul className="space-y-2">
          {stats.milestones.map((m) => (
            <li key={m.year}>
              <Link
                href={`/maps/highway-timeline/${m.year}`}
                className="flex items-baseline justify-between rounded-md border border-slate-200 bg-slate-50 px-4 py-2 hover:bg-slate-100"
              >
                <span className="text-base font-bold text-slate-900">
                  {m.year}
                  <span className="ml-2 text-sm font-normal text-slate-600">
                    {m.label}
                  </span>
                </span>
                <span className="text-xs font-semibold text-amber-600">
                  {(stats.cumKmByYear[String(m.year)] ?? 0).toLocaleString("ja-JP")} km →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-6 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-lg font-bold text-slate-900">10年単位で見る</h2>
        <ul className="flex flex-wrap gap-2">
          {[1962, 1970, 1980, 1990, 2000, 2010, 2020].map((y) => (
            <li key={y}>
              <Link
                href={`/maps/highway-timeline/${y}`}
                className="inline-block rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                {y}年
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-5">
        <h2 className="mb-2 text-lg font-bold text-slate-900">関連コンテンツ</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>
            <Link
              href="/blog/highway-japan-58years"
              className="font-semibold text-amber-700 underline"
            >
              詳細解説: 日本の高速道路は58年で14,805 kmに広がった
            </Link>
            （動画 + マイルストーン + TOP 5 路線）
          </li>
          <li>
            <Link href="/ranking/road-extension-actual" className="underline">
              都道府県別 道路実延長ランキング
            </Link>
          </li>
        </ul>
      </section>

      <footer className="text-xs text-slate-500">
        出典: {stats.source}{" "}
        <a
          href={stats.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          (配布ページ)
        </a>
      </footer>
    </main>
  );
}

function Stat({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <div className="text-xs font-semibold tracking-widest text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
        {value} <span className="text-sm font-semibold text-slate-500">{unit}</span>
      </div>
    </div>
  );
}
