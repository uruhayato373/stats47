import Image from "next/image";
import Link from "next/link";

import { Button } from "@stats47/components/atoms/ui/button";
import { BarChart3, Search } from "lucide-react";
import { Metadata } from "next";

import { CountUp } from "@/components/atoms/CountUp";
import { ScrollReveal } from "@/components/atoms/ScrollReveal";
import { ThemeAwareImage } from "@/components/atoms/ThemeAwareImage";

import { listLatestArticles } from "@/features/blog/server";
import { FeaturedRankings } from "@/features/ranking/server";

import { AdSenseAd, RANKING_PAGE_FOOTER } from "@/lib/google-adsense";


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

export default async function HomePage() {
  const latestArticles = await listLatestArticles(4).catch(() => []);

  return (
    <div className="w-full" suppressHydrationWarning>
      {/* ① Hero Section */}
      <section className="relative py-8 md:py-12 overflow-hidden">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 opacity-80 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 dark:opacity-100" />
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-100/30 to-transparent skew-x-12 dark:from-blue-900/10" />

        <div className="max-w-5xl mx-auto text-center px-4 relative z-10">
          <h1 className="text-2xl font-bold mb-2">
            あなたの県は<span className="text-primary relative inline-block">
              何位？
              <svg className="absolute w-full h-3 -bottom-1 left-0 text-primary/20 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0 5 Q 50 10 100 5 L 100 10 L 0 10 Z" fill="currentColor" />
              </svg>
            </span>
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
            <CountUp end={1800} duration={800} className="font-semibold text-primary" suffix="以上の統計" />で47都道府県をランキング
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            <Button asChild>
              <Link href="/ranking">
                <BarChart3 className="h-4 w-4 mr-1.5" />
                ランキングを見る
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/search">
                <Search className="h-4 w-4 mr-1.5" />
                キーワードで探す
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ② 注目のランキング（LCP 要素 — ScrollReveal なしで即表示） */}
      <FeaturedRankings limit={8} />



      {/* ④ 3つの切り口でデータを探す（旧「できること」） */}
      <ScrollReveal>
        <section className="py-10 px-4 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-lg font-bold mb-8">3つの切り口でデータを探す</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  href: "/ranking",
                  image: "/images/features/ranking.webp",
                  title: "1,800以上のランキング",
                  description: "年収・人口・消費量から教育・医療・環境まで。地図やテーブルで比較できます。各ランキングで関連指標との相関も確認できます。",
                },
                {
                  href: "/areas",
                  image: "/images/features/area-profile.webp",
                  title: "地元の「強み」を発見",
                  description: "KPI・チャートで、あなたの都道府県の全国での立ち位置をひと目で把握。",
                },
              ].map((card, i) => (
                <ScrollReveal key={card.href} delay={i * 100}>
                  <Link href={card.href} className="group block rounded-none border border-border hover:border-primary/50 hover:shadow-md transition-all overflow-hidden h-full">
                    <div className="overflow-hidden">
                      <Image
                        src={card.image}
                        alt={card.title}
                        width={800}
                        height={460}
                        className="w-full h-auto group-hover:scale-105 transition-transform duration-300"
                        {...(i === 0 ? { priority: true } : { loading: "lazy" as const })}
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold mb-1">{card.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{card.description}</p>
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ⑤ 新着ブログ記事 */}
      {latestArticles.length > 0 && (
        <ScrollReveal>
          <section className="py-10 px-4">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">統計ブログ</h2>
                <Link href="/blog" className="text-sm text-primary hover:underline font-medium">
                  すべての記事 &rarr;
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {latestArticles.map((article) => {
                  const r2 = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://storage.stats47.jp";
                  return (
                    <Link
                      key={article.slug}
                      href={`/blog/${article.slug}`}
                      className="group block rounded-none border border-border overflow-hidden hover:border-primary/50 hover:shadow-md transition-all"
                    >
                      <div className="relative aspect-[1200/630] w-full bg-muted overflow-hidden">
                        <ThemeAwareImage
                          lightSrc={`${r2}/blog/${article.slug}/thumbnail-light.webp`}
                          darkSrc={`${r2}/blog/${article.slug}/thumbnail-dark.webp`}
                          alt={article.title}
                          fill
                          sizes="(max-width: 768px) 50vw, 25vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        </ScrollReveal>
      )}

      {/* 広告 */}
      <div className="flex justify-center my-8">
        <AdSenseAd
          format={RANKING_PAGE_FOOTER.format}
          slotId={RANKING_PAGE_FOOTER.slotId}
        />
      </div>
    </div>
  );
}
