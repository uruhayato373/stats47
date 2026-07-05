#!/usr/bin/env node
/**
 * check-agent-skill-consistency.cjs — エージェント/スキル/スクリプトの整合性ドリフトを決定的に検出する。
 *
 * 今回のセッション (2026-06-16) で「新スクリプトを書いたが、その出力を消費する auto-resubmit.mjs の
 * 前提を読まずに doc/memory に偽の主張を書いた」ドリフトが起きた教訓から、機械で捕まえられる範囲
 * (リンク切れ・参照先不在・orphan) を「床」として検出する。意味的な統合バグ (今回の #1) は機械では
 * 捕まらないため、Stop hook の意味レビュー喚起と組み合わせる (二層)。
 *
 * 検出 (決定的):
 *   [E1] SKILL.md の primary_agent / co_agents が指す agent ファイルが存在するか
 *   [E2] SKILL.md 本文が参照する .claude/scripts|hooks のスクリプトが存在するか
 *   [E3] settings.json の hook command が指すファイルが存在するか
 *   [W1] .claude/scripts/** のスクリプトがどこからも参照されていない (orphan)
 *   [W2] 非 dead の SKILL.md が参照する packages/**|apps/** の scripts が存在しない (dead-skill 検知)
 *
 * Usage:
 *   node .claude/scripts/lib/check-agent-skill-consistency.cjs            # 全検査 (report)。error あれば exit 1
 *   node .claude/scripts/lib/check-agent-skill-consistency.cjs --json     # JSON 出力
 *   node .claude/scripts/lib/check-agent-skill-consistency.cjs --gate     # Stop hook 用。未監査の関連変更があれば exit 2
 *   node .claude/scripts/lib/check-agent-skill-consistency.cjs --mark-audited  # 現在の関連変更を監査済みとして記録
 *
 * 正典: docs/01_技術設計 ではなく運用ガード。関連: .claude/hooks/check-consistency-on-stop.js /
 *       .claude/skills/dev/audit-consistency/SKILL.md / memory project_recurrence_guard_scripts
 */
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..", "..");
const AUDIT_MARKER = path.join(ROOT, ".claude/state/consistency/audited.json");

// 組み込み/プラグイン agent 型 (ファイル .claude/agents/*.md を持たない)。E1 で誤検知しない。
const BUILTIN_AGENTS = new Set([
  "claude",
  "general-purpose",
  "Explore",
  "Plan",
  "statusline-setup",
  "fork",
]);

const args = process.argv.slice(2);
const has = (f) => args.includes(f);

// ── ユーティリティ ──────────────────────────────────────────────
function walk(dir, exts, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === ".git") continue;
      walk(p, exts, out);
    } else if (exts.some((x) => e.name.endsWith(x))) {
      out.push(p);
    }
  }
  return out;
}
const rel = (p) => path.relative(ROOT, p);
function readSafe(p) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return "";
  }
}

// SKILL が「dead (削除済み機能の歴史的記述)」と明示マークされているか。
// frontmatter に status: dead または deprecated: true があれば link/script 参照検査から除外する。
function isDeadSkill(text) {
  const fm = text.split("---")[1] || "";
  return /^\s*status:\s*dead\b/m.test(fm) || /^\s*deprecated:\s*true\b/m.test(fm);
}

