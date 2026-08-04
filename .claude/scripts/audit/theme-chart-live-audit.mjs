#!/usr/bin/env node
/**
 * theme-chart-live-audit — テーマページのチャートが叩く e-Stat リクエストを live 実測する。
 *
 * ★静的な validator (validate-theme-catalog) は「statsDataId が 10 桁か」までしか見られない。
 *   実在しない statsDataId・廃止された cdCat01・全国行を持たない統計表は、
 *   **本番でチャートが空になって初めて分かる**。ここを週次で先回りする。
 *
 * 検査項目 (page-components theme/*.json の estatParams 全件):
 *   - [not-found]  e-Stat がその statsDataId を返さない (統計表が廃止・ID 誤り)
 *   - [no-rows]    リクエストは通るが 0 件 (cdCat01 等の絞りが実データと合っていない)
 *   - [http-error] API エラー・タイムアウト
 *   - [no-national] 全国行 (areaCode 00000) が無い → 全国表示では 47 県平均へ落ちる (warn)
 *
 * read-only。e-Stat API を叩くだけで R2 にも git にも書かない (state JSON の出力のみ)。
 *
 * Usage:
 *   node .claude/scripts/audit/theme-chart-live-audit.mjs [--json <path>] [--limit N]
 *
 * 要 env: NEXT_PUBLIC_ESTAT_APP_ID (apps/web/.env.development に公開 ID あり)
 */
import { readdirSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "../../..");
const THEME_DIR = path.join(
  PROJECT_ROOT,
  "apps/web/scripts/data/page-components/theme",
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

/** page-components から e-Stat リクエストを一意に抽出する */
function collectRequests() {
  const seen = new Map(); // cacheKey → request
  for (const file of readdirSync(THEME_DIR).filter((f) => f.endsWith(".json"))) {
    const theme = file.replace(/\.json$/, "");
    const components = JSON.parse(readFileSync(path.join(THEME_DIR, file), "utf8"));

    for (const comp of components) {
      const key = comp.componentKey ?? comp.component_key ?? "(no-key)";
      const props = comp.componentProps ?? comp.component_props ?? {};
      const groups = [props.estatParams, props.columnParams, props.lineParams];

      // composition / donut / cpi 系は segments + statsDataId で個別リクエストになる
      if (props.statsDataId && Array.isArray(props.segments)) {
        for (const seg of props.segments) {
          if (seg?.code) groups.push({ statsDataId: props.statsDataId, cdCat01: seg.code });
        }
        if (props.totalCode) {
          groups.push({ statsDataId: props.statsDataId, cdCat01: props.totalCode });
        }
      }

      for (const group of groups) {
        if (!group) continue;
        for (const params of Array.isArray(group) ? group : [group]) {
          if (!params?.statsDataId) continue;
          const cacheKey = JSON.stringify(params, Object.keys(params).sort());
          if (seen.has(cacheKey)) continue;
          seen.set(cacheKey, { theme, componentKey: key, params });
        }
      }
    }
  }
  return [...seen.values()];
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

  const requests = collectRequests().slice(0, limit);
  console.log(`## テーマチャート live 監査`);
  console.log(`対象リクエスト: ${requests.length} 件\n`);

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

  if (json) {
    mkdirSync(path.dirname(path.resolve(json)), { recursive: true });
    writeFileSync(
      path.resolve(json),
      JSON.stringify(
        {
          auditedAt: new Date().toISOString(),
          total: requests.length,
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

  if (errors.length > 0) {
    console.error(`\n❌ ${errors.length} 件のチャートが実データを取れません`);
    for (const e of errors) console.error("   " + e);
    console.error("\n是正: page-components の estatParams を e-Stat の現行仕様に合わせる");
    console.error("規約: .claude/rules/theme-catalog-standards.md");
    process.exit(1);
  }

  console.log(`✅ 全 ${requests.length} リクエストが実データを返した`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
