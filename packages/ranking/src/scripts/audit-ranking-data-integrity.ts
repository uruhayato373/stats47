/**
 * audit-ranking-data-integrity — ranking 配信 (R2) の実データ整合性を live 実測で監査する。
 *
 * 背景 (2026-07-27 実測): active な 2,179 ランキングのうち 67 件で
 * `app/ranking/<key>/values.json` が 404 (公開以来ずっとチャートが空)。残り約 2,112 件の
 * values.json は 2026-05-27 (Phase 6) 以降 writer 不在で凍結された stale データ。
 * `item.json` は fresh 生成されるため item.latestYear と values 最新年がズレうる。
 * また `app/home/featured.json` が count:0 に汚染され category/survey の一部も同時に
 * 汚染された障害も過去にあった。いずれも 2 ヶ月間検知されなかった。本スクリプトはこれを
 * 週次で機械検知する **read-only** 監査 (R2 write は一切しない。HEAD/GET のみ)。
 *
 * 別途 Phase C で values.json writer を復活させる予定だが、本監査はそれと独立に
 * 「今の R2 の実態」を検査する (writer が直っても本監査は有効であり続ける)。
 *
 * 検査項目:
 *   (a) item.json 実在      — active 全キーで `app/ranking/<key>/item.json` が 200 か
 *   (b) values.json 実在    — 同上キーで `app/ranking/<key>/values.json` が 200 か
 *   (c) 年整合              — values が 200 のとき item.latestYear.yearCode が
 *                             values の持つ年集合に含まれるか
 *   (d) home featured       — `app/home/featured.json` の count が
 *                             HOME_FEATURED_PROMINENCE の定義数以上か
 *   (e) per-URL 件数下限    — `app/survey/all.json` / 17 category の `items.json` が
 *                             極端に少なくないか (絶対フロア + 前回実行比のドリフト検知)
 *   (f) 正規化 snapshot 実在 — normalizationOptions を持つキーで
 *                             `values-per-*.json` / `national-trend.json` が 200 か
 *   (g) 正規化 値域         — fixture ゲート (lib/normalized-fixtures.ts) の期待レンジに入るか
 *   (h) 正規化 鮮度         — 相対 (values.json との generatedAt 差) と絶対 (現在時刻との差) の
 *                             2 軸。相対だけだと values.json ごと凍結したキーを見逃す
 *   (i) 正典 app/stats      — active キーの `app/stats/<key>/values.json` が実在し rowCount>0 か。
 *                             前回比 rowCount ドリフト (部分崩壊) も見る
 *   (k) レシピ整合         — 値の隣に焼かれた取得レシピが現在の config と一致するか
 *                            (出典が同じでも軸 pin・tab・変換が違えば別の数字になる)
 *   (j) 形状               — 同一 (県, 年) の重複行 / unit が % なのに値が範囲外 /
 *                             47 県に満たない年。取り込み (page-data-batch) と同じ純関数
 *                             (`@stats47/data-configs` の classifyShape) で判定する
 *
 * (j) は 2026-07-30 の実測 (active 2,179 件のうち 209 件が壊れた形状のまま配信) を受けた追加。
 * (i) は payload 全体を取得しているのに `meta.rowCount` しか読んでおらず、
 * 「1,128 行 ≠ 47 県 × 1 年」という自明な矛盾を素通りさせていた。同日に本監査を実行した
 * 結果は違反 0 件 = ✓ OK だった。行が**少なすぎる**側 (0 件) だけを見て、
 * **多すぎる**側を見ていなかったのが穴。追加のネットワークコストは 0。
 *
 * (f)(g)(h) は 2026-07-29 の障害 (values-per-area.json が 100 倍過大な値のまま 2 ヶ月配信) の
 * 再発検知。件数チェックだけでは「値が桁違い」も「writer 不在で凍結」も捕まえられなかった。
 * (g) の期待レンジは writer (generate-ranking-normalized-values.ts) と**同一の定義**を import する。
 *
 * enumeration source: active キー一覧は `app/ranking-items/all.json` を使う
 * (KNOWN_RANKING_KEYS を cross-package import するより単純で、これは本番配信の実体
 * そのもの。isActive:true の件数が実測 2,179 件で確認済みの数と一致することを確認済み)。
 *
 * 使い方:
 *   npx tsx packages/ranking/src/scripts/audit-ranking-data-integrity.ts
 *   npx tsx packages/ranking/src/scripts/audit-ranking-data-integrity.ts --json <path>
 *   npx tsx packages/ranking/src/scripts/audit-ranking-data-integrity.ts --concurrency 25
 *
 * 違反が 1 件でもあれば exit 1。
 */
import * as fs from "node:fs";
import * as path from "node:path";

import {
  EXPECTED_SHAPE_ANOMALY,
  buildRecipe,
  classifyShape,
  findExpectedEmpty,
  getMetricConfig,
  parseRecipe,
  summarizeShape,
  type MetricRecipe,
  type ShapeRow,
} from "@stats47/data-configs";
// HOME_FEATURED_RANKINGS は掲載価値スコアへの一元化で廃止。注目 8 件は生成物が持つ。
import { HOME_FEATURED_PROMINENCE } from "@stats47/data-configs/ranking-prominence";

import surveysMaster from "../data/surveys.json";

import { checkFixtureGates, type FixtureViolation } from "./lib/normalized-fixtures";

