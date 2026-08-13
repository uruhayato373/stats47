#!/usr/bin/env tsx
/**
 * generate-article-charts.ts
 *
 * docs/21_ブログ記事原稿/<slug>/data/*.json を読み、SVG チャートを生成する固定 CLI スクリプト。
 *
 * Usage:
 *   npx tsx .claude/scripts/blog/generate-article-charts.ts --slug <slug>            # 生成 + placeholder 置換
 *   npx tsx .claude/scripts/blog/generate-article-charts.ts --slug <slug> --dry-run  # JSON syntax 検証のみ
 *   npx tsx .claude/scripts/blog/generate-article-charts.ts --slug <slug> --validate # SVG 品質検証 (CI 用)
 *
 * --validate の検査内容:
 *   data/*.svg と article.md インライン <svg> の両方を対象に、
 *   - ERROR (CI fail): 構造不正 (viewBox/width/height/閉じタグ欠落)
 *   - WARN  (可視化のみ): dark mode 非対応 (@media prefers-color-scheme:dark 欠落) /
 *     theme 依存色の inline 直書き (svg-* class にすべき)
 *   → 品質統一の決定的ゲート。判断は不要 (コードで一律検査)。
 *
 * チャート種別 (ファイル名パターン):
 *   *-prefecture-rankings.json → bar chart (上位 5 + 下位 5)   [実装済み]
 *   *-tile-grid.json           → tile-grid-map (都道府県地図)    [実装済み]
 *   *-timeseries.json          → line chart (時系列・多系列対応)  [実装済み]
 *   *-scatter.json             → scatter chart (正方形・単色)      [実装済み]
 *   *-stacked.json             → stacked-bar                     [TODO]
 *   *-summary-findings.json    → findings card (番号付き要点)     [実装済み]
 *   *-findings.json            → findings card (番号付き要点)     [実装済み]
 *
 * 関連:
 *   - SKILL.md: .claude/skills/blog/generate-article-charts/SKILL.md (chart 種別仕様の詳細)
 *   - workflow: .github/workflows/generate-article-charts.yml (PR で --validate 自動実行)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  lintScatterData,
  lintScatterParity,
  lintScatterQuality,
  lintSvgContent,
  lintSvgSize,
  extractInlineSvgs,
} from '../lib/svg-lint.mjs';
import { inspectChartSourceManifest } from '../lib/chart-provenance.mjs';
import { buildProvenanceLine } from '../lib/svg-provenance.mjs';
// Layer 1 共有ライブラリ (SSoT)。CLI 内インライン生成を廃し svg-builder に一本化。
// tsx 実行のため TS ソースを直接 import する (このスクリプトは tsx で起動する)。
import {
  generateBarChartSvg,
  generateChoroplethSvg,
  generateLineSvg,
  generateScatterSvg,
  generateStackedBarSvg,
  generateFindingsCardSvg,
} from '../../../packages/svg-builder/src/charts/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');

// ---------- 都道府県 名前→コード マップ (scatter / choropleth 用) ----------
const PREF_NAME_TO_CODE = (() => {
  const map = new Map();
  try {
    const raw = fs.readFileSync(
      path.join(PROJECT_ROOT, 'packages/area/src/data/prefectures.json'),
      'utf8'
    );
    for (const p of JSON.parse(raw)) {
      const code2 = String(p.prefCode).slice(0, 2); // "01000" → "01"
      const norm = String(p.prefName).replace(/[都道府県]$/, '');
      map.set(p.prefName, code2);
      map.set(norm, code2);
      if (p.prefName === '北海道') map.set('北海道', code2);
    }
  } catch {
    // フォールバックなし: 見つからなければ code は空文字 (地方色分けは無効化)
  }
  return map;
})();
const prefCodeOf = (name) =>
  PREF_NAME_TO_CODE.get(String(name || '').trim()) || '';

// ---------- CLI 引数 ----------
const args = process.argv.slice(2);
const getArg = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
};
const SLUG = getArg('--slug');
const DRY_RUN = args.includes('--dry-run');
const VALIDATE = args.includes('--validate');
const EXTRACT_INLINE = args.includes('--extract-inline');
// --base: 記事ルート (slug の親)。デフォルトは docs draft。公開済記事の chart 再生成は
//          `--base .local/r2/app/blog` で R2 data を直接対象にできる (Phase 7 で追加)。
const BASE = getArg('--base') || 'docs/21_ブログ記事原稿';

if (!SLUG) {
  console.error('Usage: --slug <slug> [--base <dir>] [--dry-run|--validate]');
  process.exit(1);
}

const ARTICLE_DIR = path.join(PROJECT_ROOT, BASE, SLUG);
const DATA_DIR = path.join(ARTICLE_DIR, 'data');
const ARTICLE_MD = path.join(ARTICLE_DIR, 'article.md');

if (!fs.existsSync(ARTICLE_DIR)) {
  console.error(`[error] Article dir not found: ${ARTICLE_DIR}`);
  process.exit(1);
}
if (!fs.existsSync(DATA_DIR)) {
  // --validate は data/ が無くても article.md のインライン SVG を検査するため継続。
  // それ以外（生成・dry-run）は data/ が無ければ no-op。
  if (!VALIDATE) {
    console.warn(`[warn] Data dir not found: ${DATA_DIR}`);
    console.warn(
      `[warn] Nothing to process. Exiting 0 (no data dir is a no-op).`
    );
    process.exit(0);
  }
}

// ---------- helpers ----------
const log = (msg) => console.log(msg);
const warn = (msg) => console.warn(`[warn] ${msg}`);
const err = (msg) => console.error(`[error] ${msg}`);

function detectChartType(filename, parsed) {
  // filename suffix が曖昧で型を確定できないとき、JSON 内の明示 chartType を fallback に使う。
  // (article.md の埋め込み basename を変えられない復旧記事で、canonical 命名にできない場合の逃げ道)
  const fromName = detectChartTypeFromName(filename);
  if (fromName) return fromName;
  const explicit =
    parsed && typeof parsed === 'object' ? parsed.chartType : null;
  if (
    explicit === 'bar' ||
    explicit === 'tile-grid' ||
    explicit === 'line' ||
    explicit === 'scatter' ||
    explicit === 'stacked-bar' ||
    explicit === 'summary'
  ) {
    return explicit;
  }
  return null;
}

function detectChartTypeFromName(filename) {
  // canonical names
  if (filename.endsWith('-ranking.json')) return 'bar';
  if (filename.endsWith('-map.json')) return 'tile-grid';
  if (filename.endsWith('-timeseries.json')) return 'line';
  if (filename.endsWith('-scatter.json')) return 'scatter';
  if (filename.endsWith('-stacked.json')) return 'stacked-bar';
  if (filename.endsWith('-summary-findings.json')) return 'summary';
  if (filename.endsWith('-findings.json')) return 'summary';
  // alias (既存記事の許容パターン)
  if (filename.endsWith('-prefecture-rankings.json')) return 'bar';
  if (filename.endsWith('-top5-bottom5.json')) return 'bar';
  if (filename.endsWith('-top-bottom.json')) return 'bar';
  if (filename.endsWith('-rate-ranking.json')) return 'bar';
  if (filename.endsWith('-income-ranking.json')) return 'bar';
  if (filename.endsWith('-tile-grid.json')) return 'tile-grid';
  if (filename.endsWith('-tilemap.json')) return 'tile-grid'; // 頻出 alias (gas-ratio-tilemap / chart1-tilemap 等 20+ 枚)
  if (filename.endsWith('-income-map.json')) return 'tile-grid';
  if (filename.endsWith('-ratio-map.json')) return 'tile-grid';
  if (filename.endsWith('-trend.json')) return 'line';
  if (filename.endsWith('-national-trend.json')) return 'line';
  if (filename.endsWith('-rate-scatter.json')) return 'scatter';
  if (filename.endsWith('-breakdown.json')) return 'stacked-bar';
  if (filename.endsWith('-composition.json')) return 'stacked-bar';
  return null;
}

// ---------- 記事 JSON → svg-builder アダプター ----------
// 各 gen*Svg 関数は記事の柔軟な JSON 形式を svg-builder の型安全 API に変換して呼ぶ。

/** areaName 候補を探す共通ヘルパー */
const rawName = (it) => it.pref || it.areaName || it.label || it.name || '';
const normPref = (s) =>
  String(s || '')
    .replace(/[都道府県]$/, '')
    .replace(/^北海$/, '北海道')
    .trim();

