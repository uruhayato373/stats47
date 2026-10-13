import assert from "node:assert/strict";
import test from "node:test";
import { CODES, DOCS31, auditBackgroundPresence, auditImageAssets, auditR2BodyPresence, validateRankingArticleFiles, validateRankingChartData } from "../lib/image-assets-audit.mjs";
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
const codes = (findings) => findings.map((f) => f.code);
const files = (map) => (name) => map[name] ?? null;
const rankingFiles = (over = {}) => ({
  "chart-data.json": chartText,
  "data-provenance.json": JSON.stringify(provenance()),
  "render-spec.json": specText(),
  ...over,
});

test("docs/31 に git の追跡ファイルが 1 つでもあれば違反 (作業場で、正本は R2)", () => {
  assert.deepEqual(codes(auditImageAssets({ tracked: [] }).findings), []);
  assert.deepEqual(codes(auditImageAssets({ tracked: [`${D}README.md`] }).findings), [], "作業場の説明だけは置いてよい");
  const r = auditImageAssets({ tracked: [`${D}a-foo/draft.md`, `${D}product-sales/p/images/a.png`] });
  assert.deepEqual(codes(r.findings), [CODES.DOCS31_TRACKED, CODES.DOCS31_TRACKED]);
  assert.equal(r.summary.docs31Tracked, 2);
});

test("ランキング記事は chart-data.json・data-provenance.json・render-spec.json で復元できなければ保存前に警告", () => {
  assert.deepEqual(codes(validateRankingArticleFiles("a-foo", files(rankingFiles()))), []);
  const none = codes(validateRankingArticleFiles("a-foo", files({})));
  assert.ok(none.includes(CODES.RENDER_SPEC_INVALID));
  assert.ok(none.includes(CODES.RANKING_CHART_DATA_INVALID));
  assert.ok(none.includes(CODES.RANKING_PROVENANCE_INVALID));
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
  const badSource = validateRankingArticleFiles("a-foo", files(rankingFiles({ "data-provenance.json": JSON.stringify(provenance({ source: "r2:app/stats/bar/values.json" })) })));
  assert.deepEqual(codes(badSource), [CODES.RANKING_PROVENANCE_INVALID]);
});

test("家計 (a-kakei-*) は単一指標のランキング記事契約の対象外", () => {
  assert.deepEqual(validateRankingArticleFiles("a-kakei-aichi", files({})), []);
});

test("台帳が公開 R2 に保存済みとする本文の欠落を検出し、未保存の公開記事も違反、通信失敗は判定不能", () => {
  const art = (key, status, store, saved) => ({ key, status, r2Path: `note/x/${key}`, body: { store, manifest: saved ? { sha256: "a".repeat(64) } : null } });
  const articles = [
    art("a-present", "published", "r2-public", true),
    art("a-missing", "published", "r2-public", true),
    art("a-flaky", "published", "r2-public", true),
    art("a-paid", "published", "r2-private", true),
    art("a-unsaved", "published", "r2-public", false),
    art("a-planned", "draft", "r2-private", false),
    art("a-recovered", "published", "note-only", false),
  ];
  const status = new Map([["note/x/a-present", 200], ["note/x/a-missing", 404], ["note/x/a-flaky", 0]]);
  const r = auditR2BodyPresence(articles, status);
  assert.deepEqual(r.findings.map((f) => f.file), ["note/x/a-missing", "note/x/a-unsaved"]);
  assert.deepEqual(r.unknown, ["a-flaky"]);
  assert.equal(r.checked, 3);
});

test("render-spec は chart-data.json の変更とテンプレート版の更新で古くなる", () => {
  assert.deepEqual(codes(validateRankingArticleFiles("a-foo", files(rankingFiles()))), []);
  const changedData = rankingFiles({ "chart-data.json": chartText.replace("指標", "別の指標") });
  assert.deepEqual(codes(validateRankingArticleFiles("a-foo", files(changedData))), [CODES.RENDER_SPEC_INVALID]);
  const oldSpec = JSON.parse(specText());
  oldSpec.renderer.templateVersion = `${NOTE_RENDER_TEMPLATE_VERSION}-old`;
  assert.deepEqual(codes(validateRankingArticleFiles("a-foo", files(rankingFiles({ "render-spec.json": JSON.stringify(oldSpec) })))), [CODES.RENDER_SPEC_INVALID]);
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
