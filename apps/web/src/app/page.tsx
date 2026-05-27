import Link from "next/link";

import { Button } from "@stats47/components/atoms/ui/button";
import { BarChart3, Download, ExternalLink, MapPin, Search, TrendingUp } from "lucide-react";
import { Metadata } from "next";

import { ThemeAwareImage } from "@/components/atoms/ThemeAwareImage";

import { TrackedAffiliateLink } from "@/features/ads";
import {
  buildFurusatoNozeiUrl,
  FURUSATO_NOZEI_LINKS,
} from "@/features/ads/constants/furusato-nozei";
import { listLatestArticles } from "@/features/blog/server";
import { FeaturedRankings } from "@/features/ranking/server";
import {
  HeroShell,
  KpiGrid,
  KpiTile,
  NextUpGrid,
} from "@/features/redesign";

import { AdSenseAd, RANKING_PAGE_FOOTER } from "@/lib/google-adsense";

/**
 * 主要ページプレビュー画像/動画の R2 公開 URL ベース。
 * 仕様: docs/01_技術設計/12_homepage-previews.md
 * 撮影: apps/web/scripts/capture-home-previews.ts
 * R2 ファイルが未生成の場合、NextUpGrid は previewImageUrl の 404 を許容し
 * グラデアクセントへフォールバックする (object src が失敗しても layout は変わらない)。
 */
const HOME_PREVIEWS_BASE =
  (process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "https://storage.stats47.jp") +
  "/app/home/previews";

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

/** ホームのふるさと納税ピックアップ対象（北海道・山形・宮崎・沖縄） */
const HOME_FURUSATO_PICKS = ["01000", "06000", "45000", "47000"] as const;

/** 県コードに基づく安定パステルパレット (画像なしサムネ用) */
function pickPalette(prefCode: string) {
  const palettes = [
    { start: "#bbf7d0", end: "#16a34a" },
    { start: "#fbcfe8", end: "#ec4899" },
    { start: "#fde68a", end: "#f59e0b" },
    { start: "#bfdbfe", end: "#3b82f6" },
    { start: "#fef3c7", end: "#fbbf24" },
    { start: "#ddd6fe", end: "#8b5cf6" },
  ];
  const idx = parseInt(prefCode.slice(0, 2), 10) % palettes.length;
  return palettes[idx];
}

