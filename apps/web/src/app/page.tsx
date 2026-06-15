import Link from "next/link";

import { Button } from "@stats47/components/atoms/ui/button";
import { BarChart3, MapPin, Search, TrendingUp } from "lucide-react";
import { Metadata } from "next";

import { ThemeAwareImage } from "@/components/atoms/ThemeAwareImage";
import { PageShell, PageHeader } from "@/components/layout";

import { listLatestArticles } from "@/features/blog/server";
import { FeaturedRankings } from "@/features/ranking/server";

import { AdSenseAd, RANKING_PAGE_FOOTER } from "@/lib/google-adsense";

/**
 * 動的レンダリング（ランタイム SSR）を強制する。
 *
 * このページは `<FeaturedRankings>`（注目のランキング）と `listLatestArticles`（最新記事）を
 * R2 snapshot から読む。**ビルド環境では R2 が読めない**（detectEnvironment が要求する
 * `R2_ACCESS_KEY_ID/SECRET/ENDPOINT` と deploy が渡す `CLOUDFLARE_R2_*` の名前不一致 +
 * `R2_PUBLIC_FETCH_URL` 未設定で `fetchFromR2` が throw、build log: `home/featured.json が R2 に
 * 存在しません` / `hasS3Credentials:false`）。
 *
 * トップは純 SSG（`○ /`）で **ビルド時に空の FeaturedRankings を焼き込み**、本 OpenNext 構成では
 * prerendered ページは再デプロイまで配信され続ける（`revalidate` を付けても時間ベース ISR 再生成が
 * 効かず `x-nextjs-stale-time` が無限のまま＝検証で空のまま byte 一致を確認）ため、トップから
 * /ranking 詳細への導線が恒久的に消える回帰が起きていた。
 *
 * `force-dynamic` でビルド時 prerender を止め、**毎リクエスト Cloudflare Workers ランタイムで描画**
 * させると、R2 バインディング（ランタイムで稼働。/ranking/[key] が同経路で実データ描画されるのと同じ）で
 * featured.json / values / 記事を取得でき、tile map・1 位データ付きで正しく出る。
 *
 * 不採用: build env に `R2_PUBLIC_FETCH_URL` を足してビルド時に読む案は、/ranking/[key] の
 * generateStaticParams が ~1,800 件返してビルドが激重化するため見送り。
 */
export const dynamic = "force-dynamic";

/**
 * ホームページ (ミニマル版・2026-06-15 リデザイン)
 *
 * 設計思想:
 * - 暗色ヒーローを廃し、最小 PageHeader（h1 + 1 行説明 + 細い統計テキスト + 主要 CTA）に
 * - 主役は「注目のランキング」。その下に主要動線 3 枚と最新ブログだけを置く
 * - ふるさと納税ネイティブ枠 / データパック CTA / 主要ページグリッドは過剰だったため撤去
 *   （回遊はヘッダーナビと discovery カードに集約）
 */
export async function generateMetadata(): Promise<Metadata> {
  // robots.ts / sitemap.ts と同じ本番ドメインをフォールバックにする
  // (旧 "stats47.example.com" は誤った canonical/OG 絶対 URL を出していた)。
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://stats47.jp";

  const title = { absolute: "統計で見る都道府県 | 47都道府県ランキング・データ比較" };
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

/** トップの主要動線 3 枚（リンク先は重複させない）。 */
const DISCOVERY_CARDS = [
  {
    href: "/ranking",
    icon: TrendingUp,
    title: "ランキングから探す",
    description:
      "年収・人口・消費量から教育・医療・環境まで、全 17 カテゴリの統計ランキング。",
  },
  {
    href: "/areas",
    icon: MapPin,
    title: "都道府県から探す",
    description: "あなたの都道府県の全国での立ち位置を、チャートでひと目で把握。",
  },
  {
    href: "/themes",
    icon: BarChart3,
    title: "テーマで分析",
    description:
      "少子高齢化・労働・医療・観光・物価など、社会課題を 17 テーマで横断分析。",
  },
];

export default async function HomePage() {
  const latestArticles = await listLatestArticles(4).catch(() => []);

  return (
    <div className="w-full" suppressHydrationWarning>
      {/* ① 最小ヘッダー */}
      <PageShell>
        <PageHeader
          eyebrow="stats47 ─ 47都道府県データ"
          title="あなたの県は何位？"
          description="年収・人口・消費量から教育・医療まで、1,800 以上の統計で 47 都道府県をランキング。地図・グラフ・CSV で自由に使えます。"
          stats="1,800+ ランキング ・ 47 都道府県 ・ 250 万件超のデータ ・ 30 年分の時系列"
          actions={
            <>
              <Button asChild>
                <Link href="/ranking">
                  <BarChart3 className="mr-1.5 h-4 w-4" />
                  ランキングを見る
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/search">
                  <Search className="mr-1.5 h-4 w-4" />
                  キーワード検索
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/areas">
                  <MapPin className="mr-1.5 h-4 w-4" />
                  都道府県から探す
                </Link>
              </Button>
            </>
          }
        />
      </PageShell>

      {/* ② 注目のランキング（主役・全幅バンド） */}
      <FeaturedRankings limit={8} />

      <PageShell>
        {/* ③ データを探す（主要動線 3 枚） */}
        <section>
          <h2 className="mb-4 text-lg font-bold">データを探す</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {DISCOVERY_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.title}
                  href={card.href}
                  className="group flex items-start gap-3 rounded-none border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
                >
                  <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
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
        </section>

        {/* ④ 統計ブログ */}
        {latestArticles.length > 0 && (
          <section className="mt-12">
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
                  process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
                  "https://storage.stats47.jp";
                return (
                  <Link
                    key={article.slug}
                    href={`/blog/${article.slug}`}
                    className="group block overflow-hidden rounded-none border border-border bg-card transition-shadow hover:shadow-md"
                  >
                    <div className="relative aspect-square w-full overflow-hidden bg-muted">
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
          </section>
        )}

        {/* ⑤ AdSense (footer) */}
        <div className="mt-12 flex justify-center">
          <AdSenseAd
            format={RANKING_PAGE_FOOTER.format}
            slotId={RANKING_PAGE_FOOTER.slotId}
          />
        </div>
      </PageShell>
    </div>
  );
}
