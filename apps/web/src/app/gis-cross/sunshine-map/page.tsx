// ISR 24h: 気候平年値メッシュは decadal 更新のため頻繁な再生成は不要。
export const revalidate = 86400;

import Link from "next/link";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@stats47/components/atoms/ui/breadcrumb";

import { SunshineMapClient } from "@/features/sunshine-map";
import { loadSunshineMapMeta } from "@/features/sunshine-map/server";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "日本の日照地図 | 統計で見る都道府県",
  description:
    "全国の年間日照時間を1kmメッシュで可視化した日照地図。国土数値情報の気候平年値メッシュをもとに、太平洋側・日本海側・山間部の日照の差を地図で確かめられます。",
  alternates: {
    canonical: "/gis-cross/sunshine-map",
  },
};

export default async function SunshineMapPage() {
  const meta = await loadSunshineMapMeta();

  return (
    <div className="container mx-auto px-4 py-4 text-foreground">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">ホーム</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/gis-cross">掛け合わせ分析</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>日本の日照地図</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">日本の日照地図</h1>
        <p className="text-sm text-muted-foreground mt-1">
          全国の年間日照時間を 1km メッシュで可視化しました。都道府県ランキングでは
          見えない、県内の山間部と平野部、太平洋側と日本海側の差が地図に表れます。
        </p>
      </div>

      <SunshineMapClient meta={meta} />

      <p className="text-xs text-muted-foreground mt-6">
        出典: 国土交通省 国土数値情報「平年値（気候）メッシュ（G02）」2022年版。
        各 1km メッシュの年間日照時間（平年値）を色で表現しています。
      </p>
    </div>
  );
}
