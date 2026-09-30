import assert from "node:assert/strict";
import test from "node:test";
import { CODES, DOCS31, auditBackgroundPresence, auditImageAssets, validateRankingChartData } from "../lib/image-assets-audit.mjs";
import { NOTE_RENDER_TEMPLATE_VERSION, buildRenderProps, buildRenderSpec, noteBackgroundR2Key, validateBackground, validateRenderSpec } from "../lib/note-render-spec.mjs";

const D = DOCS31;
const rows = (year = 2024) =>
  Array.from({ length: 47 }, (_, i) => ({ rank: i + 1, area_code: String(i + 1).padStart(2, "0") + "000", area_name: `県${i + 1}`, year: String(year), value: 100 - i, deviation: 50 }));
const chartData = (over = {}) => ({
  _meta: { rankingKey: "foo", year: 2024, source: "post-note-ranking" },
  copy: { canonicalTitle: "指標", readerLabel: "指標", hook: "どこ？" },
  unit: "円",
  summary: { mean: 1, stddev: 1, topBottomRatio: 2 },
  data: rows(),
  ...over,
});
const provenance = (over = {}) => ({ slug: "a-foo", rankingKey: "foo", year: "2024", source: "r2:app/stats/foo/values.json", restore: "curl -sf x", ...over });
const chartText = JSON.stringify(chartData());
const specText = () => JSON.stringify(buildRenderSpec("a-foo", chartText));
const run = (tracked, extra = {}) =>
  auditImageAssets({
    tracked,
    readJson: (file) => extra.json?.[file] ?? null,
    readText: (file) => extra.text?.[file] ?? null,
    pngBytes: new Map(tracked.filter((f) => f.endsWith(".png")).map((f) => [f, 1000])),
    ...extra,
  });
const codes = (result) => result.findings.map((f) => f.code);

test("SVG から再生成できる PNG を追跡していると違反になる", () => {
  const r = run([`${D}a-kakei-x/images/a.svg`, `${D}a-kakei-x/images/a.png`]);
  assert.deepEqual(codes(r), [CODES.DERIVED_PNG_TRACKED]);
});

test("SVG を持たない PNG は追跡していてよく、再生成元なしとして数えられる", () => {
  const r = run([`${D}product-sales/p/images/a.png`]);
  assert.deepEqual(codes(r), []);
  assert.deepEqual(r.summary.sourcelessByClass, { "product-sales": 1 });
});

test("gitignore された PNG に SVG が無いと、git に載らず失われるので違反になる", () => {
  const withSvg = run([`${D}a-kakei-x/images/a.svg`], { ignoredUntracked: [`${D}a-kakei-x/images/a.png`] });
  assert.deepEqual(codes(withSvg), []);
  const withoutSvg = run([], { ignoredUntracked: [`${D}a-kakei-x/images/b.png`] });
  assert.deepEqual(codes(withoutSvg), [CODES.IGNORED_PNG_WITHOUT_SVG]);
});

test("ランキング記事は chart-data.json と data-provenance.json で復元できなければ違反", () => {
  const tracked = [`${D}a-foo/draft.md`, `${D}a-foo/chart-data.json`, `${D}a-foo/data-provenance.json`];
  const ok = run(tracked, {
    json: { [`${D}a-foo/chart-data.json`]: chartData(), [`${D}a-foo/data-provenance.json`]: provenance() },
    text: { [`${D}a-foo/chart-data.json`]: chartText, [`${D}a-foo/render-spec.json`]: specText() },
  });
  assert.deepEqual(codes(ok), []);
  const noFiles = run(tracked);
  assert.ok(codes(noFiles).includes(CODES.RENDER_SPEC_INVALID));
  assert.ok(codes(noFiles).includes(CODES.RANKING_CHART_DATA_INVALID));
  assert.ok(codes(noFiles).includes(CODES.RANKING_PROVENANCE_INVALID));
});

