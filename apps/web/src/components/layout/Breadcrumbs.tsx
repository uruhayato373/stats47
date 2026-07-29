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

/**
 * 全ページ共通のパンくず（視覚 UI + BreadcrumbList JSON-LD を一体で出力）。
 *
 * top 以外の全ページで PageShell 直下の先頭に配置する（Breadcrumbs 必須ルール）。
 * JSON-LD の itemListElement を同時に出力し、ページ側の構造化データ重複を防ぐ。
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
      <Breadcrumb className={className ?? "mb-4"}>
        <BreadcrumbList>
          {items.map((item, i) => {
            const isLast = i === items.length - 1;
            return (
              <Fragment key={`${item.label}-${i}`}>
                <BreadcrumbItem>
                  {isLast || !item.href ? (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={item.href}>{item.label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator />}
              </Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </>
  );
}
