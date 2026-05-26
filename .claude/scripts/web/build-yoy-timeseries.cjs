#!/usr/bin/env node
/**
 * 任意 ranking metric の YoY (year-over-year) 時系列 JSON を生成する汎用パイプライン。
 *
 * Pipeline (build-population-yoy-data.cjs を汎用化したもの):
 *   1. .local/r2/app/ranking/<metricKey>/values.json を読む
 *   2. 47県揃いの年だけを使って yoyRatio(p, t) = P(p, t) / P(p, t-1) を算出
 *      (47県未揃いの年や前年データが欠ける年はスキップ → 連続セグメントのみ扱う)
 *   3. 5年中央移動平均で平滑化 (端は trim)
 *   4. 全期間 maxAbs を算出
 *   5. JSON を --output に書き出す
 *
 * Usage:
 *   # 単発
 *   node build-yoy-timeseries.cjs \
 *     --metric-key total-fertility-rate \
 *     --output apps/web/public/themes/population-dynamics/yoy-total-fertility-rate.json
 *
 *   # バッチ
 *   node build-yoy-timeseries.cjs --batch .claude/config/yoy-batch.json
 */
const fs = require("node:fs");
const path = require("node:path");

const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const MA_WINDOW = 5;

function toTwoDigit(areaCode5) {
  return areaCode5.slice(0, 2);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { metricKey: null, output: null, batch: null };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--metric-key") opts.metricKey = args[++i];
    else if (args[i] === "--output") opts.output = args[++i];
    else if (args[i] === "--batch") opts.batch = args[++i];
  }
  return opts;
}

