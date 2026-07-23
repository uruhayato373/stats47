import Link from "next/link";

import { HOME_PORTAL_TERMS } from "@stats47/data-configs";
import { Metadata } from "next";

import { PageShell, PageHeader } from "@/components/layout";
import { SectionHeader } from "@/components/section";

import { InContentAdSlot, FooterAdSlot } from "@/features/ads";
import { listLatestArticles } from "@/features/blog/server";
import {
  HomeSearch,
  PortalAreaEntry,
  PortalBlogCard,
  PortalCategoryGrid,
  PortalUseCaseGrid,
} from "@/features/home-portal";
import { FeaturedRankings } from "@/features/ranking/server";

import { HUB_INCONTENT } from "@/lib/google-adsense";

/**
 * 動的レンダリング（ランタイム SSR）を強制する。
 *
 * このページは `<FeaturedRankings>`（注目のランキング）と `listLatestArticles`（最新記事）を
 * R2 snapshot から読む。**ビルド環境では R2 が読めない**ため、純 SSG だと空を焼き込み再デプロイまで
 * 配信され続ける回帰が起きる。`force-dynamic` で毎リクエスト Cloudflare Workers ランタイムに描画させ、
 * R2 バインディングで featured.json / 記事を取得する（詳細な経緯は git 履歴参照）。
 */
export const dynamic = "force-dynamic";

/**
 * ホームページ（ポータル型・2026-07-23 再設計）
 *
 * 設計思想（正典: docs/02_実装計画/38_ポータル型ホーム・ヘッダー再設計仕様.md）:
 * - 暗色ヒーローを完全撤去し、白基調の「h1 + 短い説明 + 大きな統計検索」から開始する。
 * - 検索・カテゴリ・注目ランキング・知りたいこと・都道府県・統計ブログの順に「発見」を並べる。
 * - 各セクションは代表項目 + 「もっと見る」に抑え、home へ全件を詰めない。
 */
export async function generateMetadata(): Promise<Metadata> {
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

export default async function HomePage() {
  const latestArticles = await listLatestArticles(4).catch(() => []);
  const popularTerms = HOME_PORTAL_TERMS.map((t) => t.term);
  const r2PublicUrl =
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://storage.stats47.jp";

  return (
    <div className="w-full">
      {/* ① 検索入口（白基調・hero なし）+ カテゴリから探す */}
      <PageShell>
        <PageHeader
          title="日本の地域データを探す"
          description="47都道府県のランキング、人口・年収・暮らしの統計を検索できます。"
        />
        <HomeSearch terms={popularTerms} />

        <section className="mt-10">
          <SectionHeader
            title="カテゴリから探す"
            action={
              <Link
                href="/ranking"
                className="font-semibold text-primary hover:underline"
              >
                すべてのカテゴリ →
              </Link>
            }
          />
          <PortalCategoryGrid />
        </section>
      </PageShell>

      {/* ② 注目のランキング（主役・全幅バンド。自前の見出し + 実験 wrapper を保持） */}
      <FeaturedRankings limit={8} />

      <PageShell>
        {/* 記事内広告（注目ランキング後・ページ 1 枠まで。slotId 未発行の間は非表示） */}
        <InContentAdSlot slot={HUB_INCONTENT} className="mt-0 mb-12" />

        {/* ③ 知りたいことから探す（テーマを利用意図へ翻訳） */}
        <section>
          <SectionHeader
            title="知りたいことから探す"
            action={
              <Link
                href="/themes"
                className="font-semibold text-primary hover:underline"
              >
                すべてのテーマ →
              </Link>
            }
          />
          <PortalUseCaseGrid />
        </section>

        {/* ④ 都道府県から探す（/areas への軽量入口） */}
        <section className="mt-12">
          <SectionHeader title="都道府県から探す" />
          <PortalAreaEntry />
        </section>

        {/* ⑤ 統計を読み解く（統計ブログ） */}
        {latestArticles.length > 0 && (
          <section className="mt-12">
            <SectionHeader
              title="統計を読み解く"
              action={
                <Link
                  href="/blog"
                  className="font-semibold text-primary hover:underline"
                >
                  すべての記事 →
                </Link>
              }
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {latestArticles.map((article) => (
                <PortalBlogCard
                  key={article.slug}
                  slug={article.slug}
                  title={article.title}
                  r2Url={r2PublicUrl}
                />
              ))}
            </div>
          </section>
        )}

        {/* ⑥ コンテンツ末尾の全幅フッター広告 */}
        <FooterAdSlot />
      </PageShell>
    </div>
  );
}
