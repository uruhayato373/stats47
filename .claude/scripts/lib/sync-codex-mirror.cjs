#!/usr/bin/env node
"use strict";

/**
 * Codex が読む生成物を Claude 側の SSOT から作り直す (二重管理のドリフト止め)。
 *
 *   .claude/skills/<群>/<skill>/ → .agents/skills/<群>/<skill> (skill のフォルダごとの相対 symlink。複製しない)
 *   .claude/skills/** (skill の外) → .agents/skills/**        (learned/*.md など。ファイルごとの相対 symlink)
 *   .claude/agents/<name>.md     → .codex/agents/<name>.toml (frontmatter → キー、本文 → developer_instructions)
 *   .claude/settings.json の hooks → .codex/hooks.json        (Codex で動かない hook を除いた生成物)
 *
 * 決定事項 (2026-09-14):
 *   - 正典は .claude 側。skill はフォルダのリンク、agent TOML と hooks.json は形式変換した生成物。正典を二重管理しない。
 *   - 2026-11-24 (CODEX-MIRROR-SLIM-01): SKILL.md の複製 161 本 (1.43MB) をやめ、skill のフォルダを symlink にした。
 *     根拠は Codex の公式文書 (https://learn.chatgpt.com/docs/build-skills、2026-11-24 取得) の
 *     "Codex supports symlinked skill folders and follows the symlink target when scanning these locations."。
 *     フォルダごとのリンクなので、skill の中のデータ (reference/snapshots など) もリンク越しに見える。
 *   - `.claude/` → `.Codex/` の書き換えはしない。Codex は AGENTS.md → CLAUDE.md 経由で .claude/rules を
 *     読むので原文が正しい (旧 mirror は存在しない .Codex/rules/… を 188 ファイルで指していた)。
 *   - 週次 snapshot・レビュー等のデータ (reference/snapshots, snapshots, reference/reviews,
 *     weekly-snapshots) は指示ではないので mirror に含めない。
 *   - .agents/skills 内に既にある symlink で .claude/skills を指すもの (generate-blog-images 等) は
 *     そのまま残す (E10 が symlink を要求する)。
 *
 *   node .claude/scripts/lib/sync-codex-mirror.cjs            # 生成 (差分があるものだけ書く・不要物は消す)
 *   node .claude/scripts/lib/sync-codex-mirror.cjs --check    # ドリフトがあれば一覧を出して exit 1 (CI / E11)
 *   node .claude/scripts/lib/sync-codex-mirror.cjs --root <dir>   # 別のルートを対象にする (テストの fixture 用)
 */

const fs = require("node:fs");
const path = require("node:path");

// ルートは、このスクリプトが置かれている作業ツリー。CLAUDE_PROJECT_DIR は読まない: worktree のセッションでは
// その変数が元の作業ツリーを指すので、ルートにすると再生成が別の作業ツリーへ書き込む (CI-TOOLING-FOLLOWUP-01)。
// 別のルート (テストの fixture・整合性検査が見ているルート) は --root <dir> か setRoot() で明示する。
/** @type {string} */ let ROOT;
/** @type {string} */ let SKILLS_SRC;
/** @type {string} */ let SKILLS_DST;
/** @type {string} */ let AGENTS_SRC;
/** @type {string} */ let AGENTS_DST;
/** @type {string} */ let SETTINGS_SRC;
/** @type {string} */ let HOOKS_DST;

/** @param {string} root */
function setRoot(root) {
  ROOT = path.resolve(root);
  SKILLS_SRC = path.join(ROOT, ".claude/skills");
  SKILLS_DST = path.join(ROOT, ".agents/skills");
  AGENTS_SRC = path.join(ROOT, ".claude/agents");
  AGENTS_DST = path.join(ROOT, ".codex/agents");
  SETTINGS_SRC = path.join(ROOT, ".claude/settings.json");
  HOOKS_DST = path.join(ROOT, ".codex/hooks.json");
}
setRoot(path.resolve(__dirname, "..", "..", ".."));

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
    // 比較する両側を実体パスに揃える。片側だけ realpath にすると、root 自体が symlink を含む場所
    // (macOS の /var → /private/var など) で正しいリンクを「外を指す」と誤判定する (2026-10-02)
    const root = fs.realpathSync(targetRoot);
    return real === root || real.startsWith(root + path.sep);
  } catch {
    return false;
  }
}

