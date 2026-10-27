/**
 * 国土数値情報「駅別乗降客数」(S12) を国土交通データプラットフォーム
 * (mlit-data.jp) の GraphQL API から取得し、都道府県別に
 * public/station-passengers/{NN}.json へ書き出す。
 *
 * 各駅レコードは駅ポイント (lat/lon) + 年次乗降客数を持つ。
 * Remotion の StationPassengers コンポーネントが staticFile で読み込む。
 *
 * 実行:
 *   tsx scripts/fetch-station-passengers.ts 22        # 静岡県
 *   tsx scripts/fetch-station-passengers.ts 13 14 22  # 複数県
 *   tsx scripts/fetch-station-passengers.ts all       # 全 47 県
 *
 * API キー: 環境変数 MLIT_API_KEY を使用する。
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { fetchPrefectures, to2DigitPrefCode } from "@stats47/area";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REMOTION_ROOT = resolve(__dirname, "..");
const OUT_DIR = resolve(REMOTION_ROOT, "public/station-passengers");

const DATASET_ID = "nlni_ksj-s12";
const API_URL = "https://www.mlit-data.jp/api/v1/";
const PAGE_SIZE = 1000;

/** 2 桁コード → 正式名称 (`@stats47/area` の prefectures.json が正本。独自の表を持たない) */
const PREF_NAMES: Readonly<Record<string, string>> = Object.fromEntries(
  fetchPrefectures().map((p) => [to2DigitPrefCode(p.prefCode), p.prefName]),
);

function readApiKey(): string {
  if (process.env.MLIT_API_KEY) return process.env.MLIT_API_KEY;
  throw new Error("MLIT_API_KEY が環境変数に見つかりません");
}

interface RawRecord {
  id: string;
  title?: string;
  metadata?: Record<string, unknown>;
}

/** S12 の 1 駅 (駅グループ単位に集約済み) */
interface StationOut {
  /** 駅グループコード */
  code: string;
  name: string;
  line: string;
  operator: string;
  lat: number;
  lon: number;
  /** 年 → 乗降客数 */
  counts: Record<string, number>;
}

interface PrefStationData {
  prefCode: string;
  prefName: string;
  dataset: string;
  source: string;
  /** データのある年 (昇順) */
  years: number[];
  stations: StationOut[];
}

async function postQuery(query: string, apiKey: string): Promise<unknown> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      apikey: apiKey,
    },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    throw new Error(`MLIT API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const json = (await res.json()) as { data?: unknown; errors?: unknown };
  if (json.errors) {
    throw new Error(`GraphQL error: ${JSON.stringify(json.errors).slice(0, 300)}`);
  }
  return json.data;
}

function buildQuery(prefCode: string, nextToken: string | null): string {
  if (nextToken) {
    // GraphQL 文字列リテラルへの埋め込み: バックスラッシュを先にエスケープしてから
    // 二重引用符をエスケープする（順序を逆にすると `\"` が壊れる / 不完全サニタイズ）。
    const esc = nextToken.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    return `query { getAllData(size: ${PAGE_SIZE}, nextDataRequestToken: "${esc}") { nextDataRequestToken data { id title metadata } } }`;
  }
  const filter = `{ AND: [{ attributeName: "DPF:dataset_id", is: "${DATASET_ID}" }, { attributeName: "DPF:prefecture_code", is: "${prefCode}" }] }`;
  return `query { getAllData(size: ${PAGE_SIZE}, term: "", attributeFilter: ${filter}) { nextDataRequestToken data { id title metadata } } }`;
}

async function fetchPrefRecords(prefCode: string, apiKey: string): Promise<RawRecord[]> {
  const all: RawRecord[] = [];
  let token: string | null = null;
  for (let batch = 0; batch < 30; batch++) {
    const data = (await postQuery(buildQuery(prefCode, token), apiKey)) as {
      getAllData?: { nextDataRequestToken?: string | null; data?: RawRecord[] };
    };
    const node = data.getAllData ?? {};
    const recs = node.data ?? [];
    all.push(...recs);
    token = node.nextDataRequestToken ?? null;
    if (recs.length === 0 || !token) break;
  }
  return all;
}

const num = (v: unknown): number => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** メタデータ 1 件を StationOut に変換。乗降客数が全年 0 のものは null。 */
function toStation(meta: Record<string, unknown>): StationOut | null {
  const lat = num(meta["DPF:latitude"]);
  const lon = num(meta["DPF:longitude"]);
  if (lat === 0 || lon === 0) return null;

  const counts: Record<string, number> = {};
  for (const [k, v] of Object.entries(meta)) {
    const m = /^NLNI:joukou_kyakusuu_(\d{4})$/.exec(k);
    if (!m) continue;
    const c = num(v);
    if (c > 0) counts[m[1]] = c;
  }
  if (Object.keys(counts).length === 0) return null;

  return {
    code: String(meta["NLNI:group_code"] ?? meta["NLNI:eki_code"] ?? ""),
    name: String(meta["NLNI:eki_mei"] ?? meta["DPF:title"] ?? ""),
    line: String(meta["NLNI:rosen_mei"] ?? ""),
    operator: String(meta["NLNI:unei_kaisha"] ?? ""),
    lat,
    lon,
    counts,
  };
}

/** 駅グループコード単位で重複排除。総乗降客数が最大のレコードを代表とする。 */
function dedupeByGroup(stations: StationOut[]): StationOut[] {
  const sum = (s: StationOut) =>
    Object.values(s.counts).reduce((a, b) => a + b, 0);
  const best = new Map<string, StationOut>();
  for (const s of stations) {
    const key = s.code || `${s.name}@${s.lat},${s.lon}`;
    const cur = best.get(key);
    if (!cur || sum(s) > sum(cur)) best.set(key, s);
  }
  return [...best.values()];
}

async function buildPref(prefCode: string, apiKey: string): Promise<PrefStationData> {
  const prefName = PREF_NAMES[prefCode] ?? prefCode;
  process.stdout.write(`[fetch] ${prefCode} ${prefName} ...`);
  const raw = await fetchPrefRecords(prefCode, apiKey);

  const stations = dedupeByGroup(
    raw
      .map((r) => (r.metadata ? toStation(r.metadata) : null))
      .filter((s): s is StationOut => s !== null),
  ).sort((a, b) => {
    const max = (s: StationOut) => Math.max(0, ...Object.values(s.counts));
    return max(b) - max(a);
  });

  const yearSet = new Set<number>();
  for (const s of stations) {
    for (const y of Object.keys(s.counts)) yearSet.add(Number(y));
  }
  const years = [...yearSet].sort((a, b) => a - b);

  console.log(` ${raw.length} records → ${stations.length} stations, years ${years.join("/")}`);
  return {
    prefCode,
    prefName,
    dataset: "国土数値情報 駅別乗降客数 (S12)",
    source: "国土交通省 国土数値情報 (国土交通データプラットフォーム経由)",
    years,
    stations,
  };
}

async function main() {
  const apiKey = readApiKey();
  const args = process.argv.slice(2);
  const codes =
    args.length === 0
      ? ["22"]
      : args[0] === "all"
        ? Object.keys(PREF_NAMES)
        : args.map((a) => to2DigitPrefCode(a));

  mkdirSync(OUT_DIR, { recursive: true });
  for (const code of codes) {
    const data = await buildPref(code, apiKey);
    const outPath = resolve(OUT_DIR, `${code}.json`);
    writeFileSync(outPath, JSON.stringify(data));
    console.log(`[write] ${outPath}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