const R2_BASE = process.env.R2_PUBLIC_FETCH_URL || "https://storage.stats47.jp";

const CATEGORY_KEYS = [
  "landweather",
  "population",
  "laborwage",
  "agriculture",
  "miningindustry",
  "commercial",
  "economy",
  "construction",
  "energy",
  "tourism",
  "educationsports",
  "administrativefinancial",
  "safetyenvironment",
  "socialsecurity",
  "international",
  "infrastructure",
  "ict",
] as const;

// 前回実行比でカウントが半減 (または 0 化) した場合をドリフトとみなす。
// 2026-07-27 実測でカテゴリ件数は 8 (international) 〜 817 (economy) と幅が大きく、
// 全カテゴリ共通の絶対下限は意味を持たない (international=8 は正常値)。
// そのため「絶対フロア (count===0 は無条件で異常)」+「前回実行比 50% 未満に急減したら異常」
// の 2 段構えにする。初回実行時は baseline が無いので絶対フロアのみ適用する。
const DRIFT_RATIO_THRESHOLD = 0.5;

/**
 * values.json と正規化 snapshot の generatedAt 差の許容日数。
 * sync-snapshots は週次なので 8 日あれば正常運用では絶対に超えない。
 * writer が止まると (2026-07-29 の 2 ヶ月 stale) 必ず超える。
 */
const NORMALIZED_STALE_DAYS = 8;

/**
 * 正規化 snapshot の **絶対鮮度** の上限日数 (現在時刻との差)。
 *
 * NORMALIZED_STALE_DAYS は values.json との**相対**比較なので、values.json 自身も同時に
 * 凍結していると素通りする (2026-07-29 実測: inpatient-rate-per-100k は values.json 05-22 /
 * 正規化 05-21 で 1 日差のため検知できず、100 倍の誤値が残っていた)。
 * writer は sync-snapshots のたびに全 target を上書きするので、正常運用なら 30 日を超えない。
 * 「writer が動かなくなった」ものを相対比較の死角なしに捕まえる。
 */
const NORMALIZED_ABSOLUTE_STALE_DAYS = 30;

const NORM_TYPES = ["per_population", "per_area"] as const;
type NormType = (typeof NORM_TYPES)[number];

interface ItemJson {
  item?: {
    latestYear?: { yearCode?: string };
    isActive?: boolean;
  };
}

interface ValuesJson {
  generatedAt?: string;
  partitions?: Array<{
    yearCode?: string;
    values?: Array<{ areaCode?: string; value?: number | null }>;
  }>;
}

interface StatsValuesJson {
  meta?: { rowCount?: number; recipe?: unknown };
  rows?: unknown[];
}

/**
 * (j) 形状の検査結果。
 *
 * 2026-07-30 実測: active 2,179 件のうち **209 件**が壊れた形状のまま配信されていた
 * (重複行 176 / 単位と値の矛盾 27 / 県の欠落 24)。同日に本監査を実行した結果は
 * 違反 0 件 = ✓ OK で、(a)-(i) のどれも検知できなかった。
 * (i) は payload 全体を取得しているのに `meta.rowCount` しか読んでいなかったため、
 * 「1,128 行 ≠ 47 県 × 1 年」という自明な矛盾が素通りしていた。
 *
 * 判定は取り込み (page-data-batch) と**同じ純関数** `@stats47/data-configs` の
 * `classifyShape` を使う。追加のネットワークコストは 0 (rows は既に取得済み)。
 */
interface ShapeChecks {
  checked: number;
  /** 検査種別ごとの違反件数 */
  byCheck: Record<string, number>;
  /** allowlist で降格されない違反 */
  violations: Array<{ key: string; check: string; message: string }>;
  /** allowlist で降格された違反の件数 (是正の残数) */
  allowedCount: number;
  /** 配信側 app/ranking/<key>/values.json の partition 内で areaCode が重複しているキー */
  deliveryDuplicates: string[];
  /**
   * 配信側の重複のうち、正典 app/stats 側が allowlist 済みのもの。**違反にしない**。
   *
   * 配信側は正典から決定的に変換されるだけなので、正典が壊れていれば配信側も壊れる。
   * これを独立した違反に数えると根本データが直るまで監査が永久に赤くなり、
   * 「赤いのが常態」になって新しい問題が埋もれる (normalized.expectedSkipped と同じ理由)。
   * 独立した違反として扱うのは「正典は健全なのに配信側だけ壊れている」= 生成器のバグだけ。
   */
  deliveryDuplicatesExpected: string[];
  ok: boolean;
}

/**
 * (k) レシピ整合の検査結果。
 *
 * 「この値は**現在の config** で作れるか」を見る。値の隣に焼かれた
 * `meta.recipe.configHash` と `buildRecipe(getMetricConfig(key)).configHash` を突き合わせる。
 *
 * ★出典 (statsDataId) が同じでも、軸 pin・tab 選択・線形結合・軸合算・率・地域軸が
 * 変われば別の数字になる。config を直しても R2 を再生成していなければ古い値が
 * 配信され続けるが、(a)-(j) はどれもそれを検知できない (形は正しいので通ってしまう)。
 *
 * `unbaked` は違反ではなく**残数**。レシピ導入 (2026-07-30) 以前に書かれた payload には
 * レシピが無く、全面再生成が終わるまでは正常な状態。前回比で増えたときだけ fail する
 * (縮小専用ラチェット)。0 になったら必須化する。
 *
 * 追加のネットワークコストは 0 (payload は (i) で取得済み)。
 */
