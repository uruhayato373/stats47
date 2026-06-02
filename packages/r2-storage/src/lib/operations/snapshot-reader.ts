import { logger } from "@stats47/logger";

import { fetchFromR2AsJson } from "./fetch";

const DEFAULT_STALE_AFTER_DAYS = 30;

export interface SnapshotReaderOptions<TSnapshot, TData> {
  /** R2 キー（`app/` プレフィックス必須） */
  readonly key: string;
  /** ログ用ラベル（例: `"categories"`） */
  readonly label: string;
  /** snapshot から配信データを取り出す */
  readonly select: (snapshot: TSnapshot) => TData;
  /** snapshot が R2 に存在しないときのフォールバック値 */
  readonly fallback: TData;
  /** snapshot の生成時刻アクセサ（stale 判定用）。既定で `snapshot.generatedAt` を読む */
  readonly generatedAt?: (snapshot: TSnapshot) => string | undefined;
  /** stale 警告の閾値日数（既定 30） */
  readonly staleAfterDays?: number;
}

function defaultGeneratedAt<TSnapshot>(snapshot: TSnapshot): string | undefined {
  const value = (snapshot as { generatedAt?: unknown }).generatedAt;
  return typeof value === "string" ? value : undefined;
}

/**
 * R2 snapshot reader の共通ファクトリ。
 *
 * 各 feature が個別実装していた「fetch → 欠損時フォールバック → stale 警告 → 取り出し」を集約する。
 * **module-level メモリキャッシュは持たない**（`r2-storage-design.md` 準拠。
 * キャッシュは Next.js / CDN 層に委譲し、re-push 直後の取りこぼしや warm isolate の stale 保持を防ぐ）。
 *
 * @example
 * const loadCategories = createSnapshotReader<CategoriesSnapshot, Category[]>({
 *   key: CATEGORIES_SNAPSHOT_KEY,
 *   label: "categories",
 *   select: (s) => s.categories,
 *   fallback: [],
 * });
 *
 * @returns snapshot から `select` した値を返す async ローダ（リクエスト毎に R2 を直接 fetch）
 */
export function createSnapshotReader<TSnapshot, TData>(
  options: SnapshotReaderOptions<TSnapshot, TData>,
): () => Promise<TData> {
  const {
    key,
    label,
    select,
    fallback,
    generatedAt = defaultGeneratedAt,
    staleAfterDays = DEFAULT_STALE_AFTER_DAYS,
  } = options;

  return async function loadSnapshot(): Promise<TData> {
    const snapshot = await fetchFromR2AsJson<TSnapshot>(key);
    if (!snapshot) {
      logger.warn({ key, label }, `${label} snapshot が R2 に存在しません`);
      return fallback;
    }

    const generated = generatedAt(snapshot);
    if (generated) {
      const ageDays =
        (Date.now() - new Date(generated).getTime()) / (1000 * 60 * 60 * 24);
      if (ageDays > staleAfterDays) {
        logger.warn(
          { key, label, generatedAt: generated, ageDays: Math.round(ageDays) },
          `${label} snapshot が ${staleAfterDays} 日以上古い`,
        );
      }
    }

    return select(snapshot);
  };
}
