#!/usr/bin/env node
/**
 * theme-chart-live-audit — テーマページの全チャート依存を R2 配信値で live 実測する。
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
 * 検査項目 (依存ミラーの全 R2 metric):
 *   - values.json の存在・JSON/row構造・有限値・年
 *   - MetricConfig と配信値の unit・recipe configHash 一致
 *   - meta.areaCount と実際の行の地域数一致
 *   - 47県未満は shape-gate SSOT と同じ warn-only (港湾・漁業・職種の正当な部分集計を許容)
 * 移行前互換e-Stat requestが残る期間だけ、従来のAPI実測も同じ母集団で行う。
 * 成功条件: 期待集合と実集合が一致し (limit 無し時)、その全件が成功すること。
 *
 * read-only。公開R2/e-Statを読むだけで R2 にも git にも書かない (指定時のJSON出力のみ)。
 *
 * Usage:
 *   node .claude/scripts/audit/theme-chart-live-audit.mjs [--json <path>] [--limit N]
 *
 * 要 env: NEXT_PUBLIC_ESTAT_APP_ID (apps/web/.env.development に公開 ID あり)
 */
import { existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  classifyNational,
  inspectEstatPayload,
  inspectStatsPayload,
  isFiniteEstatValue,
  parseAuditLimit,
  parseDependencyMirror,
  summarizeAudit,
} from "./theme-chart-live-audit-core.mjs";

export { classifyNational, isFiniteEstatValue } from "./theme-chart-live-audit-core.mjs";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "../../..");
const DEPENDENCY_MIRROR = path.join(
  import.meta.dirname,
  "theme-chart-dependencies.generated.json",
);
const ESTAT_ENDPOINT =
  "https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData";

/**
 * 会社ネットワーク等、直接の外向き通信が遮断され明示 CONNECT だけが通る環境向け。
 * ★CI では HTTPS_PROXY が無いので dispatcher は undefined = 従来どおり素の fetch。
 *   undici が解決できない環境でも落とさない (proxy 無しで続行する)。
 */
function resolveDispatcher() {
  const proxy = process.env.HTTPS_PROXY ?? process.env.https_proxy ?? process.env.HTTP_PROXY;
  if (!proxy) return undefined;
  try {
    const { ProxyAgent } = createRequire(import.meta.url)("undici");
    return new ProxyAgent(proxy);
  } catch {
    return undefined;
  }
}

function parseArgs() {
  const argv = process.argv.slice(2);
  let json = null;
  let rawLimit;
  let staged = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--json" && argv[i + 1]) json = argv[++i];
    if (argv[i] === "--limit") {
      if (!argv[i + 1]) throw new Error("--limit requires a value");
      rawLimit = argv[++i];
    }
    if (argv[i] === "--staged") staged = true;
  }
  return { json, limit: parseAuditLimit(rawLimit), staged };
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
function loadExpectedDependencies() {
  let raw;
  try {
    raw = JSON.parse(readFileSync(DEPENDENCY_MIRROR, "utf8"));
  } catch (error) {
    throw new Error(
      `依存ミラーを読めません: ${DEPENDENCY_MIRROR}; ${String(error).slice(0, 120)}`,
    );
  }
  return parseDependencyMirror(raw);
}