interface RecipeChecks {
  checked: number;
  /** レシピが焼かれていない (旧 payload)。違反ではなく残数 */
  unbaked: string[];
  /** 焼かれたレシピが現在の config と食い違う = R2 が stale */
  drift: Array<{ key: string; baked: string; current: string; diff: string }>;
  /** config が registry に無い (公開だけ残っている) */
  configMissing: string[];
  ok: boolean;
}

interface NationalTrendJson {
  generatedAt?: string;
  series?: Array<{ basis?: string; points?: unknown[] }>;
}

interface RankingItemsAll {
  count: number;
  items: Array<{
    rankingKey: string;
    isActive?: boolean;
    latestYear?: { yearCode?: string };
    calculation?: {
      normalizationOptions?: Array<{ type?: string }>;
    };
  }>;
}

/** 正規化系 (f)(g)(h) の検査結果 */
interface NormalizedChecks {
  /** normalizationOptions を持つ active キー数 */
  expectedKeys: number;
  /** normType ごとの「宣言している / 実在する」件数 */
  perType: Record<string, { declared: number; present: number }>;
  /** national-trend.json が実在するキー数 */
  trendPresent: number;
  /** 欠落 (宣言しているのに 200 でない) */
  missing: Array<{ key: string; artifact: string }>;
  /** 鮮度違反。kind="relative" = values.json との差 / "absolute" = 現在時刻との差 */
  stale: Array<{ key: string; artifact: string; ageDays: number; kind: "relative" | "absolute" }>;
  /** 値域違反 */
  fixtureViolations: FixtureViolation[];
  /**
   * EXPECTED_EMPTY 済みキー由来の欠落/stale。**違反にしない**。
   *
   * 正典 app/stats が空なら writer は正しく生成をスキップするので、正規化 snapshot が
   * 無い/古いのは (i) で追跡済みの既知課題の**結果**であって独立した問題ではない。
   * これを違反に数えると根本データが直るまで監査が永久に赤くなり、
   * 「赤いのが常態」になって新しい問題が埋もれる (本ゲート群が防ごうとしている失敗そのもの)。
   */
  expectedSkipped: string[];
  ok: boolean;
}

/**
 * (i) 正典 `app/stats/<key>/values.json` の検査結果。
 *
 * 2026-07-29 実測: active 2,179 件のうち 6 件が rowCount:0 のまま本番公開されていた。
 * 配信側 `app/ranking/<key>/values.json` には旧データが残るためページは正常に見え、
 * (a)-(h) のどれも検知できなかった (すべて app/ranking しか見ていないため)。
 */
interface StatsChecks {
  checked: number;
  /** app/stats が 404 */
  missing: string[];
  /** rowCount 0 (allowlist 未登録のもののみ) */
  empty: string[];
  /** rowCount 0 だが EXPECTED_EMPTY で許可済み */
  emptyAllowed: string[];
  /** 前回比で rowCount が閾値未満に急減 (部分崩壊。0 件検査では捕まらない) */
  drift: Array<{ key: string; count: number; previous: number }>;
  /** ネットワーク断等で判定不能 (違反にはしない) */
  unreachable: number;
  /** 次回のドリフト判定 baseline (key → rowCount) */
  rowCounts?: Record<string, number>;
  ok: boolean;
}

interface CountSnapshot {
  home: number;
  survey: number;
  categories: Record<string, number>;
  /** (i) の前回比ドリフト用 */
  statsRowCounts: Record<string, number>;
  /** (k) の縮小専用ラチェット用。レシピ未焼き込みの残数 */
  recipeUnbaked?: number;
}

interface AuditReport {
  generatedAt: string;
  r2Base: string;
  totals: {
    activeKeys: number;
    itemMissing: number;
    valuesMissing: number;
    yearMismatch: number;
  };
  itemMissing: string[];
  valuesMissing: string[];
  yearMismatch: Array<{ key: string; itemYear: string | undefined; valuesYears: string[] }>;
  countChecks: {
    home: { count: number; expected: number; ok: boolean };
    survey: { count: number; expectedFloor: number; ok: boolean; driftOk: boolean };
    categories: Record<
      string,
      { count: number; ok: boolean; driftOk: boolean; previous?: number }
    >;
  };
  normalized: NormalizedChecks;
  stats: StatsChecks;
  shape: ShapeChecks;
  recipe: RecipeChecks;
  ok: boolean;
}

/**
 * 正規化 artifact の鮮度を 2 軸で検査する。
 * - relative: values.json との差 (writer だけ止まったケース)
 * - absolute: 現在時刻との差 (values.json ごと凍結したケース = 相対比較の死角)
 */
function checkFreshness(
  key: string,
  artifact: string,
  baseGeneratedAt: string | undefined,
  artifactGeneratedAt: string | undefined,
  now: number,
): NormalizedChecks["stale"] {
  const out: NormalizedChecks["stale"] = [];
  const rel = ageInDays(baseGeneratedAt, artifactGeneratedAt);
  if (rel !== null && rel > NORMALIZED_STALE_DAYS) {
    out.push({ key, artifact, ageDays: Math.round(rel), kind: "relative" });
  }
  const abs = artifactGeneratedAt ? (now - Date.parse(artifactGeneratedAt)) / 86_400_000 : null;
  if (abs !== null && Number.isFinite(abs) && abs > NORMALIZED_ABSOLUTE_STALE_DAYS) {
    out.push({ key, artifact, ageDays: Math.round(abs), kind: "absolute" });
  }
  return out;
}

