#!/usr/bin/env node
/**
 * theme-chart-live-audit — テーマページのチャートが叩く e-Stat リクエストを live 実測する。
 *
 * ★静的な validator (validate-theme-catalog) は「statsDataId が 10 桁か」までしか見られない。
 *   実在しない statsDataId・廃止された cdCat01・全国行を持たない統計表は、
 *   **本番でチャートが空になって初めて分かる**。ここを週次で先回りする。
 *
 * ★監査母集団の単一ソース (CROSS-PAGE-DATA-SSOT-01 WP4):
 *   旧実装は page-components/theme/*.json から独自ロジックで estatParams を抽出していたが、
 *   pyramid の 34 request (props 外・app fetch にハードコード) や composition/donut の展開が
 *   漏れ、130 request しか見ていなかった (期待集合は 192 distinct)。
 *   ここでは正典 `collectThemeDataDependenciesWithProvenance` から機械生成した依存ミラー
 *   `theme-chart-dependencies.generated.json` を読み、期待集合の**全件**を検査する。
 *   ミラーの鮮度は CI (`generate-theme-dependency-mirror.ts --check`) が保証する。
 *
 * 検査項目 (依存ミラーの全 request):
 *   - [not-found]  e-Stat がその statsDataId を返さない (統計表が廃止・ID 誤り)
 *   - [no-rows]    リクエストは通るが 0 件 (cdCat01 等の絞りが実データと合っていない)
 *   - [http-error] API エラー・タイムアウト
 *   - [no-national] 全国行 (areaCode 00000) が無い → 全国表示では 47 県平均へ落ちる (warn)
 * 成功条件: 期待集合と実集合が一致し (limit 無し時)、その全件が成功すること。
 *
 * read-only。e-Stat API を叩くだけで R2 にも git にも書かない (state JSON の出力のみ)。
 *
 * Usage:
 *   node .claude/scripts/audit/theme-chart-live-audit.mjs [--json <path>] [--limit N]
 *
 * 要 env: NEXT_PUBLIC_ESTAT_APP_ID (apps/web/.env.development に公開 ID あり)
 */
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "../../..");
const DEPENDENCY_MIRROR = path.join(
  import.meta.dirname,
  "theme-chart-dependencies.generated.json",
);
const ESTAT_ENDPOINT =
  "https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData";

function parseArgs() {
  const argv = process.argv.slice(2);
  let json = null;
  let limit = Infinity;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--json" && argv[i + 1]) json = argv[++i];
    if (argv[i] === "--limit" && argv[i + 1]) limit = Number(argv[++i]);
  }
  return { json, limit };
}

function resolveAppId() {
  if (process.env.NEXT_PUBLIC_ESTAT_APP_ID) return process.env.NEXT_PUBLIC_ESTAT_APP_ID;
  // CI/ローカルとも .env.development (公開 ID・git tracked) を最後の拠り所にする
  try {
    const env = readFileSync(
      path.join(PROJECT_ROOT, "apps/web/.env.development"),
      "utf8",
    );
    return env.match(/^NEXT_PUBLIC_ESTAT_APP_ID=(.+)$/m)?.[1]?.trim().replace(/^["']|["']$/g, "");
  } catch {
    return undefined;
  }
}

/**
 * 依存ミラー (正典 collector の機械生成物) を読み、期待 request 集合を返す。
 * ミラーの各 request は `{ statsDataId, filters, themeKey, componentKey, componentType }`。
 * e-Stat に送る params は `{ statsDataId, ...filters }` に平坦化する。
 */
function loadExpectedRequests() {
  let mirror;
  try {
    mirror = JSON.parse(readFileSync(DEPENDENCY_MIRROR, "utf8"));
  } catch (error) {
    console.error(
      `依存ミラーを読めません: ${DEPENDENCY_MIRROR}\n` +
        `生成: npx tsx packages/data-configs/scripts/generate-theme-dependency-mirror.ts\n` +
        String(error).slice(0, 120),
    );
    process.exit(1);
  }
  const requests = (mirror.requests ?? []).map((r) => ({
    theme: r.themeKey,
    componentKey: r.componentKey,
    componentType: r.componentType,
    params: { statsDataId: r.statsDataId, ...(r.filters ?? {}) },
  }));
  return { requests, distinctExpected: mirror.distinctRequests ?? requests.length };
}

/**
 * 一過性の失敗 (5xx / 429 / timeout) は再試行する。
 * ★誤検知を出す監査は運用で無視されるようになる。e-Stat は実測で単発の 503 を返すことがあり
 *   (2026-08-04: 1 回目 503 → 直後の 3 回は 200)、1 発で alert を上げてはならない。
 */
async function fetchWithRetry(url, attempts = 3) {
  let last = { status: "http-error", detail: "unknown" };
  for (let i = 0; i < attempts; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, 1000 * 2 ** (i - 1)));
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      if (res.ok) return { res };
      // 4xx は再試行しても同じ (パラメータが誤っている)
      if (res.status < 500 && res.status !== 429) {
        return { error: { status: "http-error", detail: `HTTP ${res.status}` } };
      }
      last = { status: "http-error", detail: `HTTP ${res.status} (${attempts} 回試行)` };
    } catch (error) {
      last = { status: "http-error", detail: `${String(error).slice(0, 80)} (${attempts} 回試行)` };
    }
  }
  return { error: last };
}