function resolveR2PublicBase() {
  if (process.env.R2_PUBLIC_FETCH_URL) return process.env.R2_PUBLIC_FETCH_URL.replace(/\/+$/, "");
  if (process.env.NEXT_PUBLIC_R2_PUBLIC_URL) {
    return process.env.NEXT_PUBLIC_R2_PUBLIC_URL.replace(/\/+$/, "");
  }
  try {
    const env = readFileSync(path.join(PROJECT_ROOT, "apps/web/.env.development"), "utf8");
    const value = env.match(/^(?:R2_PUBLIC_FETCH_URL|NEXT_PUBLIC_R2_PUBLIC_URL)=(.+)$/m)?.[1];
    if (value) return value.trim().replace(/^["']|["']$/g, "").replace(/\/+$/, "");
  } catch {
    // 公開配信URLは非secret。環境ファイルが無いCIでも既定値でread-only監査を続ける。
  }
  return "https://storage.stats47.jp";
}

/**
 * 一過性の失敗 (5xx / 429 / timeout) は再試行する。
 * ★誤検知を出す監査は運用で無視されるようになる。e-Stat は実測で単発の 503 を返すことがあり
 *   (2026-08-04: 1 回目 503 → 直後の 3 回は 200)、1 発で alert を上げてはならない。
 */
async function fetchWithRetry(url, dispatcher, attempts = 3) {
  let last = { status: "http-error", detail: "unknown" };
  for (let i = 0; i < attempts; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, 1000 * 2 ** (i - 1)));
    try {
      const res = await fetch(url, { dispatcher, signal: AbortSignal.timeout(30_000) });
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

/**
 * e-Stat の値が実データか判定する。「該当なし」「秘匿」は `-` / `‐` / `***` / `X` 等の
 * プレースホルダ文字列で返るため、数値としてパースできるかで見分ける。
 */
async function inspect(appId, params, dispatcher) {
  const query = new URLSearchParams({ appId, limit: "200", ...params });
  const { res, error } = await fetchWithRetry(`${ESTAT_ENDPOINT}?${query}`, dispatcher);
  if (error) return error;

  let payload;
  try {
    payload = await res.json();
  } catch {
    return { status: "malformed-json", detail: "JSON parse failed" };
  }
  return inspectEstatPayload(payload, params);
}

async function inspectR2(metric, dispatcher, publicBase, staged) {
  if (staged) {
    const localPath = path.join(
      PROJECT_ROOT,
      ".local/r2/app/stats",
      metric.metricKey,
      "values.json",
    );
    if (existsSync(localPath)) {
      try {
        return { ...inspectStatsPayload(JSON.parse(readFileSync(localPath, "utf8")), metric), source: "staged" };
      } catch {
        return { status: "malformed-json", detail: "staged JSON parse failed", source: "staged" };
      }
    }
  }
  const { res, error } = await fetchWithRetry(
    `${publicBase}/app/stats/${encodeURIComponent(metric.metricKey)}/values.json`,
    dispatcher,
  );
  if (error) return { ...error, source: "public-r2" };
  let payload;
  try {
    payload = await res.json();
  } catch {
    return { status: "malformed-json", detail: "JSON parse failed", source: "public-r2" };
  }
  return { ...inspectStatsPayload(payload, metric), source: "public-r2" };
}

async function main() {
  const { json, limit, staged } = parseArgs();
  const dispatcher = resolveDispatcher();
  const { requests: allRequests, metrics: allMetrics, distinctExpected } =
    loadExpectedDependencies();
  const allDependencies = [
    ...allRequests.map((request) => ({ kind: "estat", ...request })),
    ...allMetrics.map((metric) => ({ kind: "r2", ...metric })),
  ];
  const partial = limit !== null && limit < allDependencies.length;
  const dependencies = limit === null ? allDependencies : allDependencies.slice(0, limit);
  const appId = allRequests.length > 0 ? resolveAppId() : undefined;
  if (allRequests.length > 0 && !appId) {
    console.error("legacy e-Stat request が残っていますが NEXT_PUBLIC_ESTAT_APP_ID を解決できません");
    process.exit(1);
  }
  const publicBase = resolveR2PublicBase();
  console.log(`## テーマチャート live 監査`);
  console.log(
    `期待集合 (依存ミラー): ${allMetrics.length} R2 metric / ${allRequests.length} legacy e-Stat request`,
  );
  console.log(`対象依存: ${dependencies.length} 件${partial ? " (--limit で一部のみ)" : ""}\n`);
  if (staged) console.log("読み取り: .local/r2 staged優先、未生成keyは公開R2へfallback\n");

  const results = [];
  const errors = [];
  const warns = [];
  const emptyNationalWarns = [];
  const areaCoverageWarns = [];

  for (const dependency of dependencies) {
    const outcome =
      dependency.kind === "estat"
        ? await inspect(appId, dependency.params, dispatcher)
        : await inspectR2(dependency, dispatcher, publicBase, staged);
    const where = `${dependency.theme}/${dependency.componentKey}`;
    const label =
      dependency.kind === "estat"
        ? `${where} (${dependency.params.statsDataId}${dependency.params.cdCat01 ? ` cdCat01=${dependency.params.cdCat01}` : ""})`
        : `${where} (R2 ${dependency.metricKey})`;
    results.push({ ...dependency, ...outcome });

    if (outcome.status !== "ok") {
      errors.push(`[${outcome.status}] ${label}: ${outcome.detail}`);
    } else if (dependency.kind === "r2" && outcome.areaCoverageWarning) {
      areaCoverageWarns.push(`[area-coverage] ${label}: ${outcome.areaCoverageWarning}`);
    } else if (dependency.kind === "estat" && !outcome.hasNational) {
      // 行が無いのか、行はあるが値がプレースホルダなのかを分けて報告する。
      // 前者は統計表の設計、後者は「該当なし」で、是正の打ち手が違う。
      if (outcome.hasNationalRow) {
        emptyNationalWarns.push(
          `[national-row-empty] ${label}: 全国行はあるが値がプレースホルダ (実データ無し)`,
        );
      } else {
        warns.push(`[no-national] ${label}: 全国行なし → 全国表示は 47 県平均になる`);
      }
    }
    // e-Stat のレート制限を避ける
    await new Promise((r) => setTimeout(r, 250));
  }

  for (const [title, list] of [
    ["47都道府県未満 (shape-gate SSOTによりwarn-only)", areaCoverageWarns],
    ["全国行なし", warns],
    ["全国行はあるが値が無い", emptyNationalWarns],
  ]) {
    if (list.length === 0) continue;
    console.log(`⚠️  warn ${list.length} 件 (${title})`);
    for (const w of list.slice(0, 20)) console.log("   " + w);
    if (list.length > 20) console.log(`   … 他 ${list.length - 20} 件`);
    console.log("");
  }

  const summary = summarizeAudit({
    distinctExpected,
    requested: dependencies.length,
    results,
    isPartial: partial,
  });

  if (json) {
    mkdirSync(path.dirname(path.resolve(json)), { recursive: true });
    writeFileSync(
      path.resolve(json),
      JSON.stringify(
        {
          auditedAt: new Date().toISOString(),
          distinctExpected,
          audited: results.length,
          r2MetricExpected: allMetrics.length,
          legacyEstatExpected: allRequests.length,
          staged,
          partial,
          status: summary.status,
          coverageOk: summary.coverageOk,
          errorCount: errors.length,
          warnCount: areaCoverageWarns.length + warns.length + emptyNationalWarns.length,
          areaCoverageWarningCount: areaCoverageWarns.length,
          noNationalCount: warns.length,
          nationalRowEmptyCount: emptyNationalWarns.length,
          results,
        },
        null,
        2,
      ),
    );
    console.log(`JSON: ${json}`);
  }

  if (!summary.coverageOk) {
    console.error(
      `\n❌ 期待集合と実集合が一致しません: 期待 ${distinctExpected} / 検査 ${results.length}`,
    );
    console.error("依存ミラーを再生成: npx tsx packages/data-configs/scripts/generate-theme-dependency-mirror.ts");
    process.exit(1);
  }

  if (errors.length > 0) {
    console.error(`\n❌ ${errors.length} 件のチャート依存が実データ契約を満たしません`);
    for (const e of errors) console.error("   " + e);
    console.error("\n是正: MetricConfig と app/stats/<metric>/values.json の生成・配信状態を一致させる");
    console.error("規約: .claude/rules/theme-catalog-standards.md");
    process.exit(1);
  }

  console.log(`✅ 期待集合 ${distinctExpected} request 全件が実データを返した (期待=実集合=成功)`);
  process.exit(0);
}

// ★直接実行のときだけ main() を回す。テストから pure 関数を import しても走らせない。
// 文字列連結 (`file://${process.argv[1]}`) は Windows で不一致になるため pathToFileURL を使う
// (.claude/rules/coding-standards.md)。
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
