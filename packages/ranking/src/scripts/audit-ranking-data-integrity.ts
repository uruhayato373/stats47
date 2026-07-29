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
 *                             HOME_FEATURED_RANKINGS の定義数以上か
 *   (e) per-URL 件数下限    — `app/survey/all.json` / 17 category の `items.json` が
 *                             極端に少なくないか (絶対フロア + 前回実行比のドリフト検知)
 *   (f) 正規化 snapshot 実在 — normalizationOptions を持つキーで
 *                             `values-per-*.json` / `national-trend.json` が 200 か
 *   (g) 正規化 値域         — fixture ゲート (lib/normalized-fixtures.ts) の期待レンジに入るか
 *   (h) 正規化 鮮度         — 相対 (values.json との generatedAt 差) と絶対 (現在時刻との差) の
 *                             2 軸。相対だけだと values.json ごと凍結したキーを見逃す
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

import { HOME_FEATURED_RANKINGS } from "@stats47/data-configs";

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
  ok: boolean;
}

interface CountSnapshot {
  home: number;
  survey: number;
  categories: Record<string, number>;
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
    return { home: prev.countChecks?.home?.count ?? 0, survey: prev.countChecks?.survey?.count ?? 0, categories };
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

  // (f)(g)(h) 正規化系の集計器
  const normalized: NormalizedChecks = {
    expectedKeys: 0,
    perType: Object.fromEntries(NORM_TYPES.map((t) => [t, { declared: 0, present: 0 }])),
    trendPresent: 0,
    missing: [],
    stale: [],
    fixtureViolations: [],
    ok: true,
  };

  await mapPool(activeItems, concurrency, async (entry) => {
    const key = entry.rankingKey;
    const declaredTypes = (entry.calculation?.normalizationOptions ?? [])
      .map((o) => o.type)
      .filter((t): t is NormType => (NORM_TYPES as readonly string[]).includes(t ?? ""));

    const [itemRes, valuesRes] = await Promise.all([
      fetchJson<ItemJson>(`app/ranking/${key}/item.json`),
      fetchJson<ValuesJson>(`app/ranking/${key}/values.json`),
    ]);

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

  normalized.ok =
    normalized.missing.length === 0 &&
    normalized.stale.length === 0 &&
    normalized.fixtureViolations.length === 0;

  // --- (d) home featured ---
  const homeRes = await fetchJson<{ count: number }>("app/home/featured.json");
  const homeCount = homeRes.body?.count ?? 0;
  const homeExpected = HOME_FEATURED_RANKINGS.length;
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
    ok:
      itemMissing.length === 0 &&
      valuesMissing.length === 0 &&
      yearMismatch.length === 0 &&
      countChecksOk &&
      normalized.ok,
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
