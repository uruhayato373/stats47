// ISR 24h: 港湾統計は年次データのため頻繁な更新は不要。
// force-dynamic を避けることで毎リクエストの ports + portStatistics 全行スキャンを削減。
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

import { PortMapClient } from "@/features/port-statistics";
import { loadPortData } from "@/features/port-statistics/server";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "港湾統計マップ | 統計で見る都道府県",
  description:
    "日本の甲種港湾171港の海上出入貨物量・入港船舶隻数を地図上で可視化。港湾別ランキングと年度推移。国土交通省 港湾調査（港湾統計年報）のデータを使用。",
  alternates: {
    canonical: "/ports",
  },
};

export default async function PortsPage() {
  // ビルド時に D1 が利用できない場合は空データでレンダリング、ISR で再生成する
  const { ports, years } = await loadPortData().catch(() => ({ ports: [], years: [] }));

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
            <BreadcrumbPage>港湾統計マップ</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-6">
        <h1 className="text-lg font-bold">港湾統計マップ</h1>
        <p className="text-sm text-muted-foreground mt-1">
          甲種港湾 {ports.length} 港の海上出入貨物量・入港船舶隻数を地図上に表示。
          バブルの大きさは値に比例します。
        </p>
      </div>

      <PortMapClient ports={ports} years={years} />

      <p className="text-xs text-muted-foreground mt-6">
        出典:{" "}
        <a
          href="https://www.e-stat.go.jp/stat-search/files?toukei=00600280&tstat=000001018967"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground"
        >
          国土交通省「港湾調査（港湾統計 年報）」
        </a>
        {" / "}
        <a
          href="https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-C02-v3.html"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground"
        >
          国土数値情報「港湾データ」
        </a>
      </p>
    </div>
  );
}