/**
 * bar chart: [{ pref, value }] / { data, title, subtitle, unit, layout? }
 * → svg-builder generateBarChartSvg (BarItem[] with separator)
 *
 * 件数は標準の「上位5+下位5」に固定（10件は廃止）。データが10件未満のときだけ
 * 重複しない範囲に自動縮小する。
 * layout（または layoutOverride）:
 *   "columns"（デフォルト）= 横長2列カード（ブログ本文 + X 用）
 *   "portrait"            = 縦長スタックカード（Instagram 用、4:5）
 *   "single"             = 縦1列+中略
 */
function genBarChartSvg(data, layoutOverride) {
  const items = Array.isArray(data) ? data : data.data || [];
  if (!items.length) return `<!-- empty data -->`;
  const title =
    (Array.isArray(data) ? null : data.title) ?? '都道府県別ランキング';
  const subtitle = (Array.isArray(data) ? null : data.subtitle) ?? undefined;
  const source = (Array.isArray(data) ? null : data.source) ?? undefined;
  const unit = (Array.isArray(data) ? null : data.unit) ?? '';
  const palette = (Array.isArray(data) ? null : data.palette) ?? 'red';
  const rightPalette =
    (Array.isArray(data) ? null : data.rightPalette) ?? 'blue';
  // 標準は上位5+下位5 のみ。件数が少ない場合は上下が重複しない範囲に縮小。
  const N = Math.min(5, Math.floor(items.length / 2) || 1);
  const layout =
    layoutOverride ?? (Array.isArray(data) ? null : data.layout) ?? 'columns';
  const highLabel = (Array.isArray(data) ? null : data.highLabel) ?? '上位';
  const lowLabel = (Array.isArray(data) ? null : data.lowLabel) ?? '下位';

  const sorted = [...items].sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  const top = sorted.slice(0, N);
  // 下位 N 件: sorted は降順なので slice(-N) は「下位の中で値が大きい順」=
  // 表示ランク 43→47 と昇順で一致する。reverse すると最下位が先頭に来て
  // 連番ランク (43..47) と名前がズレる (rank fabrication) ため reverse しない。
  const bottom = sorted.slice(-N);

  const barItems = [
    ...top.map((it, i) => ({
      label: `${i + 1}位 ${rawName(it)}`,
      name: rawName(it),
      rank: i + 1,
      value: it.value ?? 0,
    })),
    { label: '…', value: 0, isSeparator: true },
    ...bottom.map((it, i) => ({
      label: `${sorted.length - N + i + 1}位 ${rawName(it)}`,
      name: rawName(it),
      rank: sorted.length - N + i + 1,
      value: it.value ?? 0,
    })),
  ];

  return generateBarChartSvg(barItems, {
    title,
    subtitle,
    source,
    unit,
    palette,
    rightPalette,
    layout,
    highLabel,
    lowLabel,
  });
}

