/**
 * R2 (公開 URL) から ranking 観測値を取得するリーダ。
 * `app/ranking/<key>/values.json` の最新フル 47 県 partition を返す。
 * 出典メタ (調査名・statsDataId 等) は values.json に無いため、スナップショット TS 側で手記する。
 *
 * CLI: `npx tsx src/data/load-ranking-values.ts <rankingKey>`
 */
import { PREFECTURE_CODES5, toCode5 } from "./prefectures";

const R2_BASE = process.env.R2_PUBLIC_FETCH_URL ?? "https://storage.stats47.jp";

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

/** app/ranking/<key>/values.json から最新の 47 県フル partition を取得する。 */
export async function fetchRankingValues(rankingKey: string): Promise<FetchedValues> {
  const res = await fetch(`${R2_BASE}/app/ranking/${rankingKey}/values.json`);
  if (!res.ok) throw new Error(`R2 fetch 失敗 (${res.status}): ${rankingKey}`);
  const payload = (await res.json()) as RankingValuesPayload;
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

if (import.meta.url === `file://${process.argv[1]}`) {
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
