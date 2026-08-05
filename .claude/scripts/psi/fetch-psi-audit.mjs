/**
 * PageSpeed Insights API 取得スクリプト
 *
 * .claude/config/psi-urls.txt を読み、mobile + desktop 両方で PSI を計測し、
 * .claude/state/metrics/psi/psi-batch-<ISO>.json に結果を保存する。
 *
 * 認証:
 *   PSI API v5 は公開エンドポイントだが、quota を上げるため PSI_API_KEY を使う。
 *   API キーがない場合も動くが、レート制限に引っかかる可能性がある。
 *
 * Usage:
 *   npm run fetch-psi-audit
 *   node .claude/scripts/psi/fetch-psi-audit.mjs --strategy mobile
 *   node .claude/scripts/psi/fetch-psi-audit.mjs --file custom-urls.txt
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const PROJECT_ROOT = resolve(fileURLToPath(import.meta.url), "..", "..", "..", "..");
const DEFAULT_URL_FILE = join(PROJECT_ROOT, ".claude/config/psi-urls.txt");
const OUTPUT_DIR = join(PROJECT_ROOT, ".claude/state/metrics/psi");
const CATEGORIES = ["performance", "accessibility", "best-practices", "seo"];
const DEFAULT_STRATEGIES = ["mobile", "desktop"];

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { file: DEFAULT_URL_FILE, strategies: DEFAULT_STRATEGIES };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--file") opts.file = args[++i];
    else if (args[i] === "--strategy") opts.strategies = [args[++i]];
  }
  return opts;
}

function readUrls(path) {
  return readFileSync(path, "utf-8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
}

async function fetchPsi(url, strategy) {
  const params = new URLSearchParams();
  params.append("url", url);
  params.append("strategy", strategy);
  for (const cat of CATEGORIES) params.append("category", cat);
  if (process.env.PSI_API_KEY) params.append("key", process.env.PSI_API_KEY);

  const endpoint = `https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed?${params.toString()}`;
  const res = await fetch(endpoint);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PSI API ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.json();
}

function extractLcpElement(audits) {
  // 2026-04 時点の Lighthouse v13 では lcp-breakdown-insight の details.items
  // が [subpart-table, node-info, ...] の配列になる（item に type:"node" が含まれる）。
  const audit = audits["lcp-breakdown-insight"] || audits["largest-contentful-paint-element"];
  if (!audit) return null;
  const items = audit.details?.items || [];
  const nodeItem = items.find((it) => it?.type === "node" || it?.nodeLabel || it?.selector);
  if (!nodeItem) return null;
  const breakdown = {};
  const tableItem = items.find((it) => it?.type === "table" && Array.isArray(it?.items));
  if (tableItem) {
    for (const row of tableItem.items) {
      if (row?.subpart && row?.duration != null) {
        breakdown[row.subpart] = Math.round(row.duration);
      }
    }
  }
  return {
    selector: nodeItem.selector || null,
    node_label: nodeItem.nodeLabel || null,
    snippet:
      typeof nodeItem.snippet === "string" ? nodeItem.snippet.slice(0, 300) : null,
    breakdown_ms: Object.keys(breakdown).length > 0 ? breakdown : null,
  };
}

function extractLayoutShiftContributors(audits) {
  const audit = audits["layout-shifts"] || audits["layout-shift-elements"];
  if (!audit) return [];
  const items = audit.details?.items || [];
  return items.slice(0, 5).map((item) => {
    const node = item?.node || {};
    const causes = (item?.subItems?.items || [])
      .map((s) => s?.cause)
      .filter(Boolean);
    return {
      selector: node.selector || null,
      node_label: node.nodeLabel || null,
      score: item?.score ?? null,
      causes: causes.length > 0 ? [...new Set(causes)] : [],
    };
  });
}

/**
 * Lighthouse の `dom-size` から DOM 規模を取り出す。
 *
 * 2026-08-05 の性能改修 (PERF-AREA-DOM-01) で、完了条件が「DOM 9,101 から 70% 削減」
 * だったにもかかわらず **どの自動パイプラインもこの値を保存していなかった**。
 * PSI は毎回 dom-size を計算しているので、保存するだけで以後は cron で裏取りできる。
 *
 * `max_child_elements` も取る。単一 nav に子要素が 873 個ある、といった
 * 「一箇所に集中した肥大」は total だけでは見えないため。
 *
 * 総数は locale 非依存の `numericValue` を第一候補にする。depth / child は
 * `statistic` の英語表記に依存するので、将来 PSI に locale を渡すようになったら
 * null へ縮退する (誤った数値を返すよりよい)。現在 fetchPsi は locale を渡していない。
 */
