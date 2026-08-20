#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..", "..");
const BASELINE = process.env.MAINTENANCE_DEBT_BASELINE || path.join(ROOT, ".claude/config/maintenance-debt-baseline.json");
const SCAN_ROOTS = ["apps", "packages", ".claude", ".github"].map((item) => path.join(ROOT, item));
const TEXT_EXT = /\.(?:[cm]?[jt]sx?|md|ya?ml|json|sh|css|scss)$/i;
const EXCLUDED = new Set(["node_modules", ".next", "dist", "coverage", ".git", "state", "worktrees"]);

function rel(file) { return path.relative(ROOT, file).split(path.sep).join("/"); }
function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory() && EXCLUDED.has(entry.name)) return [];
    // ガードの baseline ファイル群は「debt の引用」であって debt ではない (自己参照検知の防止)
    if (!entry.isDirectory() && /-baseline\.json$/.test(entry.name)) return [];
    const file = path.join(dir, entry.name);
    // 本 checker 自身も除外 (ルール定義・メッセージ文言がパターン語を含むのは仕様でありメタ言及)
    if (!entry.isDirectory() && file === __filename) return [];
    return entry.isDirectory() ? walk(file) : TEXT_EXT.test(entry.name) ? [file] : [];
  });
}
function finding(code, file, line, message, content) {
  return { code, file: rel(file), line, message, content: content.trim().slice(0, 200) };
}
// baseline key は行番号を含めない「内容キー」(v2)。行番号キー (v1) は無関係な追記でも
// 行ズレ churn を起こし、「落ちたら再生成」の儀式化 = ガード形骸化を招いた (2026-07-14 教訓)。
// 同一内容が複数行ある場合は件数で ratchet する (count 超過 = 新規)。
function key(item) { return `${item.code}:${item.file}:${item.content}`; }
function countByKey(findings) {
  const counts = {};
  for (const f of findings) { const k = key(f); counts[k] = (counts[k] ?? 0) + 1; }
  return counts;
}
function loadBaselineV2() {
  if (!fs.existsSync(BASELINE)) return null;
  try {
    const parsed = JSON.parse(fs.readFileSync(BASELINE, "utf8"));
    if (parsed.version === 2 && parsed.findings && !Array.isArray(parsed.findings)) return parsed.findings;
  } catch { /* fallthrough */ }
  return null; // v1 (行番号キー) / 破損 → 移行が必要
}

