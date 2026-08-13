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
 * apps/web/scripts の型検査を「手書き allowlist」に戻させないための契約。
 *
 * ★背景 (2026-08-13)。apps/web/tsconfig.json は exclude に "scripts/**\/*" を持ち、
 * include も "src/**\/*" だけなので、CI が毎日動かすスクリプトは型検査対象外だった。
 * 唯一の検査は tsconfig.ogp.json の**手書き allowlist** で、そこに載っていなかった
 * sync-rakuten-catalog.ts の import 漏れが 9 日間検出されず、日次の楽天同期が毎日
 * 11 分走ってから ReferenceError で全損していた (tsc なら TS2304 で即出る)。
 * 手書きの列挙は必ず載せ忘れるので、網は glob でなければならない。
 */
test("apps/web/scripts is type-checked by a glob, not a hand-written list", () => {
  const config = readJsonc("apps/web/scripts/tsconfig.json");
  const include = config.include ?? [];
  assert.ok(
    include.includes("**/*.ts"),
    "scripts/tsconfig.json の include が glob でない = 新しいスクリプトが検査から漏れる",
  );
  // 依存として引かれる src が Next の型拡張なしで検査されると偽陽性が出る
  assert.ok(
    include.some((entry) => entry.includes("next-env.d.ts")),
    "next-env.d.ts が無いと src 側で偽陽性 (TS2769) が出て、この検査ごと無効化される",
  );

  // 実在する全スクリプトが glob の対象であること (拡張子の取りこぼし検出)
  const dir = path.join(ROOT, "apps/web/scripts");
  const sources = fs
    .readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.tsx?$/.test(entry.name));
  assert.ok(sources.length > 0, "apps/web/scripts に .ts が 1 つも無い = パス変更を疑う");
  assert.ok(
    include.includes("**/*.tsx") || sources.every((entry) => entry.name.endsWith(".ts")),
    ".tsx が存在するのに include が **/*.tsx を持たない",
  );
});

test("the root type-check runs the scripts config", () => {
  const pkg = JSON.parse(read("package.json"));
  const scriptsCheck = pkg.scripts["type-check:scripts"];
  assert.ok(scriptsCheck, "type-check:scripts が無い");
  assert.match(
    scriptsCheck,
    /apps\/web\/scripts\/tsconfig\.json/,
    "type-check:scripts が scripts/tsconfig.json を指していない",
  );
  assert.match(
    pkg.scripts["type-check"],
    /type-check:scripts/,
    "root の type-check から呼ばれていない = CI の type-check job が素通りする",
  );
});