/** 2 つの ISO 日時の差 (日) を返す。パース不能なら null */
/**
 * レシピ差分を 1 行で説明する。hash が違うことだけ言われても直せないので、
 * 「どのフィールドがどう変わったか」まで出す。
 */
function describeRecipeDiff(baked: MetricRecipe, current: MetricRecipe): string {
  const parts: string[] = [];
  const b = (baked.estatParams ?? {}) as Record<string, string | undefined>;
  const c = (current.estatParams ?? {}) as Record<string, string | undefined>;
  for (const k of new Set([...Object.keys(b), ...Object.keys(c)])) {
    if (b[k] !== c[k]) parts.push(`${k}: ${b[k] ?? "(なし)"} → ${c[k] ?? "(なし)"}`);
  }
  const bo = JSON.stringify(baked.ops ?? null);
  const co = JSON.stringify(current.ops ?? null);
  if (bo !== co) parts.push(`ops: ${bo} → ${co}`);
  if (baked.kind !== current.kind) parts.push(`kind: ${baked.kind} → ${current.kind}`);
  return parts.length > 0 ? parts.join(" / ") : "(estatParams/ops は同一。refetch 等の差)";
}

function ageInDays(a: string | undefined, b: string | undefined): number | null {
  if (!a || !b) return null;
  const ta = Date.parse(a);
  const tb = Date.parse(b);
  if (!Number.isFinite(ta) || !Number.isFinite(tb)) return null;
  return Math.abs(ta - tb) / 86_400_000;
}

// ---- プロキシ対応 fetch (ローカル企業ネットワーク越しの実行を許容する) ----
// 参考実装: packages/estat-api/src/core/client/http-client.ts の getProxyDispatcher。
// undici は本パッケージの直接依存ではないため動的 import + try/catch で握りつぶす
// (依存が無い環境・Cloudflare Workers 等では素の fetch にフォールバック)。
let cachedDispatcher: unknown | null | undefined;
async function getProxyDispatcher(): Promise<unknown | null> {
  if (cachedDispatcher !== undefined) return cachedDispatcher;
  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  if (!proxyUrl) {
    cachedDispatcher = null;
    return null;
  }
  try {
    const { ProxyAgent } = await import("undici");
    cachedDispatcher = new ProxyAgent(proxyUrl);
    return cachedDispatcher;
  } catch {
    cachedDispatcher = null;
    return null;
  }
}

async function fetchR2(pathname: string, timeoutMs = 20000): Promise<Response> {
  const dispatcher = await getProxyDispatcher();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const opts: RequestInit & { dispatcher?: unknown } = { signal: controller.signal };
    if (dispatcher) opts.dispatcher = dispatcher;
    return await fetch(`${R2_BASE}/${pathname}`, opts);
  } finally {
    clearTimeout(timer);
  }
}

async function mapPool<T, R>(items: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx]);
      }
    }),
  );
  return out;
}

async function fetchJson<T>(pathname: string): Promise<{ status: number; body: T | null }> {
  try {
    const res = await fetchR2(pathname);
    if (!res.ok) return { status: res.status, body: null };
    return { status: res.status, body: (await res.json()) as T };
  } catch {
    // network エラー (timeout / DNS / proxy 断) は 0 として区別する (404 と混同しない)
    return { status: 0, body: null };
  }
}

