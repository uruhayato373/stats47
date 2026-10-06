/**
 * check-datasets の契約。
 * 実リポジトリが通ることに加えて、壊した入力ごとに「その理由で」落ちることを固定する
 * (未宣言・重なり・空の行・語彙外・寿命の不一致を見逃すと、台帳が置き場の正本として機能しない)。
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { DATASETS, GOVERNED, IGNORED_NAMES, IMAGE_EXT, IMAGE_ROOTS, KINDS, TARGETS, datasetDir, datasetPath } from "../../../../config/datasets.mjs";
import { DOMAINS } from "../../../../config/paths.mjs";
import { checkDatasets, findRetiredReferences, patternToRegExp } from "../check-datasets.mjs";
import { RETENTION_POLICIES } from "../prune-state-snapshots.mjs";

const ROOT = resolve(fileURLToPath(new URL("../../../..", import.meta.url)));
const domainIds = new Set(JSON.parse(readFileSync(resolve(ROOT, DOMAINS), "utf8")).domains.map((x) => x.id));

const base = {
  governed: [/^data\//, /^\.claude\/state\/metrics\//],
  ignoredNames: new Set([".gitkeep"]),
  kinds: KINDS,
  targets: TARGETS,
  domainIds: new Set(["site"]),
  retention: { foo: { directory: ".claude/state/metrics/foo" } },
};
const ds = (id, path, opts = {}) => ({ id, path, kind: "series", domain: "site", target: "data", description: id, ...opts });
const run = (datasets, files) => checkDatasets({ ...base, datasets, files });

test("実リポジトリの追跡ファイルは台帳と矛盾しない", () => {
  const files = execFileSync("git", ["-C", ROOT, "ls-files", "-z"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 })
    .split("\0")
    .filter(Boolean);
  const result = checkDatasets({
    datasets: DATASETS,
    files,
    governed: GOVERNED,
    ignoredNames: IGNORED_NAMES,
    kinds: KINDS,
    targets: TARGETS,
    domainIds,
    retention: RETENTION_POLICIES,
    imageRoots: IMAGE_ROOTS,
    imageExt: IMAGE_EXT,
  });
  assert.deepEqual(result.errors, []);
});

test("可変部分は決めた形だけに当たる", () => {
  assert.ok(patternToRegExp("a/{date}.json").test("a/2026-10-06.json"));
  assert.ok(!patternToRegExp("a/{date}.json").test("a/2026-W41.json"));
  assert.ok(!patternToRegExp("a/{name}.json").test("a/b/c.json"), "{name} は階層を越えない");
  assert.ok(patternToRegExp("a/{**}").test("a/b/c.json"), "{**} は階層を越える");
  assert.throws(() => patternToRegExp("a/{nope}.json"), /未知の可変部分/);
});

test("台帳に無いファイルは未宣言で落ちる (対象範囲外と .gitkeep は見ない)", () => {
  const r = run([ds("foo.batch", ".claude/state/metrics/foo/{date}.json")], [
    ".claude/state/metrics/foo/2026-10-06.json",
    ".claude/state/metrics/foo/latest.json",
    ".claude/state/metrics/foo/.gitkeep",
    ".claude/state/other/x.json",
  ]);
  assert.deepEqual(r.errors, ["未宣言: .claude/state/metrics/foo/latest.json"]);
});

test("2 行に当たるファイルは重なりで落ちる", () => {
  const r = run([ds("a", "data/x/{name}.json"), ds("b", "data/x/{date}.json")], ["data/x/2026-10-06.json"]);
  assert.equal(r.errors.length, 1);
  assert.match(r.errors[0], /^重なり: data\/x\/2026-10-06\.json ← a, b$/);
});

test("どのファイルにも当たらない行は落ちる (planned は通す)", () => {
  const r = run([ds("a", "data/x.json"), ds("b", "data/y.json", { planned: true })], []);
  assert.deepEqual(r.errors, ["どのファイルにも当たらない: a (data/x.json)"]);
});

test("語彙外の kind / target / 領域と id の重複は落ちる", () => {
  const files = ["data/x.json"];
  assert.match(run([ds("a", "data/x.json", { kind: "nope" })], files).errors.join(), /語彙外の kind/);
  assert.match(run([ds("a", "data/x.json", { target: "nope" })], files).errors.join(), /語彙外の target/);
  assert.match(run([ds("a", "data/x.json", { domain: "nope" })], files).errors.join(), /domains\.json に無い領域/);
  assert.match(run([ds("a", "data/x.json"), ds("a", "data/y.json", { planned: true })], files).errors.join(), /id が重複/);
});

test("寿命は RETENTION_POLICIES に実在し、置き場が一致しなければ落ちる", () => {
  const files = [".claude/state/metrics/foo/2026-10-06.json", "data/foo/2026-10-06.json"];
  assert.deepEqual(run([ds("a", ".claude/state/metrics/foo/{date}.json", { retain: "foo" }), ds("b", "data/foo/{date}.json")], files).errors, []);
  assert.match(run([ds("a", ".claude/state/metrics/foo/{date}.json", { retain: "nope" }), ds("b", "data/foo/{date}.json")], files).errors.join(), /RETENTION_POLICIES に無い寿命/);
  assert.match(run([ds("a", ".claude/state/metrics/foo/{date}.json"), ds("b", "data/foo/{date}.json", { retain: "foo" })], files).errors.join(), /置き場 .* と path が食い違う/);
});

test("本来の置き場と現在地が違う行だけを移行対象に数える", () => {
  const r = run([ds("a", ".claude/state/metrics/foo/{date}.json"), ds("b", "data/foo/{date}.json")], [
    ".claude/state/metrics/foo/2026-10-06.json",
    "data/foo/2026-10-06.json",
  ]);
  assert.deepEqual(r.moves, [{ id: "a", path: ".claude/state/metrics/foo/{date}.json", target: "data", files: 1 }]);
});

test("移した旧置き場がコードに残っていれば落ち、コメント行は通す", () => {
  const retired = [{ from: ".claude/state/metrics/foo/", to: "data/foo/", since: "2026-10-06" }];
  const errors = findRetiredReferences(retired, [
    { file: "a.mjs", line: 3, text: 'const DIR = ".claude/state/metrics/foo/";' },
    { file: "b.mjs", line: 1, text: " * 旧置き場は .claude/state/metrics/foo/ だった" },
    { file: "c.yml", line: 9, text: "  # git add .claude/state/metrics/foo/" },
    { file: "d.yml", line: 10, text: "git add .claude/state/metrics/foo/" },
  ]);
  assert.deepEqual(errors, [
    "旧置き場の参照: a.mjs:3 (.claude/state/metrics/foo/ → data/foo/)",
    "旧置き場の参照: d.yml:10 (.claude/state/metrics/foo/ → data/foo/)",
  ]);
});

test("datasetPath は可変部分の無い行だけ、datasetDir は可変部分より前のディレクトリを返す", () => {
  const fixed = DATASETS.find((x) => !x.path.includes("{"));
  const slotted = DATASETS.find((x) => x.path.includes("/{date}"));
  assert.equal(datasetPath(fixed.id), fixed.path);
  assert.throws(() => datasetPath(slotted.id), /datasetDir を使う/);
  assert.equal(datasetDir(slotted.id), slotted.path.slice(0, slotted.path.indexOf("/{date}")));
  assert.throws(() => datasetPath("no.such-dataset"), /台帳に無いデータセット/);
});

test("画像は IMAGE_ROOTS の外にあれば置き場違反で落ちる", () => {
  const r = checkDatasets({
    ...base,
    datasets: [],
    files: [
      "assets/blog/article-backgrounds/a.webp",
      "apps/web/public/images/b.png",
      "packages/gis/data/geoshape/svg/01_北海道.svg",
      ".claude/skills/note/x/examples/cover.svg",
      "apps/web/scripts/lib/legacy-images/c.jpg",
      ".claude/skills/note/x/magazine-cover.png",
      "docs/legacy-images/d.png",
      "README.md",
    ],
    imageRoots: IMAGE_ROOTS,
    imageExt: IMAGE_EXT,
  });
  assert.deepEqual(
    r.errors.map((e) => e.replace(/ \(.*$/, "")),
    [
      "画像の置き場違反: apps/web/scripts/lib/legacy-images/c.jpg",
      "画像の置き場違反: .claude/skills/note/x/magazine-cover.png",
      "画像の置き場違反: docs/legacy-images/d.png",
    ],
  );
});

test("手順書 (SKILL.md・rules・agents) の旧パスは落ち、旧置き場と書いた経緯の行だけ通す", () => {
  const retired = [{ from: ".claude/state/metrics/foo", to: "data/foo", since: "2026-10-06" }];
  const errors = findRetiredReferences(retired, [
    { file: ".claude/skills/x/SKILL.md", line: 5, text: "1. `.claude/state/metrics/foo/LATEST.md` を Read" },
    { file: ".claude/rules/y.md", line: 7, text: "# 出力は .claude/state/metrics/foo/ へ" },
    { file: ".claude/agents/z.md", line: 9, text: "(旧置き場 `.claude/state/metrics/foo/` は 2026-10-06 に data/foo/ へ移した)" },
    { file: ".codex/agents/z.toml", line: 2, text: "read .claude/state/metrics/foo/history.csv" },
  ]);
  assert.deepEqual(errors, [
    "旧置き場の参照: .claude/skills/x/SKILL.md:5 (.claude/state/metrics/foo → data/foo)",
    "旧置き場の参照: .claude/rules/y.md:7 (.claude/state/metrics/foo → data/foo)",
    "旧置き場の参照: .codex/agents/z.toml:2 (.claude/state/metrics/foo → data/foo)",
  ]);
});
