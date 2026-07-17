/**
 * home-featured-v1 実験の sticky assignment (仕様 doc 28 §8)。
 *
 * - localStorage key `stats47_exp_home_featured_v1` に control/editorial を保存し同一 browser で固定
 * - 初回だけ 50/50 (random 注入可・テスト用)
 * - localStorage 不可 (プライベートモード等) は module 内 session cache で session 内だけ固定
 * - 個人情報・乱数値そのものを GA4 に送らない (送るのは variant 名のみ)
 *
 * VariantAdSlot の sticky パターンを参考にしつつ、広告 domain logic は import しない (§8.2)。
 */

export const HOME_FEATURED_EXPERIMENT_ID = "home-featured-v1";
export const HOME_FEATURED_STORAGE_KEY = "stats47_exp_home_featured_v1";

export const HOME_FEATURED_EXPERIMENT_VARIANTS = ["control", "editorial"] as const;
export type HomeFeaturedExperimentVariant =
  (typeof HOME_FEATURED_EXPERIMENT_VARIANTS)[number];

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function isVariant(value: unknown): value is HomeFeaturedExperimentVariant {
  return (HOME_FEATURED_EXPERIMENT_VARIANTS as readonly unknown[]).includes(value);
}

/** 初回割当 (50/50)。random は [0,1) を返す関数 (既定 Math.random・テストで注入)。 */
export function pickHomeFeaturedVariant(
  random: () => number = Math.random,
): HomeFeaturedExperimentVariant {
  return random() < 0.5 ? "control" : "editorial";
}

/** localStorage 不可時の session 内固定 (module 単位で保持) */
let sessionAssignment: HomeFeaturedExperimentVariant | null = null;

/** テスト専用: session cache をリセットする */
export function __resetHomeFeaturedAssignmentForTest(): void {
  sessionAssignment = null;
}

function defaultStorage(): StorageLike | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null; // localStorage アクセス自体が throw する環境 (SecurityError 等)
  }
}

/**
 * sticky assignment を解決する。
 * 優先順: localStorage の妥当な保存値 > session cache > 新規割当 (保存を試行)。
 * storage の getItem/setItem が throw しても crash せず割当を返す (§8.2 例外耐性)。
 */
export function resolveHomeFeaturedAssignment(options?: {
  storage?: StorageLike | null;
  random?: () => number;
}): HomeFeaturedExperimentVariant {
  const storage = options?.storage === undefined ? defaultStorage() : options.storage;

  if (storage) {
    try {
      const stored = storage.getItem(HOME_FEATURED_STORAGE_KEY);
      if (isVariant(stored)) {
        sessionAssignment = stored;
        return stored;
      }
    } catch {
      /* 読み取り不可は新規割当へ */
    }
  }

  if (sessionAssignment) return sessionAssignment;

  const assigned = pickHomeFeaturedVariant(options?.random);
  sessionAssignment = assigned;
  if (storage) {
    try {
      storage.setItem(HOME_FEATURED_STORAGE_KEY, assigned);
    } catch {
      /* 保存不可でも session cache で固定される */
    }
  }
  return assigned;
}