/**
 * tile-grid map: [{ pref, value }] / { data, title, unit }
 * → svg-builder generateChoroplethSvg (ChoroplethItem[])
 */
function genTileGridMapSvg(data) {
  const get = (k) => (Array.isArray(data) ? undefined : data[k]);
  const items = Array.isArray(data) ? data : data.data || [];
  if (!items.length) return `<!-- empty data -->`;
  const title = get('title') ?? '都道府県マップ';
  const unit = get('unit') ?? '';

  const choroplethItems = items
    .filter((it) => typeof it.value === 'number' && isFinite(it.value))
    .map((it) => ({
      code: prefCodeOf(rawName(it)),
      name: normPref(rawName(it)),
      value: it.value,
    }))
    .filter((it) => it.code && it.name);

  if (!choroplethItems.length) return `<!-- empty choropleth data -->`;
  return generateChoroplethSvg(choroplethItems, {
    title,
    unit,
    subtitle: get('subtitle'),
    // D3 カラースキーム名 (例 "Blues" / "Viridis" / "RdYlGn")。未指定時は既定 Reds。
    scheme: get('scheme') ?? get('colorScheme'),
    reverse: get('reverse'),
    showValue: get('showValue'),
    colorMin: get('colorMin'),
    colorMax: get('colorMax'),
    legendLabels: get('legendLabels'),
  });
}

