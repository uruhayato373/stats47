#!/usr/bin/env node
"use strict";

/**
 * 観測値の表示整形が共有規約を迂回していないか検査する決定的ガード。
 *
 * ## なぜ要るか (2026-07-31)
 *
 * 同じランキングの中で「60.4」と「44」が混ざり、表とヘッダーでも桁数が食い違っていた。
 * 原因は 2 つで、どちらも**規約が無かったから**ではなく**規約を各所が迂回していたから**:
 *
 *   1. 共有フォーマッタが `maximumFractionDigits` だけを指定していた
 *      (`44.0` は JS の number では `44` なので、max 指定だけでは小数が消える)
 *   2. 呼び出し側が桁数を `1` に決め打ちしていた
 *      (桁数は 1 つの値では決まらず**データセット全体**で決まる)
 *
 * 部品自体は `@stats47/utils` に揃っていた (`resolveValuePrecision` +
 * `formatValueWithPrecision`)。Remotion と visualization は従っていて、
 * **svg-builder と apps/web だけが独自実装していた**。同じ分断を繰り返さないための床。
 *
 * ## 派生値 (率・倍率・偏差値・変化率) の扱い
 *
 * 派生値はデータセットの桁数と無関係なので本来は対象外だが、**行の近傍から
 * 機械的に判別することはできない**。汎用フォーマッタ (例:
 * `build-national-average-series.ts` の `formatSigned`) は「変化率を整形する」という
 * 意図が呼び出し元にしかなく、関数本体だけを見ても派生値だと分からない。
 * キーワード近傍による推測は誤検知を生み、誤検知を出すガードは運用で無効化される。
 *
 * → **baseline 方式**を採る (`check-maintenance-debt.cjs` と同じ型)。既存の違反は
 *   baseline に固定し、**新規の混入だけ**を止める。baseline は縮小専用。
 *
 * ## 使い方
 *
 *   check-value-format.cjs                  違反を列挙 (exit 1)
 *   check-value-format.cjs --baseline       既存を許容し、新規悪化のみ exit 1
 *   check-value-format.cjs --write-baseline 現在値を baseline へ (縮小専用)
 *   check-value-format.cjs --ratchet-check  origin/main 比で baseline の増加を拒否
 */

const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..", "..");
const BASELINE =
  process.env.VALUE_FORMAT_BASELINE ||
  path.join(ROOT, ".claude/config/value-format-baseline.json");

/**
 * 検査対象は**観測値を描画する層**に限る。広告・ナビ等の数値は指標ではない。
 */
const SCAN_DIRS = [
  "packages/svg-builder/src",
  "packages/visualization/src",
  "apps/web/src/features/ranking",
  "apps/web/src/components/stat-charts",
  "apps/web/src/components/charts",
];

/** 違反パターン。**確実に違反と言えるものだけ**を入れる (誤検知ゼロを優先)。 */
const VIOLATIONS = [
  {
    code: "max-fraction-digits-only",
    test: (line) => /maximumFractionDigits/.test(line) && !/minimumFractionDigits/.test(line),
    message:
      "maximumFractionDigits の単独指定 — 44.0 は number では 44 なので小数が消え、" +
      "同じ図の中で 60.4 と 44 が混ざる。formatValueWithPrecision (min=max) を使う",
  },
  {
    code: "bare-tolocalestring",
    // ★ロケールは "ja-JP" のように**大文字を含む**。[a-z-] だけにすると
    //   本番に実在した toLocaleString("ja-JP") を見逃す (テストで検出した)
    test: (line) => /\.toLocaleString\(\s*(?:"[A-Za-z-]+"|'[A-Za-z-]+')?\s*\)/.test(line),
    message:
      "toLocaleString を素で呼んでいる — 桁数が制御されずデータセット内で揃わない。" +
      "formatValueWithPrecision(value, precision) を使い、precision は " +
      "resolveValuePrecision(values) でデータセットから 1 度だけ解決する",
  },
];

function rel(file) {
  return path.relative(ROOT, file).split(path.sep).join("/");
}

/** 検査対象のファイルか。 */
function isValueRenderingFile(relPath) {
  const p = String(relPath).replace(/\\/g, "/");
  if (!/\.tsx?$/.test(p)) return false;
  if (p.includes("node_modules") || p.includes("/dist/") || p.includes("/.next/")) return false;
  // 規約の実装本体 (packages/utils) と テストは対象外
  if (p.includes("packages/utils/")) return false;
  if (/__tests__|\.test\.|\.spec\./.test(p)) return false;
  return SCAN_DIRS.some((dir) => p.startsWith(dir));
}

/**
 * 1 ファイルを検査する (純関数・テストから直接呼ぶ)。
 * @returns {Array<{code:string,file:string,line:number,message:string,content:string}>}
 */
function inspectSource(relPath, content) {
  if (!isValueRenderingFile(relPath)) return [];
  const findings = [];
  String(content)
    .split(/\r?\n/)
    .forEach((raw, index) => {
      const line = raw.trim();
      // コメントは実装ではない (規約の説明文が自分を検出するのを防ぐ)
      if (line.startsWith("//") || line.startsWith("*") || line.startsWith("/*")) return;
      for (const v of VIOLATIONS) {
        if (v.test(line)) {
          findings.push({
            code: v.code,
            file: relPath,
            line: index + 1,
            message: v.message,
            content: line.slice(0, 200),
          });
        }
      }
    });
  return findings;
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".next") return [];
      return walk(file);
    }
    return isValueRenderingFile(rel(file)) ? [file] : [];
  });
}

