import Link from "next/link";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@stats47/components/atoms/ui/card";
import { ArrowRight } from "lucide-react";

interface NextUpItem {
  href: string;
  title: string;
  description?: string;
  badge?: string;
  /** カード上部のアクセントカラー (Tailwind gradient class、省略時はデフォルト) */
  accent?: string;
  /** プレビュー画像 URL (AVIF 推奨)。指定時はグラデの代わりに 16:9 で表示 */
  previewImageUrl?: string;
  /** プレビュー動画 URL (WebM 推奨)。指定時は video 要素で autoplay loop muted */
  previewVideoUrl?: string;
}

interface NextUpGridProps {
  /** セクションタイトル */
  title?: string;
  /** タイトル右の "すべて見る" リンク */
  moreHref?: string;
  /** 表示アイテム */
  items: NextUpItem[];
  /** lg+ で表示する列数 (default: 3) */
  columns?: 2 | 3 | 4;
}

const COLUMN_CLASS: Record<2 | 3 | 4, string> = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

const DEFAULT_ACCENTS = [
  "from-amber-200 to-amber-500",
  "from-sky-200 to-sky-600",
  "from-pink-200 to-pink-500",
  "from-emerald-200 to-emerald-500",
  "from-violet-200 to-violet-500",
  "from-rose-200 to-rose-500",
];

/**
 * D-System「次に読む」回遊リンク 3 列 grid
 *
 * ページ末尾に配置し、関連コンテンツへの遷移を促す。
 * previewImageUrl / previewVideoUrl 未指定なら 80px グラデアクセント (LCP 影響なし)、
 * 指定時は 16:9 のプレビュー画像/動画を表示 (lazy load + motion-reduce 対応)。
 *
 * 画像/動画の生成: docs/01_技術設計/12_homepage-previews.md
 */
export function NextUpGrid({
  title = "次に読む",
  moreHref,
  items,
  columns = 3,
}: NextUpGridProps) {
  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 py-3 px-4">
        <CardTitle className="text-base">{title}</CardTitle>
        {moreHref && (
          <Link
            href={moreHref}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            すべて見る
            <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </CardHeader>
      <CardContent className="p-4 pt-3">
        <div className={`grid gap-3 ${COLUMN_CLASS[columns]}`}>
          {items.map((item, i) => {
            const accent = item.accent ?? DEFAULT_ACCENTS[i % DEFAULT_ACCENTS.length];
            const hasMedia = Boolean(item.previewVideoUrl ?? item.previewImageUrl);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex flex-col gap-2 rounded-md border border-border bg-card overflow-hidden transition-colors hover:border-primary"
              >
                {hasMedia ? (
                  <div
                    className={`relative w-full overflow-hidden bg-gradient-to-br ${accent}`}
                    style={{ aspectRatio: "16 / 9" }}
                    aria-hidden
                  >
                    {item.previewVideoUrl ? (
                      <video
                        src={item.previewVideoUrl}
                        poster={item.previewImageUrl}
                        muted
                        autoPlay
                        loop
                        playsInline
                        preload="metadata"
                        className="h-full w-full object-cover motion-reduce:hidden"
                      />
                    ) : null}
                    {item.previewImageUrl ? (
                      // motion-reduce 時 + 動画ロード失敗時のフォールバック静止画
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.previewImageUrl}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className={`h-full w-full object-cover ${item.previewVideoUrl ? "motion-reduce:block hidden" : ""}`}
                      />
                    ) : null}
                  </div>
                ) : (
                  <div className={`h-16 bg-gradient-to-br ${accent}`} aria-hidden />
                )}
                <div className="px-3 pb-3 flex flex-col gap-1.5">
                  {item.badge && (
                    <span className="inline-block self-start rounded bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                      {item.badge}
                    </span>
                  )}
                  <p className="text-sm font-medium line-clamp-2 leading-snug group-hover:text-primary">
                    {item.title}
                  </p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
