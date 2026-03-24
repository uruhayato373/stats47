/**
 * @fileoverview サイドバーメインコンポーネント
 *
 * アプリケーションのサイドバーナビゲーションを提供するサーバーコンポーネントです。
 * カテゴリ・サブカテゴリデータを取得し、SidebarClientに渡します。
 *
 * ## 責務
 *
 * 1. **データ取得**: カテゴリ・サブカテゴリデータを非同期で取得
 * 2. **エラーハンドリング**: 取得エラー時はエラーメッセージをSidebarClientに渡す
 * 3. **UIへの橋渡し**: 取得したデータをSidebarClient（Client Component）に渡す
 *
 * ## コンポーネント構成
 *
 * ```
 * layout.tsx
 * └── Suspense (fallback: SidebarSkeleton)
 *     └── Sidebar (async Server Component) ← データ取得
 *         └── SidebarClient (Client Component) ← UI表示
 * ```
 *
 * ## 使用例
 *
 * ```tsx
 * // layout.tsxで使用
 * import { Suspense } from "react";
 * import { Sidebar } from "@/components/organisms/Sidebar";
 * import { SidebarSkeleton } from "@/components/organisms/Sidebar/SidebarSkeleton";
 *
 * export default function Layout({ children }) {
 *   return (
 *     <div className="flex">
 *       <Suspense fallback={<SidebarSkeleton />}>
 *         <Sidebar />
 *       </Suspense>
 *       <main className="flex-1">{children}</main>
 *     </div>
 *   );
 * }
 * ```
 *
 * @module Sidebar
 */

import { listCategories } from "@/features/category/server";
import { unwrap } from "@stats47/types";
import { type Category } from "@/features/category";

import { logger } from "@/lib/logger";

import { SidebarClient } from "./SidebarClient";

/**
 * サイドバーコンポーネント（Server Component）
 *
 * カテゴリ・サブカテゴリデータを非同期で取得し、SidebarClientに渡します。
 * エラーが発生した場合は、エラーメッセージをSidebarClientに渡してエラー状態を表示します。
 *
 * **注意**: このコンポーネントは呼び出し側でSuspenseでラップする必要があります。
 *
 * @returns SidebarClientコンポーネント（カテゴリデータまたはエラー情報を含む）
 *
 * @example
 * ```tsx
 * <Suspense fallback={<SidebarSkeleton />}>
 *   <Sidebar />
 * </Suspense>
 * ```
 */
export async function Sidebar() {
  let categories: Category[] = [];
  let errorMessage: string | undefined;

  try {
    categories = unwrap(await listCategories());
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(
      {
        error: errorMessage,
        errorStack: error instanceof Error ? error.stack : undefined,
      },
      "カテゴリ取得エラー"
    );
  }

  return <SidebarClient categories={categories} error={errorMessage} />;
}