test("単位・47行・連番・年・出典の欠落を個別に検出する", () => {
  const cases = {
    "単位なし": chartData({ unit: undefined }),
    "46 行": chartData({ data: rows().slice(1) }),
    "順位が連番でない": chartData({ data: rows().map((r, i) => (i === 3 ? { ...r, rank: 99 } : r)) }),
    "年の不一致": chartData({ data: rows(2020) }),
    "指標名なし": chartData({ copy: { canonicalTitle: "", readerLabel: "x", hook: "y" } }),
  };
  for (const [name, data] of Object.entries(cases)) {
    assert.ok(validateRankingChartData("a-foo", data).length > 0, `${name} を検出できない`);
  }
  assert.deepEqual(validateRankingChartData("a-foo", chartData()), []);
  const badSource = run([`${D}a-foo/draft.md`], {
    json: { [`${D}a-foo/chart-data.json`]: chartData(), [`${D}a-foo/data-provenance.json`]: provenance({ source: "r2:app/stats/bar/values.json" }) },
    text: { [`${D}a-foo/chart-data.json`]: chartText, [`${D}a-foo/render-spec.json`]: specText() },
  });
  assert.deepEqual(codes(badSource), [CODES.RANKING_PROVENANCE_INVALID]);
});

test("家計 (a-kakei-*) は単一指標のランキング記事契約の対象外", () => {
  const r = run([`${D}a-kakei-aichi/draft.md`]);
  assert.equal(r.summary.rankingArticles, 0);
  assert.deepEqual(codes(r), []);
});

test("追跡中 PNG が予算を超えると違反、予算内なら通る", () => {
  const tracked = [`${D}product-sales/p/images/a.png`, `${D}product-sales/p/images/b.png`];
  assert.deepEqual(codes(run(tracked, { budget: { trackedPngBytes: 2000, trackedPngCount: 2 } })), []);
  assert.deepEqual(codes(run(tracked, { budget: { trackedPngBytes: 1999, trackedPngCount: 2 } })), [CODES.TRACKED_PNG_OVER_BUDGET]);
  assert.deepEqual(codes(run(tracked, { budget: { trackedPngBytes: 5000, trackedPngCount: 1 } })), [CODES.TRACKED_PNG_OVER_BUDGET]);
});

test("catalog が r2_body:true でも R2 に無い記事を検出し、既知の一覧は新規違反にしない", async () => {
  const { auditR2BodyPresence } = await import("../lib/image-assets-audit.mjs");
  const articles = {
    "a-present": { r2_body: true, r2_path: "note/x/a-present" },
    "a-missing": { r2_body: true, r2_path: "note/x/a-missing" },
    "a-known": { r2_body: true, r2_path: "note/x/a-known" },
    "a-paid": { r2_body: true, r2_path: "note/x/a-paid", is_paid: true },
    "a-unsynced": { r2_body: false, r2_path: "note/x/a-unsynced" },
    "a-flaky": { r2_body: true, r2_path: "note/x/a-flaky" },
  };
  const status = new Map([
    ["note/x/a-present", 200],
    ["note/x/a-missing", 404],
    ["note/x/a-known", 404],
    ["note/x/a-flaky", 0],
  ]);
  const r = auditR2BodyPresence(articles, status, ["a-known"]);
  assert.deepEqual(r.findings.map((f) => f.file), ["note/x/a-missing"]);
  assert.deepEqual(r.unknown, ["a-flaky"]);
  assert.equal(r.checked, 4);
});

test("render-spec は chart-data.json の変更とテンプレート版の更新で古くなる", () => {
  const tracked = [`${D}a-foo/draft.md`, `${D}a-foo/chart-data.json`, `${D}a-foo/data-provenance.json`, `${D}a-foo/render-spec.json`];
  const json = { [`${D}a-foo/chart-data.json`]: chartData(), [`${D}a-foo/data-provenance.json`]: provenance() };
  const base = { json, text: { [`${D}a-foo/chart-data.json`]: chartText, [`${D}a-foo/render-spec.json`]: specText() } };
  assert.deepEqual(codes(run(tracked, base)), []);
  const changedData = { ...base, text: { ...base.text, [`${D}a-foo/chart-data.json`]: chartText.replace("指標", "別の指標") } };
  assert.deepEqual(codes(run(tracked, changedData)), [CODES.RENDER_SPEC_INVALID]);
  const oldSpec = JSON.parse(specText());
  oldSpec.renderer.templateVersion = `${NOTE_RENDER_TEMPLATE_VERSION}-old`;
  const stale = { ...base, text: { ...base.text, [`${D}a-foo/render-spec.json`]: JSON.stringify(oldSpec) } };
  assert.deepEqual(codes(run(tracked, stale)), [CODES.RENDER_SPEC_INVALID]);
});

