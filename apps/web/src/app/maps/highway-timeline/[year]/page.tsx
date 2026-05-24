import Link from "next/link";
import { notFound } from "next/navigation";

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

const YEAR_START = 1962;
const YEAR_END = 2020;

export function generateStaticParams(): Array<{ year: string }> {
  const years: Array<{ year: string }> = [];
  for (let y = YEAR_START; y <= YEAR_END; y++) {
    years.push({ year: String(y) });
  }
  return years;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ year: string }>;
}): Promise<Metadata> {
  const { year } = await params;
  const y = Number(year);
  if (!Number.isInteger(y) || y < YEAR_START || y > YEAR_END) return {};
  return {
    title: `${y}年時点の日本の高速道路マップ｜国土数値情報 N06`,
    description: `${y}年までに開通した日本の高速道路ネットワークを地図で可視化。1962年からの累計区間数・累計距離を年別に確認できます。`,
    alternates: { canonical: `/maps/highway-timeline/${y}` },
  };
}

export default async function HighwayTimelineYearPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year } = await params;
  const y = Number(year);
  if (!Number.isInteger(y) || y < YEAR_START || y > YEAR_END) notFound();

  const stats = await loadHighwayStats();
  const cumSections = stats.cumByYear[String(y)] ?? 0;
  const cumKm = stats.cumKmByYear[String(y)] ?? 0;
  const milestone = stats.milestones.find((m) => m.year === y);
  const prevYear = y > YEAR_START ? y - 1 : null;
  const nextYear = y < YEAR_END ? y + 1 : null;

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">ホーム</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/maps/highway-timeline">
              高速道路 時系列マップ
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{y}年</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">
          Highway Timeline
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          {y}年時点の日本の高速道路マップ
        </h1>
        {milestone ? (
          <p className="mt-2 inline-block rounded-md border border-cyan-300 bg-cyan-50 px-3 py-1 text-sm font-semibold text-cyan-700">
            🛣 {y} マイルストーン: {milestone.label}
          </p>
        ) : null}
      </header>

      <section className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat
          label="累計区間"
          value={`${cumSections.toLocaleString("ja-JP")}`}
          unit="区間"
        />
        <Stat
          label="累計距離"
          value={`${cumKm.toLocaleString("ja-JP")}`}
          unit="km"
        />
        <Stat
          label="年代進捗"
          value={`${Math.round(((y - YEAR_START) / (YEAR_END - YEAR_START)) * 100)}`}
          unit="%"
        />
      </section>

      <section className="mb-6">
        <HighwayTimelineMap year={y} />
      </section>

      <nav className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4">
        {prevYear ? (
          <Link
            href={`/maps/highway-timeline/${prevYear}`}
            className="text-sm font-semibold text-slate-700 hover:text-slate-900"
          >
            ← {prevYear}年
          </Link>
        ) : (
          <span />
        )}
        <Link
          href="/maps/highway-timeline"
          className="text-sm font-semibold text-amber-600 hover:text-amber-700"
        >
          年表一覧へ
        </Link>
        {nextYear ? (
          <Link
            href={`/maps/highway-timeline/${nextYear}`}
            className="text-sm font-semibold text-slate-700 hover:text-slate-900"
          >
            {nextYear}年 →
          </Link>
        ) : (
          <span />
        )}
      </nav>

      <section className="mb-6 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-lg font-bold text-slate-900">
          マイルストーン年に飛ぶ
        </h2>
        <ul className="flex flex-wrap gap-2">
          {stats.milestones.map((m) => (
            <li key={m.year}>
              <Link
                href={`/maps/highway-timeline/${m.year}`}
                className="inline-block rounded-md border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                {m.year}: {m.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <footer className="text-xs text-slate-500">
        <p>
          出典: {stats.source}{" "}
          <a
            href={stats.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            (配布ページ)
          </a>
        </p>
        <p className="mt-1">
          詳細解説:{" "}
          <Link
            href="/blog/highway-japan-58years"
            className="text-amber-600 underline"
          >
            日本の高速道路は58年で14,805 kmに広がった
          </Link>
        </p>
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
