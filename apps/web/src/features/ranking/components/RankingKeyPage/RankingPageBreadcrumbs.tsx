import Link from "next/link";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@stats47/components/atoms/ui/breadcrumb";

import { CURRENT_ITEM_CLASS } from "@/components/layout/Breadcrumbs";

interface RankingPageBreadcrumbsProps {
  rankingName: string;
  category?: { key: string; name: string } | null;
  /** 追加 className (ArticleShell の breadcrumb slot 内で余白調整に使う) */
  className?: string;
}

/**
 * ranking 詳細のパンくず。ArticleShell の breadcrumb slot に渡す前提で、
 * 自前のレイアウト shell は持たない (zone 内のコンテナ幅に従う)。
 */
export function RankingPageBreadcrumbs({
  rankingName,
  category,
  className,
}: RankingPageBreadcrumbsProps) {
  return (
    <Breadcrumb className={className ?? "mb-4"}>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/">ホーム</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {category && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/category/${category.key}`}>{category.name}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </>
        )}
        {/* 狭い画面では現在地 (= H1 と同じ文言) を出さない。長い指標名が 3 行折り返して H1 と二重に並ぶため
            (2026-10-04 週次 UI 検査。Breadcrumbs / ブログ詳細と同じ扱い) */}
        <BreadcrumbSeparator className={CURRENT_ITEM_CLASS} />
        <BreadcrumbItem className={CURRENT_ITEM_CLASS}>
          <BreadcrumbPage>{rankingName}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
