import { listAllMetrics } from "@stats47/data-configs";
import { fetchFromR2AsJson, saveToR2 } from "@stats47/r2-storage/server";

import { rankingItemKeyPath } from "../types/snapshot";

import type { RankingItem } from "../types/ranking-item";

/**
 * config → item.json の category フィールド refresh exporter
 *
 * 背景: カテゴリページ (`/category/[key]`) は R2 `app/category/<key>/items.json`
 * を読み、これは `exportRankingItemsPerUrl` (master) が item.json の `categoryKey`
 * で再グループ化して生成する。しかし item.json の categoryKey は登録時の値が残る
 * だけで、git TS config (`packages/data-configs/src/metrics/<key>.ts`) の `category`
 * 編集は伝播しない (per-url exporter は item.json を再グループ化するのみ。同ファイル
 * 冒頭コメントが "config→item.json の field refresh は follow-up" と予告)。
 *
 * 本 exporter がその follow-up の category 版 (`ranking-item-seo-refresh` の姉妹)。
 * **git TS config が SSOT** なので、config の `category` / `additionalCategories` を
 * item.json に反映する。これにより誤分類の修正 (config 編集) がカテゴリページに効く。
 *
 * ★実行順: 本 refresh は **master (exportRankingItemsPerUrl) の前**に走らせること。
 *   master が更新後の categoryKey で category items.json を再グループ化するため。
 *
 * 完全DBレス (docs/01_技術設計/19): D1 不使用。読みは公開 URL 経由可、
 * 書き (saveToR2) は CI 専用ガード (`_assert-ci-write.ts`) の下でのみ通る。
 */

/** item.json のラッパ構造 (`{ generatedAt, item }`)。 */
interface RankingItemSnapshot {
  generatedAt?: string;
  item: RankingItem;
}

export interface RefreshRankingItemCategoryResult {
  /** registry の metric 総数 */
  scanned: number;
  /** categoryKey / additionalCategories を更新した item.json 数 */
  patched: number;
  /** item.json が R2 に存在しなかった metric 数 */
  missing: number;
  /** config と item.json が既に一致していた数 */
  unchanged: number;
  /** 更新された rankingKey 一覧 (検証用) */
  changedKeys: string[];
  durationMs: number;
}

interface RefreshOptions {
  /** true で R2 書き込みをスキップし差分のみ集計 (既定 true)。 */
  dryRun?: boolean;
  /** 指定時はこの rankingKey 群だけを対象にする (検証用)。 */
  only?: string[];
  /** 並列フェッチ数 (既定 16)。 */
  concurrency?: number;
}

/** additionalCategories を正規化 (null / 空配列を null に揃える)。 */
function normalizeAdditional(
  value: readonly string[] | null | undefined,
): string[] | null {
  if (!value || value.length === 0) return null;
  return [...value];
}

/** 2 つの additionalCategories が等価か (順序込み)。 */
function additionalEqual(
  a: string[] | null,
  b: string[] | null,
): boolean {
  if (a === null || b === null) return a === b;
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

export async function refreshRankingItemCategory(
  options: RefreshOptions = {},
): Promise<RefreshRankingItemCategoryResult> {
  const dryRun = options.dryRun ?? true;
  const concurrency = options.concurrency ?? 16;
  const onlySet = options.only ? new Set(options.only) : null;
  const startedAt = Date.now();

  const metrics = listAllMetrics().filter(
    (m) => !onlySet || onlySet.has(m.key),
  );

  let patched = 0;
  let missing = 0;
  let unchanged = 0;
  const changedKeys: string[] = [];
  const uploads: Promise<unknown>[] = [];

  for (let i = 0; i < metrics.length; i += concurrency) {
    const batch = metrics.slice(i, i + concurrency);
    await Promise.all(
      batch.map(async (metric) => {
        const keyPath = rankingItemKeyPath(metric.key);
        const snapshot = await fetchFromR2AsJson<RankingItemSnapshot>(keyPath);
        if (!snapshot?.item) {
          missing++;
          return;
        }

        const item = snapshot.item;
        // category は必須フィールドなので常に config を SSOT として上書きする。
        const nextCategoryKey = metric.category;
        // additionalCategories は config に定義があればそれを、無ければ既存を温存。
        const nextAdditional = metric.additionalCategories
          ? normalizeAdditional(metric.additionalCategories)
          : normalizeAdditional(item.additionalCategories);

        const currentAdditional = normalizeAdditional(item.additionalCategories);
        if (
          nextCategoryKey === item.categoryKey &&
          additionalEqual(nextAdditional, currentAdditional)
        ) {
          unchanged++;
          return;
        }

        patched++;
        changedKeys.push(metric.key);
        if (dryRun) return;

        const body = JSON.stringify({
          generatedAt: snapshot.generatedAt ?? new Date().toISOString(),
          item: {
            ...item,
            categoryKey: nextCategoryKey,
            additionalCategories: nextAdditional,
          },
        });
        uploads.push(
          saveToR2(keyPath, body, {
            contentType: "application/json; charset=utf-8",
          }),
        );
      }),
    );
  }

  if (!dryRun) await Promise.all(uploads);

  return {
    scanned: metrics.length,
    patched,
    missing,
    unchanged,
    changedKeys,
    durationMs: Date.now() - startedAt,
  };
}
