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

import { HOME_FEATURED_PROMINENCE } from "@stats47/data-configs/ranking-prominence";

import surveysMaster from "../data/surveys.json";

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

interface ItemJson {
  item?: {
    latestYear?: { yearCode?: string };
    isActive?: boolean;
  };
}

interface ValuesJson {
  partitions?: Array<{ yearCode?: string }>;
}

interface RankingItemsAll {
  count: number;
  items: Array<{
    rankingKey: string;
    isActive?: boolean;
    latestYear?: { yearCode?: string };
  }>;
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
  ok: boolean;
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

  await mapPool(activeItems, concurrency, async (entry) => {
    const key = entry.rankingKey;
    const [itemRes, valuesRes] = await Promise.all([
      fetchJson<ItemJson>(`app/ranking/${key}/item.json`),
      fetchJson<ValuesJson>(`app/ranking/${key}/values.json`),
    ]);

    if (itemRes.status !== 200 || !itemRes.body) {
      itemMissing.push(key);
    }
    if (valuesRes.status !== 200 || !valuesRes.body) {
      valuesMissing.push(key);
      return; // values が無ければ年整合は判定不能
    }
    const itemYear = itemRes.body?.item?.latestYear?.yearCode;
    const valuesYears = [
      ...new Set((valuesRes.body.partitions ?? []).map((p) => p.yearCode).filter((y): y is string => Boolean(y))),
    ];
    if (itemYear && valuesYears.length > 0 && !valuesYears.includes(itemYear)) {
      yearMismatch.push({ key, itemYear, valuesYears });
    }
  });

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
    ok:
      itemMissing.length === 0 &&
      valuesMissing.length === 0 &&
      yearMismatch.length === 0 &&
      countChecksOk,
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