function loadPreviousSnapshot(jsonOutPath: string | undefined): CountSnapshot | null {
  if (!jsonOutPath) return null;
  try {
    if (!fs.existsSync(jsonOutPath)) return null;
    const prev = JSON.parse(fs.readFileSync(jsonOutPath, "utf8")) as AuditReport;
    const categories: Record<string, number> = {};
    for (const [key, v] of Object.entries(prev.countChecks?.categories ?? {})) {
      categories[key] = v.count;
    }
    return {
      home: prev.countChecks?.home?.count ?? 0,
      survey: prev.countChecks?.survey?.count ?? 0,
      categories,
      statsRowCounts: prev.stats?.rowCounts ?? {},
      // 前回レポートに recipe が無い (本検査の導入前) なら undefined = ラチェット無効
      recipeUnbaked: prev.recipe?.unbaked?.length,
    };
  } catch {
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const jsonIdx = args.indexOf("--json");
  const jsonOutPath = jsonIdx >= 0 ? args[jsonIdx + 1] : undefined;
  const concIdx = args.indexOf("--concurrency");
  const concurrency = concIdx >= 0 ? Number(args[concIdx + 1]) : 25;

  const previous = loadPreviousSnapshot(jsonOutPath);
  const now = Date.now();

  console.log(`# ranking データ整合性 監査 (${new Date().toISOString()})`);
  console.log(`R2 base: ${R2_BASE}\n`);

  // --- enumeration: app/ranking-items/all.json の isActive:true 件を対象にする ---
  const allRes = await fetchJson<RankingItemsAll>("app/ranking-items/all.json");
  if (!allRes.body) {
    console.error(`✗ app/ranking-items/all.json 取得失敗 (status ${allRes.status})`);
    process.exit(1);
  }
  const activeItems = allRes.body.items.filter((i) => i.isActive !== false);
  console.log(`対象キー: ${activeItems.length} 件 (全 ${allRes.body.items.length} 件中 active)`);

  // --- (a)(b)(c): per-key item.json / values.json ---
  const itemMissing: string[] = [];
  const valuesMissing: string[] = [];
  const yearMismatch: Array<{ key: string; itemYear: string | undefined; valuesYears: string[] }> = [];

  // (i) 正典 app/stats の集計器
  const stats: StatsChecks = {
    checked: 0, missing: [], empty: [], emptyAllowed: [], drift: [], unreachable: 0, ok: true,
  };
  const statsRowCounts: Record<string, number> = {};
  const auditNow = new Date();

  // (j) 形状の集計器
  const shape: ShapeChecks = {
    checked: 0,
    byCheck: {},
    violations: [],
    allowedCount: 0,
    deliveryDuplicates: [],
    deliveryDuplicatesExpected: [],
    ok: true,
  };

  // (k) レシピ整合の集計器
  const recipe: RecipeChecks = { checked: 0, unbaked: [], drift: [], configMissing: [], ok: true };

  // (f)(g)(h) 正規化系の集計器
  const normalized: NormalizedChecks = {
    expectedKeys: 0,
    perType: Object.fromEntries(NORM_TYPES.map((t) => [t, { declared: 0, present: 0 }])),
    trendPresent: 0,
    missing: [],
    stale: [],
    fixtureViolations: [],
    expectedSkipped: [],
    ok: true,
  };

  await mapPool(activeItems, concurrency, async (entry) => {
    const key = entry.rankingKey;
    const declaredTypes = (entry.calculation?.normalizationOptions ?? [])
      .map((o) => o.type)
      .filter((t): t is NormType => (NORM_TYPES as readonly string[]).includes(t ?? ""));

    const [itemRes, valuesRes, statsRes] = await Promise.all([
      fetchJson<ItemJson>(`app/ranking/${key}/item.json`),
      fetchJson<ValuesJson>(`app/ranking/${key}/values.json`),
      fetchJson<StatsValuesJson>(`app/stats/${key}/values.json`),
    ]);

    // --- (i) 正典 app/stats ---
    // 配信側 (app/ranking) が 200 でも正典が空なら「更新できないページ」なので、
    // values.json の有無に関わらず先に判定する。
    if (statsRes.status === 0) {
      stats.unreachable++; // network 断は違反にしない (fetchJson が 404 と区別している意図を活かす)
    } else if (statsRes.status === 404) {
      stats.checked++;
      stats.missing.push(key);
    } else {
      stats.checked++;
      const rowCount = statsRes.body?.meta?.rowCount ?? statsRes.body?.rows?.length ?? 0;
      statsRowCounts[key] = rowCount;
      if (rowCount === 0) {
        if (findExpectedEmpty(key, "prefecture", auditNow)) stats.emptyAllowed.push(key);
        else stats.empty.push(key);
      } else {
        const prev = previous?.statsRowCounts?.[key];
        if (prev !== undefined && prev > 0 && rowCount < prev * DRIFT_RATIO_THRESHOLD) {
          stats.drift.push({ key, count: rowCount, previous: prev });
        }

        // --- (k) レシピ整合 -------------------------------------------------
        // 「この値は現在の config で作れるか」。同じく追加コスト 0。
        const recipeConfig = getMetricConfig(key);
        recipe.checked++;
        if (!recipeConfig) {
          recipe.configMissing.push(key);
        } else {
          const baked = parseRecipe(statsRes.body?.meta?.recipe);
          const current = buildRecipe(recipeConfig);
          if (!baked) {
            recipe.unbaked.push(key);
          } else if (baked.configHash !== current.configHash) {
            recipe.drift.push({
              key,
              baked: baked.configHash,
              current: current.configHash,
              diff: describeRecipeDiff(baked, current),
            });
          }
        }

        // --- (j) 形状 -----------------------------------------------------
        // payload は上で既に取得済みなので追加コスト 0。取り込みと同じ純関数で判定する。
        const config = recipeConfig;
        if (config) {
          shape.checked++;
          const violations = classifyShape({
            key,
            entity: "prefecture",
            summary: summarizeShape((statsRes.body?.rows ?? []) as ShapeRow[]),
            unit: config.unit,
            now: auditNow,
            allowlist: EXPECTED_SHAPE_ANOMALY,
          });
          for (const v of violations) {
            shape.byCheck[v.check] = (shape.byCheck[v.check] ?? 0) + 1;
            if (v.isError) shape.violations.push({ key, check: v.check, message: v.message });
            else shape.allowedCount++;
          }
        }
      }
    }

    // --- (j-2) 配信側の重複 ------------------------------------------------
    // 取り込みが直っても generate-ranking-values が壊す経路を独立に捕まえる。
    // これも既に取得済みの payload を見るだけ。
    if (valuesRes.status === 200 && valuesRes.body?.partitions) {
      const duplicated = valuesRes.body.partitions.some((p) => {
        const seen = new Set<string>();
        for (const v of p.values ?? []) {
          const code = v.areaCode ?? "";
          if (seen.has(code)) return true;
          seen.add(code);
        }
        return false;
      });
      if (duplicated) {
        // 正典側が既知の壊れなら配信側の重複はその帰結。生成器のバグと区別する。
        const sourceKnownBroken = EXPECTED_SHAPE_ANOMALY.some(
          (e) => e.key === key && e.check === "duplicate-area-year",
        );
        if (sourceKnownBroken) shape.deliveryDuplicatesExpected.push(key);
        else shape.deliveryDuplicates.push(key);
      }
    }

    if (itemRes.status !== 200 || !itemRes.body) {
      itemMissing.push(key);
    }
    if (valuesRes.status !== 200 || !valuesRes.body) {
      valuesMissing.push(key);
      return; // values が無ければ年整合も正規化検査も判定不能
    }
    const itemYear = itemRes.body?.item?.latestYear?.yearCode;
    const valuesYears = [
      ...new Set((valuesRes.body.partitions ?? []).map((p) => p.yearCode).filter((y): y is string => Boolean(y))),
    ];
    if (itemYear && valuesYears.length > 0 && !valuesYears.includes(itemYear)) {
      yearMismatch.push({ key, itemYear, valuesYears });
    }

    // --- (f)(g)(h) 正規化 snapshot ---
    if (declaredTypes.length === 0) return;
    // 正典が空と分かっているキーは writer が正しくスキップするため、欠落/stale を違反にしない
    if (findExpectedEmpty(key, "prefecture", auditNow)) {
      normalized.expectedSkipped.push(key);
      return;
    }
    normalized.expectedKeys++;
    const baseGeneratedAt = valuesRes.body.generatedAt;

    const [trendRes, ...normRes] = await Promise.all([
      fetchJson<NationalTrendJson>(`app/ranking/${key}/national-trend.json`),
      ...declaredTypes.map((t) =>
        fetchJson<ValuesJson>(`app/ranking/${key}/values-${t.replace(/_/g, "-")}.json`),
      ),
    ]);

    if (trendRes.status === 200 && (trendRes.body?.series?.length ?? 0) > 0) {
      normalized.trendPresent++;
      normalized.stale.push(
        ...checkFreshness(key, "national-trend.json", baseGeneratedAt, trendRes.body?.generatedAt, now),
      );
    } else {
      normalized.missing.push({ key, artifact: "national-trend.json" });
    }

    declaredTypes.forEach((normType, i) => {
      normalized.perType[normType].declared++;
      const res = normRes[i];
      const artifact = `values-${normType.replace(/_/g, "-")}.json`;

      if (res.status !== 200 || !res.body || (res.body.partitions?.length ?? 0) === 0) {
        normalized.missing.push({ key, artifact });
        return;
      }
      normalized.perType[normType].present++;

      normalized.stale.push(
        ...checkFreshness(key, artifact, baseGeneratedAt, res.body.generatedAt, now),
      );

      // (g) 値域: 最新年 partition を fixture ゲートにかける
      const latest = res.body.partitions?.[0];
      if (latest) {
        const valuesByAreaCode = new Map<string, number | null>(
          (latest.values ?? []).map((v) => [v.areaCode ?? "", v.value ?? null]),
        );
        normalized.fixtureViolations.push(
          ...checkFixtureGates({
            rankingKey: key,
            normType,
            yearCode: latest.yearCode ?? "",
            valuesByAreaCode,
          }),
        );
      }
    });
  });

  stats.ok =
    stats.missing.length === 0 && stats.empty.length === 0 && stats.drift.length === 0;

  // allowlist で降格されたものは違反にしない (是正待ちの既知分で監査を永久に赤くしない)。
  // 「赤いのが常態」になると新しい問題が埋もれる — 本ゲート群が防ごうとしている失敗そのもの。
  shape.ok = shape.violations.length === 0 && shape.deliveryDuplicates.length === 0;

  normalized.ok =
    normalized.missing.length === 0 &&
    normalized.stale.length === 0 &&
    normalized.fixtureViolations.length === 0;

  // --- (d) home featured ---
  const homeRes = await fetchJson<{ count: number }>("app/home/featured.json");
  const homeCount = homeRes.body?.count ?? 0;
  const homeExpected = HOME_FEATURED_PROMINENCE.length;
  const homeOk = homeRes.status === 200 && homeCount >= homeExpected;

  // --- (e) survey / category 件数下限 ---
  const surveyRes = await fetchJson<{ count: number }>("app/survey/all.json");
  const surveyCount = surveyRes.body?.count ?? 0;
  // 絶対フロア: master (surveys.json, 75件) の半数を下回れば明確に異常。
  const surveyFloor = Math.floor((surveysMaster as unknown[]).length / 2);
  const surveyAbsOk = surveyRes.status === 200 && surveyCount >= surveyFloor;
  const surveyDriftOk =
    previous === null || previous.survey === 0 ? true : surveyCount >= previous.survey * DRIFT_RATIO_THRESHOLD;

  const categoryChecks: AuditReport["countChecks"]["categories"] = {};
  await mapPool(CATEGORY_KEYS as unknown as string[], 10, async (catKey) => {
    const res = await fetchJson<{ count: number }>(`app/category/${catKey}/items.json`);
    const count = res.body?.count ?? 0;
    const absOk = res.status === 200 && count > 0; // 絶対フロア: 0 件は無条件で異常
    const prevCount = previous?.categories[catKey];
    const driftOk = prevCount === undefined || prevCount === 0 ? true : count >= prevCount * DRIFT_RATIO_THRESHOLD;
    categoryChecks[catKey] = { count, ok: absOk, driftOk, ...(prevCount !== undefined ? { previous: prevCount } : {}) };
  });

  const countChecksOk =
    homeOk &&
    surveyAbsOk &&
    surveyDriftOk &&
    Object.values(categoryChecks).every((c) => c.ok && c.driftOk);

  // (k) 判定。drift と configMissing は即違反、unbaked は**増えたときだけ**違反
  // (全面再生成が終わるまでは残っているのが正常なので、減る方向だけを強制する)
  const prevUnbaked = previous?.recipeUnbaked;
  const unbakedGrew = prevUnbaked !== undefined && recipe.unbaked.length > prevUnbaked;
  recipe.ok = recipe.drift.length === 0 && recipe.configMissing.length === 0 && !unbakedGrew;

  const report: AuditReport = {
    generatedAt: new Date().toISOString(),
    r2Base: R2_BASE,
    totals: {
      activeKeys: activeItems.length,
      itemMissing: itemMissing.length,
      valuesMissing: valuesMissing.length,
      yearMismatch: yearMismatch.length,
    },
    itemMissing: itemMissing.sort(),
    valuesMissing: valuesMissing.sort(),
    yearMismatch: yearMismatch.sort((a, b) => a.key.localeCompare(b.key)),
    countChecks: {
      home: { count: homeCount, expected: homeExpected, ok: homeOk },
      survey: { count: surveyCount, expectedFloor: surveyFloor, ok: surveyAbsOk, driftOk: surveyDriftOk },
      categories: categoryChecks,
    },
    normalized,
    stats: { ...stats, rowCounts: statsRowCounts },
    shape,
    recipe,
    ok:
      itemMissing.length === 0 &&
      valuesMissing.length === 0 &&
      yearMismatch.length === 0 &&
      countChecksOk &&
      normalized.ok &&
      stats.ok &&
      shape.ok &&
      recipe.ok,
  };

  // ---- レポート出力 ----
  console.log(`\n## (a)(b) item.json / values.json 実在`);
  console.log(`  item.json 欠落: ${itemMissing.length} 件`);
  console.log(`  values.json 欠落: ${valuesMissing.length} 件`);
  if (valuesMissing.length > 0) {
    console.log(`    ${valuesMissing.slice(0, 20).join(", ")}${valuesMissing.length > 20 ? " …" : ""}`);
  }
  if (itemMissing.length > 0) {
    console.log(`  item.json 欠落キー: ${itemMissing.slice(0, 20).join(", ")}${itemMissing.length > 20 ? " …" : ""}`);
  }

  console.log(`\n## (c) 年整合 (item.latestYear ∈ values の年集合)`);
  console.log(`  不整合: ${yearMismatch.length} 件`);
  for (const m of yearMismatch.slice(0, 20)) {
    console.log(`    ${m.key}: item=${m.itemYear} values=[${m.valuesYears.join(",")}]`);
  }
  if (yearMismatch.length > 20) console.log(`    … 他 ${yearMismatch.length - 20} 件 (--json で全件)`);

  console.log(`\n## (d) home featured`);
  console.log(`  count=${homeCount} (期待 >= ${homeExpected}) ${homeOk ? "✓" : "✗"}`);

  console.log(`\n## (e) survey / category 件数下限`);
  console.log(
    `  survey: count=${surveyCount} (絶対フロア >= ${surveyFloor}${surveyAbsOk ? " ✓" : " ✗"}, drift ${surveyDriftOk ? "✓" : "✗"})`,
  );
  for (const [key, c] of Object.entries(categoryChecks)) {
    const prevStr = c.previous !== undefined ? ` prev=${c.previous}` : "";
    console.log(`  category/${key}: count=${c.count}${prevStr} ${c.ok && c.driftOk ? "✓" : "✗"}`);
  }

  console.log(`\n## (f)(g)(h) 正規化 snapshot (values-per-*.json / national-trend.json)`);
  console.log(`  対象キー (normalizationOptions 保持): ${normalized.expectedKeys} 件`);
  for (const [type, c] of Object.entries(normalized.perType)) {
    console.log(`    ${type}: 宣言 ${c.declared} / 実在 ${c.present}`);
  }
  console.log(`    national-trend: 実在 ${normalized.trendPresent}`);
  if (normalized.expectedSkipped.length > 0) {
    console.log(
      `  (EXPECTED_EMPTY のため検査対象外: ${normalized.expectedSkipped.length} 件 — ${normalized.expectedSkipped.join(", ")})`,
    );
  }
  console.log(`  (f) 欠落: ${normalized.missing.length} 件`);
  for (const m of normalized.missing.slice(0, 10)) console.log(`      ${m.key} / ${m.artifact}`);
  if (normalized.missing.length > 10)
    console.log(`      … 他 ${normalized.missing.length - 10} 件 (--json で全件)`);
  console.log(
    `  (g) 値域違反: ${normalized.fixtureViolations.length} 件 (期待レンジは lib/normalized-fixtures.ts)`,
  );
  for (const v of normalized.fixtureViolations.slice(0, 10)) console.log(`      ${v.message}`);
  const staleRel = normalized.stale.filter((s) => s.kind === "relative").length;
  const staleAbs = normalized.stale.filter((s) => s.kind === "absolute").length;
  console.log(
    `  (h) 鮮度違反: ${normalized.stale.length} 件 ` +
      `(relative>${NORMALIZED_STALE_DAYS}日=${staleRel} / absolute>${NORMALIZED_ABSOLUTE_STALE_DAYS}日=${staleAbs})`,
  );
  for (const s of normalized.stale.slice(0, 10))
    console.log(`      ${s.key} / ${s.artifact} (${s.kind} ${s.ageDays} 日)`);
  if (normalized.stale.length > 10)
    console.log(`      … 他 ${normalized.stale.length - 10} 件 (--json で全件)`);

  console.log(`\n## (i) 正典 app/stats/<key>/values.json`);
  console.log(`  検査: ${stats.checked} 件 (取得不能 ${stats.unreachable} 件は判定対象外)`);
  console.log(`  404 欠落: ${stats.missing.length} 件`);
  for (const k of stats.missing.slice(0, 10)) console.log(`      ${k}`);
  console.log(`  rowCount 0 (未許可): ${stats.empty.length} 件 ← 公開中だが更新不能`);
  for (const k of stats.empty.slice(0, 10)) console.log(`      ${k}`);
  console.log(`  rowCount 0 (EXPECTED_EMPTY 許可済): ${stats.emptyAllowed.length} 件`);
  for (const k of stats.emptyAllowed.slice(0, 10)) console.log(`      ${k}`);
  console.log(`  前回比ドリフト (< ${DRIFT_RATIO_THRESHOLD}): ${stats.drift.length} 件`);
  for (const d of stats.drift.slice(0, 10)) console.log(`      ${d.key}: ${d.previous} → ${d.count}`);
  if (stats.empty.length > 0 || stats.missing.length > 0) {
    console.log(
      `  → 是正: config の statsDataId / cdCat01 を e-Stat メタで再確認し再取り込み。` +
        `意図した 0 件なら packages/data-configs/src/expected-empty.ts に理由・追跡先・期限を添えて登録`,
    );
  }

  console.log(`\n## (j) 形状 (重複行 / 単位と値の矛盾 / 県のカバレッジ)`);
  console.log(`  検査: ${shape.checked} 件`);
  const checkLabels: Record<string, string> = {
    "duplicate-area-year": "同一 (県, 年) の重複行",
    "percent-out-of-range": "unit が % なのに値が範囲外",
    "area-coverage": "47 県に満たない年がある",
    "raw-truncated": "e-Stat 応答の打ち切り",
  };
  for (const [check, n] of Object.entries(shape.byCheck).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${checkLabels[check] ?? check}: ${n} 件`);
  }
  console.log(`  allowlist 許可済 (是正の残数): ${shape.allowedCount} 件`);
  console.log(`  違反 (未許可): ${shape.violations.length} 件`);
  for (const v of shape.violations.slice(0, 10)) console.log(`      ${v.message}`);
  if (shape.violations.length > 10) {
    console.log(`      … 他 ${shape.violations.length - 10} 件`);
  }
  console.log(
    `  配信側 partition の areaCode 重複 (生成器のバグ): ${shape.deliveryDuplicates.length} 件`,
  );
  for (const k of shape.deliveryDuplicates.slice(0, 10)) console.log(`      ${k}`);
  console.log(
    `  同 (正典が既知の壊れ = その帰結。違反にしない): ${shape.deliveryDuplicatesExpected.length} 件`,
  );
  if (shape.violations.length > 0) {
    console.log(
      `  → 是正: 未指定の分類軸を diagnose-unpinned-axes.ts で列挙して config に pin する。` +
        `既知の是正待ちなら packages/data-configs/src/expected-shape-anomaly.ts に登録`,
    );
  }

  console.log(`\n## (k) レシピ整合 (値の隣のレシピ = 現在の config か)`);
  console.log(`  検査: ${recipe.checked} 件`);
  console.log(
    `  未焼き込み (旧 payload・残数): ${recipe.unbaked.length} 件` +
      (prevUnbaked !== undefined ? ` (前回 ${prevUnbaked})` : " (前回なし=ラチェット無効)"),
  );
  if (unbakedGrew) {
    console.log(`      ★増加している。取り込みが meta.recipe を焼けていない可能性`);
  }
  console.log(`  config 不在: ${recipe.configMissing.length} 件`);
  if (recipe.configMissing.length > 0) {
    console.log(`      ${recipe.configMissing.slice(0, 10).join(", ")}`);
  }
  console.log(`  ★ドリフト (R2 が stale): ${recipe.drift.length} 件`);
  for (const d of recipe.drift.slice(0, 10)) {
    console.log(`      ${d.key}: ${d.diff}`);
  }
  if (recipe.drift.length > 10) console.log(`      … 他 ${recipe.drift.length - 10} 件`);
  if (recipe.drift.length > 0) {
    console.log(
      `  → 是正: config を直したあと R2 を再生成する ` +
        `(page-data-batch --metric <keys> → diff-push-r2 --prefix app/stats)`,
    );
  }

  console.log(`\n## 総合判定: ${report.ok ? "✓ OK" : "✗ 違反あり"}`);

  if (jsonOutPath) {
    fs.mkdirSync(path.dirname(jsonOutPath), { recursive: true });
    fs.writeFileSync(jsonOutPath, JSON.stringify(report, null, 2));
    console.log(`\n書き出し: ${jsonOutPath}`);
  }

  if (!report.ok) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
