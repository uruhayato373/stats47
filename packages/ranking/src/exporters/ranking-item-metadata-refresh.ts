import { listAllMetrics } from "@stats47/data-configs";
import { fetchFromR2AsJson, saveToR2 } from "@stats47/r2-storage/server";

import { rankingItemKeyPath } from "../types/snapshot";

import type { RankingItem } from "../types/ranking-item";

/**
 * config → item.json の表示メタ (title / subtitle / note / category) refresh exporter
 *
 * 背景: ランキング詳細・カテゴリページが描画する title / subtitle / annotation /
 * categoryKey は R2 `app/ranking/<key>/item.json` の値だが、git TS config
 * (`packages/data-configs/src/metrics/<key>.ts`) の編集はこれに伝播しない
 * (per-url exporter "master" は item.json を再グループ化するのみ)。
 *
 * 本 exporter が follow-up (`ranking-item-seo-refresh` の姉妹)。**git TS config が
 * SSOT** なので以下を item.json に反映する:
 *   - `title`       → item.title       (正準名。年・※を除去した clean な値)
 *   - `subtitle`    → item.subtitle    (定義補足。未定義なら消す)
 *   - `note`        → item.annotation  (データ注釈。UI のキャプション)
 *   - `category`    → item.categoryKey (誤分類修正をカテゴリページに反映)
 *   - `additionalCategories` → item.additionalCategories
 * seoTitle/seoDescription は `ranking-item-seo-refresh` が別途担う。
 *
 * ★実行順: 本 refresh は **master (exportRankingItemsPerUrl) の前**に走らせること。
 *   master が更新後の categoryKey/title で category items.json を再グループ化するため。
 *
 * 完全DBレス (docs/01_技術設計/19)。読みは公開 URL 経由可、
 * 書き (saveToR2) は CI 専用ガード (`_assert-ci-write.ts`) の下でのみ通る。
 */

/** item.json のラッパ構造 (`{ generatedAt, item }`)。 */
interface RankingItemSnapshot {
  generatedAt?: string;
  item: RankingItem;
}

export interface RefreshRankingItemMetadataResult {
  /** registry の metric 総数 */
  scanned: number;
  /** title/subtitle/note/category のいずれかを更新した item.json 数 */
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
function additionalEqual(a: string[] | null, b: string[] | null): boolean {
  if (a === null || b === null) return a === b;
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

/** 文字列の正規化 (undefined/空 → null)。 */
function strOrNull(v: string | null | undefined): string | null {
  return v != null && v !== "" ? v : null;
}

export async function refreshRankingItemMetadata(
  options: RefreshOptions = {},
): Promise<RefreshRankingItemMetadataResult> {
  const dryRun = options.dryRun ?? true;
  const concurrency = options.concurrency ?? 16;
  const onlySet = options.only ? new Set(options.only) : null;
  const startedAt = Date.now();

  const metrics = listAllMetrics().filter((m) => !onlySet || onlySet.has(m.key));

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

        // title / category は必須 → 常に config を SSOT として上書き。
        const nextTitle = metric.title;
        const nextCategoryKey = metric.category;
        // subtitle は config 定義を SSOT (未定義 → 消す)。
        const nextSubtitle = strOrNull(metric.subtitle);
        // note → annotation。config に無ければ既存 annotation を温存。
        const nextAnnotation = strOrNull(metric.note) ?? strOrNull(item.annotation);
        // additionalCategories は config 定義があれば優先、無ければ既存温存。
        const nextAdditional = metric.additionalCategories
          ? normalizeAdditional(metric.additionalCategories)
          : normalizeAdditional(item.additionalCategories);

        const curSubtitle = strOrNull(item.subtitle);
        const curAnnotation = strOrNull(item.annotation);
        const curAdditional = normalizeAdditional(item.additionalCategories);

        if (
          nextTitle === item.title &&
          nextSubtitle === curSubtitle &&
          nextAnnotation === curAnnotation &&
          nextCategoryKey === item.categoryKey &&
          additionalEqual(nextAdditional, curAdditional)
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
            title: nextTitle,
            subtitle: nextSubtitle ?? undefined,
            annotation: nextAnnotation ?? undefined,
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
