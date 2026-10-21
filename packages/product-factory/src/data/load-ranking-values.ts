/**
 * R2 (公開 URL) から ranking 観測値を取得するリーダ。
 * `app/ranking/<key>/values.json` の最新フル 47 県 partition を返す。
 * 出典メタ (調査名・statsDataId 等) は values.json に無いため、スナップショット TS 側で手記する。
 *
 * CLI: `npx tsx src/data/load-ranking-values.ts <rankingKey>`
 */
import { PREFECTURE_CODES5, toCode5 } from "./prefectures";
import { pathToFileURL } from "node:url";
import { SITE } from "@stats47/data-configs";

const R2_BASE = process.env.R2_PUBLIC_FETCH_URL ?? SITE.r2PublicBaseUrl;

interface RankingValueRecord {
  readonly areaCode: string;
  readonly value: number | null;
  readonly unit?: string;
  readonly yearCode?: string;
}
interface Partition {
  readonly yearCode: string;
  readonly count: number;
  readonly values: readonly RankingValueRecord[];
}
interface RankingValuesPayload {
  readonly rankingKey: string;
  readonly areaType: string;
  readonly partitions: readonly Partition[];
}

export interface FetchedValues {
  readonly rankingKey: string;
  readonly year: string;
  readonly unit: string;
  readonly values: readonly { code5: string; value: number | null }[];
}

const FETCH_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 500;

/** 4xx など、取り直しても結果が変わらない失敗。再試行しない */
class PermanentFetchError extends Error {}

/**
 * values.json を取る。接続の失敗と 5xx だけを間隔を空けて再試行する。
 *
 * パックの固定データは 2,000 件超を 1 本ずつ取り、取れなかった指標は理由付きで飛ばす。再試行が無いと 1 回の瞬断で
 * 指標が 1 つ減り、件数を固定したテストが落ちた (2026-10-21 の develop-quality-gate run 39594085606 で P-12 が
 * 2,073 → 2,072。直後の手元の作り直しは 2 回とも 2,073)。4xx は元データが無いので、すぐ失敗にする。
 */
async function fetchValuesPayload(
  url: string,
  rankingKey: string,
  deps: { fetchImpl?: typeof fetch; sleep?: (ms: number) => Promise<void> },
): Promise<RankingValuesPayload> {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const sleep = deps.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  let lastError: unknown;
  for (let attempt = 0; attempt < FETCH_ATTEMPTS; attempt++) {
    try {
      const res = await fetchImpl(url);
      if (res.ok) return (await res.json()) as RankingValuesPayload;
      const message = `R2 fetch 失敗 (${res.status}): ${rankingKey}`;
      if (res.status < 500) throw new PermanentFetchError(message);
      lastError = new Error(message);
    } catch (error) {
      if (error instanceof PermanentFetchError) throw error;
      lastError = error;
    }
    if (attempt < FETCH_ATTEMPTS - 1) await sleep(RETRY_BASE_DELAY_MS * 2 ** attempt);
  }
  throw lastError;
}

/** app/ranking/<key>/values.json から最新の 47 県フル partition を取得する。 */
export async function fetchRankingValues(
  rankingKey: string,
  deps: { fetchImpl?: typeof fetch; sleep?: (ms: number) => Promise<void> } = {},
): Promise<FetchedValues> {
  const payload = await fetchValuesPayload(`${R2_BASE}/app/ranking/${rankingKey}/values.json`, rankingKey, deps);
  const full = payload.partitions
    .filter((p) => p.values.length >= 47)
    .slice()
    .sort((a, b) => a.yearCode.localeCompare(b.yearCode));
  const latest = full[full.length - 1];
  if (!latest) throw new Error(`47 県フルの年が見つからない: ${rankingKey}`);
  const unit = latest.values.find((v) => v.unit)?.unit ?? "";
  const byCode = new Map<string, number | null>();
  for (const v of latest.values) byCode.set(toCode5(v.areaCode), v.value ?? null);
  return {
    rankingKey,
    year: latest.yearCode.slice(0, 4),
    unit,
    values: PREFECTURE_CODES5.map((code5) => ({ code5, value: byCode.get(code5) ?? null })),
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const key = process.argv[2];
  if (!key) {
    console.error("usage: load-ranking-values.ts <rankingKey>");
    process.exit(1);
  }
  fetchRankingValues(key)
    .then((r) => {
      console.log(`year=${r.year} unit=${r.unit} count=${r.values.length}`);
      for (const v of r.values) console.log(`    { code: "${v.code5}", value: ${v.value} },`);
    })
    .catch((e: unknown) => {
      console.error(e instanceof Error ? e.message : String(e));
      process.exit(1);
    });
}
