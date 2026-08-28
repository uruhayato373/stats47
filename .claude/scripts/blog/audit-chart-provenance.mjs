#!/usr/bin/env node
/**
 * audit-chart-provenance.mjs — ブログチャートの出典 (source.json) が
 * 「本当に再取得できるか」を機械的に検査する。
 *
 * ## なぜ存在検査では足りないか
 *
 * `quality-gate.mjs` の系譜 gate は `<name>.json` + `<name>.source.json` の **存在**だけを見る。
 * だが source.json の中身が「出自が data json に無い」(`incomplete: true`) だったり、
 * 参照している rankingKey が既に R2 から消えていたりすると、**存在しても復元できない**。
 * 元データ (data json) を失った瞬間にその図は永久に作り直せなくなる。
 *
 * 2026-07-29 の実測 (898 件): restorable 804 / out-of-scope (authored) 65 /
 * **欠陥 29** (参照そのものが無い 18 + 自己申告 incomplete 11)。
 *
 * 初版は「参照先 rankingKey 消滅 2 件」も欠陥に数えたが、**これは本 checker の誤検知**だった。
 * `rankingKey` に `"a + b"` のように複数キーを連結する規約があり (splitKeys 参照)、
 * 分解せず実在確認したため必ず 404 になっていた。個別キーは全て 200 で健全。
 *
 * ## kind 語彙 (実装が真実源・2026-07-29 実測で 14 種)
 *
 * §1.5 は ranking / estat / manual の 3 種しか記述していなかったが、実際には 14 種あった。
 * ドリフトを止めるため、chart-provenance.mjs に語彙と「再取得に必要なフィールド」を定義し、
 * **未知の kind は error にする** (新しい kind を足したら共有定義も更新する規律)。
 *
 * ## authored は欠陥ではない
 *
 * `kind: "authored"` は記事本文由来の要点テキスト等で、**SSOT 指標ではない**。
 * data json 自体が真実源なので SSOT から再取得できないのが正しい。
 * 「復元不能」と混同して復元を試みると捏造になるため、明示的に対象外とする。
 *
 * Usage:
 *   node .claude/scripts/blog/audit-chart-provenance.mjs [--limit N] [--json] [--staged]
 *
 * 出力: .claude/state/blog/chart-provenance-queue.json (機械用)
 *       .claude/state/blog/chart-provenance-LATEST.md  (人間用)
 * exit: 欠陥 0 → 0 / 欠陥あり → 3 (CI は件数ラチェットで判定する)
 *
 * 正典: .claude/rules/blog-data-schema.md §1.5 / §1.7
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  extractChartSourceReferences,
  inspectChartSourceManifest,
} from '../lib/chart-provenance.mjs';

const PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..'
);
const R2 = process.env.R2_PUBLIC_FETCH_URL || 'https://storage.stats47.jp';
const STATE_DIR = path.join(PROJECT_ROOT, '.claude/state/blog');
const QUEUE_IN = path.join(STATE_DIR, 'svg-lineage-queue.json');
const CONC = 24;
const args = process.argv.slice(2);
const JSON_OUT = args.includes('--json');
const STAGED = args.includes('--staged');
const LIMIT = args.includes('--limit')
  ? Number(args[args.indexOf('--limit') + 1])
  : null;
const ESTAT_APP_ID = process.env.NEXT_PUBLIC_ESTAT_APP_ID || '';
const log = (m) => !JSON_OUT && console.log(m);

/**
 * CDN のキャッシュを迂回する URL を作る。
 *
 * R2 公開 URL は Cloudflare CDN 経由で **404 も一定時間キャッシュされる**
 * (2026-07-29 実測: push 済みのファイルが `cf-cache-status: HIT` / `age: 157` で 404)。
 * 監査がこれを踏むと「参照先が消えた」と誤判定し、ラチェットが誤警報を出す。
 */
