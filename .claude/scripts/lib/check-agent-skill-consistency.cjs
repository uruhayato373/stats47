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
 *   [E4] 全 custom agent の frontmatter (name/description/model) が完全か
 *   [E5] 全 custom agent に Output Contract があるか
 *   [E6] 全 active skill の frontmatter (name/description/primary_agent) が完全か
 *   [E7] agent/skill に過剰検証を誘発する禁止 prompt が無いか
 *   [E8] subagent 委譲 skill が共通契約を参照し、同時起動上限 3 以下か
 *   [E9] agent/skill frontmatter に YAML として危険な plain scalar が無いか
 *   [E10] Claude Code → Codex MCP と blog画像skillの入口がSSOTどおりか
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
// パス区切りは常に "/" に正規化する。Windows では path.relative が "\" を返し、
// 除外リスト (例: task-router の primary_agent 免除) や git status 由来の
// scope 突合が一致せず、Windows でだけ誤検知する (2026-07-28 実測)。
const rel = (p) => path.relative(ROOT, p).split(path.sep).join("/");
function readSafe(p) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return "";
  }
}

function extractFrontmatter(text) {
  if (!text.startsWith("---\n")) return "";
  const end = text.indexOf("\n---", 4);
  return end === -1 ? "" : text.slice(4, end);
}

function frontmatterValue(frontmatter, field) {
  const lines = frontmatter.split("\n");
  const start = lines.findIndex((line) => line.startsWith(`${field}:`));
  if (start === -1) return "";
  const inline = lines[start].slice(field.length + 1).trim();
  if (!/^[>|][+-]?$/.test(inline)) return inline;

  const continuation = [];
  for (let i = start + 1; i < lines.length && /^\s+/.test(lines[i]); i += 1) {
    continuation.push(lines[i].trim());
  }
  return continuation.join(" ");
}