test("render-spec を持つランキング記事の PNG は追跡すると違反、無視されるのは正常", () => {
  const spec = [`${D}a-foo/draft.md`, `${D}a-foo/chart-data.json`, `${D}a-foo/render-spec.json`];
  const img = `${D}a-foo/images/cover-1280x670.png`;
  assert.ok(codes(run([...spec, img])).includes(CODES.DERIVED_PNG_TRACKED));
  assert.ok(!codes(run(spec, { ignoredUntracked: [img] })).includes(CODES.IGNORED_PNG_WITHOUT_SVG));
  // render-spec が無ければ再生成元が無いので、無視された PNG は失われる
  assert.ok(codes(run([`${D}a-foo/draft.md`, `${D}a-foo/chart-data.json`], { ignoredUntracked: [img] })).includes(CODES.IGNORED_PNG_WITHOUT_SVG));
  // 4 枚以外の PNG は spec では作れない
  assert.ok(codes(run(spec, { ignoredUntracked: [`${D}a-foo/images/other.png`] })).includes(CODES.IGNORED_PNG_WITHOUT_SVG));
});

const SHA = "a".repeat(64);
const goodBackground = (slug = "a-foo") => ({ status: "approved", source: "imagegen", model: "m", prompt: "p", sha256: SHA, bytes: 1000, width: 1280, height: 670, r2Key: noteBackgroundR2Key(slug, SHA) });

test("生成 AI の背景は SHA・R2 キー・寸法・モデル・指示文が揃わないと spec として無効", () => {
  assert.deepEqual(validateBackground("a-foo", undefined), []);
  assert.deepEqual(validateBackground("a-foo", goodBackground()), []);
  const cases = {
    "未承認": { ...goodBackground(), status: "draft" },
    "SHA が不正": { ...goodBackground(), sha256: "zz" },
    "R2 キーが SHA と不一致": { ...goodBackground(), r2Key: "media/note-backgrounds/a-foo/000000000000/background.jpg" },
    "別記事のキー": { ...goodBackground(), r2Key: noteBackgroundR2Key("a-bar", SHA) },
    "寸法違い": { ...goodBackground(), width: 1600 },
    "モデル未記録": { ...goodBackground(), model: "" },
    "指示文未記録": { ...goodBackground(), prompt: " " },
  };
  for (const [name, bg] of Object.entries(cases)) assert.ok(validateBackground("a-foo", bg).length > 0, `${name} を検出できない`);
});

test("背景を持つ spec は有効で、背景の不備は RENDER_SPEC_INVALID になる", () => {
  const spec = buildRenderSpec("a-foo", chartText, goodBackground());
  assert.deepEqual(validateRenderSpec("a-foo", spec, chartText), []);
  assert.ok(validateRenderSpec("a-foo", { ...spec, background: { ...goodBackground(), model: "" } }, chartText).length > 0);
  assert.equal("background" in buildRenderSpec("a-foo", chartText), false);
});

test("背景があるときだけ props に backgroundImage が入る", () => {
  const data = chartData();
  assert.equal("backgroundImage" in buildRenderProps(data), false);
  assert.equal(buildRenderProps(data, "data:image/jpeg;base64,AAAA").backgroundImage, "data:image/jpeg;base64,AAAA");
});

test("spec の背景が R2 に無い記事を検出し、通信失敗は判定不能として分ける", () => {
  const bgs = [{ slug: "a-ok", r2Key: "k1" }, { slug: "a-missing", r2Key: "k2" }, { slug: "a-flaky", r2Key: "k3" }];
  const r = auditBackgroundPresence(bgs, new Map([["k1", 200], ["k2", 404], ["k3", 0]]));
  assert.deepEqual(r.findings.map((f) => f.file), ["k2"]);
  assert.deepEqual(r.unknown, ["a-flaky"]);
});
