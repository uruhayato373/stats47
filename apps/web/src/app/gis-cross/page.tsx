// ISR 24h: 掛け合わせコンテンツの一覧は頻繁に変わらない。
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

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "掛け合わせ分析 | 統計で見る都道府県",
  description:
    "統計データと地理情報（GIS）を掛け合わせ、単独の指標では見えない都道府県の姿を可視化するページ集。過疎地域と医療機関の重なりなど、面と点を組み合わせた分析。",
  alternates: {
    canonical: "/gis-cross",
  },
};

/** 掛け合わせコンテンツ一覧。新規ページ追加時はここに 1 行足す。 */
const CROSS_CONTENTS: Array<{
  href: string;
  title: string;
  description: string;
  pair: string;
}> = [
  {
    href: "/gis-cross/depopulation-medical",
    title: "過疎地域と医療機関",
    description:
      "県内の医療機関のうち過疎地域に立地する割合を 47 都道府県で可視化。地図で過疎地域（面）と医療機関（点）の重なりを確かめられます。",
    pair: "過疎地域 × 医療機関",
  },
  {
    href: "/gis-cross/sunshine-map",
    title: "日本の日照地図",
    description:
      "全国の年間日照時間を 1km メッシュで可視化。都道府県ランキングでは見えない、県内の山間部と平野部、太平洋側と日本海側の日照差が地図に表れます。",
    pair: "日照時間 × 1km メッシュ",
  },
];

export default function GisCrossHubPage() {
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
            <BreadcrumbPage>掛け合わせ分析</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">掛け合わせ分析</h1>
        <p className="text-sm text-muted-foreground mt-1">
          統計データと地理情報（GIS）を掛け合わせ、単独の指標では見えない都道府県の姿を可視化します。
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-4 @md:grid-cols-2">
        {CROSS_CONTENTS.map((c) => (
          <li key={c.href}>
            <Link
              href={c.href}
              className="block rounded-md border p-4 transition-shadow hover:shadow-md"
            >
              <p className="text-xs text-muted-foreground mb-1">{c.pair}</p>
              <h2 className="text-base font-bold text-slate-900">{c.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {c.description}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