async function inspect(appId, params) {
  const query = new URLSearchParams({ appId, limit: "200", ...params });
  const { res, error } = await fetchWithRetry(`${ESTAT_ENDPOINT}?${query}`);
  if (error) return error;

  let body;
  try {
    body = await res.json();
  } catch {
    return { status: "http-error", detail: "JSON parse failed" };
  }

  const statistical = body?.GET_STATS_DATA?.STATISTICAL_DATA;
  const resultStatus = body?.GET_STATS_DATA?.RESULT?.STATUS;
  if (resultStatus !== 0 && resultStatus !== "0") {
    const msg = body?.GET_STATS_DATA?.RESULT?.ERROR_MSG ?? `status ${resultStatus}`;
    return { status: "not-found", detail: String(msg).slice(0, 120) };
  }
  const values = [].concat(statistical?.DATA_INF?.VALUE ?? []);
  if (values.length === 0) return { status: "no-rows", detail: "0 件" };

  const hasNational = values.some((v) => v["@area"] === "00000");
  return {
    status: "ok",
    rows: values.length,
    hasNational,
    tableTitle: String(statistical?.TABLE_INF?.TITLE?.$ ?? statistical?.TABLE_INF?.TITLE ?? "")
      .slice(0, 80),
  };
}

async function main() {
  const { json, limit } = parseArgs();
  const appId = resolveAppId();
  if (!appId) {
    console.error("NEXT_PUBLIC_ESTAT_APP_ID が解決できません");
    process.exit(1);
  }

  const { requests: allRequests, distinctExpected } = loadExpectedRequests();
  const partial = Number.isFinite(limit) && limit < allRequests.length;
  const requests = allRequests.slice(0, limit);
  console.log(`## テーマチャート live 監査`);
  console.log(`期待集合 (依存ミラー): ${distinctExpected} distinct request`);
  console.log(`対象リクエスト: ${requests.length} 件${partial ? " (--limit で一部のみ)" : ""}\n`);

  const results = [];
  const errors = [];
  const warns = [];

  for (const req of requests) {
    const outcome = await inspect(appId, req.params);
    const where = `${req.theme}/${req.componentKey}`;
    const label = `${where} (${req.params.statsDataId}${req.params.cdCat01 ? ` cdCat01=${req.params.cdCat01}` : ""})`;
    results.push({ ...req, ...outcome });

    if (outcome.status !== "ok") {
      errors.push(`[${outcome.status}] ${label}: ${outcome.detail}`);
    } else if (!outcome.hasNational) {
      warns.push(`[no-national] ${label}: 全国行なし → 全国表示は 47 県平均になる`);
    }
    // e-Stat のレート制限を避ける
    await new Promise((r) => setTimeout(r, 250));
  }

  if (warns.length > 0) {
    console.log(`⚠️  warn ${warns.length} 件 (全国行なし)`);
    for (const w of warns.slice(0, 20)) console.log("   " + w);
    if (warns.length > 20) console.log(`   … 他 ${warns.length - 20} 件`);
    console.log("");
  }

  // 期待集合と実集合が一致するか (limit 無し時)。ミラー破損や slice バグの陰性対照。
  const coverageOk = partial || results.length === distinctExpected;

  if (json) {
    mkdirSync(path.dirname(path.resolve(json)), { recursive: true });
    writeFileSync(
      path.resolve(json),
      JSON.stringify(
        {
          auditedAt: new Date().toISOString(),
          distinctExpected,
          audited: results.length,
          partial,
          coverageOk,
          errorCount: errors.length,
          warnCount: warns.length,
          results,
        },
        null,
        2,
      ),
    );
    console.log(`JSON: ${json}`);
  }

  if (!coverageOk) {
    console.error(
      `\n❌ 期待集合と実集合が一致しません: 期待 ${distinctExpected} / 検査 ${results.length}`,
    );
    console.error("依存ミラーを再生成: npx tsx packages/data-configs/scripts/generate-theme-dependency-mirror.ts");
    process.exit(1);
  }

  if (errors.length > 0) {
    console.error(`\n❌ ${errors.length} 件のチャートが実データを取れません`);
    for (const e of errors) console.error("   " + e);
    console.error("\n是正: catalog の estatParams / segments / cdCat01 を e-Stat の現行仕様に合わせる");
    console.error("規約: .claude/rules/theme-catalog-standards.md");
    process.exit(1);
  }

  if (partial) {
    console.log(`\n⚠️  --limit で一部のみ検査 (${results.length}/${distinctExpected})。全件監査は --limit なしで実行する`);
    process.exit(0);
  }

  console.log(`✅ 期待集合 ${distinctExpected} request 全件が実データを返した (期待=実集合=成功)`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
