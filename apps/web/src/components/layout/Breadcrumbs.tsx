import { Fragment } from "react";

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@stats47/components/atoms/ui/breadcrumb";

import Link from "@/components/atoms/SiteLink";


import { SITE_ORIGIN } from "@/config/site";

export interface BreadcrumbTrailItem {
  /** 表示ラベル */
  label: string;
  /** リンク先。末尾（現在地）は href を省略し BreadcrumbPage で描画する */
  href?: string;
}

interface BreadcrumbsProps {
  /**
   * ルート（ホーム）から現在地までの全項目。
   * 例: [{ label: "ホーム", href: "/" }, { label: "カテゴリ", href: "/category" }, { label: "医療" }]
   * 末尾（現在地）は href を省略する。
   */
  items: BreadcrumbTrailItem[];
  className?: string;
}

/**
 * 現在地の項目の幅。どの画面幅でも出し、列の幅を超える名前は 1 行で省略記号 (…) にする。
 * 記事ページ (blog/[slug]) の手組みのパンくずも同じクラスを使う。
 */
export const CURRENT_ITEM_CLASS =
  "min-w-0 max-w-full *:data-[slot=breadcrumb-page]:block *:data-[slot=breadcrumb-page]:truncate";

/** 中間項目は狭い画面 (sm 未満) で省き、代わりに BreadcrumbEllipsis を 1 つ出す */
const MIDDLE_ITEM_CLASS = "max-sm:hidden";
const ELLIPSIS_ITEM_CLASS = "sm:hidden";

/**
 * 全ページ共通のパンくず（視覚 UI + BreadcrumbList JSON-LD を一体で出力）。
 *
 * top 以外の全ページで PageShell 直下の先頭に配置する（Breadcrumbs 必須ルール）。
 * JSON-LD の itemListElement を同時に出力し、ページ側の構造化データ重複を防ぐ。
 *
 * 現在地は常に出し、長い名前は省略記号で 1 行に収める (以前は sm 未満で隠していたため、狭い画面では
 * 「ホーム」だけが残ることがあった)。4 項目以上のとき、狭い画面ではホームと直前の項目と現在地を残し、
 * 間を BreadcrumbEllipsis にまとめる。JSON-LD には全項目を残す。
 *
 * 設計仕様: docs/01_技術設計/04_デザインシステム.md
 */
export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: `${SITE_ORIGIN}${item.href}` } : {}),
    })),
  };
  // 省く対象はホーム (0) と直前 (length - 2) と現在地 (length - 1) の間
  const hasMiddle = items.length > 3;
  const isMiddle = (i: number) => hasMiddle && i > 0 && i < items.length - 2;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Breadcrumb className={className ?? "mb-4"} data-nav-surface="breadcrumb">
        <BreadcrumbList>
          {items.map((item, i) => {
            const isLast = i === items.length - 1;
            const middle = isMiddle(i);
            return (
              <Fragment key={`${item.label}-${i}`}>
                <BreadcrumbItem
                  className={isLast ? CURRENT_ITEM_CLASS : middle ? MIDDLE_ITEM_CLASS : undefined}
                >
                  {isLast || !item.href ? (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink render={<Link href={item.href} />}>{item.label}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast && (
                  <BreadcrumbSeparator className={middle ? MIDDLE_ITEM_CLASS : undefined} />
                )}
                {hasMiddle && i === 0 && (
                  <>
                    <BreadcrumbItem className={ELLIPSIS_ITEM_CLASS}>
                      <BreadcrumbEllipsis />
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className={ELLIPSIS_ITEM_CLASS} />
                  </>
                )}
              </Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </>
  );
}
