#!/usr/bin/env node
"use strict";

/**
 * Codex が読む生成物を Claude 側の SSOT から作り直す (二重管理のドリフト止め)。
 *
 *   .claude/skills/**            → .agents/skills/**        (バイト同一コピー)
 *   .claude/agents/<name>.md     → .codex/agents/<name>.toml (frontmatter → キー、本文 → developer_instructions)
 *
 * 決定事項 (2026-09-14):
 *   - 正典は .claude 側。.agents/skills と .codex/agents は tracked のままの生成物で、手で直さない。
 *   - `.claude/` → `.Codex/` の書き換えはしない。Codex は AGENTS.md → CLAUDE.md 経由で .claude/rules を
 *     読むので原文が正しい (旧 mirror は存在しない .Codex/rules/… を 188 ファイルで指していた)。
 *   - 週次 snapshot・レビュー等のデータ (reference/snapshots, snapshots, reference/reviews,
 *     weekly-snapshots) は指示ではないので mirror に含めない。
 *   - .agents/skills 内に既にある symlink で .claude/skills を指すもの (generate-blog-images 等) は
 *     そのまま残す (E10 が symlink を要求する)。
 *
 *   node .claude/scripts/lib/sync-codex-mirror.cjs            # 生成 (差分があるものだけ書く・不要物は消す)
 *   node .claude/scripts/lib/sync-codex-mirror.cjs --check    # ドリフトがあれば一覧を出して exit 1 (CI / E11)
 */

const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..", "..");
const SKILLS_SRC = path.join(ROOT, ".claude/skills");
const SKILLS_DST = path.join(ROOT, ".agents/skills");
const AGENTS_SRC = path.join(ROOT, ".claude/agents");
const AGENTS_DST = path.join(ROOT, ".codex/agents");

// 指示ではないデータ。mirror に含めない (Codex は .claude 側の絶対パスで読む)。
const DATA_DIR_NAMES = new Set(["snapshots", "reviews", "weekly-snapshots"]);

const rel = (p) => path.relative(ROOT, p).split(path.sep).join("/");

// skipData: SSOT 側はデータディレクトリを読まない。生成物側は全部見て、古い複製を削除対象にする。
function walkFiles(dir, out = [], { skipData = false } = {}) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (skipData && DATA_DIR_NAMES.has(entry.name)) continue;
      walkFiles(full, out, { skipData });
    } else if (entry.isFile() || entry.isSymbolicLink()) {
      out.push(full);
    }
  }
  return out;
}

function isLinkInto(linkPath, targetRoot) {
  try {
    if (!fs.lstatSync(linkPath).isSymbolicLink()) return false;
    const real = fs.realpathSync(linkPath);
    return real === targetRoot || real.startsWith(targetRoot + path.sep);
  } catch {
    return false;
  }
}

// ── skills ─────────────────────────────────────────────────────────────────
function planSkills() {
  const expected = new Map(); // dst relative → { src }
  for (const src of walkFiles(SKILLS_SRC, [], { skipData: true })) {
    const r = path.relative(SKILLS_SRC, src);
    expected.set(r, { src });
  }
  const actions = [];
  const seen = new Set();
  if (fs.existsSync(SKILLS_DST)) {
    for (const dst of walkFiles(SKILLS_DST)) {
      const r = path.relative(SKILLS_DST, dst);
      seen.add(r);
      // 既存 symlink で .claude/skills を指すものは SSOT 参照なので触らない
      if (isLinkInto(dst, SKILLS_SRC)) continue;
      const want = expected.get(r);
      if (!want) {
        actions.push({ op: "delete", path: dst });
        continue;
      }
      if (fs.lstatSync(want.src).isSymbolicLink()) continue; // src 側 symlink はコピーしない
      const a = fs.readFileSync(want.src);
      const b = fs.readFileSync(dst);
      if (!a.equals(b)) actions.push({ op: "write", path: dst, src: want.src });
    }
  }
  for (const [r, { src }] of expected) {
    if (seen.has(r)) continue;
    if (fs.lstatSync(src).isSymbolicLink()) continue;
    // 生成物側に「ディレクトリ symlink」があり、その配下に該当する場合は既に届いている
    const dst = path.join(SKILLS_DST, r);
    if (coveredByDirLink(dst)) continue;
    actions.push({ op: "write", path: dst, src });
  }
  return actions;
}

// dst の祖先ディレクトリのどれかが .claude/skills への symlink なら、その配下は自動的に一致する
function coveredByDirLink(dst) {
  let cur = path.dirname(dst);
  while (cur.startsWith(SKILLS_DST) && cur !== SKILLS_DST) {
    if (isLinkInto(cur, SKILLS_SRC)) return true;
    cur = path.dirname(cur);
  }
  return false;
}