// ── skills ─────────────────────────────────────────────────────────────────
/** SKILL.md を持つフォルダ (.claude/skills からの相対パス)。この単位でリンクする */
function skillFolders() {
  const folders = new Set();
  for (const src of walkFiles(SKILLS_SRC, [], { skipData: true })) {
    if (path.basename(src) === "SKILL.md") folders.add(path.relative(SKILLS_SRC, path.dirname(src)));
  }
  return folders;
}

/** r (相対パス) を含む skill のフォルダ。無ければ null */
function owningFolder(r, folders) {
  let cur = path.dirname(r);
  while (cur && cur !== ".") {
    if (folders.has(cur)) return cur;
    cur = path.dirname(cur);
  }
  return null;
}

function planSkills() {
  const folders = skillFolders();
  const actions = [];
  // skill のフォルダは丸ごとリンクにする (Codex は symlink のフォルダを辿る)
  for (const folder of folders) {
    const dst = path.join(SKILLS_DST, folder);
    const src = path.join(SKILLS_SRC, folder);
    let linked = false;
    try {
      linked = fs.lstatSync(dst).isSymbolicLink() && fs.realpathSync(dst) === fs.realpathSync(src);
    } catch { /* 無い */ }
    if (!linked) actions.push({ op: "dirlink", path: dst, src });
  }
  // skill の外のファイル (learned/*.md など) はファイルごとのリンク
  const expected = new Map(); // dst relative → { src }
  for (const src of walkFiles(SKILLS_SRC, [], { skipData: true })) {
    const r = path.relative(SKILLS_SRC, src);
    if (owningFolder(r, folders) !== null) continue;
    expected.set(r, { src });
  }
  const seen = new Set();
  if (fs.existsSync(SKILLS_DST)) {
    for (const dst of walkFiles(SKILLS_DST)) {
      const r = path.relative(SKILLS_DST, dst);
      // skill のフォルダ自体と、その中の古い複製は上の dirlink が置き換える
      if (folders.has(r) || owningFolder(r, folders) !== null) continue;
      seen.add(r);
      // 同名の原本を指すリンクだけを許可する。別 skill への誤リンクは修復する。
      // .claude/skills の skill を指す既存のフォルダのリンク (generate-blog-images) は残す (E10 が要求する)。
      const source = path.join(SKILLS_SRC, r);
      if (isLinkInto(dst, SKILLS_SRC) && (fs.statSync(dst).isDirectory() ||
          (fs.existsSync(source) && fs.realpathSync(dst) === fs.realpathSync(source)))) continue;
      const want = expected.get(r);
      if (!want) {
        actions.push({ op: "delete", path: dst });
        continue;
      }
      if (fs.lstatSync(want.src).isSymbolicLink()) continue; // src 側 symlink はリンクしない
      actions.push({ op: "link", path: dst, src: want.src });
    }
  }
  for (const [r, { src }] of expected) {
    if (seen.has(r)) continue;
    if (fs.lstatSync(src).isSymbolicLink()) continue;
    // 生成物側に「ディレクトリ symlink」があり、その配下に該当する場合は既に届いている
    const dst = path.join(SKILLS_DST, r);
    if (coveredByDirLink(dst)) continue;
    actions.push({ op: "link", path: dst, src });
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

// ── hooks ──────────────────────────────────────────────────────────────────
// Codex で動かない hook。理由を書いたものだけを除き、残りは settings.json から機械的に写す。
const CODEX_EXCLUDED_HOOKS = new Map([
  // ブラウザの MCP (claude-in-chrome・Claude_Browser・chrome-devtools) は Codex に無い (.codex/config.toml で無効)
  [".claude/hooks/pre-browser-admin-read.mjs", "Codex にブラウザの MCP が無い"],
  // Claude Code の transcript (JSONL) の形を読む。Codex の transcript は形が違う
  [".claude/hooks/check-unpushed-on-stop.js", "Claude Code の transcript の形を読む"],
  [".claude/hooks/check-findings-on-stop.js", "Claude Code の transcript の形を読む"],
]);

/** `node "$CLAUDE_PROJECT_DIR"/.claude/hooks/x.js args` → `node '.claude/hooks/x.js' args` */
function codexHookCommand(command) {
  const m = /^node "\$CLAUDE_PROJECT_DIR"\/(\S+)(.*)$/.exec(command);
  if (!m) throw new Error(`settings.json の hook command を Codex 用に写せない: ${command}`);
  return { file: m[1], command: `node '${m[1]}'${m[2]}` };
}

function renderCodexHooks() {
  const settings = JSON.parse(fs.readFileSync(SETTINGS_SRC, "utf8"));
  /** @type {Record<string, any[]>} */
  const out = {};
  for (const [event, groups] of Object.entries(settings.hooks ?? {})) {
    const kept = [];
    for (const group of groups) {
      const hooks = [];
      for (const hook of group.hooks ?? []) {
        const { file, command } = codexHookCommand(hook.command);
        if (CODEX_EXCLUDED_HOOKS.has(file)) continue;
        hooks.push({ ...hook, command });
      }
      if (hooks.length === 0) continue;
      kept.push(group.matcher === undefined ? { hooks } : { matcher: group.matcher, hooks });
    }
    if (kept.length > 0) out[event] = kept;
  }
  return `${JSON.stringify({ hooks: out }, null, 2)}\n`;
}

function planHooks() {
  if (!fs.existsSync(SETTINGS_SRC)) return [];
  const want = renderCodexHooks();
  const have = fs.existsSync(HOOKS_DST) ? fs.readFileSync(HOOKS_DST, "utf8").replace(/\r\n/g, "\n") : null;
  return have === want ? [] : [{ op: "write", path: HOOKS_DST, content: want }];
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
    if (a.op === "dirlink") {
      // 古い複製のフォルダ (中身はコピーとリンク) を消してからフォルダのリンクを張る。
      // rmSync はリンクを辿らないので、原本 (.claude/skills) は消えない。
      fs.rmSync(a.path, { recursive: true, force: true });
      fs.symlinkSync(path.relative(path.dirname(a.path), a.src).split(path.sep).join("/"), a.path, "dir");
    }
    else if (a.op === "link") {
      // unlink のみ。既存リンクの原本へ書き込んだり、原本を削除したりしない。
      try { fs.unlinkSync(a.path); } catch (error) { if (error.code !== "ENOENT") throw error; }
      fs.symlinkSync(path.relative(path.dirname(a.path), a.src).split(path.sep).join("/"), a.path, "file");
    }
    else if (a.src) {
      try { fs.unlinkSync(a.path); } catch (error) { if (error.code !== "ENOENT") throw error; }
      fs.copyFileSync(a.src, a.path);
    }
    else fs.writeFileSync(a.path, a.content);
  }
}

function main(argv = process.argv.slice(2)) {
  const check = argv.includes("--check");
  const rootAt = argv.indexOf("--root");
  if (rootAt >= 0) {
    const root = argv[rootAt + 1];
    if (!root || root.startsWith("--")) {
      console.error("✗ --root にはルートのディレクトリを渡す");
      return 2;
    }
    setRoot(root);
  }
  const actions = [...planSkills(), ...planAgents(), ...planHooks()];
  const stale = actions.filter((a) => a.op === "delete").length;
  const writes = actions.length - stale;
  if (check) {
    if (actions.length === 0) {
      console.log("✓ codex mirror 一致 — .agents/skills・.codex/agents・.codex/hooks.json は .claude の SSOT と同一");
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
module.exports = { planSkills, planAgents, planHooks, renderAgentToml, renderCodexHooks, parseFrontmatter, tomlMultiline, setRoot };
