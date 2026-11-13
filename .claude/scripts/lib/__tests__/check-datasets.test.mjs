/**
 * check-datasets の契約。
 * 実リポジトリが通ることに加えて、壊した入力ごとに「その理由で」落ちることを固定する
 * (未宣言・重なり・空の行・語彙外・寿命の不一致を見逃すと、台帳が置き場の正本として機能しない)。
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { AGENT_STATE, DATASETS, GOVERNED, IGNORED_NAMES, IMAGE_EXT, IMAGE_ROOTS, KINDS, REGISTRIES, REGISTRY_REFS, RETIRED, TARGETS, datasetDir, datasetPath } from "../../../../config/datasets.mjs";
import { DOMAINS, KDP_LISTINGS } from "../../../../config/paths.mjs";
import { checkDatasets, checkRefs, checkSchemas, dataLiteralHits, dataTops, findDataPathLiterals, findRetiredReferences, parseGrepRows, patternToRegExp, refValues, retiredHits, selectPath } from "../check-datasets.mjs";
import { RETENTION_POLICIES } from "../prune-state-snapshots.mjs";
import { CONFIG_MOVE_PENDING, DATA_README_PENDING, OUTSIDE_DATA, SYSTEM_CONFIG } from "../../../../config/datasets.mjs";
import { buildEr, checkDataReadmes, checkOutsideData, checkPlacement } from "../check-datasets.mjs";
import { assertDatasetShape } from "../dataset-shape.mjs";

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
    agentState: AGENT_STATE,
  });
  assert.deepEqual(result.errors, []);
});

test("[mutation] skill の reference/{reviews,audits}/ に監査・レビューの全文を置くと未宣言で落ちる (置き場は data/<領域>/)", () => {
  // 2026-11-14 DOCS-GOVERNANCE-GAPS-01。テーマ 36 件・調査 4 件・SEO 監査 1 件の全文が検査の外に溜まっていた。
  // 旧置き場と、まだ無い skill の同じ名前の置き場の両方が、台帳に行が無いので落ちることを固定する
  // 旧置き場は RETIRED の宣言から組み立てる (このファイルに直書きすると、旧置き場の参照の検査に自分が掛かる)
  const moved = RETIRED.filter((r) => r.since === "2026-11-14" && /\/reference\/(reviews|audits)$/.test(r.from)).map((r) => r.from);
  assert.equal(moved.length, 5, "テーマ・調査の reviews / audits と SEO 監査の audits の 5 か所");
  const planted = [...moved.map((dir) => `${dir}/2026-11-14-planted.md`), ".claude/skills/dev/some-new-skill/reference/reviews/first-review.md"];
  const files = execFileSync("git", ["-C", ROOT, "ls-files", "-z"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 })
    .split("\0")
    .filter(Boolean);
  const result = checkDatasets({
    datasets: DATASETS,
    files: [...files.filter((f) => !planted.includes(f)), ...planted],
    governed: GOVERNED,
    ignoredNames: IGNORED_NAMES,
    kinds: KINDS,
    targets: TARGETS,
    domainIds,
    retention: RETENTION_POLICIES,
  });
  for (const file of planted) assert.ok(result.errors.includes(`未宣言: ${file}`), `未宣言で落ちない: ${file}`);
  // skill の reference/ のほかのファイル (手順・契約) は範囲に入れない
  assert.ok(!GOVERNED.some((re) => re.test(".claude/skills/theme/manage-theme-portfolio/reference/theme-proposal-format.md")));
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

test("planned の行が追跡ファイルに当たっていれば落ちる (件数があるのに「まだ 1 件も無い」と宣言した食い違い)", () => {
  const r = run([ds("a", "data/x/{**}", { planned: true })], ["data/x/1.json"]);
  assert.deepEqual(r.errors, ["planned なのに追跡ファイルが 1 件ある (planned を外す): a (data/x/{**})"]);
  assert.deepEqual(run([ds("a", "data/x/{**}", { planned: true })], ["data/x/.gitkeep"]).errors, []);
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

// 2026-10-06 に .claude/state/ をエージェント運用の状態だけへ絞った。事業の記録を黙って戻すと、
// 「エージェントをやめたら消してよい置き場」に事業の記録が混ざり、置き場の判断基準が崩れる
test(".claude/state/ を指す行は AGENT_STATE の許可リストに無ければ落ちる", () => {
  const datasets = [
    ds("agent.ok", ".claude/state/ok/ledger.json", { target: "state" }),
    ds("biz.queue", ".claude/state/sales-queue/queue.json", { target: "state" }),
    ds("biz.mislabeled", ".claude/state/metrics/foo/{date}.json"),
    ds("biz.data", "data/sales-queue/queue.json"),
  ];
  const r = checkDatasets({ ...base, datasets, files: [], agentState: { "agent.ok": "理由", "agent.gone": "理由" } });
  assert.deepEqual(
    r.errors.filter((e) => !e.startsWith("どのファイルにも")).map((e) => e.replace(/ \(.*$/, "")),
    [
      "biz.queue: .claude/state/ はエージェント運用の状態だけを置く",
      "biz.mislabeled: .claude/state/ はエージェント運用の状態だけを置く",
      "AGENT_STATE に台帳に無い id: agent.gone",
    ],
  );
});

// 2026-10-07: 作業カードの完了条件が旧パスの git diff を指したまま残り、空の差分で合格に見えた。
// 手順書だけでなく作業カード・文書・memory の旧パスも止め、当時のパスを残す履歴だけは対象外にする
test("作業カード・文書・memory の旧パスも落ち、旧パスと書いた経緯の行だけ通す", () => {
  const retired = [{ from: ".claude/state/metrics/foo", to: "data/foo", since: "2026-10-06" }];
  const errors = findRetiredReferences(retired, [
    { file: ".claude/todo/backlog.md", line: 3, text: "- **完了条件**: `git diff -- .claude/state/metrics/foo/history.csv` に削除行が無い" },
    { file: "docs/01_技術設計/x.md", line: 4, text: "計測は .claude/state/metrics/foo/ に置く" },
    { file: ".claude/memory/y.md", line: 5, text: "当時の旧パス `.claude/state/metrics/foo/` を上書きしていた" },
  ]);
  assert.deepEqual(errors, [
    "旧置き場の参照: .claude/todo/backlog.md:3 (.claude/state/metrics/foo → data/foo)",
    "旧置き場の参照: docs/01_技術設計/x.md:4 (.claude/state/metrics/foo → data/foo)",
  ]);
});

test("実リポジトリに旧置き場の参照が残っていない (履歴を除く)", () => {
  const hits = retiredHits();
  assert.ok(!hits.some((h) => /^data\/|\/reference\/(?:audits|reviews|reports)\//.test(h.file)), "履歴の除外が効いていない");
  assert.deepEqual(findRetiredReferences(RETIRED, hits), []);
});

// 2026-10-07: コードに data/ の直書きが 230 ファイル・500 か所あり、置き場を移すたびに手で探して直していた。
// 台帳の id で引けば、次に移すときは台帳の 1 行を変えるだけで済む
test("コードの data/ 直書きは落ち、テスト・コメント・import・別ディレクトリの data/ は通す", () => {
  const errors = findDataPathLiterals(["gsc", "sns"], [
    { file: ".claude/scripts/a.mjs", line: 1, text: 'const p = path.join(ROOT, "data/gsc/history.csv");' },
    { file: ".claude/scripts/b.mjs", line: 2, text: "console.log(`wrote data/sns/posts.json`);" },
    { file: ".claude/scripts/lib/c.cjs", line: 3, text: 'const S = path.resolve(__dirname, "../../../data/sns/posts.json");' },
    { file: ".claude/scripts/d.mjs", line: 4, text: "// data/gsc/history.csv を読む" },
    { file: ".claude/scripts/e.mjs", line: 5, text: "import schema from '../../data/gsc/x.schema.json' with { type: 'json' };" },
    { file: ".claude/scripts/lib/__tests__/f.test.mjs", line: 6, text: 'assert.equal(p, "data/gsc/history.csv");' },
    { file: "packages/ranking/src/exporters/g.ts", line: 7, text: 'path.resolve(__dirname, "../data/sns.json")' },
    { file: ".claude/scripts/h.mjs", line: 8, text: 'const q = "metadata/gsc/x";' },
  ]);
  assert.deepEqual(errors.map((e) => e.replace(/ \(.*$/, "")), [
    "data/ の直書き: .claude/scripts/a.mjs:1",
    "data/ の直書き: .claude/scripts/b.mjs:2",
    "data/ の直書き: .claude/scripts/lib/c.cjs:3",
  ]);
});

test("実リポジトリのコードに data/ の直書きが残っていない", () => {
  const tops = dataTops(DATASETS);
  assert.ok(tops.includes("gsc") && tops.includes("sns"), "台帳から data/ の第 1 階層を取れていない");
  assert.deepEqual(findDataPathLiterals(tops, dataLiteralHits(tops)), []);
});

test("config / ledger の JSON は schema の宣言・実在・形の一致が無ければ落ち、それ以外の kind は問わない", () => {
  const schema = { type: "object", required: ["id"], properties: { id: { type: "string" } } };
  const store = { "s/x.schema.json": schema, "data/a.json": { id: "a" }, "data/b.json": { id: 1 }, "data/c.json": {} };
  const run = (datasets, files) => checkSchemas({ datasets, files, readJson: (p) => store[p], exists: (p) => p in store });
  const row = (id, path, kind, opts = {}) => ({ id, path, kind, domain: "site", target: "data", description: id, ...opts });

  assert.deepEqual(run([row("ok", "data/a.json", "ledger", { schema: "s/x.schema.json" })], ["data/a.json"]), []);
  assert.deepEqual(run([row("series", "data/c.json", "series")], ["data/c.json"]), [], "series は schema を求めない");
  assert.deepEqual(run([row("sch", "s/x.schema.json", "config")], ["s/x.schema.json"]), [], "schema 自身は対象外");
  assert.match(run([row("none", "data/a.json", "config")], ["data/a.json"])[0], /schema \(JSON Schema のパス\) が無い/);
  assert.match(run([row("gone", "data/a.json", "ledger", { schema: "s/missing.schema.json" })], ["data/a.json"])[0], /schema のファイルが無い/);
  assert.match(run([row("type", "data/b.json", "ledger", { schema: "s/x.schema.json" })], ["data/b.json"])[0], /schema に合わない/);
  assert.match(run([row("req", "data/c.json", "ledger", { schema: "s/x.schema.json" })], ["data/c.json"])[0], /schema に合わない/);
  assert.match(run([row("bad", "data/c.json", "series", { schema: "s/x.json" })], ["data/c.json"])[0], /\*\.schema\.json を指す/);
});

// 意図 (2026-10-20 RECORD-SCHEMA-CONTRACT-01): セッションは管理画面を開かず記録から判断するので、判断に使う
// state・series の記録も形の契約を持つ。schema を宣言した行は kind を問わず検証し、形が崩れたら止める。
test("state・series でも schema を宣言した行は当たるファイルを検証する", () => {
  const schema = { type: "object", required: ["sources"], properties: { sources: { type: "array", items: { type: "object", required: ["source"] } } } };
  const store = { "s/r.schema.json": schema, "data/ok.json": { sources: [{ source: "a8" }] }, "data/broken.json": { sources: [{ status: "pass" }] } };
  const run = (datasets, files) => checkSchemas({ datasets, files, readJson: (p) => store[p], exists: (p) => p in store });
  const row = (id, path, kind) => ({ id, path, kind, domain: "site", target: "data", description: id, schema: "s/r.schema.json" });
  for (const kind of ["state", "series"]) {
    assert.deepEqual(run([row("ok", "data/ok.json", kind)], ["data/ok.json"]), [], kind);
    assert.match(run([row("broken", "data/broken.json", kind)], ["data/broken.json"])[0] ?? "", /schema に合わない/, kind);
  }
});

test("書き手は形が崩れた記録を書かずに止まる (assertDatasetShape)", () => {
  const latest = JSON.parse(readFileSync(resolve(ROOT, "data/measurement-cycle/latest.json"), "utf8"));
  assertDatasetShape("business.measurement-cycle", latest);
  const { week: _week, ...withoutWeek } = latest;
  assert.throws(() => assertDatasetShape("business.measurement-cycle", withoutWeek), /dataset_shape_mismatch/);
  assert.throws(() => assertDatasetShape("business.measurement-cycle", { ...latest, sources: "broken" }), /dataset_shape_mismatch/);
  assert.throws(() => assertDatasetShape("gsc.latest", {}), /dataset_schema_missing/);
});

test("判断に使う記録の行は schema を宣言している", () => {
  for (const id of ["revenue.authenticated", "revenue.authenticated-history", "business.measurement-cycle", "business.nsm-weekly", "a8.results", "rakuten.results"]) {
    assert.match(DATASETS.find((d) => d.id === id)?.schema ?? "", /^config\/schema\/.+\.schema\.json$/, id);
  }
});

test("実リポジトリの config / ledger の JSON と schema を宣言した記録はすべて形が合う", () => {
  const files = execFileSync("git", ["-C", ROOT, "ls-files", "-z"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }).split("\0").filter(Boolean);
  const errors = checkSchemas({
    datasets: DATASETS,
    files,
    readJson: (p) => JSON.parse(readFileSync(resolve(ROOT, p), "utf8")),
    exists: (p) => existsSync(resolve(ROOT, p)),
  });
  assert.deepEqual(errors, []);
});

// ── 台帳どうしの参照 (refs)。2026-10-26 ──
// 意図: 置き場と形だけでは「指す先が実在するか」を見ない。参照先に無い ID は error で止まり、その理由が
// クラッシュではなく「参照切れ」の文面であることを固定する (赤の理由を読まないミューテーションは間違った理由で赤になりうる)。

const refsFixture = () => ({
  "data/parent.json": { items: [{ id: 1, title: "A" }, { id: 2, title: "B" }], byKey: { "K-1": { n: 1 }, "K-2": { n: 2 } } },
  "data/child.json": {
    rows: [
      { id: 10, parent: 1, title: "A", channel: "x", keys: "K-1,K-2" },
      { id: 11, parent: 2, title: "B", channel: "y", keys: '["K-2"]' },
      { id: 12, title: "no parent" },
    ],
  },
  "reg/registry.ts": '// START\n  "K-1": 1,\n  "K-2": 2,\n// END\n  "K-9": 9,\n',
});
const refRow = (id, path, refs) => ({ id, path, kind: "ledger", domain: "site", target: "data", description: id, ...(refs ? { refs } : {}) });
const runRefs = (datasets, store = refsFixture(), extra = {}) =>
  checkRefs({
    datasets,
    files: Object.keys(store),
    readJson: (p) => {
      if (!(p in store)) throw new Error(`no file ${p}`);
      return store[p];
    },
    readText: (p) => store[p],
    registries: { keys: { description: "fixture", files: ["reg/registry.ts"], between: ["START", "END"], pattern: '^\\s*"([A-Z]-\\d)":' } },
    ...extra,
  });
const parentRow = refRow("t.parent", "data/parent.json");

test("selectPath は配列・オブジェクトの値とキーをたどり、parent に兄弟の項目を返す", () => {
  const doc = refsFixture()["data/parent.json"];
  assert.deepEqual(selectPath(doc, "items[].id").map((n) => n.value), [1, 2]);
  assert.equal(selectPath(doc, "items[].id")[0].parent.title, "A");
  assert.deepEqual(selectPath(doc, "byKey.$keys").map((n) => n.value), ["K-1", "K-2"]);
  assert.deepEqual(selectPath(doc, "byKey.$keys")[1].parent, { n: 2 }, "$keys の parent はキーの指す値");
  assert.deepEqual(selectPath(doc, "byKey.*.n").map((n) => n.value), [1, 2]);
  assert.deepEqual(selectPath(doc, "items[].missing"), [], "無い項目は飛ばす");
  assert.throws(() => selectPath(doc, "byKey.$keys.x"), /末尾/);
});

test("refValues の parse: list は配列・JSON 配列の文字列・カンマ区切りを ID の並びにする", () => {
  assert.deepEqual(refValues(["a", "b"], "list"), ["a", "b"]);
  assert.deepEqual(refValues('["a","b"]', "list"), ["a", "b"]);
  assert.deepEqual(refValues("a, b", "list"), ["a", "b"]);
  assert.deepEqual(refValues("", "list"), []);
  assert.deepEqual(refValues("a,b", undefined), ["a,b"], "parse 無しは値をそのまま 1 件として扱う");
});

test("参照先にある ID だけなら通り、写しの一致・where・registry・parse を検査する", () => {
  const child = refRow("t.child", "data/child.json", [
    { field: "rows[].parent", to: "t.parent", key: "items[].id", copies: ["title"] },
    { field: "rows[].keys", parse: "list", to: "registry:keys" },
    { field: "rows[].id", where: { channel: "x" }, to: "registry:keys", severity: "warn", why: "where で x の行だけを見る検査の確認" },
  ]);
  const result = runRefs([parentRow, child]);
  assert.deepEqual(result.errors, []);
  // where: channel=x の行 (id=10) だけを見る。10 は registry に無いので warn に 1 件
  assert.equal(result.warnings.length, 1);
  assert.match(result.warnings[0], /参照切れ: t\.child data\/child\.json \(id=10\) の rows\[\]\.id=10 が registry:keys に無い/);
});

test("[mutation] 参照先に無い ID は「参照切れ」の error で落ちる (クラッシュではない)", () => {
  const child = refRow("t.child", "data/child.json", [{ field: "rows[].parent", to: "t.parent", key: "items[].id" }]);
  const store = refsFixture();
  store["data/child.json"].rows[1].parent = 99;
  const result = runRefs([parentRow, child], store);
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0], /^参照切れ: t\.child data\/child\.json \(id=11\) の rows\[\]\.parent=99 が t\.parent の items\[\]\.id に無い$/);
  assert.deepEqual(result.warnings, []);

  // registry 側: between の外 (K-9) は ID に数えない
  const viaRegistry = refRow("t.child", "data/child.json", [{ field: "rows[].keys", parse: "list", to: "registry:keys" }]);
  const store2 = refsFixture();
  store2["data/child.json"].rows[0].keys = "K-1,K-9";
  const r2 = runRefs([viaRegistry], store2);
  assert.equal(r2.errors.length, 1);
  assert.match(r2.errors[0], /^参照切れ: .*rows\[\]\.keys=K-9 が registry:keys に無い$/);
});

test("[mutation] 写しが参照先と違えば「写しの不一致」で落ちる", () => {
  const child = refRow("t.child", "data/child.json", [{ field: "rows[].parent", to: "t.parent", key: "items[].id", copies: ["title"] }]);
  const store = refsFixture();
  store["data/child.json"].rows[0].title = "古い題名";
  const result = runRefs([parentRow, child], store);
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0], /^写しの不一致: t\.child data\/child\.json の title=古い題名 が t\.parent \(1\) の A と違う$/);
});

test("refs の宣言の不備は error (参照先の取り違え・理由の無い warn・知らない項目・0 件の参照先)", () => {
  const cases = [
    [{ field: "rows[].parent", to: "t.nope", key: "items[].id" }, /台帳に無い参照先 t\.nope/],
    [{ field: "rows[].parent", to: "t.parent" }, /key \(参照先の ID の path\) が要る/],
    [{ field: "rows[].parent", to: "registry:nope" }, /REGISTRIES に無い参照先/],
    [{ field: "rows[].parent", to: "registry:keys", key: "x" }, /key \/ copies を書かない/],
    [{ field: "rows[].parent", to: "t.parent", key: "items[].id", severity: "warn" }, /理由 \(why\) を書く/],
    [{ field: "rows[].parent", to: "t.parent", key: "items[].id", severity: "info", why: "十分に長い理由の文です" }, /severity は "warn" だけ/],
    [{ field: "rows[].parent", to: "t.parent", key: "items[].id", allow: [99] }, /知らない項目 allow/],
    [{ field: "rows[].parent", to: "t.parent", key: "items[].nothing" }, /1 件も読めない/],
  ];
  for (const [ref, re] of cases) {
    const result = runRefs([parentRow, refRow("t.child", "data/child.json", [ref])]);
    assert.equal(result.errors.length, 1, JSON.stringify(ref));
    assert.match(result.errors[0], re);
  }
});

test("REGISTRY_REFS は registry の ID がすべて参照先の台帳にあることを検査する", () => {
  const store = refsFixture();
  const refs = [{ from: "registry:keys", to: "t.parent", key: "byKey.$keys" }];
  assert.deepEqual(runRefs([parentRow], store, { registryRefs: refs }).errors, []);
  delete store["data/parent.json"].byKey["K-2"];
  const broken = runRefs([parentRow], store, { registryRefs: refs });
  assert.equal(broken.errors.length, 1);
  assert.match(broken.errors[0], /^参照切れ: registry:keys の K-2 が t\.parent の byKey\.\$keys に無い$/);
});

test("実リポジトリの台帳の参照は error 0 件 (warn は理由を宣言した参照だけから出る)", () => {
  const files = execFileSync("git", ["-C", ROOT, "ls-files", "-z"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }).split("\0").filter(Boolean);
  const result = checkRefs({
    datasets: DATASETS,
    files,
    readJson: (p) => JSON.parse(readFileSync(resolve(ROOT, p), "utf8")),
    readText: (p) => readFileSync(resolve(ROOT, p), "utf8"),
    registries: REGISTRIES,
    registryRefs: REGISTRY_REFS,
  });
  assert.deepEqual(result.errors, []);
  const warnRefs = DATASETS.flatMap((d) => (d.refs ?? []).filter((r) => r.severity === "warn").map((r) => [d.id, r.field]));
  for (const w of result.warnings) assert.ok(warnRefs.some(([id, field]) => w.includes(`${id} `) && w.includes(` の ${field}=`)), w);
});

test("台帳参照が宣言されている (投稿→指標・販売→出品・納品版→商品カタログ・投稿→投稿) と広告の実験", () => {
  const refsOf = (id) => DATASETS.find((d) => d.id === id)?.refs ?? [];
  assert.ok(refsOf("sns.posts").some((r) => r.field === "posts[].metric_keys" && r.to === "registry:metrics"));
  assert.ok(refsOf("sns.posts").some((r) => r.field === "posts[].parent_post_id" && r.to === "sns.posts" && !r.severity));
  assert.deepEqual(refsOf("sales.ledger").map((r) => r.to).sort(), ["kdp.listings"]);
  assert.ok(refsOf("sales.ledger").every((r) => !r.severity));
  assert.ok(refsOf("products.note-pack-deliveries").some((r) => r.to === "products.packs" && !r.severity));
  assert.ok(refsOf("affiliate.ads").some((r) => r.field === "ads[].experimentId" && r.to === "affiliate.experiments" && !r.severity));
  // Geo のコンテンツは事業計画のコンテンツの機会を ID で指す (位置から作っていた ID を 2026-11-11 に台帳へ固定した)
  assert.ok(refsOf("geo.content-lifecycle").some((r) => r.field === "contents.$keys" && r.to === "business-plan.content-opportunities" && !r.severity));
  assert.ok(refsOf("geo.analyses").some((r) => r.field === "analyses.*.contentId" && r.to === "business-plan.content-opportunities"));
});

test("[mutation] 厳格化した schema は知らない項目と語彙外の値を落とす", () => {
  const files = [KDP_LISTINGS, datasetPath("products.note-pack-deliveries"), datasetPath("sales.ledger")];
  const store = Object.fromEntries(files.map((f) => [f, JSON.parse(readFileSync(resolve(ROOT, f), "utf8"))]));
  const rows = DATASETS.filter((d) => ["kdp.listings", "products.note-pack-deliveries", "sales.ledger"].includes(d.id));
  const run = () =>
    checkSchemas({ datasets: rows, files, readJson: (p) => store[p] ?? JSON.parse(readFileSync(resolve(ROOT, p), "utf8")), exists: (p) => existsSync(resolve(ROOT, p)) });
  assert.deepEqual(run(), []);
  const kdp = Object.values(store[KDP_LISTINGS].listings)[0];
  kdp.unknownField = true;
  assert.match(run().join("\n"), /kdp\.listings: .* が schema に合わない/);
  delete kdp.unknownField;
  const deliveries = store[datasetPath("products.note-pack-deliveries")].packs["P-01"]._delivery;
  deliveries.officeValidation = "unknown";
  assert.match(run().join("\n"), /products\.note-pack-deliveries: .* が schema に合わない/);
  deliveries.officeValidation = "owner-pending";
  store[datasetPath("sales.ledger")].observations[0].channel = "booth";
  assert.match(run().join("\n"), /sales\.ledger: .* が schema に合わない/);
  store[datasetPath("sales.ledger")].observations[0].channel = "kdp";
  assert.deepEqual(run(), [], "戻すと通る (赤は書き換えた値が理由)");
});

test("where の値の配列はどれかに一致する行、unless は合う行を除き、registry の union は 2 つの正本を合わせる (2026-10-27)", () => {
  const child = refRow("t.child", "data/child.json", [
    { field: "rows[].keys", parse: "list", where: { channel: ["x", "y"] }, to: "registry:keys" },
    { field: "rows[].id", unless: { channel: ["x", "y"] }, to: "registry:keys" },
  ]);
  // id=12 は channel が無いので unless に合わず、registry に無い 12 が参照切れになる
  const result = runRefs([parentRow, child]);
  assert.deepEqual(result.errors.map((e) => e.replace(/ \(id=\d+\)/, "")), ["参照切れ: t.child data/child.json の rows[].id=12 が registry:keys に無い"]);

  const registries = {
    keys: { description: "fixture", files: ["reg/registry.ts"], between: ["START", "END"], pattern: '^\\s*"([A-Z]-\\d)":' },
    nines: { description: "fixture", files: ["reg/registry.ts"], pattern: '^\\s*"(K-9)":' },
    both: { description: "fixture", union: ["keys", "nines"] },
  };
  const store = refsFixture();
  store["data/child.json"].rows[0].keys = "K-1,K-9";
  const viaKeys = refRow("t.child", "data/child.json", [{ field: "rows[].keys", parse: "list", to: "registry:keys" }]);
  const viaBoth = refRow("t.child", "data/child.json", [{ field: "rows[].keys", parse: "list", to: "registry:both" }]);
  assert.equal(runRefs([viaKeys], store, { registries }).errors.length, 1, "片方の正本だけなら K-9 は参照切れ");
  assert.deepEqual(runRefs([viaBoth], store, { registries }).errors, [], "union なら K-9 も届く");
  const nested = { ...registries, nested: { description: "fixture", union: ["both"] } };
  const viaNested = refRow("t.child", "data/child.json", [{ field: "rows[].keys", parse: "list", to: "registry:nested" }]);
  assert.match(runRefs([viaNested], store, { registries: nested }).errors[0], /union を持たない/);
  const badWhere = refRow("t.child", "data/child.json", [{ field: "rows[].id", where: {}, to: "registry:keys" }]);
  assert.match(runRefs([badWhere]).errors[0], /where は \{ 項目/);
});

test("[mutation] 投稿台帳: 指標を指す投稿の参照切れは error、warn は投稿済みの ranking の content_key だけ", () => {
  const catalogPath = datasetPath("sns.x-catalog");
  const files = ["data/sns/posts.json", catalogPath];
  const doc = JSON.parse(readFileSync(resolve(ROOT, "data/sns/posts.json"), "utf8"));
  const catalog = JSON.parse(readFileSync(resolve(ROOT, catalogPath), "utf8"));
  const rows = DATASETS.filter((d) => d.id === "sns.posts" || d.id === "sns.x-catalog").map((d) => (d.id === "sns.x-catalog" ? { ...d, refs: [] } : d));
  const run = () =>
    checkRefs({ datasets: rows, files, readJson: (p) => (p === catalogPath ? catalog : doc), readText: (p) => readFileSync(resolve(ROOT, p), "utf8"), registries: REGISTRIES });
  const clean = run();
  assert.deepEqual(clean.errors, []);
  for (const w of clean.warnings) assert.match(w, /posts\[\]\.content_key=.* が registry:ranking-content-keys に無い$/);
  assert.deepEqual(clean.warnings, [], "YouTube・note の key は別の体系なので、ranking-content-keys と照合しない");
  const byId = new Map(doc.posts.map((p) => [p.id, p]));
  for (const w of clean.warnings) {
    const post = byId.get(Number(w.match(/\(id=(\d+)\)/)[1]));
    assert.equal(post.domain, "ranking");
    assert.ok(["posted", "deleted"].includes(post.status), `warn は外に出た記録だけ: id=${post.id}`);
  }
  const draft = doc.posts.find((p) => p.domain === "ranking" && p.status === "draft");
  const geo = doc.posts.find((p) => p.domain === "geo");
  const quiz = doc.posts.find((p) => p.domain === "ranking-quiz");
  const saved = [draft.content_key, geo.metric_keys, quiz.content_key];
  draft.content_key = "no-such-metric";
  geo.metric_keys = "floodExposureShare2051";
  quiz.content_key = "no-such-quiz-metric";
  const broken = run().errors.join("\n");
  assert.ok(broken.includes(`(id=${draft.id}) の posts[].content_key=no-such-metric が registry:metrics に無い`), broken);
  assert.ok(broken.includes(`(id=${geo.id}) の posts[].metric_keys=floodExposureShare2051 が registry:geo-post-metric-keys に無い`), broken);
  assert.ok(broken.includes(`(id=${quiz.id}) の posts[].content_key=no-such-quiz-metric が registry:metrics に無い`), broken);
  // 投稿済みの ranking でも旧 slug (RANKING_SLUG_REDIRECTS) は届く
  const posted = doc.posts.find((p) => p.domain === "ranking" && p.status === "posted");
  [draft.content_key, geo.metric_keys, quiz.content_key] = saved;
  const before = posted.content_key;
  posted.content_key = "ssdse-c-lb021101";
  assert.equal(run().warnings.length, clean.warnings.length, "旧 slug は 301 先の指標へ届くので warn を増やさない");
  posted.content_key = before;
  assert.deepEqual(run().errors, [], "戻すと通る");
});

test("[mutation] 投稿台帳: X・Threads の投稿の template は sns.x-catalog の templates[].id に無いと error (他媒体の template は対象外。下書きも対象)", () => {
  const catalogPath = datasetPath("sns.x-catalog");
  const files = ["data/sns/posts.json", catalogPath];
  const doc = JSON.parse(readFileSync(resolve(ROOT, "data/sns/posts.json"), "utf8"));
  const catalog = JSON.parse(readFileSync(resolve(ROOT, catalogPath), "utf8"));
  const rows = DATASETS.filter((d) => d.id === "sns.posts" || d.id === "sns.x-catalog").map((d) => (d.id === "sns.x-catalog" ? { ...d, refs: [] } : d));
  const run = () =>
    checkRefs({
      datasets: rows, files, readJson: (p) => (p === catalogPath ? catalog : doc),
      readText: (p) => readFileSync(resolve(ROOT, p), "utf8"), registries: REGISTRIES,
    });
  const templateErrors = () => run().errors.filter((e) => e.includes("posts[].template="));
  assert.deepEqual(templateErrors(), [], "現状の台帳は X・Threads の template がすべてカタログにある");
  const x = doc.posts.find((p) => p.platform === "x" && p.template && p.status !== "draft");
  const draft = doc.posts.find((p) => p.platform === "x" && p.status === "draft" && p.template);
  const ig = doc.posts.find((p) => p.platform === "instagram" && p.template && !catalog.templates.some((t) => t.id === p.template));
  assert.ok(x && ig, "fixture: X の投稿と、カタログに無い template を持つ Instagram の投稿が実台帳にある");
  const saved = x.template;
  x.template = "no-such-template";
  assert.ok(templateErrors().some((e) => e.includes(`(id=${x.id}) の posts[].template=no-such-template が sns.x-catalog の templates[].id に無い`)), templateErrors().join("\n"));
  x.template = saved;
  const draftSaved = draft.template;
  draft.template = "no-such-template";
  assert.ok(templateErrors().some((e) => e.includes(`(id=${draft.id}) の posts[].template=no-such-template が sns.x-catalog の templates[].id に無い`)), "下書きも止める (素材の取り込みは型が無ければ template を空にし、domain 名を入れない)");
  draft.template = draftSaved;
  assert.deepEqual(templateErrors(), [], "戻すと通る (Instagram の ranking・area-carousel などはカタログに無くても error にしない)");
});

test("[mutation] KDP の status・kdpStatus・publicationStage の組み合わせを schema が固定する (2026-10-27)", () => {
  const store = { [KDP_LISTINGS]: JSON.parse(readFileSync(resolve(ROOT, KDP_LISTINGS), "utf8")) };
  const rows = DATASETS.filter((d) => d.id === "kdp.listings");
  const run = () => checkSchemas({ datasets: rows, files: [KDP_LISTINGS], readJson: (p) => store[p] ?? JSON.parse(readFileSync(resolve(ROOT, p), "utf8")), exists: (p) => existsSync(resolve(ROOT, p)) });
  assert.deepEqual(run(), []);
  const listings = store[KDP_LISTINGS].listings;
  const live = Object.values(listings).find((l) => l.status === "listed" && l.kdpStatus === "live");
  const withdrawn = Object.values(listings).find((l) => l.status === "withdrawn" && l.withdrawal?.unpublishedAt);
  const blocked = Object.values(listings).find((l) => l.status === "blocked-design");
  const cases = [
    [live, "publicationStage", undefined], // 販売中なのに工程が無い
    [live, "asin", null], // 販売中なのに ASIN が無い
    [live, "status", "draft"], // 販売中なのに売らない判断
    [withdrawn, "kdpStatus", "live"], // 出版停止を受理したのに販売中
    [blocked, "publicationStage", "live"], // 作らない判断の版が live
    [{ ...live, kdpStatus: "draft" }, null, null], // listed なのに本棚は下書き (下で置き換える)
  ];
  for (const [target, field, value] of cases) {
    if (field === null) {
      const before = live.kdpStatus;
      live.kdpStatus = "draft";
      assert.match(run().join("\n"), /kdp\.listings: .* が schema に合わない/, "listed + kdpStatus=draft");
      live.kdpStatus = before;
      continue;
    }
    const before = target[field];
    if (value === undefined) delete target[field];
    else target[field] = value;
    assert.match(run().join("\n"), /kdp\.listings: .* が schema に合わない/, `${target.id} ${field}=${String(value)}`);
    if (before === undefined) delete target[field];
    else target[field] = before;
  }
  // 販売中なのに公開前の工程は、販売中の本の修正 (kdp-promote --mode update) の証拠があるときだけ許す (2026-11-03 20fb26cf0)
  {
    const beforeStage = live.publicationStage;
    const beforeEvidence = live.publicationStageEvidence;
    live.publicationStage = "verified";
    live.publicationStageEvidence = { ...(beforeEvidence ?? {}), prepared: { ...(beforeEvidence?.prepared ?? {}), mode: "create" } };
    assert.match(run().join("\n"), /kdp\.listings: .* が schema に合わない/, `${live.id} publicationStage=verified (修正の証拠なし)`);
    live.publicationStageEvidence = { ...(beforeEvidence ?? {}), prepared: { ...(beforeEvidence?.prepared ?? {}), mode: "update" } };
    assert.deepEqual(run(), [], `${live.id} publicationStage=verified + 修正の証拠は通る`);
    live.publicationStage = beforeStage;
    if (beforeEvidence === undefined) delete live.publicationStageEvidence;
    else live.publicationStageEvidence = beforeEvidence;
  }
  assert.deepEqual(run(), [], "戻すと通る (赤は書き換えた値が理由)");
});

// ── DB の置き場 (2026-11-10 オーナー決定) ──
// マスタと台帳は data/ の 1 つの DB にまとめ、config/ はシステムの設定だけ、packages/・apps/ は型・読み込み・検査だけにする。
// 文章の規約ではなく、この検査で守る。許可リストは縮小専用で、移したのに行が残っても止まる。

const trackedNow = () =>
  execFileSync("git", ["-C", ROOT, "ls-files", "-z"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }).split("\0").filter(Boolean);

test("実リポジトリは種類と置き場が一致し、data/ の外の台帳と README は一覧に載ったものだけ", () => {
  const files = trackedNow();
  assert.deepEqual(checkPlacement(DATASETS, { systemConfig: SYSTEM_CONFIG, movePending: CONFIG_MOVE_PENDING }), []);
  assert.deepEqual(checkOutsideData({ entries: OUTSIDE_DATA, files, registries: REGISTRIES }), []);
  assert.deepEqual(checkDataReadmes({ files, pending: DATA_README_PENDING }), []);
});

test("[mutation] マスタ・台帳を config/ や packages/ に置く、設定を data/ に置く、schema の種類を取り違える、は落ちる", () => {
  const row = (id, path, kind) => ({ id, path, kind, domain: "site", target: "data", description: id });
  const lists = { systemConfig: { "sys.ok": "接続先" }, movePending: { "biz.pending": "段 4" } };
  const run = (rows) => checkPlacement(rows, lists).map((e) => e.replace(/ \(.*$/, ""));
  const ok = [
    row("sys.ok", "config/sys.json", "config"),
    row("biz.pending", "config/biz.json", "master"),
    row("biz.master", "data/biz/master.json", "master"),
    row("biz.schema", "data/biz/master.schema.json", "schema"),
    row("agent.ledger", ".claude/state/x/ledger.json", "ledger"),
    row("agent.budget", ".claude/config/budgets/a/budgets.json", "config"),
  ];
  assert.deepEqual(run(ok), []);
  assert.deepEqual(run([...ok, row("biz.new", "config/new.json", "master")]), [
    "biz.new: マスタ・台帳は data/ に置く",
    "biz.new: config/ はシステムの設定だけを置く",
  ]);
  assert.deepEqual(run([...ok, row("biz.pkg", "packages/x/src/ledger.json", "ledger")]), ["biz.pkg: マスタ・台帳は data/ に置く"]);
  assert.deepEqual(run([...ok, row("sys.stray", "data/sys/settings.json", "config")]), ["sys.stray: 種類 config"]);
  assert.deepEqual(run([...ok, row("biz.shape", "data/biz/x.schema.json", "master")]), ["biz.shape: *.schema.json の行の種類は schema"]);
  assert.deepEqual(run([...ok, row("biz.notschema", "data/biz/x.json", "schema")]), ["biz.notschema: 種類 schema の行は *.schema.json を指す"]);
  // 移したのに許可リストに残っている・台帳に無い id が載っている、も止める (縮小専用)
  assert.deepEqual(run(ok.map((r) => (r.id === "biz.pending" ? row("biz.pending", "data/biz/moved.json", "master") : r))), [
    "biz.pending: data/ へ移したら CONFIG_MOVE_PENDING から消す",
  ]);
  assert.deepEqual(run(ok.filter((r) => r.id !== "sys.ok")), ["SYSTEM_CONFIG に台帳に無い id: sys.ok"]);
});

test("[mutation] packages/・apps/ の JSON は一覧に無ければ落ち、移した後の行と一覧に無い registry の正本も落ちる", () => {
  const entries = [
    { path: "apps/web/public/", why: "app" },
    { path: "packages/x/src/data/", why: "pending", phase: 2 },
    { path: "packages/x/src/registry.ts", why: "generated" },
  ];
  const files = ["apps/web/public/a.json", "packages/x/src/data/master.json", "packages/x/src/registry.ts", "packages/x/package.json", "packages/x/src/__tests__/f.json", "packages/x/src/a.generated.json"];
  const run = (e, f, registries = {}) => checkOutsideData({ entries: e, files: f, registries });
  assert.deepEqual(run(entries, files), [], "テスト・生成物・package.json は問わない");
  assert.match(run(entries, [...files, "packages/y/src/ledger.json"])[0], /^data\/ の外の JSON: packages\/y\/src\/ledger\.json/);
  assert.match(run(entries, files.filter((f) => !f.startsWith("packages/x/src/data/")))[0], /どのファイルにも当たらない \(移したら行を消す\): packages\/x\/src\/data\//);
  assert.match(run([...entries, { path: "apps/web/public/", why: "pending" }], files)[0], /pending の行は移す段/);
  assert.deepEqual(run(entries, files, { ok: { files: ["packages/x/src/registry.ts", "data/y/z.json"] } }), []);
  assert.match(run(entries, files, { stray: { files: ["packages/z/src/catalog.ts"] } })[0], /REGISTRIES\.stray: data\/ の外の正本 packages\/z\/src\/catalog\.ts/);
});

test("[mutation] data/ の中の README は一覧に無ければ落ち、消した後の行も落ちる", () => {
  const pending = { "data/a/README.md": "段 2 で Schema へ移す" };
  assert.deepEqual(checkDataReadmes({ files: ["data/a/README.md", "data/a/x.json", "docs/README.md", "packages/x/README.md"], pending }), []);
  assert.match(checkDataReadmes({ files: ["data/a/README.md", "data/b/c/README.md"], pending })[0], /^data\/ の中の README: data\/b\/c\/README\.md/);
  assert.match(checkDataReadmes({ files: ["data/a/x.json"], pending })[0], /DATA_README_PENDING に無いファイル: data\/a\/README\.md/);
});

test("ER は refs からテーブル・外部キーを出し、統合の候補は写しを持つ参照だけにする", () => {
  const row = (id, path, kind, opts = {}) => ({ id, path, kind, domain: "site", target: "data", description: id, ...opts });
  const er = buildEr({
    datasets: [
      row("t.a", "data/a.json", "master"),
      row("t.b", "data/b.json", "ledger", { refs: [{ field: "rows[].a", to: "t.a", key: "items[].id", copies: ["title"] }] }),
      // 値が重複なく参照先を 1 件ずつ指すだけ (1 対 1) の参照。書き手や生成の記録が別の台帳もこの形になるので候補にしない
      row("t.c", "data/c.json", "ledger", { refs: [{ field: "rows[].a", to: "t.a", key: "items[].id" }] }),
      row("t.log", "data/log.csv", "series"),
    ],
  });
  assert.deepEqual(er.tables.map((t) => t.id), ["t.a", "t.b", "t.c"], "series はテーブルに数えない");
  assert.equal(er.edges.length, 2);
  assert.deepEqual(er.candidates.map((c) => `${c.kind}:${c.from}`), ["写しを持つ:t.b"], "写しを持たない t.c は候補にしない");
  assert.match(er.candidates[0].detail, /rows\[\]\.a が title を写している/);
});

test("git grep の出力は CRLF の行も読む (Windows の作業ツリーで違反を見逃さない)", () => {
  // 作業ツリーが CRLF のファイルは行末に \r が残る。落とさないと行ごと読み飛ばし、Windows でだけ検査が通る
  const rows = parseGrepRows('a/x.mjs:3:const p = "data/gsc/x.json";\r\nb/y.mjs:7:const q = "data/sns/y.json";\n');
  assert.deepEqual(rows.map((r) => `${r.file}:${r.line}`), ["a/x.mjs:3", "b/y.mjs:7"]);
  assert.equal(rows[0].text.endsWith("\r"), false);
  assert.equal(findDataPathLiterals(["gsc", "sns"], rows).length, 2, "CRLF の行の直書きも数える");
});

test("実リポジトリの問いの台帳は、文章 (dataNote) に e-Stat の表 ID を書いていない", () => {
  const issues = JSON.parse(readFileSync(resolve(ROOT, datasetPath("content.issues")), "utf8")).issues;
  assert.deepEqual(issues.filter((i) => /[0-9]{10}/.test(i.dataNote ?? "")).map((i) => i.id), []);
});

// ── 調査ポートフォリオ: 列挙と ID の実在の持ち主は Schema と refs だけ (2026-11-14 SURVEY-PORTFOLIO-VALIDATOR-DEDUPE-01) ──
const SURVEY_STATE_IDS = ["surveys.portfolio", "surveys.experiments"];
const SURVEY_VALIDATOR = ".claude/scripts/surveys/validate-survey-portfolio.ts";

test("[mutation] 調査ポートフォリオと実験台帳の語彙外の値は Schema が、調査 ID の参照切れは refs が落とす", () => {
  const portfolioPath = datasetPath("surveys.portfolio");
  const experimentsPath = datasetPath("surveys.experiments");
  const masterPath = datasetPath("surveys.master");
  const files = [portfolioPath, experimentsPath, masterPath];
  const store = Object.fromEntries(files.map((f) => [f, JSON.parse(readFileSync(resolve(ROOT, f), "utf8"))]));
  const rows = DATASETS.filter((d) => [...SURVEY_STATE_IDS, "surveys.master"].includes(d.id));
  const readJson = (p) => store[p] ?? JSON.parse(readFileSync(resolve(ROOT, p), "utf8"));
  const schemaErrors = () => checkSchemas({ datasets: rows, files, readJson, exists: (p) => existsSync(resolve(ROOT, p)) });
  const refErrors = () => checkRefs({ datasets: rows, files, readJson, readText: (p) => readFileSync(resolve(ROOT, p), "utf8"), registries: REGISTRIES }).errors;
  assert.deepEqual(schemaErrors(), []);
  assert.deepEqual(refErrors(), []);

  const survey = store[portfolioPath].surveys[0];
  const experiment = store[experimentsPath].experiments[0];
  assert.ok(experiment, "実験台帳に 1 件以上ある (無ければこの検査は実験側を見ていない)");
  const mutations = [
    [survey, "lifecycleStatus", /surveys\.portfolio: .* が schema に合わない/],
    [survey, "editorialStatus", /surveys\.portfolio: .* が schema に合わない/],
    [survey, "linkageStatus", /surveys\.portfolio: .* が schema に合わない/],
    [survey.metrics.gsc, "status", /surveys\.portfolio: .* が schema に合わない/],
    [experiment, "verdict", /surveys\.experiments: .* が schema に合わない/],
    [experiment, "changeType", /surveys\.experiments: .* が schema に合わない/],
  ];
  for (const [target, field, expected] of mutations) {
    const original = target[field];
    target[field] = "no-such-value";
    assert.match(schemaErrors().join("\n"), expected, `${field} の語彙外の値を Schema が落とす`);
    target[field] = original;
  }
  for (const [target, id] of [[survey, "surveys.portfolio"], [experiment, "surveys.experiments"]]) {
    const original = target.surveyId;
    target.surveyId = "no-such-survey";
    assert.match(refErrors().join("\n"), new RegExp(`参照切れ: ${id.replace(".", "\\.")} .*surveyId=no-such-survey が surveys\\.master の`), `${id} の調査 ID の参照切れを refs が落とす`);
    target.surveyId = original;
  }
  assert.deepEqual(schemaErrors(), [], "戻すと通る (赤は書き換えた値が理由)");
  assert.deepEqual(refErrors(), []);
});

test("調査ポートフォリオの検証スクリプトは、Schema の列挙と refs の ID の実在を二重に持たない", () => {
  // コメントを除いたコードだけを見る (判定の規律の説明に値の名前が出るのは構わない)
  const code = readFileSync(resolve(ROOT, SURVEY_VALIDATOR), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|\s)\/\/.*$/gm, "$1");
  const enums = [];
  const walk = (node, trail) => {
    if (Array.isArray(node)) return node.forEach((child, i) => walk(child, `${trail}[${i}]`));
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node.enum)) enums.push({ trail, values: node.enum });
    for (const [key, child] of Object.entries(node)) if (key !== "enum") walk(child, `${trail}.${key}`);
  };
  for (const id of SURVEY_STATE_IDS) walk(JSON.parse(readFileSync(resolve(ROOT, DATASETS.find((d) => d.id === id).schema), "utf8")), id);
  assert.ok(enums.length >= 6, `Schema から列挙を ${enums.length} 個しか読めていない (lifecycle・linkage・editorial・計測の状態・verdict・changeType)`);
  const duplicated = enums.filter(({ values }) => values.every((value) => code.includes(`"${value}"`) || code.includes(`'${value}'`)));
  assert.deepEqual(duplicated.map((e) => e.trail), [], "Schema の列挙の全部の値を検証スクリプトが文字列で持っている (列挙は Schema だけが持つ。部分集合を使う意味の検査は構わない)");
  assert.doesNotMatch(code, /masterIds\.has\(/, "調査 ID の実在は refs (surveys[].surveyId・experiments[].surveyId → surveys.master) だけが持つ");
});