/**
 * line chart: { title, unit, series:[{label,data:[{year,value}]}] }
 *           / { title, unit, data:[{year,value}], label? }
 * → svg-builder generateLineSvg (StatsSchema[])
 * 系列が複数あれば seriesKey="areaCode"、単系列は areaCode を仮置き。
 */
function genLineChartSvg(data) {
  const title = (Array.isArray(data) ? null : data.title) ?? '推移';
  const unit = (Array.isArray(data) ? null : data.unit) ?? '';
  const subtitle = (Array.isArray(data) ? null : data.subtitle) ?? undefined;

  let series = data.series;
  if (!series && Array.isArray(data.data))
    series = [{ label: data.label || '値', data: data.data }];
  if (!series && Array.isArray(data)) series = [{ label: '値', data }];
  series = (series || []).filter((s) => Array.isArray(s.data) && s.data.length);
  if (!series.length) return `<!-- empty line data -->`;

  // StatsSchema[] に変換: areaCode = series インデックス (仮), yearCode = 年
  const statsData = series.flatMap((s, si) =>
    s.data.map((pt) => ({
      metricKey: 'value',
      areaCode: String(si + 1).padStart(2, '0'),
      areaName: s.label || `系列${si + 1}`,
      yearCode: String(pt.year ?? pt.x ?? ''),
      yearName: String(pt.year ?? pt.x ?? ''),
      value:
        typeof pt.value === 'number'
          ? pt.value
          : typeof pt.y === 'number'
            ? pt.y
            : null,
      unit,
    }))
  );

  return generateLineSvg(statsData, {
    title,
    subtitle,
    unit,
    xKey: 'yearCode',
    seriesKey: 'areaCode',
    yLabel: unit ? `${title}（${unit}）` : title,
    legendPosition: series.length > 1 ? 'bottom' : 'bottom',
  });
}

/**
 * scatter: { title, xLabel, yLabel, xUnit?, yUnit?, points:[{label,x,y}] }
 * → svg-builder generateScatterSvg (ScatterPoint[])
 */
function genScatterChartSvg(data) {
  const title = data.title ?? '散布図';
  const xLabel = data.xLabel ?? 'X';
  const yLabel = data.yLabel ?? 'Y';
  const raw = data.points || data.data || [];
  const points = raw
    .filter((p) => typeof p.x === 'number' && typeof p.y === 'number')
    .map((p) => ({
      name: p.label || p.pref || p.areaName || '',
      code: p.code || prefCodeOf(p.label || p.pref || p.areaName || ''),
      x: p.x,
      y: p.y,
    }));
  if (!points.length) return `<!-- empty scatter data -->`;
  return generateScatterSvg(points, {
    title,
    xLabel: data.xUnit ? `${xLabel}（${data.xUnit}）` : xLabel,
    yLabel: data.yUnit ? `${yLabel}（${data.yUnit}）` : yLabel,
  });
}

/**
 * findings card: { title?, findings: string[] | [{text}] } / string[]
 * → svg-builder generateFindingsCardSvg
 */
