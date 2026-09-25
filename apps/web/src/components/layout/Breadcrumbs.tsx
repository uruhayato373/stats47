import { Fragment } from "react";

import Link from "next/link";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@stats47/components/atoms/ui/breadcrumb";

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

const SITE_ORIGIN = "https://stats47.jp";

/** 現在地の項目 (と直前の区切り) は sm 以上だけ出す */
export const CURRENT_ITEM_CLASS = "hidden sm:inline-flex";

/**
 * 全ページ共通のパンくず（視覚 UI + BreadcrumbList JSON-LD を一体で出力）。
 *
 * top 以外の全ページで PageShell 直下の先頭に配置する（Breadcrumbs 必須ルール）。
 * JSON-LD の itemListElement を同時に出力し、ページ側の構造化データ重複を防ぐ。
 *
 * 狭い画面 (sm 未満) では末尾 (現在地) を出さない。見出しと同じ語が並び、長い名前だけが次の行へ
 * 落ちて見出しと重なって見えた (2026-09-25 UI 全面点検)。JSON-LD には全項目を残す。
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
            const isBeforeLast = i === items.length - 2;
            return (
              <Fragment key={`${item.label}-${i}`}>
                <BreadcrumbItem className={isLast && items.length > 1 ? CURRENT_ITEM_CLASS : undefined}>
                  {isLast || !item.href ? (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={item.href}>{item.label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast && (
                  <BreadcrumbSeparator className={isBeforeLast ? CURRENT_ITEM_CLASS : undefined} />
                )}
              </Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </>
  );
}
