const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");

// tsconfig は JSONC (コメント付き) なので素の JSON.parse は通らない。
// ★行コメントだけを落とす。ブロックコメント除去を足すと glob の "**/*.ts" の `/*` を
//   コメント開始と誤認して include を食い潰す (実際にやって include が壊れた)。
const readJsonc = (rel) => {
  const raw = read(rel);
  assert.ok(!/^\s*\/\*/m.test(raw), `${rel}: ブロックコメントは使わない (この parser が壊れる)`);
  return JSON.parse(raw.replace(/^\s*\/\/.*$/gm, ""));
};

/**
 * 「CI が動かす TS スクリプトが型検査されていない」を**クラスとして**塞ぐ契約。
 *
 * ★背景 (2026-08-13)。各 package の tsconfig は include が src だけなので、scripts/ 配下は
 * 何もしなければ型検査されない。唯一あった検査は apps/web/scripts/tsconfig.ogp.json の
 * **手書き allowlist** で、そこに載っていなかった sync-rakuten-catalog.ts の import 漏れが
 * 9 日間検出されず、日次の楽天同期が毎日 11 分走ってから ReferenceError で全損していた。
 *
 * インスタンスを直すだけでは同じことが別ディレクトリで起きるので、ここでは
 * **ファイルシステムから scripts ディレクトリを列挙して**全件の被覆を要求する。
 */

const IGNORED_SEGMENTS = new Set(["node_modules", "dist", ".next", ".local", ".git", "out"]);

/** .ts / .mts / .tsx を含む "scripts" ディレクトリを列挙する */
function findScriptDirs(dir = ROOT, found = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || IGNORED_SEGMENTS.has(entry.name)) continue;
    const abs = path.join(dir, entry.name);
    if (entry.name === "scripts") {
      const hasTs = fs
        .readdirSync(abs, { recursive: true, withFileTypes: true })
        .some((f) => f.isFile() && /\.(ts|mts|tsx)$/.test(f.name));
      if (hasTs) found.push(path.relative(ROOT, abs));
      // scripts 配下に更に scripts を掘らない (実例が無く、掘ると遅い)
      continue;
    }
    findScriptDirs(abs, found);
  }
  return found;
}

/**
 * 型検査に載っていないと分かっているディレクトリ。**理由と実測を必ず書く。**
 * このリストは縮小専用 (下のラチェットが件数増加を落とす)。
 */
const KNOWN_UNCOVERED = {
  ".claude/scripts":
    "agent / CI 用スクリプト 41 ファイル。2026-08-13 に計測したところ、compiler option を " +
    "調整しても error 71 件 (TS7006 implicit any 39 / TS2339 21 ほか) 残る。lib/*.mjs の " +
    "素 JS core を import する設計なので型付けの方針決めから要る。backlog: " +
    ".claude/todo/05_機能バックログ.md の SCRIPTS-TYPECHECK-01",
};

/** include の glob がそのディレクトリを覆うか (使われている書式だけを解釈する) */
function includeCovers(pattern, relDir) {
  const prefix = pattern.includes("*") ? pattern.slice(0, pattern.indexOf("*")) : `${pattern}/`;
  return relDir === pattern || relDir.startsWith(prefix);
}

/** 祖先に tsconfig があり、その include がこのディレクトリを覆っているか */
function coveredByAncestorConfig(dir) {
  let current = path.dirname(dir);
  while (current && current !== "." && current !== path.sep) {
    const config = path.join(current, "tsconfig.json");
    if (fs.existsSync(path.join(ROOT, config))) {
      const include = readJsonc(config).include ?? [];
      const relDir = path.relative(current, dir).split(path.sep).join("/");
      return include.some((pattern) => includeCovers(pattern, relDir));
    }
    current = path.dirname(current);
  }
  return false;
}

