/**
 * モバイルナビゲーションドロワー（Server Component）
 *
 * カテゴリを取得し、MobileNavDrawerClient に渡す。
 * PC では client 側が `return null` するため描画コストはほぼゼロ。
 * `cookies()` / `headers()` は呼ばない（SSG 維持）。
 *
 * 設計仕様: docs/01_技術設計/21_統一レイアウト設計.md
 */
import { isOk } from "@stats47/types";

import { listCategories } from "@/features/category/server";

import { MobileNavDrawerClient } from "./MobileNavDrawerClient";

export async function MobileNavDrawer() {
  const result = await listCategories().catch(() => null);
  const categories = result && isOk(result) ? result.data : [];

  return <MobileNavDrawerClient categories={categories} />;
}