function collect() {
  const files = SCAN_DIRS.flatMap((d) => walk(path.join(ROOT, d)));
  const findings = files.flatMap((f) => inspectSource(rel(f), fs.readFileSync(f, "utf8")));
  return { files: files.length, findings };
}

// baseline key は**行番号を含めない内容キー**。行番号を入れると無関係な追記でも
// 行ズレ churn が起き、「落ちたら再生成」の儀式化 = ガード形骸化を招く
// (`check-asset-policy.cjs` / `check-maintenance-debt.cjs` と同じ不変条項)。
function key(item) {
  return `${item.code}:${item.file}:${item.content}`;
}

function countByKey(findings) {
  const counts = {};
  for (const f of findings) {
    const k = key(f);
    counts[k] = (counts[k] ?? 0) + 1;
  }
  return counts;
}

function loadBaseline() {
  if (!fs.existsSync(BASELINE)) return null;
  try {
    const parsed = JSON.parse(fs.readFileSync(BASELINE, "utf8"));
    if (parsed.version === 1 && parsed.findings && !Array.isArray(parsed.findings)) {
      return parsed.findings;
    }
  } catch {
    /* fallthrough */
  }
  return null;
}

function main() {
  const result = collect();
  const counts = countByKey(result.findings);

  if (process.argv.includes("--write-baseline")) {
    // ratchet 不変条項: baseline は**縮む一方**。増やすコードパスは存在しない。
    // 新規違反は (a) 実修正 か (b) 誤検知ならルール修正 のどちらかで解消する。
    const prev = loadBaseline();
    if (prev) {
      const added = Object.entries(counts).filter(([k, n]) => n > (prev[k] ?? 0));
      if (added.length) {
        console.error(
          `✗ baseline は縮小専用 — 追加 ${added.length} 件を拒否。` +
            `実修正 (formatValueWithPrecision へ移行) かルール修正 (誤検知の除外) で解消する:`,
        );
        added.slice(0, 20).forEach(([k, n]) => console.error(`  + ${k.slice(0, 160)} (${prev[k] ?? 0}→${n})`));
        process.exitCode = 1;
        return;
      }
      const removed = Object.keys(prev).filter((k) => !(counts[k] > 0)).length;
      console.log(`baseline diff: +0 / -${removed}`);
    }
    const sorted = Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
    fs.mkdirSync(path.dirname(BASELINE), { recursive: true });
    fs.writeFileSync(BASELINE, `${JSON.stringify({ version: 1, findings: sorted }, null, 2)}\n`);
    console.log(`✓ value-format baseline 更新: ${rel(BASELINE)} (${result.findings.length} findings)`);
    return;
  }

  if (process.argv.includes("--ratchet-check")) {
    // CI 用: baseline の手編集による「増加」を origin/main との比較で拒否する。
    const { execFileSync } = require("node:child_process");
    let mainRaw = null;
    try {
      mainRaw = execFileSync("git", ["show", `origin/main:${rel(BASELINE)}`], {
        cwd: ROOT,
        encoding: "utf8",
      });
    } catch {
      console.log("ratchet-check: origin/main に baseline 無し — skip");
      return;
    }
    let mainFindings = {};
    try {
      const parsed = JSON.parse(mainRaw);
      if (parsed.version === 1 && parsed.findings && !Array.isArray(parsed.findings)) {
        mainFindings = parsed.findings;
      } else {
        console.log("ratchet-check: origin/main baseline の形式が違う — skip");
        return;
      }
    } catch {
      console.log("ratchet-check: origin/main baseline parse 不可 — skip");
      return;
    }
    const cur = loadBaseline() ?? {};
    const grown = Object.entries(cur).filter(([k, n]) => n > (mainFindings[k] ?? 0));
    if (grown.length) {
      console.error(`✗ ratchet 違反: baseline が origin/main より ${grown.length} 件増えている (縮小専用):`);
      grown.slice(0, 20).forEach(([k, n]) => console.error(`  + ${k.slice(0, 160)} (${mainFindings[k] ?? 0}→${n})`));
      process.exitCode = 1;
      return;
    }
    const shrunk = Object.keys(mainFindings).filter((k) => !(cur[k] > 0)).length;
    console.log(`✓ ratchet OK: baseline は origin/main 比 +0 / -${shrunk}`);
    return;
  }

  const known = process.argv.includes("--baseline") ? (loadBaseline() ?? {}) : {};
  const seen = {};
  const fresh = result.findings.filter((item) => {
    const k = key(item);
    seen[k] = (seen[k] ?? 0) + 1;
    return seen[k] > (known[k] ?? 0);
  });

  if (!fresh.length) {
    console.log(`✓ 数値整形の新規違反なし — ${result.files} files / known ${result.findings.length}`);
  } else {
    console.error(`✗ 数値整形: ${fresh.length} 件の新規違反`);
    fresh.forEach((item) => console.error(`  [${item.code}] ${item.file}:${item.line}\n      ${item.message}\n      ${item.content}`));
  }
  process.exitCode = fresh.length ? 1 : 0;
}

if (require.main === module) main();
module.exports = { collect, inspectSource, isValueRenderingFile };