function noCache(url) {
  return `${url}${url.includes('?') ? '&' : '?'}__audit=${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
async function getJson(url) {
  try {
    const r = await fetch(noCache(url), { signal: AbortSignal.timeout(15000) });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}

function getStagedSource(entry) {
  if (!STAGED) return null;
  const sourcePath = path.join(
    PROJECT_ROOT,
    '.local/r2/app/blog',
    entry.slug,
    'data',
    `${entry.base}.source.json`
  );
  if (!fs.existsSync(sourcePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  } catch {
    return { __stagedParseError: true };
  }
}
async function exists(url) {
  try {
    const r = await fetch(noCache(url), { signal: AbortSignal.timeout(15000) });
    return r.status === 200;
  } catch {
    return false;
  }
}
async function eStatTableExists(statsDataId) {
  if (!ESTAT_APP_ID) return true;
  const url = new URL(
    'https://api.e-stat.go.jp/rest/3.0/app/json/getMetaInfo'
  );
  url.searchParams.set('appId', ESTAT_APP_ID);
  url.searchParams.set('statsDataId', statsDataId);
  url.searchParams.set('lang', 'J');
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(20_000),
      });
      if (!response.ok) continue;
      const json = await response.json();
      const result = json?.GET_META_INFO?.RESULT;
      if (result?.STATUS === 0) return true;
      if (result && result.STATUS !== 0) return false;
    } catch {
      // 一時的なネットワーク失敗は同じ決定的リクエストを最大3回まで再試行する。
    }
  }
  return false;
}
async function pool(items, fn) {
  const out = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONC, items.length) }, async () => {
      while (i < items.length) {
        const k = i++;
        out[k] = await fn(items[k]);
      }
    })
  );
  return out;
}

if (!fs.existsSync(QUEUE_IN)) {
  console.error(
    `[provenance] ${path.relative(PROJECT_ROOT, QUEUE_IN)} が無い。先に build-lineage-queue.mjs を実行してください`
  );
  process.exit(1);
}
const lineage = JSON.parse(fs.readFileSync(QUEUE_IN, 'utf8'));
let targets = lineage.entries.filter((e) => e.hasSource);
if (LIMIT) targets = targets.slice(0, LIMIT);
log(
  `[provenance] source.json ${targets.length} 件を検査 (系譜 queue ${lineage.entries.length} 件のうち` +
    `${STAGED ? ' / .local/r2 staged優先' : ''})`
);

const keyCache = new Map();
async function rankingKeyExists(key) {
  if (!keyCache.has(key)) {
    keyCache.set(
      key,
      await exists(`${R2}/app/ranking/${encodeURIComponent(key)}/values.json`)
    );
  }
  return keyCache.get(key);
}
const metricKeyCache = new Map();
async function metricKeyExists(key) {
  if (!metricKeyCache.has(key)) {
    const stagedPath = path.join(
      PROJECT_ROOT,
      '.local/r2/app/stats',
      key,
      'values.json'
    );
    metricKeyCache.set(
      key,
      STAGED && fs.existsSync(stagedPath)
        ? true
        : await exists(`${R2}/app/stats/${encodeURIComponent(key)}/values.json`)
    );
  }
  return metricKeyCache.get(key);
}
const estatCache = new Map();
async function eStatDataIdExists(statsDataId) {
  if (!estatCache.has(statsDataId)) {
    estatCache.set(statsDataId, eStatTableExists(statsDataId));
  }
  return estatCache.get(statsDataId);
}

let done = 0;
const rows = await pool(targets, async (e) => {
  const stagedSource = getStagedSource(e);
  const src =
    stagedSource ??
    (await getJson(`${R2}/app/blog/${e.slug}/data/${e.base}.source.json`));
  if (++done % 200 === 0) log(`  ${done}/${targets.length}`);
  const base = { slug: e.slug, base: e.base, chartType: e.chartType };
  if (src?.__stagedParseError)
    return {
      ...base,
      kind: null,
      verdict: 'fetch-failed',
      detail: 'staged source.json を解析できない',
    };
  if (!src)
    return {
      ...base,
      kind: null,
      verdict: 'fetch-failed',
      detail: 'source.json を取得できない',
    };

  const inspection = inspectChartSourceManifest(src);
  const kind = inspection.kind;
  if (inspection.verdict === 'out-of-scope') {
    return {
      ...base,
      kind,
      verdict: 'out-of-scope',
      detail: inspection.detail,
    };
  }
  if (inspection.verdict === 'invalid') {
    return {
      ...base,
      kind,
      verdict: inspection.code,
      detail: inspection.detail,
    };
  }
  const refs = inspection.rankingKeys;
  const present = await pool(refs, rankingKeyExists);
  const dead = refs.filter((_, i) => !present[i]);
  if (dead.length > 0) {
    return {
      ...base,
      kind,
      verdict: 'dead-reference',
      detail: `R2 に無い rankingKey: ${dead.join(', ')}`,
    };
  }
  const { metricKeys, statsDataIds } = extractChartSourceReferences(src);
  const metricPresent = await pool(metricKeys, metricKeyExists);
  const deadMetrics = metricKeys.filter((_, i) => !metricPresent[i]);
  if (deadMetrics.length > 0) {
    return {
      ...base,
      kind,
      verdict: 'dead-metric-reference',
      detail: `R2 に無い metricKey: ${deadMetrics.join(', ')}`,
    };
  }
  const estatPresent = await pool(statsDataIds, eStatDataIdExists);
  const deadEstat = statsDataIds.filter((_, i) => !estatPresent[i]);
  if (deadEstat.length > 0) {
    return {
      ...base,
      kind,
      verdict: 'dead-estat-reference',
      detail: `e-Stat API で取得できない statsDataId: ${deadEstat.join(', ')}`,
    };
  }
  return {
    ...base,
    kind,
    verdict: 'restorable',
    detail:
      refs.length || metricKeys.length || statsDataIds.length
        ? `参照 ${refs.length + metricKeys.length + statsDataIds.length} 件を実在確認`
        : '参照あり',
  };
});

const DEFECTS = new Set([
  'fetch-failed',
  'no-kind',
  'unknown-kind',
  'self-declared-incomplete',
  'missing-reference',
  'dead-reference',
  'dead-metric-reference',
  'dead-estat-reference',
]);
const tally = {};
for (const r of rows) tally[r.verdict] = (tally[r.verdict] ?? 0) + 1;
const defects = rows.filter((r) => DEFECTS.has(r.verdict));

const summary = {
  generatedAt: new Date().toISOString(),
  checked: rows.length,
  byVerdict: tally,
  defectCount: defects.length,
  defects: defects.map((d) => ({
    slug: d.slug,
    base: d.base,
    kind: d.kind,
    verdict: d.verdict,
    detail: d.detail,
  })),
};
fs.mkdirSync(STATE_DIR, { recursive: true });
fs.writeFileSync(
  path.join(STATE_DIR, 'chart-provenance-queue.json'),
  JSON.stringify(summary, null, 2)
);

const byVerdict = Object.entries(tally).sort((a, b) => b[1] - a[1]);
const md = `# ブログチャート出典 (source.json) 再取得可能性 (LATEST)

検査対象: ${rows.length} 件 (source.json を持つチャート)

## 判定
${byVerdict.map(([v, n]) => `- \`${v}\`: **${n}**${DEFECTS.has(v) ? ' ← 欠陥' : ''}`).join('\n')}

**欠陥計: ${defects.length} 件**

## 判定の意味
- \`restorable\` — kind ごとに必要な参照があり、参照先 rankingKey も R2 に実在する
- \`out-of-scope\` — \`kind: "authored"\` (記事本文由来)。SSOT 指標ではないので再取得不能が正しい
- \`self-declared-incomplete\` — source.json 自身が \`incomplete: true\` で「出自不明」と申告している
- \`missing-reference\` — kind が要求する参照フィールドが無い
- \`dead-reference\` — 参照している rankingKey が R2 に存在しない (指標の廃止/改名)
- \`dead-estat-reference\` — 参照している statsDataId が e-Stat API で取得できない
- \`unknown-kind\` — 語彙のドリフト。\`.claude/scripts/lib/chart-provenance.mjs\` の共有定義に追加する

## 欠陥一覧
${defects.length === 0 ? 'なし' : defects.map((d) => `- \`${d.verdict}\` ${d.slug}/${d.base} (kind=${d.kind}) — ${String(d.detail).slice(0, 100)}`).join('\n')}

真実源: \`.claude/state/blog/chart-provenance-queue.json\` / 正典: \`.claude/rules/blog-data-schema.md §1.5\`
`;
fs.writeFileSync(path.join(STATE_DIR, 'chart-provenance-LATEST.md'), md);

if (JSON_OUT) {
  process.stdout.write(JSON.stringify(summary));
} else {
  log('');
  for (const [v, n] of byVerdict)
    log(`  ${String(n).padStart(4)}  ${v}${DEFECTS.has(v) ? '  ← 欠陥' : ''}`);
  log(
    `\n[provenance] 欠陥 ${defects.length} 件 / 書込: .claude/state/blog/chart-provenance-{queue.json,LATEST.md}`
  );
}
process.exit(defects.length > 0 ? 3 : 0);
