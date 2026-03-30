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

import { type Category } from "@/features/category";
import { listCategories } from "@/features/category/server";

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
  // D1 接続エラー時は throw して Suspense fallback（SidebarSkeleton）を表示。
  // try/catch で握り潰すと、エラー状態が ISR キャッシュに保存されて
  // 全訪問者にエラーページが配信され続ける問題が発生するため。
  const result = await listCategories();

  if (!result.success) {
    logger.error(
      { error: result.error.message },
      "カテゴリ取得エラー"
    );
    // D1 接続エラーは throw して ISR キャッシュを汚染しない
    throw result.error;
  }

  return <SidebarClient categories={result.data} />;
}