// Full YAML parserをCI依存に加えず、frontmatterで実際に事故になった構文を決定的に止める。
// 引用済み scalar と folded/literal block は対象外。複雑な値は frontmatter に置かない。
function checkFrontmatterSyntax(findings, file, text) {
  const frontmatter = extractFrontmatter(text);
  if (!frontmatter) {
    findings.push({
      level: "error",
      code: "E9",
      file: rel(file),
      msg: "先頭の YAML frontmatter が無い、または閉じていない",
    });
    return;
  }

  for (const line of frontmatter.split("\n")) {
    if (!line || /^\s/.test(line) || line.startsWith("#")) continue;
    const match = line.match(/^[A-Za-z_][A-Za-z0-9_-]*:\s*(.*)$/);
    if (!match) {
      findings.push({
        level: "error",
        code: "E9",
        file: rel(file),
        msg: `frontmatter の top-level 行が key: value 形式ではない: ${line}`,
      });
      continue;
    }

    const value = match[1];
    if (!value || /^[>|][+-]?$/.test(value) || /^["']/.test(value)) continue;
    if (
      value.startsWith("`") ||
      (/^\[/.test(value) && (!value.endsWith("]") || /\]\s+\[/.test(value))) ||
      /:\s/.test(value)
    ) {
      findings.push({
        level: "error",
        code: "E9",
        file: rel(file),
        msg: "frontmatter の plain scalar が YAML として曖昧。引用符または folded block を使う",
      });
    }
  }
}

// SKILL が「dead (削除済み機能の歴史的記述)」と明示マークされているか。
// frontmatter に status: dead または deprecated: true があれば link/script 参照検査から除外する。
function isDeadSkill(text) {
  const fm = extractFrontmatter(text);
  return /^\s*status:\s*dead\b/m.test(fm) || /^\s*deprecated:\s*true\b/m.test(fm);
}

// ── 検査 ────────────────────────────────────────────────────────
function checkAgentPromptContracts(findings, scope) {
  let agentFiles = walk(path.join(ROOT, ".claude/agents"), [".md"]).filter(
    (f) => path.basename(f) !== "README.md"
  );
  if (scope) agentFiles = agentFiles.filter((f) => scope.has(rel(f)));
  // model-prompting.md が扱うモデル + inherit。fable は 2026-08-17 に backlog-loop の
  // escalation 先として追加した (CI の run 本体は sonnet 固定なので、上位モデルは
  // Agent tool の委譲でのみ使う)。ここを増やすときは model-prompting.md 側にも設計指針を書く。
  const allowedModels = new Set(["haiku", "sonnet", "opus", "fable", "inherit"]);

  for (const af of agentFiles) {
    const text = readSafe(af);
    const fm = extractFrontmatter(text);
    checkFrontmatterSyntax(findings, af, text);
    for (const field of ["name", "description", "model"]) {
      if (!frontmatterValue(fm, field)) {
        findings.push({
          level: "error",
          code: "E4",
          file: rel(af),
          msg: `frontmatter の ${field} が無い`,
        });
      }
    }
    const model = fm.match(/^model:\s*(\S+)/m)?.[1];
    if (model && !allowedModels.has(model)) {
      findings.push({
        level: "error",
        code: "E4",
        file: rel(af),
        msg: `model '${model}' は haiku/sonnet/opus/inherit のいずれでもない`,
      });
    }
    const description = frontmatterValue(fm, "description");
    if (description.length > 300) {
      findings.push({
        level: "error",
        code: "E4",
        file: rel(af),
        msg: "description が300文字を超えている。routingに必要な責務とtriggerへ絞る",
      });
    }
    if (!/^## Output Contract\b/m.test(text)) {
      findings.push({
        level: "error",
        code: "E5",
        file: rel(af),
        msg: "Output Contract が無い",
      });
    }
  }
}

function checkSkillPromptContracts(findings, scope) {
  let skillFiles = walk(path.join(ROOT, ".claude/skills"), ["SKILL.md"]);
  if (scope) skillFiles = skillFiles.filter((f) => scope.has(rel(f)));

  for (const sf of skillFiles) {
    const text = readSafe(sf);
    if (isDeadSkill(text)) continue;
    const fm = extractFrontmatter(text);
    checkFrontmatterSyntax(findings, sf, text);
    for (const field of ["name", "description"]) {
      if (!frontmatterValue(fm, field)) {
        findings.push({
          level: "error",
          code: "E6",
          file: rel(sf),
          msg: `frontmatter の ${field} が無い`,
        });
      }
    }
    if (text.split("\n").length > 500) {
      findings.push({
        level: "error",
        code: "E6",
        file: rel(sf),
        msg: "SKILL.md が500行を超えている。詳細をreferenceへ分離する",
      });
    }
    const hasPrimaryAgent =
      /^primary_agent:\s*\S+/m.test(fm) ||
      /^\s+primary_agent:\s*["']?\S+/m.test(fm);
    if (
      rel(sf) !== ".claude/skills/management/task-router/SKILL.md" &&
      !hasPrimaryAgent
    ) {
      findings.push({
        level: "error",
        code: "E6",
        file: rel(sf),
        msg: "primary_agent が無い",
      });
    }

    const delegates =
      /^context:\s*fork\b/m.test(fm) ||
      /\bAgent\([a-z][A-Za-z0-9_-]*\)/.test(text) ||
      /Agent tool[^\n]{0,100}(?:委譲|起動|呼ぶ)/i.test(text) ||
      /(?:subagent|サブエージェント)(?:\s*最大\s*[1-9][0-9]*体)?(?:へ|に)\s*(?:委譲|起動)/i.test(text);
    if (!delegates) continue;

    for (const required of [
      ".claude/rules/model-prompting.md",
      ".claude/rules/agent-output-contract.md",
    ]) {
      if (!text.includes(required)) {
        findings.push({
          level: "error",
          code: "E8",
          file: rel(sf),
          msg: `委譲する skill が ${required} を参照していない`,
        });
      }
    }
    const cap = /^context:\s*fork\b/m.test(fm)
      ? 1
      : Number(text.match(/最大\s*([0-9]+)/)?.[1] || NaN);
    if (!Number.isFinite(cap) || cap < 1 || cap > 3) {
      findings.push({
        level: "error",
        code: "E8",
        file: rel(sf),
        msg: "subagent 同時起動上限を 1〜3 の数値で明示していない",
      });
    }
  }
}

function checkBannedPromptPatterns(findings, scope) {
  let files = [
    ...walk(path.join(ROOT, ".claude/agents"), [".md"]).filter(
      (f) => path.basename(f) !== "README.md"
    ),
    ...walk(path.join(ROOT, ".claude/skills"), ["SKILL.md"]),
  ];
  if (scope) files = files.filter((f) => scope.has(rel(f)));
  const patterns = [
    ["自己検証", /自己検証/],
    ["ダブルチェック", /ダブルチェック/],
    ["double-check", /double-check/i],
    ["re-verify", /re-verify/i],
    ["答える前に再確認", /答える前に再確認/],
  ];
  for (const file of files) {
    const text = readSafe(file);
    if (file.endsWith("SKILL.md") && isDeadSkill(text)) continue;
    for (const [label, pattern] of patterns) {
      if (pattern.test(text)) {
        findings.push({
          level: "error",
          code: "E7",
          file: rel(file),
          msg: `過剰検証を誘発する prompt '${label}' が残っている`,
        });
      }
    }
  }
}

function checkSkillAgentLinks(findings, scope) {
  let skillFiles = walk(path.join(ROOT, ".claude/skills"), ["SKILL.md"]);
  if (scope) skillFiles = skillFiles.filter((f) => scope.has(rel(f)));
  for (const sf of skillFiles) {
    const text = readSafe(sf);
    if (isDeadSkill(text)) continue;
    const fm = extractFrontmatter(text);
    const agents = new Set();
    const pa = fm.match(/^primary_agent:\s*(.+)$/m);
    if (pa) pa[1].split(/[,\s]+/).forEach((a) => a && agents.add(a.trim()));
    const metadataPa = fm.match(/^\s+primary_agent:\s*(.+)$/m);
    if (metadataPa) {
      metadataPa[1]
        .split(/[,\s]+/)
        .forEach((a) => a && agents.add(a.trim()));
    }
    const co = fm.match(/^co_agents:\s*\[([^\]]*)\]/m);
    if (co) co[1].split(",").forEach((a) => a.trim() && agents.add(a.trim()));
    const metadataCo = fm.match(/^\s+co_agents:\s*(.+)$/m);
    if (metadataCo) {
      metadataCo[1]
        .replace(/[\[\]'"]/g, "")
        .split(",")
        .forEach((a) => a.trim() && agents.add(a.trim()));
    }
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

function checkCodexMcpContract(findings, scope) {
  const mcpRel = ".mcp.json";
  const ruleRel = ".claude/rules/codex-mcp.md";
  const skillRel = ".claude/skills/blog/generate-blog-images/SKILL.md";
  const codexSkillRel = ".agents/skills/generate-blog-images";
  const relevant = [mcpRel, ruleRel, skillRel, codexSkillRel];
  if (scope && !relevant.some((file) => scope.has(file))) return;

  const mcpPath = path.join(ROOT, mcpRel);
  if (!fs.existsSync(mcpPath)) return;
  let config;
  try {
    config = JSON.parse(readSafe(mcpPath));
  } catch {
    findings.push({
      level: "error",
      code: "E10",
      file: mcpRel,
      msg: "JSON parse 失敗",
    });
    return;
  }

  const codex = config?.mcpServers?.codex;
  if (
    codex?.type !== "stdio" ||
    codex?.command !== "codex" ||
    !Array.isArray(codex?.args) ||
    codex.args.length !== 1 ||
    codex.args[0] !== "mcp-server"
  ) {
    findings.push({
      level: "error",
      code: "E10",
      file: mcpRel,
      msg: 'codex MCPは type=stdio / command=codex / args=["mcp-server"] に固定する',
    });
  }

  const skill = readSafe(path.join(ROOT, skillRel));
  if (
    !skill ||
    !skill.includes("mcp__codex__codex") ||
    !skill.includes("npm run blog-images:codex -- request") ||
    !skill.includes("npm run blog-images:codex -- ingest")
  ) {
    findings.push({
      level: "error",
      code: "E10",
      file: skillRel,
      msg: "Codex MCP request/ingestのskill入口が無い、またはSSOTコマンド参照が欠けている",
    });
  }

  try {
    const expected = fs.realpathSync(path.dirname(path.join(ROOT, skillRel)));
    const actual = fs.realpathSync(path.join(ROOT, codexSkillRel));
    if (actual !== expected) throw new Error("target mismatch");
  } catch {
    findings.push({
      level: "error",
      code: "E10",
      file: codexSkillRel,
      msg: "Codex repo skillはClaude skill物理SSOTへのsymlinkにする",
    });
  }
}

function checkOrphanScripts(findings) {
  const scripts = walk(path.join(ROOT, ".claude/scripts"), [".mjs", ".cjs", ".js", ".py", ".sh"]);
  // 参照コーパス。**自分自身は除いて**数え、1 回でも出れば参照ありとする。
  //
  // ★2026-08-03 に 3 つの誤報原因を直した (63 警告の大半が false positive だった)。
  //   1. package.json を見ていなかった → npm script 経由で CI から走るテストを orphan 扱い
  //   2. ディレクトリ引数の実行が見えなかった (`node --test .claude/scripts/ads/__tests__/` や
  //      `.../metrics/__tests__/*.test.mjs`)。basename 照合では一致しないので、
  //      **親ディレクトリのパスが корпус に出るかも見る**
  //   3. `出現回数 > 1` を要求していた。これは「自分の定義ファイルでの一致」を除くための
  //      代用だったが、**1 箇所からだけ呼ばれる配線済みスクリプトを落としていた**
  //      (例: post-angle-carousel.yml から 1 回、pr-quality-check から 1 回)。
  //      自分自身をコーパスから除けば代用は不要で、正確に「他から参照されているか」を判定できる。
  //   4. `.claude/rules/` がコーパスに無かった → rules に手順として書かれた運用ツールを orphan 扱い
  const corpusDirs = [
    ".claude/skills",
    ".claude/agents",
    ".claude/rules",
    ".claude/prompts",
    ".claude/scripts",
    ".claude/hooks",
    ".github/workflows",
    "scripts",
    "docs",
    // CLAUDE.md / AGENTS.md はリポジトリ直下にあり、運用ツールの実行手順がここに書かれている
    // (例: setup-memory-symlink.sh)。ディレクトリ走査だけだと拾えない。
    ".",
    // metric config の provenance.restore に「このデータの再取得コマンド」が書かれている
    // (data-provenance-standards.md §2)。手動投入データの取得スクリプトはここからしか参照されない。
    "packages/data-configs/src/metrics",
  ];
  let pkgScripts = "";
  try {
    pkgScripts = JSON.stringify(JSON.parse(readSafe(path.join(ROOT, "package.json"))).scripts ?? {});
  } catch {
    pkgScripts = "";
  }
  // 自己一致を除くため path → text で持つ (連結してしまうと自分の分を引けない)
  const corpus = [];
  for (const d of corpusDirs) {
    const files =
      d === "."
        ? // 直下の .md だけ (再帰すると node_modules ごと読んでしまう)
          fs
            .readdirSync(ROOT, { withFileTypes: true })
            .filter((e) => e.isFile() && e.name.endsWith(".md"))
            .map((e) => path.join(ROOT, e.name))
        : walk(path.join(ROOT, d), [".md", ".mjs", ".cjs", ".js", ".py", ".sh", ".yml", ".yaml", ".json", ".ts"]);
    for (const f of files) {
      let st;
      try {
        st = fs.statSync(f);
      } catch {
        continue;
      }
      if (st.size > 600_000) continue; // 巨大ファイルはスキップ
      // ★docs/todo は参照元にしない (2026-08-03)。「この未使用スクリプトを消すか検討する」と
      //   TODO に書いた瞬間に「参照あり」となって警告が消える = 何もしていないのに解決に見える。
      //   TODO はそのスクリプトが**使われている**証拠ではない。
      if (rel(f).startsWith("docs/todo/")) continue;
      corpus.push({ file: f, text: readSafe(f) });
    }
  }
  corpus.push({ file: path.join(ROOT, "package.json"), text: pkgScripts });

  /** 自分自身のファイルを除いて needle が 1 回でも出現するか */
  function referencedElsewhere(needle, selfFile) {
    for (const entry of corpus) {
      if (entry.file === selfFile) continue;
      if (entry.text.includes(needle)) return true;
    }
    return false;
  }

  /**
   * ディレクトリごと実行される形だけを拾う (`node --test <dir>/` / `<dir>/*.test.mjs`)。
   * ★単に「ディレクトリ名が出現する」では駄目。docs がパスに言及しているだけで
   *   配下全部が配線済みになり、警告が 0 件になる = 何も見ない checker になる
   *   (2026-08-03 に一度そうしてしまい、63→0 で気づいた)。
   *   直前に `--test` があるものだけを実行とみなす。
   */
  function runAsDirectory(dirRel, selfFile) {
    for (const entry of corpus) {
      if (entry.file === selfFile) continue;
      let idx = 0;
      while ((idx = entry.text.indexOf(`${dirRel}/`, idx)) !== -1) {
        const before = entry.text.slice(Math.max(0, idx - 40), idx);
        // ★このディレクトリ自身の実行に限る。`--test lib/__tests__/` は lib/ 直下の
        //   スクリプトを実行しないので、続きに `/` が来る (= より深い階層) 場合は数えない。
        //   これを見落とすと lib/ 直下の未参照スクリプトが検出されなくなる。
        const after = entry.text.slice(idx + dirRel.length + 1).split(/[\s"']/, 1)[0] ?? "";
        if (before.includes("--test") && !after.includes("/")) return true;
        idx += dirRel.length;
      }
    }
    return false;
  }

  for (const s of scripts) {
    const base = path.basename(s);
    const dirRel = rel(path.dirname(s));
    const wired = referencedElsewhere(base, s) || runAsDirectory(dirRel, s);
    if (!wired) {
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
      /^\.claude\/(rules|output-styles)\//.test(real) ||
      /^\.agents\/skills\//.test(real) ||
      /SKILL\.md$/.test(real) ||
      real === ".claude/settings.json" ||
      real === ".mcp.json" ||
      real === "CLAUDE.md"
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
  // scope (Set<relpath>) 指定時は agent/SKILL 系をその集合に絞る (gate=今回の変更だけ点検)。
  checkAgentPromptContracts(findings, scope);
  checkSkillPromptContracts(findings, scope);
  checkBannedPromptPatterns(findings, scope);
  checkSkillAgentLinks(findings, scope);
  checkSkillScriptRefs(findings, scope);
  checkSkillExternalScriptRefs(findings, scope);
  // hook 検査は settings.json が scope に含まれるか、scope 無し(全検査)のときだけ
  if (!scope || scope.has(".claude/settings.json") || scope.has(".claude/settings.local.json")) {
    checkHookFiles(findings);
  }
  checkCodexMcpContract(findings, scope);
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