export function extractDomSize(audits) {
  const audit = audits?.["dom-size"];
  if (!audit) return null;

  // value は Lighthouse のバージョンで数値と {type:"numeric", value} の両方がありうる
  const toNumber = (value) => {
    if (typeof value === "number") return value;
    if (value && typeof value.value === "number") return value.value;
    return null;
  };
  const items = audit.details?.items || [];
  const byStatistic = (keyword) => {
    const item = items.find((i) =>
      String(i?.statistic || "").toLowerCase().includes(keyword),
    );
    return item ? toNumber(item.value) : null;
  };

  return {
    total_elements: toNumber(audit.numericValue) ?? byStatistic("total dom"),
    max_depth: byStatistic("depth"),
    max_child_elements: byStatistic("child"),
  };
}

function extractSummary(data, url, strategy) {
  const lighthouse = data.lighthouseResult || {};
  const categories = lighthouse.categories || {};
  const audits = lighthouse.audits || {};
  const loadingExperience = data.loadingExperience || {};
  const metrics = loadingExperience.metrics || {};

  const pick = (key) =>
    categories[key]?.score != null ? Math.round(categories[key].score * 100) : null;
  const lab = (key) => audits[key]?.numericValue ?? null;
  const field = (key) => {
    const m = metrics[key];
    if (!m) return null;
    return { percentile: m.percentile, category: m.category };
  };

  return {
    url,
    strategy,
    fetched_at: new Date().toISOString(),
    scores: {
      performance: pick("performance"),
      accessibility: pick("accessibility"),
      best_practices: pick("best-practices"),
      seo: pick("seo"),
    },
    lab_data: {
      LCP_ms: lab("largest-contentful-paint"),
      TBT_ms: lab("total-blocking-time"),
      CLS: lab("cumulative-layout-shift"),
      FCP_ms: lab("first-contentful-paint"),
      TTI_ms: lab("interactive"),
      SI_ms: lab("speed-index"),
      TTFB_ms: lab("server-response-time"),
    },
    field_data: {
      LCP: field("LARGEST_CONTENTFUL_PAINT_MS"),
      INP: field("INTERACTION_TO_NEXT_PAINT"),
      CLS: field("CUMULATIVE_LAYOUT_SHIFT_SCORE"),
      FCP: field("FIRST_CONTENTFUL_PAINT_MS"),
      TTFB: field("EXPERIMENTAL_TIME_TO_FIRST_BYTE"),
    },
    dom_size: extractDomSize(audits),
    lcp_element: extractLcpElement(audits),
    cls_contributors: extractLayoutShiftContributors(audits),
    analysis_utc: lighthouse.fetchTime || null,
    final_url: lighthouse.finalUrl || url,
  };
}

async function main() {
  const opts = parseArgs();
  const urls = readUrls(opts.file);
  if (urls.length === 0) {
    console.error(`No URLs found in ${opts.file}`);
    process.exit(2);
  }

  console.log(`PSI 計測対象: ${urls.length} URL × ${opts.strategies.length} strategy`);

  const summaries = [];
  let idx = 0;
  const total = urls.length * opts.strategies.length;
  for (const url of urls) {
    for (const strategy of opts.strategies) {
      idx += 1;
      console.log(`[${idx}/${total}] ${strategy} ${url}`);
      try {
        const data = await fetchPsi(url, strategy);
        summaries.push(extractSummary(data, url, strategy));
      } catch (e) {
        console.error(`  Error: ${e.message?.slice(0, 200)}`);
        summaries.push({ url, strategy, error: e.message?.slice(0, 200) });
      }
    }
  }

  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filepath = join(OUTPUT_DIR, `psi-batch-${timestamp}.json`);
  writeFileSync(
    filepath,
    JSON.stringify(
      { version: 1, generated_at: new Date().toISOString(), results: summaries },
      null,
      2
    ),
    "utf-8"
  );
  console.log(`\n出力: ${filepath}`);
  console.log(`成功: ${summaries.filter((s) => !s.error).length} / ${summaries.length}`);
}

// 直接起動したときだけ実行する。無条件に main() を呼ぶと、テストが
// extractDomSize を import しただけで 38 URL の PSI 計測が走り batch ファイルまで
// 書き出される (2026-08-05 に実際に起きた)。file:// URL は文字列連結で作らない
// (Windows で必ず不一致になる。check-file-url-guard.cjs を参照)。
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error("Fatal:", e.message);
    if (e.stack) console.error(e.stack);
    process.exit(1);
  });
}
