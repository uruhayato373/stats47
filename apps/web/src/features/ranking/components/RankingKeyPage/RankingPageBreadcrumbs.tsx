import Link from "next/link";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@stats47/components/atoms/ui/breadcrumb";

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
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{rankingName}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
