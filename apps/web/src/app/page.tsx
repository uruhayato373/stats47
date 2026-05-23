import Link from "next/link";

import { Button } from "@stats47/components/atoms/ui/button";
import { BarChart3, ExternalLink, MapPin, Search, TrendingUp } from "lucide-react";
import { Metadata } from "next";

import { ThemeAwareImage } from "@/components/atoms/ThemeAwareImage";

import { TrackedAffiliateLink } from "@/features/ads";
import {
  buildFurusatoNozeiUrl,
} from "@/features/ads/constants/furusato-nozei";
import { listLatestArticles } from "@/features/blog/server";
import { FeaturedRankings } from "@/features/ranking/server";
import {
  HeroShell,
  KpiGrid,
  KpiTile,
} from "@/features/redesign";

import { AdSenseAd, RANKING_PAGE_FOOTER } from "@/lib/google-adsense";

/**
 * ホームページ (最適化版)
 *
 * 設計思想:
 * - 主役は「自分の県のランキングを見たい」ユーザー
 * - ふるさと納税は 1 行ミニバナーに縮小（過剰な PR を排除）
 * - データパック CTA は削除（home に来た人の目的ではない）
 * - 3 切り口の discovery カードで主要動線を確保
 */

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://stats47.example.com";

  const title = "統計で見る都道府県 | 47都道府県ランキング・データ比較";
  const description =
    "あなたの県は何位？年収・人口・消費量から教育・医療まで、1,800以上の統計で47都道府県をランキング。地図やグラフで地域の特徴をわかりやすく可視化します。";

  return {
    title,
    description,
    keywords: [
      "統計",
      "都道府県",
      "ランキング",
      "地域の特徴",
      "データ可視化",
      "人口統計",
      "経済統計",
      "政府統計",
      "e-Stat",
      "日本",
      "47都道府県",
    ],
    openGraph: {
      title,
      description,
      type: "website",
      url: baseUrl,
      siteName: "Stats47",
      images: [
        {
          url: `${baseUrl}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: "統計で見る都道府県 - 47都道府県ランキング",
        },
      ],
      locale: "ja_JP",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${baseUrl}/og-image.jpg`],
    },
    alternates: {
      canonical: "/",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

const DISCOVERY_CARDS = [
  {
    href: "/ranking",
    icon: TrendingUp,
    title: "1,800以上のランキング",
    description: "年収・人口・消費量から教育・医療・環境まで。地図やテーブルで比較できます。",
  },
  {
    href: "/areas",
    icon: MapPin,
    title: "都道府県から探す",
    description: "あなたの都道府県の全国での立ち位置を、KPI とチャートでひと目で把握。",
  },
  {
    href: "/themes",
    icon: BarChart3,
    title: "テーマで分析",
    description: "少子高齢化・労働・医療・観光・物価など、社会課題を 17 テーマで横断分析。",
  },
];

export default async function HomePage() {
  const latestArticles = await listLatestArticles(4).catch(() => []);
  const affiliateId = process.env.NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID;
  const furusatoTopUrl = buildFurusatoNozeiUrl("", affiliateId);

  return (
    <div className="w-full" suppressHydrationWarning>
      {/* ① Hero (暗色 — ブランドのエントリー) */}
      <section className="px-4 pt-4 pb-2">
        <div className="mx-auto max-w-6xl">
          <HeroShell variant="dark">
            <div className="grid grid-cols-1 gap-8 p-8 lg:grid-cols-[1fr,360px] lg:items-center lg:p-10">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-widest text-white/70">
                  stats47 ─ 47都道府県データ
                </p>
                <h1 className="mt-2 text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl">
                  あなたの県は
                  <br className="sm:hidden" />
                  <span className="text-sky-300">何位？</span>
                </h1>
                <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/85 sm:text-base">
                  <strong className="text-white">1,800以上の統計</strong>で47都道府県をランキング。地図・グラフ・CSV ダウンロードで自由に使えます。
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button asChild className="bg-white font-bold text-slate-900 hover:bg-white/90">
                    <Link href="/ranking">
                      <BarChart3 className="mr-1.5 h-4 w-4" />
                      ランキングを見る
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">
                    <Link href="/search">
                      <Search className="mr-1.5 h-4 w-4" />
                      キーワード検索
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">
                    <Link href="/areas">
                      <MapPin className="mr-1.5 h-4 w-4" />
                      都道府県から探す
                    </Link>
                  </Button>
                </div>
              </div>
              <div>
                <KpiGrid columns={2}>
                  <KpiTile label="ランキング数" value="1,800" unit="件超" variant="dark" />
                  <KpiTile label="都道府県" value="47" unit="都道府県" variant="dark" />
                  <KpiTile label="データポイント" value="250" unit="万件超" variant="dark" />
                  <KpiTile label="時系列" value="30" unit="年分" variant="dark" />
                </KpiGrid>
              </div>
            </div>
          </HeroShell>
        </div>
      </section>

      {/* ② 注目のランキング (主役) */}
      <FeaturedRankings limit={8} />

      {/* ③ 3 切り口の discovery (検索意図に最短接続) */}
      <section className="px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 text-lg font-bold">データを探す</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {DISCOVERY_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.href}
                  href={card.href}
                  className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
                >
                  <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground group-hover:text-primary">
                      {card.title}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      {card.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ④ 統計ブログ */}
      {latestArticles.length > 0 && (
        <section className="px-4 py-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">統計ブログ</h2>
              <Link
                href="/blog"
                className="text-sm font-semibold text-primary hover:underline"
              >
                すべての記事 →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {latestArticles.map((article) => {
                const r2 =
                  process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://storage.stats47.jp";
                return (
                  <Link
                    key={article.slug}
                    href={`/blog/${article.slug}`}
                    className="group block overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md"
                  >
                    <div className="relative aspect-[1200/630] w-full overflow-hidden bg-muted">
                      <ThemeAwareImage
                        lightSrc={`${r2}/app/blog/${article.slug}/thumbnail-light.webp`}
                        darkSrc={`${r2}/app/blog/${article.slug}/thumbnail-dark.webp`}
                        alt={article.title}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-3">
                      <p className="line-clamp-2 text-sm font-semibold leading-snug">
                        {article.title}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ⑤ ふるさと納税 1 行ミニバナー (PR) */}
      <section className="px-4 py-4">
        <div className="mx-auto max-w-6xl">
          <TrackedAffiliateLink
            href={furusatoTopUrl || "https://event.rakuten.co.jp/furusato/"}
            category="furusato"
            label="楽天ふるさと納税"
            position="home-furusato-banner"
            className="group flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/40 px-4 py-3 transition-shadow hover:shadow-sm dark:border-amber-900/40 dark:bg-amber-950/20"
          >
            <span aria-hidden className="text-xl">🎁</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                都道府県別の人気返礼品を探す
                <span className="ml-2 rounded-full bg-amber-900 px-1.5 py-0.5 text-[9px] font-bold text-white">
                  PR
                </span>
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                楽天ふるさと納税 — エリア別の返礼品をピックアップ
              </p>
            </div>
            <ExternalLink className="h-4 w-4 shrink-0 text-amber-700" />
          </TrackedAffiliateLink>
        </div>
      </section>

      {/* ⑥ AdSense (footer) */}
      <div className="my-6 flex justify-center px-4">
        <AdSenseAd
          format={RANKING_PAGE_FOOTER.format}
          slotId={RANKING_PAGE_FOOTER.slotId}
        />
      </div>
    </div>
  );
}
