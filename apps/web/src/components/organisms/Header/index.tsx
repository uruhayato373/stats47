/**
 * アプリケーションヘッダー（Server Component）
 *
 * カテゴリを取得し、メガメニュー用に HeaderClient へ渡す。
 * `cookies()` / `headers()` は呼ばない（SSG 維持: nextjs-ssg-preservation.md）。
 *
 * 設計仕様: docs/01_技術設計/21_統一レイアウト設計.md
 */
import { isOk } from "@stats47/types";

import { listCategories } from "@/features/category/server";

import { HeaderClient } from "./HeaderClient";

export default async function Header() {
  // R2 cached。失敗時は空配列で fallback（カテゴリメニューは非表示になる）
  const result = await listCategories().catch(() => null);
  const categories = result && isOk(result) ? result.data : [];

  return <HeaderClient categories={categories} />;
}
