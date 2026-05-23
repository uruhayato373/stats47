// ISR 24h: 移動フローデータは年次更新のため頻繁な再生成は不要。
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

import { MigrationFlowPlayer } from "@/features/migration-flow";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "都道府県 人口移動フロー",
  description:
    "47都道府県それぞれの転入・転出フローをアニメーション地図で可視化。焦点の県を市区町村別コロプレス、全国との人の流れをパーティクルで表示します。住民基本台帳人口移動報告（2025年）より。",
  alternates: {
    canonical: "/gis-cross/migration-flow",
  },
};

export default function MigrationFlowPage() {
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
            <BreadcrumbPage>都道府県 人口移動フロー</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          都道府県 人口移動フロー
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          焦点の都道府県と全国との「人の出入り」をアニメーションで可視化します。
          焦点県は市区町村別の転入超過率で塗り分け、全国各地との転入・転出の流れを
          パーティクルで表します。
        </p>
      </div>

      <MigrationFlowPlayer initialPrefCode="28" />

      <p className="text-xs text-muted-foreground mt-6">
        出典: 総務省統計局「住民基本台帳人口移動報告」2025年（e-Stat）。
        焦点県のコロプレスは市区町村別の転入超過率（純移動 ÷ 移動者数）、
        矢印・パーティクルは焦点県と各地域との転入・転出を表します。
      </p>
    </div>
  );
}