function buildOne({ metricKey, output }) {
  const sourcePath = path.join(
    PROJECT_ROOT,
    `.local/r2/app/ranking/${metricKey}/values.json`,
  );
  const outPath = path.isAbsolute(output) ? output : path.join(PROJECT_ROOT, output);

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`source not found: ${sourcePath}`);
  }
  const raw = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  if (raw.areaType !== "prefecture" || !Array.isArray(raw.partitions)) {
    throw new Error(`unexpected schema for ${metricKey}`);
  }

  // Step 1: index by year. Only include years with full 47 prefectures.
  /** @type {Map<number, Map<string, { name: string; value: number }>>} */
  const byYear = new Map();
  /** @type {Map<string, string>} */
  const prefNames = new Map();
  let skippedYears = [];

  for (const part of raw.partitions) {
    const year = parseInt(part.yearCode, 10);
    if (!Number.isFinite(year)) continue;
    if (part.count !== 47 || !Array.isArray(part.values) || part.values.length !== 47) {
      skippedYears.push(`${year}(${part.count})`);
      continue;
    }
    const m = new Map();
    let bad = false;
    for (const v of part.values) {
      if (!Number.isFinite(v.value) || v.value <= 0) {
        bad = true;
        break;
      }
      const code2 = toTwoDigit(v.areaCode);
      m.set(code2, { name: v.areaName, value: v.value });
      prefNames.set(code2, v.areaName);
    }
    if (bad || m.size !== 47) {
      skippedYears.push(`${year}(bad)`);
      continue;
    }
    byYear.set(year, m);
  }

  const years = [...byYear.keys()].sort((a, b) => a - b);
  if (years.length < 5) {
    throw new Error(`${metricKey}: not enough valid years (${years.length}); skipped=${skippedYears.join(",")}`);
  }
  const prefCodes = [...prefNames.keys()].sort();

  // Step 2: YoY ratios. Only compute when year t and t-1 are both present.
  /** @type {Map<number, Map<string, number>>} */
  const yoy = new Map();
  for (const t of years) {
    if (!byYear.has(t - 1)) continue; // previous year missing → skip
    const cur = byYear.get(t);
    const prev = byYear.get(t - 1);
    const m = new Map();
    for (const code of prefCodes) {
      const a = prev.get(code).value;
      const b = cur.get(code).value;
      m.set(code, b / a);
    }
    yoy.set(t, m);
  }
  const yoyYears = [...yoy.keys()].sort((a, b) => a - b);
  if (yoyYears.length < 3) {
    throw new Error(`${metricKey}: not enough consecutive YoY pairs (${yoyYears.length})`);
  }

  // Step 3: 5-year centered MA, edge-trimmed
  const half = Math.floor(MA_WINDOW / 2);
  /** @type {Map<number, Map<string, number>>} */
  const ma = new Map();
  for (const t of yoyYears) {
    const window = [];
    for (let k = t - half; k <= t + half; k++) {
      if (yoy.has(k)) window.push(k);
    }
    const m = new Map();
    for (const code of prefCodes) {
      let sum = 0;
      for (const k of window) sum += yoy.get(k).get(code);
      m.set(code, sum / window.length);
    }
    ma.set(t, m);
  }

  // Step 4: global maxAbs
  let maxAbs = 0;
  for (const t of yoyYears) {
    for (const code of prefCodes) {
      const d = Math.abs(ma.get(t).get(code) - 1);
      if (d > maxAbs) maxAbs = d;
    }
  }

  // Compose output
  const frames = yoyYears.map((t) => ({
    year: t,
    yoy: prefCodes.map((code) => ({
      areaCode: code,
      areaName: prefNames.get(code),
      ratio: ma.get(t).get(code),
      rawRatio: yoy.get(t).get(code),
    })),
  }));

  const out = {
    generatedAt: new Date().toISOString(),
    source: {
      file: `app/ranking/${metricKey}/values.json`,
      sourceGeneratedAt: raw.generatedAt,
    },
    metricKey,
    yearRange: [yoyYears[0], yoyYears[yoyYears.length - 1]],
    movingAverageWindow: MA_WINDOW,
    edgeHandling: "trim (use available neighbors only at series ends)",
    skippedYears: skippedYears.length > 0 ? skippedYears : undefined,
    maxAbs,
    prefectureCodes: prefCodes,
    frames,
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(out));

  return {
    metricKey,
    output: outPath.replace(PROJECT_ROOT + "/", ""),
    yearRange: [yoyYears[0], yoyYears[yoyYears.length - 1]],
    frameCount: frames.length,
    maxAbs,
    maxAbsPercent: (maxAbs * 100).toFixed(2),
    sizeKB: (fs.statSync(outPath).size / 1024).toFixed(1),
    skipped: skippedYears,
  };
}

function main() {
  const opts = parseArgs();

  let jobs;
  if (opts.batch) {
    const batchPath = path.isAbsolute(opts.batch) ? opts.batch : path.join(PROJECT_ROOT, opts.batch);
    jobs = JSON.parse(fs.readFileSync(batchPath, "utf8"));
    if (!Array.isArray(jobs)) throw new Error("--batch JSON must be an array");
  } else if (opts.metricKey && opts.output) {
    jobs = [{ metricKey: opts.metricKey, output: opts.output }];
  } else {
    console.error("Usage:\n  --metric-key <key> --output <path>\n  --batch <batch.json>");
    process.exit(1);
  }

  const results = [];
  for (const j of jobs) {
    try {
      const r = buildOne(j);
      results.push({ ok: true, ...r });
      console.log(
        `✓ ${r.metricKey}: ${r.frameCount}年 [${r.yearRange[0]}-${r.yearRange[1]}] maxAbs=±${r.maxAbsPercent}% size=${r.sizeKB}KB${r.skipped.length ? ` skipped=${r.skipped.join(",")}` : ""}`,
      );
    } catch (e) {
      results.push({ ok: false, metricKey: j.metricKey, error: e.message });
      console.error(`✗ ${j.metricKey}: ${e.message}`);
    }
  }

  console.log(`\n${results.filter((r) => r.ok).length}/${results.length} ok`);
}

main();