// Markdown 見出し (# 〜 ######) を「同レベル以下の次の見出しまで」で 1 ブロックとして扱う。
// `.claude/todo/backlog.md` の `### [ID] タイトル` カードのように、ブロック本文の後半に
// まとめて書かれた停止条件 (例: 「- **停止条件**:」) を、ブロック冒頭寄りの個別行が
// 参照できないのは checker 側の見落としだった (2026-08-19、CROSS-PAGE-DATA-SSOT-01 の
// WP6/WP7 サブ項目が該当)。バックログ固有のカード書式には依存せず、Markdown の見出し構造
// だけで汎用的にブロックを決める。
function findEnclosingSection(lines, lineIndex) {
  let start = -1;
  let level = 0;
  for (let i = lineIndex; i >= 0; i--) {
    const m = lines[i].match(/^(#{1,6})\s/);
    if (m) { start = i; level = m[1].length; break; }
  }
  if (start === -1) return null; // 見出しより前 (ファイル冒頭等) はブロック外
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    const m = lines[i].match(/^(#{1,6})\s/);
    if (m && m[1].length <= level) { end = i; break; }
  }
  return { start, end }; // [start, end) — 0-based, end は次見出し行 (exclusive)
}
// ブロック単位の条件は、ブロック内の偶発的な単語一致 (無関係な文脈での「期限」「互換」等) で
// 誤って見逃さないよう、`.claude/rules/todo-standards.md` のカード正式フィールド (太字ラベル行)
// だけを条件として認める。緩い全文一致にすると、大きなカードでは無関係な箇所の一致で
// 本来 unbounded な行まで除外してしまう (2026-08-19 実測: CROSS-PAGE-DATA-SSOT-01 で
// R2 schema 変更に関する「期限」が離れた箇所の legacy 言及を誤って除外していた)。
const BLOCK_CONDITION_FIELD_RE = /^\s*-?\s*\*\*(?:停止条件|完了条件|削除条件|期限)\*\*\s*[:：]/;
function sectionHasCondition(lines, lineIndex) {
  const section = findEnclosingSection(lines, lineIndex);
  if (!section) return false;
  for (let i = section.start; i < section.end; i++) {
    if (BLOCK_CONDITION_FIELD_RE.test(lines[i])) return true;
  }
  return false;
}

function inspect(file) {
  const results = [];
  const relative = rel(file);
  const isTest = /(?:^|\/)(?:__tests__|tests?|fixtures?)(?:\/|$)|\.(?:spec|test)\.[cm]?[jt]sx?$/.test(relative);
  const isMarkdown = /\.mdx?$/i.test(relative);
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    const number = index + 1;
    // debt markerはコメントで宣言する。コード内のmessage/UI文言/正規表現に現れる
    // "TODO" はタスクではないため、コード系ファイルはコメント部分だけを検査する。
    let lineForDebt = line;
    if (/\.[cm]?[jt]sx?$/.test(relative)) {
      const comment = lineForDebt.match(/(?:\/\/|\/\*|^\s*\*)(.*)$/);
      lineForDebt = comment ? comment[1] : "";
    } else if (/\.(?:sh|ya?ml)$/.test(relative)) {
      const comment = lineForDebt.match(/^\s*#(.*)$/);
      lineForDebt = comment ? comment[1] : "";
    }
    // 大文字のみ検出 (debt コメント規約は大文字)。case-insensitive だと識別子・DOM id・パス
    // (`const todo` / `section#todo` / `../../todo/`) を誤検知する (2026-07-17 精緻化・legacy 用語除外と同方針)
    // debt markerの構文は `TODO:` / `TODO (Phase N):` / `TODO #123:`。
    // 単なる「TODO台帳」「TODO ID」やtodo-ran固有名詞を負債として数えない。
    const debt = lineForDebt.match(
      /\b(TODO|FIXME|HACK)\b(?=\s*(?:(?:\([^)\r\n]*\)|Phase\s+\d+|#[0-9]+)\s*)?:)/,
    );
    // 除外に「TODO- プレースホルダ規約への言及」を追加 (2026-07-20)。provenance では resourceId が未確定なとき
    // "TODO-" プレフィックスの sentinel 値を使い、コード/文書がその規約に言及する (startsWith("TODO-") /
    // TODO でない / TODO プレースホルダ / TODO resourceId)。これらは実タスクの debt マーカーではなくデータ値の
    // 言及なので誤検知。catalogStatus / VerificationStatus 等の domain 用語除外 (下の legacy 側) と同方針。
    // `docs/todo/` は 2026-06-07 に `.claude/todo/` へ統合され現存しないパス (docs-vs-issues.md 移行履歴)。
    // 「active TODO: .claude/todo/backlog.md」のような正規の参照行が誤検知していたため両方を除外する
    // (2026-08-19)。
    if (
      debt &&
      !/(?:#\d+|https?:\/\/|\b(?:MC|AFF|EXP|TODO)-?\d+\b|(?:docs|\.claude)\/todo\/|remove(?:d)?\s+(?:when|after|by)|期限|削除条件)/i.test(line) &&
      !/(?:["']TODO-|TODO-["']|startsWith\(["']TODO|TODO ?プレースホルダ|TODO ?placeholder|TODO ?でない|TODO resourceId|resourceId.*TODO)/.test(line)
      && !/TODO(?:\s*(?:ID|行|契約|定義|一覧|真実源|へ|から|を|の|完了|具体化|管理)|[）)])/u.test(line)
    )
      results.push(finding("UNTRACKED_DEBT", file, number, `${debt[1].toUpperCase()} に issue/backlog/削除条件がない`, line));

    // ファイル名/パスの一部としての "legacy" (例: legacy-category-keys.test.ts への参照) は
    // 負債ではなく単なる参照先なので語として数えない (2026-07-24 精緻化)。
    let lineForLegacy = line.replace(
      /[\w./-]*\blegacy[\w.-]*\.(?:ts|tsx|mjs|cjs|js|json|md|ya?ml)\b/gi,
      "",
    );
    // コード中の識別子・リテラル型・テスト名 (`const legacy = …` / `'common' | 'legacy'` /
    // `it('legacy hash migration …')`) は負債マーカーではない。debt マーカーは必ずコメントに
    // 書かれるので、コード拡張子ではコメント部分だけを検査する。
    // (TODO 側を「大文字のみ検出」にして識別子誤検知を消したのと同方針。2026-07-27 精緻化:
    //  image pipeline の manifest 形式名 legacy が 16 件誤検知したため)
    if (/\.[cm]?[jt]sx?$/.test(relative)) {
      const comment = lineForLegacy.match(/(?:\/\/|\/\*|^\s*\*)(.*)$/);
      lineForLegacy = comment ? comment[1] : "";
    }
    const legacy = lineForLegacy.match(/\b(legacy|deprecated|temporary|remove after)\b/i);
    // 除外 2 群: (a) 期限・条件・追跡が明示されたもの (b) domain 用語 — theme の catalogStatus /
    // open-data-catalog の VerificationStatus ("deprecated" 等はデータソースの検証ステータス列挙値であり
    // 廃止予定コードマーカーではない)。
    // enum 値「legacy」(catalog|legacy) とその日本語プローズ (legacy テーマ / カタログ駆動 20 + legacy 2 等)。
    // 負債の「legacy コード」とは別概念 (2026-07-14 ルール精緻化で誤検知 30+ 件を baseline から実削減)
    // 「縮小専用」は本チェッカー自身の baseline/ratchet 機構が使う確立語彙 (このファイル内の
    // 「baseline は縮小専用」等と同一表現)。リポジトリ全体で ratchet 統治の文脈以外に現れないため
    // (2026-08-20 実測)、legacy sentinel を shrink-only ratchet で追跡するテストコメント
    // (geo-scope-national-sentinel-ratchet.test.ts 等) を条件明示済みとして除外できる。
    if (legacy &&
        !/(?:#\d+|https?:\/\/|\b(?:MC|AFF|EXP|TODO)-?\d+\b|remove(?:d)?\s+(?:when|after|by)|until\b|期限|削除条件|互換|compat|superseded|縮小専用)/i.test(line) &&
        // `'legacy'` / `"legacy"` は状態名リテラル (`"deprecated"` を除外しているのと同じ enum 値扱い)。
        // `legacy` と `current`/`manifest` が近接する行は image pipeline の manifest 形式名としての用法
        // (例: 「初回manifest移行だけは legacyを安全にcurrent扱いできない」) で廃止予定コードではない。
        !/catalogStatus|LEGACY_SETS|IndicatorSet|indicator-sets|ThemeCatalog|THEME_CATALOGS|legacy ?テーマ|legacy ?catalog|legacy\/別経路|legacy ?\(未登録\)|未登録 ?\(legacy\)|\(legacy\) ?テーマ|カタログ駆動|legacy 2\b|"deprecated"|deprecated source|VerificationStatus|VERIFICATION_STATUSES|['"]legacy['"]|legacy[^\n]{0,20}(?:current|manifest)|(?:current|manifest)[^\n]{0,20}legacy/i.test(line) &&
        // ブロック単位の除外 (2026-08-19): 同一行に条件が無くても、Markdown の同一見出しブロック
        // (backlog.md の `### [ID]` カード等) の他行にまとめて期限・削除条件・停止条件が
        // 書かれていれば、そのブロック内の個別行は unbounded ではない。
        !(isMarkdown && sectionHasCondition(lines, index)))
      results.push(finding("UNBOUNDED_LEGACY", file, number, `${legacy[1]} に期限・削除条件がない`, line));

    if (!isTest && !relative.startsWith(".github/workflows/") && !relative.endsWith("CLAUDE.md") && !relative.endsWith("AGENTS.md") &&
        /\bwrangler\s+d1\b|\bgetDrizzle\s*\(|@stats47\/database\/server/.test(line))
      results.push(finding("D1_RUNTIME_RETURN", file, number, "廃止済みの永続D1 runtime操作候補", line));
  });
  return results;
}

function collect() {
  const files = SCAN_ROOTS.flatMap(walk);
  return { files: files.length, findings: files.flatMap(inspect) };
}

function main() {
  const result = collect();
  const counts = countByKey(result.findings);

  if (process.argv.includes("--write-baseline")) {
    // ratchet 不変条項: baseline は「縮む一方」。増やすコードパスは存在しない。
    // 新しい debt が出たら (a) 実修正 (期限・削除条件を書く / TODO を backlog 化) か
    // (b) 誤検知ならルール修正、のどちらかで解消する。baseline への吸収は不可。
    // CI 側でも --ratchet-check が origin/main との比較で手編集による増加を拒否する。
    const prev = loadBaselineV2();
    if (prev) {
      const added = Object.entries(counts).filter(([k, n]) => n > (prev[k] ?? 0));
      const removed = Object.keys(prev).filter((k) => !(counts[k] > 0)).length;
      if (added.length) {
        console.error(`✗ baseline は縮小専用 — 追加 ${added.length} 件を拒否。実修正 (期限/削除条件/backlog 化) かルール修正 (誤検知の除外) で解消する:`);
        added.slice(0, 20).forEach(([k, n]) => console.error(`  + ${k.slice(0, 160)} (${prev[k] ?? 0}→${n})`));
        if (added.length > 20) console.error(`  … 他 ${added.length - 20} 件`);
        process.exitCode = 1;
        return;
      }
      console.log(`baseline diff: +0 / -${removed}`);
    } else {
      console.log("baseline v1 (行番号キー) → v2 (内容キー) へ移行 — 行ズレ churn を根絶");
    }
    const sorted = Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
    fs.mkdirSync(path.dirname(BASELINE), { recursive: true });
    fs.writeFileSync(BASELINE, `${JSON.stringify({ version: 2, findings: sorted }, null, 2)}\n`);
    console.log(`✓ maintenance debt baseline 更新: ${rel(BASELINE)} (${result.findings.length} findings)`);
    return;
  }

  if (process.argv.includes("--ratchet-check")) {
    // CI 用: baseline の手編集・すり替えによる「増加」を origin/main との比較で拒否する。
    // (縮小 = 品質改善は歓迎。origin/main に baseline が無い初回は skip)
    const { execFileSync } = require("node:child_process");
    let mainRaw = null;
    try {
      mainRaw = execFileSync("git", ["show", `origin/main:${rel(BASELINE)}`], { cwd: ROOT, encoding: "utf8" });
    } catch {
      console.log("ratchet-check: origin/main に baseline 無し — skip");
      return;
    }
    let mainFindings = {};
    try {
      const parsed = JSON.parse(mainRaw);
      if (parsed.version === 2 && parsed.findings && !Array.isArray(parsed.findings)) mainFindings = parsed.findings;
      else { console.log("ratchet-check: origin/main は v1 baseline — 移行コミットのため skip"); return; }
    } catch { console.log("ratchet-check: origin/main baseline parse 不可 — skip"); return; }
    const cur = loadBaselineV2() ?? {};
    const grown = Object.entries(cur).filter(([k, n]) => n > (mainFindings[k] ?? 0));
    if (grown.length) {
      console.error(`✗ ratchet 違反: baseline が origin/main より ${grown.length} 件増えている (縮小専用。実修正かルール修正で解消する):`);
      grown.slice(0, 20).forEach(([k, n]) => console.error(`  + ${k.slice(0, 160)} (${mainFindings[k] ?? 0}→${n})`));
      process.exitCode = 1;
      return;
    }
    const shrunk = Object.keys(mainFindings).filter((k) => !(cur[k] > 0)).length;
    console.log(`✓ ratchet OK: baseline は origin/main 比 +0 / -${shrunk}`);
    return;
  }

  const known = process.argv.includes("--baseline") ? (loadBaselineV2() ?? {}) : {};
  // 内容キーごとに baseline 件数を超過した分だけを新規として報告する
  const seen = {};
  const fresh = result.findings.filter((item) => {
    const k = key(item);
    seen[k] = (seen[k] ?? 0) + 1;
    return seen[k] > (known[k] ?? 0);
  });
  if (process.argv.includes("--json")) console.log(JSON.stringify({ ...result, newFindings: fresh }, null, 2));
  else if (!fresh.length) console.log(`✓ maintenance debt 悪化なし — ${result.files} files / known ${result.findings.length}`);
  else {
    console.error(`✗ maintenance debt: ${fresh.length} new findings`);
    fresh.forEach((item) => console.error(`  [${item.code}] ${item.file}:${item.line} ${item.message}`));
  }
  process.exitCode = fresh.length ? 1 : 0;
}

if (require.main === module) main();
module.exports = { collect };
