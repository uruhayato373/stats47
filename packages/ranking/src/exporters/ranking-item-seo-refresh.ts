import { listAllMetrics } from "@stats47/data-configs";
import { fetchFromR2AsJson, saveToR2 } from "@stats47/r2-storage/server";

import { rankingItemKeyPath } from "../types/snapshot";

import type { RankingItem } from "../types/ranking-item";

/**
 * config → item.json の SEO フィールド refresh exporter (Q-DESIGN R0)
 *
 * 背景: ranking ページが描画する seoTitle/seoDescription は R2
 * `app/ranking/<key>/item.json` の値だが、git TS config
 * (`packages/data-configs/src/metrics/<key>.ts`) の編集はこれに伝播しない。
 * 旧 config→item.json monolith exporter は Phase F (2026-05-30) で削除され、
 * 現行 `exportRankingItemsPerUrl` は既存 item.json を再グループ化するのみ
 * (同ファイル冒頭コメントが "config→item.json の field refresh は follow-up" と予告)。
 *
 * 本 exporter がその follow-up。**git TS config が SSOT**なので、config に
 * seoTitle/seoDescription が定義されていれば item.json を上書きする
 * (未定義なら既存値を温存し、誤って空にしない)。それ以外のフィールド
 * (latestYear / tags / availableYears 等) は item.json を verbatim 保持する。
 *
 * 完全DBレス (docs/01_技術設計/19): D1 不使用。読みは公開 URL 経由可、
 * 書き (saveToR2) は CI 専用ガード (`_assert-ci-write.ts`) の下でのみ通る。
 */

/** item.json のラッパ構造 (`{ generatedAt, item }`)。 */
interface RankingItemSnapshot {
  generatedAt?: string;
  item: RankingItem;
}

export interface RefreshRankingItemSeoResult {
  /** registry の metric 総数 */
  scanned: number;
  /** seoTitle / seoDescription を更新した item.json 数 */
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

/** config に定義された seo 値を優先し、未定義なら既存 item 値を温存する。 */
function resolveSeo(
  configValue: string | undefined,
  itemValue: string | null | undefined,
): string | null {
  if (configValue != null && configValue !== "") return configValue;
  return itemValue ?? null;
}

export async function refreshRankingItemSeoFields(
  options: RefreshOptions = {},
): Promise<RefreshRankingItemSeoResult> {
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
        const snapshot =
          await fetchFromR2AsJson<RankingItemSnapshot>(keyPath);
        if (!snapshot?.item) {
          missing++;
          return;
        }

        const item = snapshot.item;
        const nextSeoTitle = resolveSeo(metric.seoTitle, item.seoTitle);
        const nextSeoDescription = resolveSeo(
          metric.seoDescription,
          item.seoDescription,
        );

        if (
          nextSeoTitle === (item.seoTitle ?? null) &&
          nextSeoDescription === (item.seoDescription ?? null)
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
            seoTitle: nextSeoTitle,
            seoDescription: nextSeoDescription,
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
