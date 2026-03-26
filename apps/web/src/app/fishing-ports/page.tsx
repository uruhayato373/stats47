import type { Metadata } from "next";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@stats47/components/atoms/ui/breadcrumb";

import { loadFishingPortData } from "@/features/fishing-ports/lib/load-fishing-port-data";
import { FishingPortMapClient } from "@/features/fishing-ports/components/FishingPortMapClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "漁港マップ | 統計で見る都道府県",
  description:
    "日本全国の漁港2,896港を地図上で可視化。第1種〜特定第3種の種別・管理者情報。国土数値情報（漁港データ）を使用。",
};

export default async function FishingPortsPage() {
  const { ports, stats } = await loadFishingPortData();

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
            <BreadcrumbPage>漁港マップ</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-6">
        <h1 className="text-lg font-bold">漁港マップ</h1>
        <p className="text-sm text-muted-foreground mt-1">
          全国 {stats.total.toLocaleString()}{" "}
          漁港の位置・種別を地図上に表示。色は種別を表します。
        </p>
      </div>

      <FishingPortMapClient ports={ports} stats={stats} />

      <p className="text-xs text-muted-foreground mt-6">
        出典: 国土交通省 国土数値情報「漁港データ（C09）」（2006年度）
      </p>
    </div>
  );
}