test("すべての scripts ディレクトリが型検査に載っている", () => {
  const pkg = JSON.parse(read("package.json"));
  const scriptsCheck = pkg.scripts["type-check:scripts"] ?? "";
  const dirs = findScriptDirs();
  assert.ok(dirs.length >= 5, `scripts ディレクトリを ${dirs.length} 件しか見つけていない = 収集が壊れている`);

  const uncovered = [];
  for (const dir of dirs) {
    if (dir in KNOWN_UNCOVERED) continue;

    // (a) 専用 tsconfig があり type-check:scripts から呼ばれている
    const own = path.join(dir, "tsconfig.json");
    if (fs.existsSync(path.join(ROOT, own))) {
      const config = readJsonc(own);
      const include = config.include ?? [];
      assert.ok(
        include.includes("**/*.ts"),
        `${own}: include が glob でない = 新しいスクリプトが漏れる`,
      );
      // .mts は "**/*.ts" に含まれない。実在する拡張子は全部 glob で拾う
      const exts = new Set(
        fs
          .readdirSync(path.join(ROOT, dir), { recursive: true, withFileTypes: true })
          .filter((f) => f.isFile())
          .map((f) => path.extname(f.name))
          .filter((e) => [".ts", ".mts", ".tsx"].includes(e)),
      );
      for (const ext of exts) {
        assert.ok(
          include.includes(`**/*${ext}`),
          `${own}: ${ext} のファイルがあるのに include に "**/*${ext}" が無い`,
        );
      }
      assert.ok(
        scriptsCheck.includes(own),
        `${own}: 存在するのに type-check:scripts から呼ばれていない = 実行されない`,
      );
      continue;
    }

    // (b) 祖先の package tsconfig の include が既にこのディレクトリを覆っている
    //     (例: packages/ai-content の include "src/**/*" は src/scripts を含む)。
    //     直上だけを見ると src/scripts のような入れ子を取りこぼす。
    if (coveredByAncestorConfig(dir)) continue;

    uncovered.push(dir);
  }

  assert.deepEqual(
    uncovered,
    [],
    `型検査に載っていない scripts ディレクトリがある:\n${uncovered.join("\n")}\n` +
      "専用 tsconfig を作って type-check:scripts に足すか、理由付きで KNOWN_UNCOVERED に入れる",
  );
});

// 免除リストは増やさない (減らすだけ)。増やせるなら「載せない」が既定になってしまう。
test("KNOWN_UNCOVERED は縮小専用", () => {
  const MAX = 1;
  const count = Object.keys(KNOWN_UNCOVERED).length;
  assert.ok(
    count <= MAX,
    `型検査の免除が ${count} 件に増えた (上限 ${MAX})。免除を足すのではなく tsconfig を作る`,
  );
  for (const [dir, reason] of Object.entries(KNOWN_UNCOVERED)) {
    assert.ok(reason.length >= 40, `${dir}: 免除の理由が短すぎる (実測と backlog を書く)`);
    assert.ok(
      fs.existsSync(path.join(ROOT, dir)),
      `${dir}: もう存在しない。KNOWN_UNCOVERED から消す`,
    );
  }
});

test("root の type-check が scripts の型検査を呼ぶ", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.ok(pkg.scripts["type-check:scripts"], "type-check:scripts が無い");
  assert.match(
    pkg.scripts["type-check"],
    /type-check:scripts/,
    "root の type-check から呼ばれていない = CI の type-check job が素通りする",
  );
});

// pre-commit は apps/web の type-check を呼ぶだけで、そこは scripts を見ない。
// commit 時点で捕まえるには別に呼ぶ必要がある (2026-08-13 に配線)。
test("pre-commit が scripts の型検査を呼ぶ", () => {
  const source = read("apps/web/scripts/pre-commit-checks.sh");
  assert.match(
    source,
    /npm run type-check:scripts/,
    "pre-commit が type-check:scripts を呼ばない = commit 時点で scripts の型エラーを通す",
  );
});
