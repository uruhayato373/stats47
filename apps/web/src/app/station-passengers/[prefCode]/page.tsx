/**
 * 駅別乗降客数バブルマップ（県別アニメーションページ）。
 *
 * 国土数値情報「駅別乗降客数」(S12) と「鉄道」(N02) をもとに、
 * 県内の鉄道駅を地図上にバブル表示し、2019〜2023 年度の推移をアニメ化する。
 * SSG + 24h ISR。47 県を generateStaticParams で事前生成。
 */
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

import { PREFECTURES } from "@/features/migration-flow/lib/prefectures";
import { StationPassengersPlayer } from "@/features/station-passengers";

import type { Metadata } from "next";

export const revalidate = 86400;

export function generateStaticParams() {
  return PREFECTURES.map((p) => ({ prefCode: p.code }));
}

function prefName(code: string): string | null {
  return PREFECTURES.find((p) => p.code === code)?.name ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ prefCode: string }>;
}): Promise<Metadata> {
  const { prefCode } = await params;
  const name = prefName(prefCode);
  if (!name) return {};
  return {
    title: `${name}の鉄道駅 乗降客数マップ | 統計で見る都道府県`,
    description: `${name}の鉄道駅を地図上にバブル表示。1日あたり乗降客数と2019〜2023年度の推移を可視化。国土数値情報「駅別乗降客数」を使用。`,
    alternates: { canonical: `/station-passengers/${prefCode}` },
  };
}

export default async function StationPassengersPrefPage({
  params,
}: {
  params: Promise<{ prefCode: string }>;
}) {
  const { prefCode } = await params;
  const name = prefName(prefCode);
  if (!name) notFound();

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">ホーム</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/station-passengers">
              鉄道駅 乗降客数マップ
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-2xl font-bold text-slate-900">
        {name}の鉄道駅 乗降客数マップ
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        国土数値情報「駅別乗降客数」(S12)・「鉄道」(N02) をもとに、{name}
        の鉄道駅を地図上にバブル表示。円の大きさは 1
        日あたりの乗降客数、青線は新幹線、灰線は在来線です。
      </p>

      <div className="mt-5">
        <StationPassengersPlayer initialPrefCode={prefCode} />
      </div>

      <div className="mt-6 rounded-md border bg-slate-50 p-4 text-sm">
        <p className="text-slate-700">
          都道府県別の乗降客数合計は{" "}
          <Link
            href="/ranking/railway-passengers"
            className="font-bold text-teal-700 underline"
          >
            鉄道駅 乗降客数ランキング
          </Link>{" "}
          で 47 都道府県を比較できます。
        </p>
      </div>
    </main>
  );
}