export default async function HomePage() {
  const latestArticles = await listLatestArticles(4).catch(() => []);
  const affiliateId = process.env.NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID;

  const furusatoPicks = HOME_FURUSATO_PICKS
    .map((code) => FURUSATO_NOZEI_LINKS.find((l) => l.prefCode === code))
    .filter((l): l is NonNullable<typeof l> => l != null);

  return (
    <div className="w-full" suppressHydrationWarning>
      {/* ① Hero (暗色 — ブランドのエントリー) */}
      <section className="px-4 pt-4 pb-2">
        <div className="mx-auto max-w-[1400px]">
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
        <div className="mx-auto max-w-[1400px]">
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
          <div className="mx-auto max-w-[1400px]">
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

      {/* ⑤ ふるさと納税 4 県ネイティブ枠 (マスタープラン § 5.3) */}
      <section className="px-4 py-8">
        <div className="mx-auto max-w-[1400px]">
          <div
            className="overflow-hidden rounded-2xl border border-amber-200 shadow-sm"
            style={{
              background: "linear-gradient(135deg, #fef3c7, #ffffff)",
            }}
          >
            <div className="flex flex-col items-start gap-3 border-b border-amber-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span aria-hidden className="text-2xl">🎁</span>
                <div>
                  <h2 className="text-base font-bold text-amber-900 sm:text-lg">
                    地域から選ぶ ふるさと納税
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    都道府県の人気返礼品ピックアップ
                  </p>
                </div>
                <span className="ml-2 rounded-full bg-amber-900 px-2 py-0.5 text-[10.5px] font-semibold text-white">
                  PR
                </span>
              </div>
              <Link
                href="/areas"
                className="rounded-md bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-800"
              >
                都道府県から探す →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-4">
              {furusatoPicks.map((pick) => {
                const url = buildFurusatoNozeiUrl(pick.rakutenAreaSlug, affiliateId);
                const palette = pickPalette(pick.prefCode);
                return (
                  <TrackedAffiliateLink
                    key={pick.prefCode}
                    href={url}
                    category="furusato"
                    label={`${pick.prefName}のふるさと納税`}
                    position="home-furusato-row"
                    className="group flex flex-col gap-2 rounded-xl border border-border bg-card p-3 transition-shadow hover:shadow-md"
                  >
                    <div
                      aria-hidden
                      className="aspect-[4/3] rounded-lg"
                      style={{
                        background: `linear-gradient(135deg, ${palette.start}, ${palette.end})`,
                      }}
                    />
                    <div>
                      <p className="text-[10.5px] font-semibold text-muted-foreground">
                        {pick.prefName}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs font-medium leading-snug text-foreground">
                        {pick.prefName}の人気返礼品を探す
                      </p>
                      <p className="mt-1.5 inline-flex items-center gap-0.5 text-[11px] font-bold text-amber-700">
                        楽天ふるさと納税
                        <ExternalLink className="h-3 w-3" />
                      </p>
                    </div>
                  </TrackedAffiliateLink>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ⑥ データパック CTA (マスタープラン § 3.3) */}
      <section className="px-4 py-8">
        <div className="mx-auto max-w-[1400px]">
          <div
            className="flex flex-col items-start gap-4 rounded-2xl border border-primary/20 p-6 shadow-sm sm:flex-row sm:items-center"
            style={{
              background: "linear-gradient(135deg, var(--primary-50, rgba(239,246,255,1)), #ffffff)",
            }}
          >
            <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Download className="h-7 w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold text-primary">データを活用する</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                1,800指標 × 47都道府県 × 30年 = 250万件以上のデータを CSV で取得できます。クレジット表記すれば無料で商用利用可能。
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild>
                <Link href="/ranking">CSV を見る</Link>
              </Button>
              <button
                type="button"
                disabled
                title="準備中"
                className="cursor-not-allowed rounded-md border border-border bg-muted/30 px-3 py-1.5 text-xs font-medium text-muted-foreground opacity-60"
              >
                JSON
              </button>
              <button
                type="button"
                disabled
                title="準備中"
                className="cursor-not-allowed rounded-md border border-border bg-muted/30 px-3 py-1.5 text-xs font-medium text-muted-foreground opacity-60"
              >
                Excel
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ⑦ 次に読む (回遊リンク強化) */}
      <section className="px-4 pb-8">
        <div className="mx-auto max-w-[1400px]">
          <NextUpGrid
            title="このサイトの主要ページ"
            moreHref="/ranking"
            items={[
              {
                href: "/ranking",
                title: "全ランキング一覧",
                description: "1,800 以上の指標から探す",
                badge: "RANKING",
                previewImageUrl: `${HOME_PREVIEWS_BASE}/ranking.avif`,
                previewVideoUrl: `${HOME_PREVIEWS_BASE}/ranking.webm`,
              },
              {
                href: "/themes",
                title: "テーマダッシュボード",
                description: "少子高齢化・労働・医療など 17 テーマ",
                badge: "THEMES",
                previewImageUrl: `${HOME_PREVIEWS_BASE}/themes.avif`,
                previewVideoUrl: `${HOME_PREVIEWS_BASE}/themes.webm`,
              },
              {
                href: "/areas",
                title: "都道府県一覧",
                description: "47 都道府県のプロフィール",
                badge: "AREAS",
                previewImageUrl: `${HOME_PREVIEWS_BASE}/areas.avif`,
              },
              {
                href: "/blog",
                title: "ブログ",
                description: "データを読み解く解説記事",
                badge: "BLOG",
                previewImageUrl: `${HOME_PREVIEWS_BASE}/blog.avif`,
              },
              {
                href: "/survey",
                title: "調査から探す",
                description: "出典別に統計を絞り込む",
                badge: "SURVEY",
                previewImageUrl: `${HOME_PREVIEWS_BASE}/survey.avif`,
              },
              {
                href: "/search",
                title: "キーワード検索",
                description: "ランキング・記事を横断検索",
                badge: "SEARCH",
                previewImageUrl: `${HOME_PREVIEWS_BASE}/search.avif`,
              },
            ]}
            columns={3}
          />
        </div>
      </section>

      {/* ⑧ AdSense (footer) */}
      <div className="my-6 flex justify-center px-4">
        <AdSenseAd
          format={RANKING_PAGE_FOOTER.format}
          slotId={RANKING_PAGE_FOOTER.slotId}
        />
      </div>
    </div>
  );
}
