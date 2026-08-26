import { logger } from "@stats47/logger";

import { fetchFromR2AsString } from "./fetch";
import { shouldSkipRemoteR2Read } from "../utils/should-skip-remote-r2-read";

const DEFAULT_STALE_AFTER_DAYS = 30;
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_ATTEMPTS = 1;

type SnapshotFetcher = (key: string) => Promise<string | null>;

export type SnapshotReadResult<TData> =
  | { readonly status: "ok"; readonly data: TData; readonly attempts: number }
  | { readonly status: "no-data"; readonly attempts: number }
  | {
      readonly status: "source-unavailable";
      readonly reason: "transport-error" | "timeout";
      readonly error: Error;
      readonly attempts: number;
    }
  | {
      readonly status: "schema-invalid";
      readonly reason: "malformed-json" | "schema-invalid";
      readonly error: Error;
      readonly attempts: number;
    }
  | {
      readonly status: "stale";
      readonly data: TData;
      readonly generatedAt: string;
      readonly ageDays: number;
      readonly attempts: number;
    };

export interface SnapshotReader<TData> {
  /** 互換loader。404だけfallbackし、破損・取得失敗はthrowする。 */
  (): Promise<TData>;
  /** page adapterが欠損・障害・schema不正・staleを区別するための結果。 */
  readResult(): Promise<SnapshotReadResult<TData>>;
}

export interface SnapshotReaderOptions<TSnapshot, TData> {
  /** R2 キー（`app/` プレフィックス必須） */
  readonly key: string;
  /** ログ用ラベル（例: `"categories"`） */
  readonly label: string;
  /** JSON.parse 後の unknown を検証し、必要なら旧schemaを現行形へ移行する。 */
  readonly parse: (value: unknown) => TSnapshot;
  /** snapshot から配信データを取り出す */
  readonly select: (snapshot: TSnapshot) => TData;
  /** snapshot が R2 に存在しないときのフォールバック値。省略時はcompat loaderもthrowする。 */
  readonly fallback?: TData;
  /** snapshot の生成時刻アクセサ（stale 判定用）。既定で `snapshot.generatedAt` を読む */
  readonly generatedAt?: (snapshot: TSnapshot) => string | undefined;
  /** stale 警告の閾値日数（既定 30） */
  readonly staleAfterDays?: number;
  /** 1回の取得上限（既定10秒） */
  readonly timeoutMs?: number;
  /** transport error / timeoutだけを再試行する回数（既定1回） */
  readonly maxAttempts?: number;
  /** 決定的test用。productionでは指定しない。 */
  readonly fetchText?: SnapshotFetcher;
  /** 決定的stale test用。productionでは指定しない。 */
  readonly now?: () => Date;
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
): SnapshotReader<TData> {
  const {
    key,
    label,
    parse,
    select,
    fallback,
    generatedAt = defaultGeneratedAt,
    staleAfterDays = DEFAULT_STALE_AFTER_DAYS,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
    fetchText = fetchFromR2AsString,
    now = () => new Date(),
  } = options;

  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
    throw new Error("maxAttempts must be a positive integer");
  }
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new Error("timeoutMs must be a positive number");
  }

  async function fetchOnce(): Promise<string | null> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        fetchText(key),
        new Promise<never>((_resolve, reject) => {
          timer = setTimeout(() => {
            const error = new Error(`${label} snapshot read timed out after ${timeoutMs}ms`);
            error.name = "SnapshotTimeoutError";
            reject(error);
          }, timeoutMs);
        }),
      ]);
    } finally {
      if (timer !== undefined) clearTimeout(timer);
    }
  }

  async function readResult(): Promise<SnapshotReadResult<TData>> {
    let raw: string | null = null;
    let transportError: Error | null = null;
    let attempts = 0;

    for (attempts = 1; attempts <= maxAttempts; attempts += 1) {
      try {
        raw = await fetchOnce();
        transportError = null;
        break;
      } catch (error) {
        transportError = error instanceof Error ? error : new Error(String(error));
      }
    }

    if (transportError) {
      const reason = transportError.name === "SnapshotTimeoutError"
        ? "timeout" as const
        : "transport-error" as const;
      logger.error({ key, label, error: transportError, attempts: maxAttempts }, `${label} snapshot の取得に失敗しました`);
      return {
        status: "source-unavailable",
        reason,
        error: transportError,
        attempts: maxAttempts,
      };
    }

    if (raw === null) {
      if (!shouldSkipRemoteR2Read()) {
        logger.warn({ key, label }, `${label} snapshot が R2 に存在しません`);
      }
      return { status: "no-data", attempts };
    }

    let value: unknown;
    try {
      value = JSON.parse(raw) as unknown;
    } catch (error) {
      const parseError = error instanceof Error ? error : new Error(String(error));
      logger.error({ key, label, error: parseError }, `${label} snapshot のJSONが壊れています`);
      return {
        status: "schema-invalid",
        reason: "malformed-json",
        error: parseError,
        attempts,
      };
    }

    let snapshot: TSnapshot;
    let data: TData;
    try {
      snapshot = parse(value);
      data = select(snapshot);
    } catch (error) {
      const schemaError = error instanceof Error ? error : new Error(String(error));
      logger.error({ key, label, error: schemaError }, `${label} snapshot がschemaに違反しています`);
      return {
        status: "schema-invalid",
        reason: "schema-invalid",
        error: schemaError,
        attempts,
      };
    }

    const generated = generatedAt(snapshot);
    if (generated) {
      const generatedTime = new Date(generated).getTime();
      if (!Number.isFinite(generatedTime)) {
        const error = new Error(`${label} snapshot generatedAt is invalid`);
        return {
          status: "schema-invalid",
          reason: "schema-invalid",
          error,
          attempts,
        };
      }
      const ageDays = (now().getTime() - generatedTime) / (1000 * 60 * 60 * 24);
      if (ageDays > staleAfterDays) {
        logger.warn(
          { key, label, generatedAt: generated, ageDays: Math.round(ageDays) },
          `${label} snapshot が ${staleAfterDays} 日以上古い`,
        );
        return { status: "stale", data, generatedAt: generated, ageDays, attempts };
      }
    }

    return { status: "ok", data, attempts };
  }

  const loadSnapshot = async (): Promise<TData> => {
    const result = await readResult();
    if (result.status === "ok" || result.status === "stale") return result.data;
    if (result.status === "no-data") {
      if ("fallback" in options) return fallback as TData;
      throw new Error(`${label} snapshot is missing`);
    }
    throw result.error;
  };

  loadSnapshot.readResult = readResult;
  return loadSnapshot;
}
