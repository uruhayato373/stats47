"use client";

import { type ReactNode, useEffect, useState } from "react";

import Link from "next/link";

import { ArrowRight } from "lucide-react";

import { trackNavClick } from "@/lib/analytics/events";

/** `/api/ranking-card/[rankingKey]` の応答。データが無い指標では API が null を返す。 */
export interface RankingLinkCardData {
    unit: string;
    yearName: string;
    top: Array<{ rank: number; areaName: string; value: string }>;
    mapSvg: string;
}

const RANKING_HREF_RE = /^\/ranking\/([^/?#]+)/;
const TOP_ROW_COUNT = 3;

/** 本文内の面。記事本文 (白い ArticleCard) の中なのでカードを重ねず、地の色で区切る。 */
const PANEL_CLASS =
    "group block rounded-content bg-muted p-3 no-underline transition-colors hover:bg-accent sm:p-4";

interface RankingLinkCardProps {
    href: string;
    /** 記事側のラベル (「〜ランキングをもっと見る」)。SSR 時点から表示し、リンク名にもなる */
    children: ReactNode;
}

/**
 * ブログ本文の `<source-link>`: 図の直下に置くランキングへの導線。
 *
 * 地理ミニ地図と上位3県を表示して「どの県が上か」を先に見せる。記事ページはビルド時に
 * 事前生成されるが観測値はビルド時に読めないため、データは表示後に API から読む。
 * 読み込み中は地図と3行の高さを確保し、表示のずれを起こさない。
 */
export function RankingLinkCard({ href, children }: RankingLinkCardProps) {
    const rankingKey = RANKING_HREF_RE.exec(href)?.[1] ?? null;
    // undefined = 読み込み中 / null = 表示できるデータなし
    const [data, setData] = useState<RankingLinkCardData | null | undefined>(
        rankingKey ? undefined : null,
    );

    useEffect(() => {
        if (!rankingKey) return;
        let cancelled = false;
        fetch(`/api/ranking-card/${rankingKey}`)
            .then((res) => (res.ok ? (res.json() as Promise<RankingLinkCardData | null>) : null))
            .catch(() => null)
            .then((json) => {
                if (!cancelled) setData(json?.top?.length ? json : null);
            });
        return () => {
            cancelled = true;
        };
    }, [rankingKey]);

    const handleClick = () => {
        trackNavClick({ label: rankingKey ?? href, href, surface: "blog_ranking_card" });
    };

    return (
        <Link href={href} className={PANEL_CLASS} onClick={handleClick}>
            {data !== null && (
                <span className="mb-3 flex items-center gap-3 sm:gap-4">
                    <span
                        aria-hidden="true"
                        className={`block aspect-[320/190] w-32 shrink-0 sm:w-48 [&>svg]:h-full [&>svg]:w-full ${data ? "" : "animate-pulse bg-background"}`}
                        dangerouslySetInnerHTML={data ? { __html: data.mapSvg } : undefined}
                    />
                    {/* 値を県名から離しすぎない (広い画面で右端へ飛ばすと1行として読めない) */}
                    <span className="min-w-0 flex-1 sm:max-w-xs">
                        <span className="block text-xs leading-5 text-muted-foreground">
                            {data ? `${data.yearName} 上位3県` : "上位3県"}
                        </span>
                        <span className="mt-1 block space-y-1">
                            {data
                                ? data.top.map((row) => (
                                      <span
                                          key={`${row.rank}-${row.areaName}`}
                                          className="flex items-baseline gap-2 leading-5"
                                      >
                                          <span className="w-7 shrink-0 text-xs tabular-nums text-muted-foreground">
                                              {row.rank}位
                                          </span>
                                          <span className="min-w-0 truncate text-sm font-semibold text-foreground">
                                              {row.areaName}
                                          </span>
                                          <span className="ml-auto shrink-0 font-mono text-sm font-bold tabular-nums text-foreground">
                                              {row.value}
                                              <span className="ml-0.5 font-sans text-[11px] font-medium text-muted-foreground">
                                                  {data.unit}
                                              </span>
                                          </span>
                                      </span>
                                  ))
                                : Array.from({ length: TOP_ROW_COUNT }, (_, i) => (
                                      <span key={i} className="block h-5 animate-pulse bg-background" />
                                  ))}
                        </span>
                    </span>
                </span>
            )}
            <span className="flex items-center justify-between gap-2 text-sm font-medium text-primary">
                <span className="group-hover:underline">{children}</span>
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </span>
        </Link>
    );
}