// ── agents ─────────────────────────────────────────────────────────────────
function parseFrontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(text);
  if (!m) throw new Error("frontmatter が無い");
  const fm = {};
  let key = null;
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line);
    if (kv) {
      key = kv[1];
      let v = kv[2].trim();
      if (v === ">-" || v === ">" || v === "|" || v === "|-") v = "";
      else if (/^(['"]).*\1$/.test(v)) v = v.slice(1, -1);
      fm[key] = v;
    } else if (key && /^\s+\S/.test(line)) {
      fm[key] = (fm[key] ? fm[key] + " " : "") + line.trim();
    }
  }
  return { fm, body: m[2] };
}

function tomlBasic(s) {
  return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r?\n/g, " ")}"`;
}

function tomlMultiline(body) {
  const text = body.replace(/\r\n/g, "\n").replace(/^\n+/, "").replace(/\s+$/, "");
  if (!text.includes("'''")) return `'''\n${text}'''`;
  // literal 文字列に載らない本文だけ basic 文字列で escape する
  return `"""\n${text.replace(/\\/g, "\\\\").replace(/"""/g, '""\\"')}"""`;
}

function renderAgentToml(mdPath) {
  const { fm, body } = parseFrontmatter(fs.readFileSync(mdPath, "utf8"));
  for (const k of ["name", "description"]) if (!fm[k]) throw new Error(`${rel(mdPath)}: frontmatter ${k} が無い`);
  return `name = ${tomlBasic(fm.name)}\ndescription = ${tomlBasic(fm.description)}\ndeveloper_instructions = ${tomlMultiline(body)}\n`;
}

function planAgents() {
  const actions = [];
  const expected = new Set();
  for (const f of fs.readdirSync(AGENTS_SRC)) {
    if (!f.endsWith(".md") || f === "README.md") continue;
    const name = f.slice(0, -3);
    const dst = path.join(AGENTS_DST, `${name}.toml`);
    expected.add(`${name}.toml`);
    const want = renderAgentToml(path.join(AGENTS_SRC, f));
    const have = fs.existsSync(dst) ? fs.readFileSync(dst, "utf8").replace(/\r\n/g, "\n") : null;
    if (have !== want) actions.push({ op: "write", path: dst, content: want });
  }
  if (fs.existsSync(AGENTS_DST)) {
    for (const f of fs.readdirSync(AGENTS_DST)) {
      if (f.endsWith(".toml") && !expected.has(f)) actions.push({ op: "delete", path: path.join(AGENTS_DST, f) });
    }
  }
  return actions;
}

// ── main ───────────────────────────────────────────────────────────────────
function apply(actions) {
  for (const a of actions) {
    if (a.op === "delete") {
      fs.rmSync(a.path, { force: true });
      // 空になったディレクトリを畳む
      let dir = path.dirname(a.path);
      while ([SKILLS_DST, AGENTS_DST].every((root) => dir !== root) && fs.existsSync(dir) && fs.readdirSync(dir).length === 0) {
        fs.rmdirSync(dir);
        dir = path.dirname(dir);
      }
      continue;
    }
    fs.mkdirSync(path.dirname(a.path), { recursive: true });
    if (a.src) fs.copyFileSync(a.src, a.path);
    else fs.writeFileSync(a.path, a.content);
  }
}

function main(argv = process.argv.slice(2)) {
  const check = argv.includes("--check");
  const actions = [...planSkills(), ...planAgents()];
  const stale = actions.filter((a) => a.op === "delete").length;
  const writes = actions.length - stale;
  if (check) {
    if (actions.length === 0) {
      console.log("✓ codex mirror 一致 — .agents/skills と .codex/agents は .claude の SSOT と同一");
      return 0;
    }
    console.error(`✗ codex mirror ドリフト: write ${writes} / delete ${stale}。再生成: node .claude/scripts/lib/sync-codex-mirror.cjs`);
    for (const a of actions.slice(0, 40)) console.error(`  [${a.op}] ${rel(a.path)}`);
    if (actions.length > 40) console.error(`  ... 他 ${actions.length - 40} 件`);
    return 1;
  }
  apply(actions);
  console.log(`✓ codex mirror 再生成: write ${writes} / delete ${stale}`);
  return 0;
}

if (require.main === module) process.exit(main());
module.exports = { planSkills, planAgents, renderAgentToml, parseFrontmatter, tomlMultiline };