// ── 検査 ────────────────────────────────────────────────────────
function checkSkillAgentLinks(findings, scope) {
  let skillFiles = walk(path.join(ROOT, ".claude/skills"), ["SKILL.md"]);
  if (scope) skillFiles = skillFiles.filter((f) => scope.has(rel(f)));
  for (const sf of skillFiles) {
    const text = readSafe(sf);
    if (isDeadSkill(text)) continue;
    const fm = text.split("---")[1] || "";
    const agents = new Set();
    const pa = fm.match(/^primary_agent:\s*(.+)$/m);
    if (pa) pa[1].split(/[,\s]+/).forEach((a) => a && agents.add(a.trim()));
    const co = fm.match(/^co_agents:\s*\[([^\]]*)\]/m);
    if (co) co[1].split(",").forEach((a) => a.trim() && agents.add(a.trim()));
    for (const a of agents) {
      const name = a.replace(/['"]/g, "");
      if (!name || name === "[]") continue;
      if (BUILTIN_AGENTS.has(name)) continue; // 組み込み agent 型はファイル不要
      const agentFile = path.join(ROOT, ".claude/agents", `${name}.md`);
      if (!fs.existsSync(agentFile)) {
        findings.push({
          level: "error",
          code: "E1",
          file: rel(sf),
          msg: `primary_agent/co_agents '${name}' に対応する .claude/agents/${name}.md が無い`,
        });
      }
    }
  }
}

function checkSkillScriptRefs(findings, scope) {
  let skillFiles = walk(path.join(ROOT, ".claude/skills"), ["SKILL.md"]);
  if (scope) skillFiles = skillFiles.filter((f) => scope.has(rel(f)));
  // 拡張子直後に \b を付け、`.json` 内の `.js` / `.tsx` 内の `.ts` への部分列誤マッチ (false E2) を防ぐ。
  const re = /\.claude\/(?:scripts|hooks)\/[A-Za-z0-9._/-]+\.(?:mjs|cjs|js|py|sh|ts)\b/g;
  for (const sf of skillFiles) {
    const text = readSafe(sf);
    if (isDeadSkill(text)) continue;
    const seen = new Set();
    let m;
    while ((m = re.exec(text))) {
      const p = m[0];
      if (seen.has(p)) continue;
      seen.add(p);
      if (!fs.existsSync(path.join(ROOT, p))) {
        findings.push({
          level: "error",
          code: "E2",
          file: rel(sf),
          msg: `参照する ${p} が存在しない`,
        });
      }
    }
  }
}

// [W2] dead-skill 検知: 非 dead の SKILL が参照する packages/**|apps/** の "scripts" 配下スクリプトが
//      存在するか。E2 は .claude/scripts|hooks しか見ないため、migration で削除された生成 CLI を参照した
//      まま放置された skill (例: 2026-06-21 発見の ai-content 生成パイプライン削除) を捕まえる。意図的に
//      dead なら frontmatter に status: dead を付けて除外。warn 止まり (既存違反で gate を壊さない)。
function checkSkillExternalScriptRefs(findings, scope) {
  let skillFiles = walk(path.join(ROOT, ".claude/skills"), ["SKILL.md"]);
  if (scope) skillFiles = skillFiles.filter((f) => scope.has(rel(f)));
  const pathRe = /(?:packages|apps)\/[A-Za-z0-9._/-]+\.(?:mjs|cjs|js|py|sh|ts)/g;
  // 実行コンテキストの行のみ対象 (npx/node/tsx/bash/sh/python/./)。
  // 歴史的記述・参照リスト中のパス言及 (例: knowledge の事故記録) は実行ではないので除外し誤検知を防ぐ。
  const RUNNER = /(?:^|\s)(?:npx|node|tsx|bash|sh|python3?|\.\/)\s/;
  for (const sf of skillFiles) {
    const text = readSafe(sf);
    if (isDeadSkill(text)) continue;
    const seen = new Set();
    for (const line of text.split("\n")) {
      if (!RUNNER.test(line)) continue;
      let m;
      pathRe.lastIndex = 0;
      while ((m = pathRe.exec(line))) {
        const p = m[0];
        if (seen.has(p) || !/\/scripts?\//.test(p)) continue; // scripts 配下のみ
        seen.add(p);
        if (!fs.existsSync(path.join(ROOT, p))) {
          findings.push({
            level: "warn",
            code: "W2",
            file: rel(sf),
            msg: `実行参照する ${p} が存在しない (dead-skill の可能性。意図的なら frontmatter に status: dead)`,
          });
        }
      }
    }
  }
}

function checkHookFiles(findings) {
  for (const sname of ["settings.json", "settings.local.json"]) {
    const sp = path.join(ROOT, ".claude", sname);
    if (!fs.existsSync(sp)) continue;
    let json;
    try {
      json = JSON.parse(readSafe(sp));
    } catch {
      findings.push({ level: "error", code: "E3", file: `.claude/${sname}`, msg: "JSON parse 失敗" });
      continue;
    }
    const hooks = json.hooks || {};
    for (const ev of Object.keys(hooks)) {
      for (const grp of hooks[ev] || []) {
        for (const h of grp.hooks || []) {
          const cmd = h.command || "";
          // command 中の .claude/.../*.{js,cjs,mjs,sh} パスを抽出
          const m = cmd.match(/\.claude\/[A-Za-z0-9._/-]+\.(?:js|cjs|mjs|sh|ts)/);
          if (m && !fs.existsSync(path.join(ROOT, m[0]))) {
            findings.push({
              level: "error",
              code: "E3",
              file: `.claude/${sname}`,
              msg: `hook ${ev} の command が指す ${m[0]} が存在しない`,
            });
          }
        }
      }
    }
  }
}

function checkOrphanScripts(findings) {
  const scripts = walk(path.join(ROOT, ".claude/scripts"), [".mjs", ".cjs", ".js", ".py", ".sh"]);
  // 参照コーパス (basename がどこかに出現すれば参照ありとみなす)
  const corpusDirs = [".claude/skills", ".claude/agents", ".claude/scripts", ".claude/hooks", ".github/workflows", "scripts", "docs"];
  let corpus = "";
  for (const d of corpusDirs) {
    for (const f of walk(path.join(ROOT, d), [".md", ".mjs", ".cjs", ".js", ".py", ".sh", ".yml", ".yaml", ".json", ".ts"])) {
      const st = fs.statSync(f);
      if (st.size > 600_000) continue; // 巨大ファイルはスキップ
      corpus += readSafe(f) + "\n";
    }
  }
  for (const s of scripts) {
    const base = path.basename(s);
    // 自身の定義行以外で basename が出現するか (定義ファイルだけの一致を除くため出現回数 > 1 を要求)
    let idx = 0,
      count = 0;
    while ((idx = corpus.indexOf(base, idx)) !== -1) {
      count++;
      idx += base.length;
      if (count > 1) break;
    }
    if (count <= 1) {
      findings.push({
        level: "warn",
        code: "W1",
        file: rel(s),
        msg: `どの SKILL/agent/workflow/script からも参照されていない可能性 (orphan)`,
      });
    }
  }
}

// ── 関連変更の検出 + ハッシュ (gate / mark-audited 用) ───────────
function relevantChangedFiles() {
  let out;
  try {
    out = execFileSync("git", ["-C", ROOT, "status", "--porcelain", "--untracked-files=all"], {
      encoding: "utf8",
    });
  } catch {
    return null; // git 無し等 → ゲート無効
  }
  const files = [];
  for (const line of out.split("\n")) {
    if (!line.trim()) continue;
    const p = line.slice(3).trim().replace(/^"|"$/g, "");
    // rename "old -> new" の new 側
    const real = p.includes(" -> ") ? p.split(" -> ")[1] : p;
    if (
      /^\.claude\/(agents|skills|scripts|hooks)\//.test(real) ||
      /SKILL\.md$/.test(real) ||
      real === ".claude/settings.json"
    ) {
      files.push(real);
    }
  }
  return [...new Set(files)].sort();
}

function changesetHash(files) {
  const h = crypto.createHash("sha256");
  for (const f of files) {
    const abs = path.join(ROOT, f);
    let content = "DELETED";
    try {
      content = crypto.createHash("sha1").update(fs.readFileSync(abs)).digest("hex");
    } catch {}
    h.update(f + "\0" + content + "\n");
  }
  return h.digest("hex");
}

function readMarker() {
  try {
    return JSON.parse(readSafe(AUDIT_MARKER));
  } catch {
    return null;
  }
}

// ── モード分岐 ──────────────────────────────────────────────────
function runChecks({ orphan, scope }) {
  const findings = [];
  // scope (Set<relpath>) 指定時は SKILL 系をその集合に絞る (gate=今回の変更だけ点検)。
  checkSkillAgentLinks(findings, scope);
  checkSkillScriptRefs(findings, scope);
  checkSkillExternalScriptRefs(findings, scope);
  // hook 検査は settings.json が scope に含まれるか、scope 無し(全検査)のときだけ
  if (!scope || scope.has(".claude/settings.json") || scope.has(".claude/settings.local.json")) {
    checkHookFiles(findings);
  }
  if (orphan) checkOrphanScripts(findings);
  return findings;
}

if (has("--mark-audited")) {
  const files = relevantChangedFiles() || [];
  fs.mkdirSync(path.dirname(AUDIT_MARKER), { recursive: true });
  const hash = changesetHash(files);
  fs.writeFileSync(
    AUDIT_MARKER,
    JSON.stringify({ hash, audited_at: new Date().toISOString().slice(0, 19), files }, null, 2) + "\n"
  );
  console.log(`[audited] ${files.length} 関連変更ファイルを監査済みとして記録 (hash ${hash.slice(0, 12)})`);
  process.exit(0);
}

if (has("--gate")) {
  // Stop hook 用。出力は最小・人間/agent 向け。
  const files = relevantChangedFiles();
  if (files === null || files.length === 0) process.exit(0); // git無し or 関連変更なし → 黙る
  const marker = readMarker();
  const hash = changesetHash(files);
  if (marker && marker.hash === hash) process.exit(0); // 監査済み → 黙る
  // 未監査 → 機械チェックを「今回の変更ファイルだけ」に絞って実行 (orphan/全リポ rot は gate では見ない)
  const findings = runChecks({ orphan: false, scope: new Set(files) });
  const errs = findings.filter((f) => f.level === "error");
  const lines = [];
  lines.push(`⚠️ 整合性監査が未実施です。この会話で agent/skill/script/hook を ${files.length} 件変更しました。`);
  lines.push(`完了前に確認してください (CLAUDE.md 行動原則8「書く前に読む」)。`);
  lines.push(``);
  lines.push(`1) 機械チェック: node .claude/scripts/lib/check-agent-skill-consistency.cjs`);
  if (errs.length) {
    lines.push(`   ↳ 既に ${errs.length} 件の error 検出:`);
    for (const e of errs.slice(0, 5)) lines.push(`     - [${e.code}] ${e.file}: ${e.msg}`);
  }
  lines.push(`2) 意味レビュー (機械では捕まらない統合バグ。例: 2026-06-16 の auto-resubmit が -drilldown.csv を誤爆送信):`);
  lines.push(`   - 新しい script/skill の出力を「消費する側」を実際に Read したか?`);
  lines.push(`   - 消費側の前提 (ファイル名規約 / glob / スキーマ) は実装上ほんとうに成立するか?`);
  lines.push(`   - doc/memory に書いた「○○は××しない」を実装で確認したか?`);
  lines.push(`   - 新規 skill/agent を参照すべき index/agent doc/cadence (weekly-review 等) を更新したか?`);
  lines.push(`3) 解除: node .claude/scripts/lib/check-agent-skill-consistency.cjs --mark-audited`);
  lines.push(``);
  lines.push(`変更: ${files.slice(0, 12).join(", ")}${files.length > 12 ? " …" : ""}`);
  process.stdout.write(lines.join("\n") + "\n");
  process.exit(2);
}

// 既定: 全検査 report
const findings = runChecks({ orphan: !has("--no-orphan") });
if (has("--json")) {
  console.log(JSON.stringify({ findings, summary: tally(findings) }, null, 2));
} else {
  const errs = findings.filter((f) => f.level === "error");
  const warns = findings.filter((f) => f.level === "warn");
  if (!findings.length) {
    console.log("✓ 整合性チェック: error/warn なし");
  } else {
    for (const f of findings) {
      console.log(`${f.level === "error" ? "✗" : "⚠"} [${f.code}] ${f.file}: ${f.msg}`);
    }
    console.log(`\n計 error ${errs.length} / warn ${warns.length}`);
  }
}
function tally(fs_) {
  return {
    error: fs_.filter((f) => f.level === "error").length,
    warn: fs_.filter((f) => f.level === "warn").length,
  };
}
process.exit(findings.some((f) => f.level === "error") ? 1 : 0);
