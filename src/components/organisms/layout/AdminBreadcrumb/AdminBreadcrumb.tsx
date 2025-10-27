"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ChevronRight } from "lucide-react";

/**
 * Adminページのパンくずナビゲーションコンポーネント
 *
 * URLパスから自動的にパンくずリストを生成して表示します。
 * スティッキーヘッダーとして動作し、ブラー効果を持ちます。
 *
 * @returns パンくずナビゲーションのJSX要素
 */
export const AdminBreadcrumb = () => {
  const pathname = usePathname();
  const pathSegments = pathname.split("/").filter(Boolean);

  // パスセグメントの表示名マッピング
  const segmentNames: Record<string, string> = {
    admin: "管理画面",
    "dev-tools": "開発ツール",
    "estat-api": "e-STAT API",
    "meta-info": "メタ情報",
    "stats-data": "統計データ",
    "stats-list": "統計一覧",
  };

  // パンくずリストを構築
  const breadcrumbs = [];
  
  // ホームを常に最初に追加
  breadcrumbs.push({ label: "ホーム", href: "/" });

  // パスセグメントを順に処理
  let currentPath = "";
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === pathSegments.length - 1;
    
    breadcrumbs.push({
      label: segmentNames[segment] || segment,
      href: currentPath,
      isLast,
    });
  });

  return (
    <div className="sticky top-0 z-10 py-3 px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* パンくずナビゲーション */}
      <nav className="flex items-center space-x-2 text-xs text-muted-foreground">
        {breadcrumbs.map((breadcrumb, index) => (
          <div key={breadcrumb.href} className="flex items-center">
            {index > 0 && <ChevronRight className="w-3 h-3" />}
            {breadcrumb.isLast ? (
              <span className="text-foreground/70">{breadcrumb.label}</span>
            ) : (
              <Link
                href={breadcrumb.href}
                className="transition-colors hover:text-foreground"
              >
                {breadcrumb.label}
              </Link>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
};