function genFindingsCardSvg(data) {
  return generateFindingsCardSvg({
    title: (Array.isArray(data) ? null : data.title) ?? undefined,
    findings: Array.isArray(data) ? data : (data.findings ?? []),
  });
}

/** stacked-bar は未実装。stub を返す。 */
function genStubSvg(chartType, name) {
  const W = 680;
  const H = 480;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="#f0f0f0" rx="8"/>
  <text x="${W / 2}" y="${H / 2}" text-anchor="middle" font-size="14" fill="#666">TODO: ${chartType} chart not implemented (${name})</text>
</svg>`;
}

// ---------- SVG lint (共有ライブラリ) ----------
// lint ロジックは .claude/scripts/lib/svg-lint.mjs に集約 (audit-chart-quality.mjs と共有)。

/** ファイルパスから SVG を読んで lint する */
function validateSvg(svgPath) {
  if (!fs.existsSync(svgPath))
    return { errors: ['file not found'], warnings: [] };
  const content = fs.readFileSync(svgPath, 'utf8');
  const filename = path.basename(svgPath);
  const jsonFilename = filename.replace(/\.svg$/, '.json');
  const jsonData = jsonMeta.find((item) => item.file === jsonFilename)?.parsed;
  // filename を渡すと tile-grid でテーマ関連 WARN を抑止する (仕様上テーマ非依存のため)
  const checks = [
    lintSvgContent(content, filename),
    lintSvgSize(filename, content),
    lintScatterQuality(filename, content, jsonData),
    lintScatterParity(filename, content, jsonData),
  ];
  return {
    errors: checks.flatMap((result) => result.errors),
    warnings: checks.flatMap((result) => result.warnings),
  };
}

/** article.md からインライン <svg> を抽出する (ファイルパス版) */
function extractInlineSvgsFromFile(mdPath) {
  if (!fs.existsSync(mdPath)) return [];
  return extractInlineSvgs(fs.readFileSync(mdPath, 'utf8'));
}

// ---------- placeholder 置換 ----------
function replacePlaceholders(chartNames) {
  if (!fs.existsSync(ARTICLE_MD)) {
    warn(
      `article.md not found at ${ARTICLE_MD}, skipping placeholder replacement`
    );
    return 0;
  }
  let md = fs.readFileSync(ARTICLE_MD, 'utf8');
  let replaced = 0;
  for (const name of chartNames) {
    // 形式1: コメント `<!-- chart:NAME -->`
    const comment = new RegExp(`<!--\\s*chart:${name}\\s*-->`, 'g');
    if (comment.test(md)) {
      md = md.replace(comment, `![チャート](data/${name}.svg)`);
      replaced++;
    }
    // 形式2: タグ `<chart-placeholder ... data="NAME" ... />` (実記事 54 本がこの形式)
    // caption 属性があれば alt に流用する。
    const tag = new RegExp(
      `<chart-placeholder[^>]*\\bdata="${name}"[^>]*/?>(?:\\s*</chart-placeholder>)?`,
      'g'
    );
    if (tag.test(md)) {
      md = md.replace(tag, (m) => {
        const cap = m.match(/caption="([^"]*)"/);
        return `![${cap ? cap[1] : 'チャート'}](data/${name}.svg)`;
      });
      replaced++;
    }
  }
  // フォールバック: placeholder の data 属性が生成チャート名と一致しないケース
  // (著者命名 "…-top10" ≠ ranking key "…-prefecture-rankings"。pilot で 54 本中多数が該当)。
  // ランキングチャートが 1 つだけなら、残った <chart-placeholder> をそれで置換する。
  const rankingCharts = chartNames.filter((n) =>
    n.endsWith('-prefecture-rankings')
  );
  if (rankingCharts.length === 1 && /<chart-placeholder/.test(md)) {
    const name = rankingCharts[0];
    md = md.replace(
      /<chart-placeholder[^>]*\/?>(?:\s*<\/chart-placeholder>)?/g,
      (m) => {
        const cap = m.match(/caption="([^"]*)"/);
        replaced++;
        return `![${cap ? cap[1] : 'チャート'}](data/${name}.svg)`;
      }
    );
  }
  if (replaced > 0) {
    fs.writeFileSync(ARTICLE_MD, md, 'utf8');
  }
  return replaced;
}

// ---------- インライン <svg> のファイル抽出 ----------
// 生成器が未対応のチャート種別 (scatter/timeseries 等) の inline <svg> を data/*.svg に
// 切り出し、![](data/…) 参照へ置換する。pilot (fertility 散布図) で実証。--extract-inline で起動。
function extractInlineSvgsToFiles() {
  if (!fs.existsSync(ARTICLE_MD)) return 0;
  let md = fs.readFileSync(ARTICLE_MD, 'utf8');
  const blocks = md.match(/<svg[\s\S]*?<\/svg>/g) || [];
  if (!blocks.length) return 0;
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  let n = 0;
  for (const block of blocks) {
    n++;
    const name = `inline-chart-${n}`;
    const aria = block.match(/aria-label="([^"]*)"/);
    fs.writeFileSync(path.join(DATA_DIR, `${name}.svg`), block, 'utf8');
    // 徹底ルール (§1.7): inline SVG も source.json 無しで残さない (1画像=1設定ファイル)。json が無いため
    // incomplete として記録し、generator 経由チャートへの差し替えを促す (inline は §1.5 アンチパターン)。
    writeChartSourceIfMissing(
      path.join(DATA_DIR, `${name}.source.json`),
      `${name}.svg`,
      'unknown',
      undefined
    );
    warn(
      `inline SVG を ${name}.svg に切り出した — inline はデータ系譜が貧弱(§1.7・要差し替え)。generator 経由のチャートにすること`
    );
    md = md.replace(
      block,
      `![${aria ? aria[1] : 'チャート'}](data/${name}.svg)`
    );
  }
  fs.writeFileSync(ARTICLE_MD, md, 'utf8');
  return n;
}

// ---------- main ----------
// validate 時は data/ 不在を許容（article.md インライン SVG 検査のため）。
const jsonFiles = fs.existsSync(DATA_DIR)
  ? fs
      .readdirSync(DATA_DIR)
      .filter((f) => f.endsWith('.json') && !f.endsWith('.source.json')) // .source.json は出典 manifest (チャートではない)
      .sort()
  : [];

if (jsonFiles.length === 0) {
  warn(`No JSON files found in ${DATA_DIR}`);
}

log(
  `[info] slug=${SLUG} mode=${EXTRACT_INLINE ? 'extract-inline' : VALIDATE ? 'validate' : DRY_RUN ? 'dry-run' : 'generate'}`
);

// --extract-inline: インライン <svg> をファイル化して終了 (JSON 不要)
if (EXTRACT_INLINE) {
  const n = extractInlineSvgsToFiles();
  log(`[done] extract-inline: ${n} inline <svg> → data/inline-chart-*.svg`);
  process.exit(0);
}

log(`[info] Found ${jsonFiles.length} JSON file(s) in data/`);

// Phase 1: JSON syntax check (always)
let jsonOkCount = 0;
let jsonNgCount = 0;
const jsonMeta = [];
for (const f of jsonFiles) {
  const fp = path.join(DATA_DIR, f);
  try {
    const parsed = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const type = detectChartType(f, parsed);
    if (type === 'scatter') {
      const sourcePath = path.join(
        DATA_DIR,
        f.replace(/\.json$/, '.source.json')
      );
      if (!fs.existsSync(sourcePath)) {
        throw new Error(
          'scatter source.json が無い。一次ソースの取得レシピを用意してから生成する'
        );
      }
      const sourceData = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
      const sourceInspection = inspectChartSourceManifest(sourceData);
      if (sourceInspection.verdict === 'invalid') {
        throw new Error(
          `scatter source.json が再取得不能: ${sourceInspection.detail}`
        );
      }
      const dataLint = lintScatterData(f, parsed, sourceData);
      if (dataLint.errors.length > 0) {
        throw new Error(dataLint.errors.join(' | '));
      }
    }
    jsonMeta.push({ file: f, type, parsed });
    jsonOkCount++;
    log(`  [ok ] ${f}  type=${type || 'unknown'}`);
  } catch (e) {
    jsonNgCount++;
    err(`  [ng ] ${f}  ${e.message}`);
  }
}

if (jsonNgCount > 0) {
  err(`JSON syntax check failed: ${jsonNgCount} file(s) invalid`);
  process.exit(2);
}

// --dry-run: stop here
if (DRY_RUN) {
  log(`[done] dry-run: ${jsonOkCount} JSON file(s) valid`);
  process.exit(0);
}

// --validate: 構造 (ERROR) + dark mode/パレット (WARN) を data/*.svg と
// article.md インライン SVG の両方で検査する。
if (VALIDATE) {
  let errorCount = 0;
  let warnCount = 0;
  let targetCount = 0;

  const report = (label, { errors, warnings }) => {
    targetCount++;
    if (errors.length === 0 && warnings.length === 0) {
      log(`  [ok  ] ${label}`);
      return;
    }
    for (const e of errors) {
      errorCount++;
      err(`  [err ] ${label}  ${e}`);
    }
    for (const w of warnings) {
      warnCount++;
      warn(`  [warn] ${label}  ${w}`);
    }
  };

  // 1. data/*.svg (生成物)
  const svgFiles = fs.existsSync(DATA_DIR)
    ? fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.svg'))
    : [];
  log(`[info] data/*.svg: ${svgFiles.length} file(s)`);
  for (const f of svgFiles) {
    report(`data/${f}`, validateSvg(path.join(DATA_DIR, f)));
  }

  // 2. article.md インライン <svg> (手書き — 品質バラつきの主因)
  const inlineSvgs = extractInlineSvgsFromFile(ARTICLE_MD);
  log(`[info] article.md inline <svg>: ${inlineSvgs.length} block(s)`);
  inlineSvgs.forEach((svg, i) => {
    report(`article.md inline-svg #${i + 1}`, lintSvgContent(svg));
  });

  if (targetCount === 0) {
    warn('検査対象の SVG なし (data/*.svg もインライン SVG も無い)');
    log(`[done] validate: 0 svg, JSON ok=${jsonOkCount}`);
    process.exit(0);
  }

  log(
    `[done] validate: ${targetCount} target(s), errors=${errorCount}, warnings=${warnCount}`
  );
  if (warnCount > 0) {
    warn(
      'WARN は描画は壊れないが品質基準未達 (dark mode 非対応 / theme 色 inline)。' +
        ' svg-builder 経由で再生成すると解消する。'
    );
  }
  // ERROR のみ CI を fail させる (WARN は可視化のみ、既存資産を壊さない)
  if (errorCount > 0) {
    err(`SVG validation failed: ${errorCount} error(s)`);
    process.exit(3);
  }
  process.exit(0);
}

/**
 * 徹底ルール (§1.7): SVG を生成したら必ず対応する source.json (出典 manifest) もセット出力する。
 * 「1画像=1設定ファイル」を generator レベルで保証し、「絵だけ (元データ消失)」の発生を構造的に防ぐ。
 * 既存 source.json (fetch-ranking-data-r2 が SSOT から確定したもの) があれば尊重し上書きしない。
 */
function writeChartSourceIfMissing(
  sourcePath: string,
  dataFile: string,
  type: string | undefined,
  parsed: Record<string, unknown> | undefined
): void {
  if (fs.existsSync(sourcePath)) return; // 確定済み (fetch-ranking-data-r2 等) を尊重
  const p = (parsed || {}) as Record<string, unknown>;
  const rankings = p.rankings as Record<string, unknown> | undefined;
  const rankingKey = (p.rankingKey || rankings?.rankingKey) as
    | string
    | undefined;
  const subtitle = typeof p.subtitle === 'string' ? p.subtitle : '';
  const year = (p.year as string) || subtitle.match(/(\d{4})/)?.[1];
  const common = {
    generatedBy: 'generate-article-charts.ts',
    chartType: type || 'unknown',
    dataFile,
    year,
    unit: (p.unit || rankings?.unit) as string | undefined,
    label: (p.title || p.label || rankings?.label) as string | undefined,
  };
  let manifest: Record<string, unknown>;
  if (rankingKey) {
    manifest = {
      kind: 'ranking',
      rankingKey,
      source: `r2:app/ranking/${rankingKey}/values.json`,
      upstream: 'metric config → e-Stat → R2 app/ranking',
      ...common,
    };
  } else if (p.derived) {
    manifest = { kind: 'derived', formula: p.derived, ...common };
  } else {
    manifest = {
      kind: type === 'summary' ? 'authored' : type || 'unknown',
      incomplete: true,
      note: '出自(rankingKey/derived)が data json に無い。fetch-ranking-data-r2 か backfill-source で SSOT を補完すること',
      ...common,
    };
  }
  fs.writeFileSync(sourcePath, JSON.stringify(manifest, null, 2));
}

// Default mode: generate SVGs
const chartNames = [];
for (const { file, type, parsed } of jsonMeta) {
  const baseName = file.replace(/\.json$/, '');
  const svgPath = path.join(DATA_DIR, `${baseName}.svg`);
  let svg;
  if (type === 'bar') {
    svg = genBarChartSvg(parsed);
  } else if (type === 'tile-grid') {
    svg = genTileGridMapSvg(parsed);
  } else if (type === 'line') {
    svg = genLineChartSvg(parsed);
  } else if (type === 'scatter') {
    svg = genScatterChartSvg(parsed);
  } else if (type === 'summary') {
    svg = genFindingsCardSvg(parsed);
  } else if (type) {
    warn(
      `chart type "${type}" not implemented for ${file} — emitting stub SVG`
    );
    svg = genStubSvg(type, baseName);
  } else {
    warn(`unknown chart type for ${file} — skipping`);
    continue;
  }
  // 2026-05-25 追加: data-source provenance を SVG 冒頭に embed
  // factual cross-check (article-factual-check.mjs) が SVG 値の出所を trace するために使用。
  // agent 手書きの inline SVG (article.md 内) には provenance がないので、
  // chart 系のチェッカーは「provenance 付き SVG = generator 経由で data から作られた」と信頼可能。
  // 相関 scatter 等 file 名に "--" を含むものは buildProvenanceLine が XML 安全化する
  // (生 "--" を XML コメントに入れると <img> 描画で broken image になる)。
  const provenance = buildProvenanceLine(file);
  fs.writeFileSync(svgPath, provenance + svg, 'utf8');
  // 徹底ルール (§1.7): SVG を書いたら必ず source.json もセット出力 (1画像=1設定ファイル)。
  writeChartSourceIfMissing(
    path.join(DATA_DIR, `${baseName}.source.json`),
    file,
    type,
    parsed
  );
  chartNames.push(baseName);
  log(`  [gen] ${baseName}.svg  (${(svg.length / 1024).toFixed(1)} KB)`);

  // ランキング棒は Instagram 用に縦長 portrait バリアントも出力する。
  // data/<name>-ig.svg は SNS 専用アセットで、article.md には埋め込まない
  // (ブログ本文は横長 columns の <name>.svg を参照する)。
  if (type === 'bar') {
    const igSvg = genBarChartSvg(parsed, 'portrait');
    fs.writeFileSync(
      path.join(DATA_DIR, `${baseName}-ig.svg`),
      provenance + igSvg,
      'utf8'
    );
    log(
      `  [gen] ${baseName}-ig.svg  (IG縦長 ${(igSvg.length / 1024).toFixed(1)} KB)`
    );
  }
}

// Phase 3: placeholder replacement
const replaced = replacePlaceholders(chartNames);
log(`[info] Replaced ${replaced} placeholder(s) in article.md`);

log(`[done] generate: ${chartNames.length} SVG file(s) written`);
