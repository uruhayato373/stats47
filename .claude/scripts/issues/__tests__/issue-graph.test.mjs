/**
 * 問いの台帳の検査が守る意図:
 *   - 同じ事実を二か所に持たない (小さな問いの親・テーマ・答えの記事が使う指標は導出し、写しを書かせない)
 *   - 役割とページ種別を取り違えない (答え = 読み物、根拠 = データ)
 *   - 答えの記事は問いごとに 1 本。関連する記事を答えとして積み上げない
 *   - 棚卸しの 4 分類が経路と読まれ方の両方で決まる
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  classifyCoverage,
  classifyDraft,
  computeReach,
  effectiveAxes,
  figurePurpose,
  PREFERENCE,
  findQueryCandidates,
  indexPages,
  listFigureDestinations,
  parentIdOf,
  parseCsv,
  resolveAxesFigure,
  pathOfUrl,
  sumTraffic,
  validateIssueGraph,
} from "../issue-graph-core.mjs";
import { grainsOfMetricSource } from "../issue-data-grains.mjs";

const page = (id, extra = {}) => {
  const [kind, key] = id.split(":");
  return { id, kind, key, title: key, href: `/${kind}/${key}`, published: true, ...extra };
};
const PAGES = indexPages([
  {
    pages: [
      page("theme:aging-society", { href: "/themes/aging-society", rankingKeys: ["total-fertility-rate"] }),
      page("blog:fertility-gap", { rankingKeys: ["unmarried-ratio"] }),
      page("blog:draft", { published: false }),
      page("ranking:unmarried-ratio"),
      page("ranking:total-fertility-rate"),
      page("ranking:per-taxpayer-income"),
      page("ranking:unused"),
      page("ranking:popular"),
    ],
  },
]);
const major = (id, extra = {}) => ({
  id, level: "major", question: `${id} の問い`, unit: "prefecture", answerability: "relation",
  primaryTheme: "theme:aging-society", sensitive: false, status: "active", ...extra,
});
const minor = (id, extra = {}) => ({
  id, level: "minor", question: `${id} の問い`, unit: "prefecture", answerability: "caveat",
  sensitive: false, status: "active", ...extra,
});
const errorsOf = (issues, links = []) => validateIssueGraph({ issues, links, pages: PAGES }).errors;

test("小さな問いの親は ID から導出し、親が無ければ止める", () => {
  assert.equal(parentIdOf("issue:A01-2"), "issue:A01");
  assert.equal(parentIdOf("issue:A01"), null);
  assert.deepEqual(errorsOf([major("issue:A01"), minor("issue:A01-1")]), []);
  assert.match(errorsOf([minor("issue:B01-1")]).join(), /親の issue:B01 が無い/);
});

test("小さな問いはテーマを持たない (親の写しになる)", () => {
  const errors = errorsOf([major("issue:A01"), minor("issue:A01-1", { primaryTheme: "theme:aging-society" })]);
  assert.match(errors.join(), /primaryTheme を持たない/);
});

test("level と ID の形の食い違い・同じ問いの文の重複を止める", () => {
  assert.match(errorsOf([major("issue:A01-1")]).join(), /level=major と ID の形が合わない/);
  const dup = errorsOf([major("issue:A01"), major("issue:A02", { question: "issue:A01 の 問い" })]);
  assert.match(dup.join(), /問いの文が issue:A01 と同じ/);
});

test("導出できる関係を evidence に書くと止める", () => {
  const issues = [major("issue:A01")];
  // primaryTheme と同じテーマ
  assert.match(errorsOf(issues, [{ issue: "issue:A01", page: "theme:aging-society", role: "evidence" }]).join(), /primaryTheme と同じ/);
  // 答えの記事が使っている指標
  const links = [
    { issue: "issue:A01", page: "blog:fertility-gap", role: "answers" },
    { issue: "issue:A01", page: "ranking:unmarried-ratio", role: "evidence" },
  ];
  assert.match(errorsOf(issues, links).join(), /答えの記事がすでにこの指標を使っている/);
  // 記事が使っていない指標は書いてよい
  assert.deepEqual(errorsOf(issues, [links[0], { issue: "issue:A01", page: "ranking:per-taxpayer-income", role: "evidence" }]), []);
});

test("小さな問いの evidence も親のテーマの写しは止める", () => {
  const errors = errorsOf([major("issue:A01"), minor("issue:A01-1")], [
    { issue: "issue:A01-1", page: "theme:aging-society", role: "evidence" },
  ]);
  assert.match(errors.join(), /primaryTheme と同じ/);
});

test("役割とページ種別の取り違え・非公開・重複を止める", () => {
  const issues = [major("issue:A01")];
  assert.match(errorsOf(issues, [{ issue: "issue:A01", page: "ranking:unused", role: "answers" }]).join(), /answers は .* だけを指す/);
  assert.match(errorsOf(issues, [{ issue: "issue:A01", page: "blog:draft", role: "answers" }]).join(), /非公開/);
  const twice = { issue: "issue:A01", page: "ranking:unused", role: "evidence" };
  assert.match(errorsOf(issues, [twice, { ...twice }]).join(), /重複/);
});

test("見送りは理由が要り、見送りの問いへはリンクしない", () => {
  assert.match(errorsOf([major("issue:A01", { status: "dropped" })]).join(), /dropReason が要る/);
  const dropped = major("issue:A01", { status: "dropped", dropReason: "データが無い" });
  assert.match(errorsOf([dropped], [{ issue: "issue:A01", page: "ranking:unused", role: "evidence" }]).join(), /見送りの問い/);
});

test("棚卸しは経路と読まれ方で 4 つに分ける", () => {
  const issues = [major("issue:A01")];
  const links = [{ issue: "issue:A01", page: "blog:fertility-gap", role: "answers" }];
  const reach = computeReach({ issues, links, pages: PAGES });
  assert.ok(reach.get("ranking:unmarried-ratio").has("via-answer"));
  assert.deepEqual([...reach.get("ranking:total-fertility-rate")], ["via-theme"]);

  const traffic = sumTraffic([
    [{ page: "https://stats47.jp/ranking/popular/", clicks: "0", impressions: "6" }],
    [{ page: "https://stats47.jp/ranking/popular?x=1", clicks: "0", impressions: "5" }],
  ]);
  const { byKind, orphanRead } = classifyCoverage({ pages: PAGES, reach, traffic });
  assert.deepEqual(byKind.ranking, { total: 5, linked: 1, weak: 1, orphanRead: 1, orphanIdle: 2 });
  assert.deepEqual(orphanRead.map((o) => o.id), ["ranking:popular"]); // 2 週の合計 11 表示で閾値 10 を超える
  assert.equal(byKind.blog.total, 1); // 非公開は数えない
});

test("GSC の URL と CSV の読み", () => {
  assert.equal(pathOfUrl("https://stats47.jp/"), "/");
  assert.equal(pathOfUrl("https://stats47.jp/blog/a/?utm=1"), "/blog/a");
  assert.deepEqual(parseCsv('page,clicks\n"https://x/a,b",3\r\n'), [{ page: "https://x/a,b", clicks: "3" }]);
});

test("問いの候補は『なぜ・理由・関係』型の語を週をまたいで合算し、表示の多い順に出す", () => {
  const weeks = [
    [
      { query: "沖縄 持ち家率 なぜ", clicks: "1", impressions: "10" },
      { query: "東京 人口 ランキング", clicks: "9", impressions: "999" },
      { query: "北陸 米作りが盛んな理由", clicks: "0", impressions: "20" },
    ],
    [{ query: "沖縄  持ち家率　なぜ", clicks: "2", impressions: "15" }],
  ];
  assert.deepEqual(findQueryCandidates({ issues: [], weeks }), [
    { query: "沖縄 持ち家率 なぜ", clicks: 3, impressions: 25 },
    { query: "北陸 米作りが盛んな理由", clicks: 0, impressions: 20 },
  ]);
});

test("問いの候補から、すでに問いが受けている語を空白違いも含めて除く。見送った問いの語も再び出さない", () => {
  const weeks = [[
    { query: "沖縄 持ち家率 なぜ", clicks: "1", impressions: "10" },
    { query: "新潟県 身長 高い 理由", clicks: "1", impressions: "10" },
    { query: "完全失業率と有効求人倍率 関係", clicks: "1", impressions: "10" },
  ]];
  const issues = [
    minor("issue:H06-1", { queries: ["沖縄持ち家率 なぜ"] }),
    minor("issue:F13-1", { status: "dropped", dropReason: "答えが出ない", queries: ["新潟県 身長 高い理由"] }),
    major("issue:A01"),
  ];
  assert.deepEqual(findQueryCandidates({ issues, weeks }).map((c) => c.query), ["完全失業率と有効求人倍率 関係"]);
});

test("問いの候補に、統計用語の『関係』と主語の無い語を入れない", () => {
  const weeks = [["40代 配偶関係 未婚 割合", "東京 主要駅 位置関係", "何故", "何故？", "原因は？", "ストレスと寿命の関係"]
    .map((query) => ({ query, clicks: "0", impressions: "5" }))];
  assert.deepEqual(findQueryCandidates({ issues: [], weeks }).map((c) => c.query), ["ストレスと寿命の関係"]);
});

test("リポジトリの台帳そのものが検査を通る", () => {
  const root = resolve(fileURLToPath(import.meta.url), "../../../../..");
  const read = (rel) => JSON.parse(readFileSync(join(root, rel), "utf8"));
  const dir = "data/content/pages";
  const pages = indexPages(readdirSync(join(root, dir)).filter((f) => f.endsWith(".json")).map((f) => read(`${dir}/${f}`)));
  const { errors } = validateIssueGraph({
    issues: read("data/content/issues.json").issues,
    links: read("data/content/issue-links.json").links,
    pages,
  });
  assert.deepEqual(errors, []);
});

test("図の配信先: 載せ忘れを一覧し、台帳どうしのずれを見分ける", () => {
  const analyses = [{ id: "analysis:A", issue: "issue:A" }];
  const pages = new Map([["blog:live", { published: true }]]);
  const posts = [{ id: 1, status: "posted" }, { id: 2, status: "draft" }, { id: 3, status: "deleted" }];
  const rows = (destinations) => listFigureDestinations({ figures: [{ id: "figure:A", analysis: "analysis:A", destinations }], analyses, posts, pages });

  // 載せ終えたものは消え、まだのものは問いまで辿れる形で残る
  assert.deepEqual(rows([{ channel: "site", page: "blog:live", status: "published" }, { channel: "x", postId: 1, status: "published" }]), []);
  const [planned] = rows([{ channel: "site", page: "blog:live", status: "planned" }]);
  assert.equal(planned.issue, "issue:A");
  assert.equal(planned.drift, false);
  assert.equal(rows([{ channel: "x", postId: 2, status: "draft" }])[0].drift, false);

  // 公開の状態の正本は配信先の台帳。食い違いはずれとして出す
  const drift = (d) => rows([d])[0]?.drift;
  assert.equal(drift({ channel: "x", postId: 1, status: "draft" }), true, "投稿済みなのに図の台帳が下書きのまま");
  assert.equal(drift({ channel: "x", postId: 2, status: "published" }), true, "投稿していないのに公開済みと書いた");
  assert.equal(drift({ channel: "x", postId: 3, status: "draft" }), true, "投稿を消した");
  assert.equal(drift({ channel: "x", postId: 9, status: "draft" }), true, "投稿が台帳に無い");
  assert.equal(drift({ channel: "site", page: "blog:gone", status: "published" }), true, "公開済みと書いたページが無い");
});

test("下書きの待ち: 本文の審査が先で、背景画像は別の工程として最後に待つ", () => {
  const draft = { hasArticle: true, published: false, verdict: "PASS", hasBackground: true };
  assert.equal(classifyDraft({ ...draft, hasArticle: false }), "執筆待ち");
  assert.equal(classifyDraft({ ...draft, verdict: "REVISE", hasBackground: false }), "レビュー待ち", "背景より審査を先に出す");
  assert.equal(classifyDraft({ ...draft, hasBackground: false }), "背景待ち");
  assert.equal(classifyDraft(draft), "公開待ち");
  assert.equal(classifyDraft({ ...draft, published: true }), "公開処理中");

  const row = (actual) => listFigureDestinations({
    figures: [{ id: "figure:A", analysis: "analysis:A", destinations: [{ channel: "site", slug: "a", status: "draft" }] }],
    analyses: [{ id: "analysis:A", issue: "issue:A" }], posts: [], pages: new Map(), drafts: new Map(actual ? [["a", actual]] : []),
  })[0];
  assert.equal(row("背景待ち").actual, "背景待ち");
  assert.equal(row("背景待ち").target, "blog:a");
  assert.equal(row(null).drift, true, "台帳に下書きがあると書いたのに実物が無い");
});

test("1 つの問いに答えを 2 本結ぶと止まる", () => {
  const issues = [{ id: "issue:A01", level: "major", question: "問い", unit: "prefecture", answerability: "relation", primaryTheme: "theme:aging-society", revenue: ["広告"], status: "active" }];
  const pages = indexPages([{ pages: [page("blog:a"), page("blog:b")] }]);
  const answers = (...keys) => keys.map((key) => ({ issue: "issue:A01", page: `blog:${key}`, role: "answers" }));
  assert.equal(validateIssueGraph({ issues, links: answers("a"), pages }).errors.filter((e) => e.includes("1 本だけ")).length, 0);
  assert.equal(validateIssueGraph({ issues, links: answers("a", "b"), pages }).errors.filter((e) => e.includes("1 本だけ")).length, 1);
});

// 分析の軸 → 図: 型は図の型の台帳 (実物) から引き、描画器の無い型と地域の要る型を全国の問いに出さない
const TEMPLATES = JSON.parse(
  readFileSync(resolve(fileURLToPath(import.meta.url), "../../../../../data/content-operations/image-templates.json"), "utf8"),
).templates;
const axis = (pattern, metrics) => ({ label: pattern, pattern, ...(metrics ? { data: metrics.map((m) => (typeof m === "string" ? { metric: m } : m)) } : {}) });
const group = () => ({ label: "区分", pattern: "compare", group: true });
const figure = (unit, explanatory, outcome, metricGrains, seriesIds) =>
  resolveAxesFigure({ issue: { id: "issue:Z01", unit }, axes: { explanatory, outcome }, templates: TEMPLATES, metricGrains, seriesIds });

test("軸が無い問いは型未定で、図を決めない", () => {
  const r = resolveAxesFigure({ issue: { id: "issue:Z01", unit: "prefecture" }, axes: undefined, templates: TEMPLATES });
  assert.deepEqual(r, { purpose: null, primary: null, allowed: [], gaps: ["型未定"], notes: [] });
});

test("県の比較は地図が主で、全国の比較は地図を出さない", () => {
  assert.equal(figure("prefecture", null, axis("compare", ["a"])).primary, "tile-map");
  const japan = figure("japan", null, axis("compare", ["a"]));
  assert.equal(japan.primary, "bar");
  assert.ok(!japan.allowed.includes("tile-map") && !japan.allowed.includes("choropleth"));
});

test("比較×比較は関係の図 (散布図)、増減の内訳は滝の図", () => {
  assert.equal(figure("prefecture", axis("compare", ["a"]), axis("compare", ["b"])).primary, "scatter");
  assert.equal(figure("prefecture", axis("compose", ["a"]), axis("change", ["b"])).primary, "waterfall");
  assert.equal(figure("prefecture", axis("compare", ["a"]), axis("compose", ["b"])).purpose, "composition");
});

test("描画器の無い型 (heatmap・pie) と使っていない型は候補に出ない", () => {
  for (const pattern of ["compare", "compose", "change"]) {
    const r = figure("prefecture", null, axis(pattern, ["a"]));
    assert.ok(!r.allowed.some((id) => ["heatmap", "pie", "table"].includes(id)), `${pattern}: ${r.allowed}`);
  }
  const none = resolveAxesFigure({
    issue: { id: "issue:Z01", unit: "prefecture" },
    axes: { explanatory: null, outcome: axis("compare", ["a"]) },
    templates: TEMPLATES.map((t) => ({ ...t, renderer: null })),
  });
  assert.deepEqual(none.gaps, ["描画器なし"]);
});

test("群の区分以外の軸に指標が無ければ未検証、書いた指標が無ければ指標なし", () => {
  assert.ok(figure("prefecture", null, axis("change")).gaps.includes("未検証"));
  assert.ok(figure("prefecture", null, axis("compare")).gaps.includes("未検証"));
  assert.deepEqual(figure("prefecture", null, axis("compare", ["a"])).gaps, []);
  assert.ok(figure("prefecture", null, axis("change", ["ghost"]), new Map([["real", new Set(["prefecture"])]])).gaps.includes("指標なし"));
});

test("指標が問いの粒度の値を持たなければ粒度不一致、別の粒度を明示すれば別粒度として残す", () => {
  const grains = new Map([["pref-only", new Set(["prefecture"])], ["both", new Set(["prefecture", "municipality"])]]);
  assert.deepEqual(figure("municipality", null, axis("compare", ["both"]), grains).gaps, []);
  // 市区町村の問いが、県の値しか無い指標を黙って指すと止める (図が決まると数えない)
  assert.deepEqual(figure("municipality", null, axis("compare", ["pref-only"]), grains).gaps, ["粒度不一致"]);
  // 県の値で答えると明示すれば誤りではないが、問いの粒度の図は決まっていない
  assert.deepEqual(figure("municipality", null, axis("compare", [{ metric: "pref-only", grain: "prefecture" }]), grains).gaps, ["別粒度"]);
  // 明示した粒度の値が無ければ、明示していても止める
  assert.deepEqual(figure("prefecture", null, axis("compare", [{ metric: "pref-only", grain: "japan" }]), grains).gaps, ["別粒度", "粒度不一致"]);
});

test("系列 (家計調査の分析単位) は ID の実在だけを見て、群の区分の軸にも書ける", () => {
  const series = new Set(["savings-income-quintile"]);
  const g = { ...group(), data: [{ series: "savings-income-quintile" }] };
  assert.deepEqual(figure("japan", g, axis("compare", [{ series: "savings-income-quintile" }]), new Map(), series).gaps, []);
  assert.deepEqual(figure("japan", null, axis("compare", [{ series: "ghost" }]), new Map(), series).gaps, ["指標なし"]);
});

test("指標の定義の entities を問いの粒度の語彙で読む", () => {
  assert.deepEqual([...grainsOfMetricSource(`"entities": [\n    "prefecture",\n    "city",\n  ],`)], ["prefecture", "municipality"]);
  assert.deepEqual([...grainsOfMetricSource('"entities": ["port"],')], []);
});

test("全国の集計で 2 つの値の関係を問うと、変化の軸が無ければ粒度不足", () => {
  assert.ok(figure("japan", axis("compare", ["a"]), axis("compare", ["b"])).gaps.includes("粒度不足"));
  assert.ok(!figure("japan", axis("change", ["a"]), axis("change", ["b"])).gaps.includes("粒度不足"));
});

test("小さな問いは粒度が同じ親の軸だけを継ぐ", () => {
  const axes = { explanatory: null, outcome: axis("compare") };
  const byId = new Map([["issue:Z01", { id: "issue:Z01", unit: "prefecture", axes }]]);
  assert.equal(effectiveAxes({ id: "issue:Z01-1", unit: "prefecture" }, byId), axes);
  assert.equal(effectiveAxes({ id: "issue:Z01-2", unit: "municipality" }, byId), undefined);
});

test("群の区分 (group) の説明側は比較の図にし、全国の問いでも粒度不足にしない", () => {
  const r = figure("japan", group(), axis("compare", ["a"]));
  assert.equal(r.purpose, "comparison");
  assert.equal(r.primary, "bar");
  assert.deepEqual(r.gaps, []);
});

test("群の区分ごとの推移は、群を系列にした折れ線にする", () => {
  assert.equal(figure("japan", group(), axis("change", ["a"])).primary, "line");
});

test("指標の無い量の説明側を群の区分と読み替えず、関係の図のまま未検証にする", () => {
  const r = figure("prefecture", axis("compare"), axis("compare", ["b"]));
  assert.equal(r.purpose, "relationship");
  assert.ok(r.gaps.includes("未検証"));
});

test("図の型の優先順は、図の型の台帳にある描画できる型だけを、その型が答える目的の下に並べる", () => {
  const byId = new Map(TEMPLATES.map((t) => [t.id, t]));
  for (const [purpose, ids] of Object.entries(PREFERENCE)) {
    for (const id of ids) {
      const t = byId.get(id);
      assert.ok(t, `${purpose}: ${id} が図の型の台帳に無い`);
      assert.ok((t.purposes ?? []).includes(purpose), `${purpose}: ${id} の purposes に ${purpose} が無い`);
      assert.ok(t.renderer != null && t.review?.status !== "unused", `${purpose}: ${id} は描画できない型`);
    }
  }
  // 軸の組み合わせから引ける目的は、どれも優先順を持つ (distribution は軸の語彙 比較・構成・変化 から引かない)
  const sides = [null, ...["compare", "compose", "change"].map((p) => axis(p)), group()];
  for (const explanatory of sides) for (const p of ["compare", "compose", "change"]) {
    const purpose = figurePurpose({ explanatory, outcome: axis(p) });
    assert.ok(PREFERENCE[purpose], `${purpose} に優先順が無い`);
  }
});

test("県の問いに県庁所在市の値で答える図は決まり、注記を付ける。市区町村の問いには使えない", () => {
  const grains = new Map([["kakei", new Set(["capital-city"])]]);
  const pref = figure("prefecture", null, axis("compare", ["kakei"]), grains);
  assert.deepEqual(pref.gaps, []);
  assert.deepEqual(pref.notes, ["県庁所在市の値 (県全体の値ではない)"]);
  assert.deepEqual(figure("municipality", null, axis("compare", ["kakei"]), grains).gaps, ["粒度不一致"]);
  // 全国の問いが県庁所在市の値で答えると明示すれば、誤りではないが問いの粒度の図は決まっていない
  assert.deepEqual(figure("japan", null, axis("compare", [{ metric: "kakei", grain: "capital-city" }]), grains).gaps, ["別粒度"]);
});

test("家計調査の指標は都道府県と書かれていても県庁所在市の粒度として読む", () => {
  assert.deepEqual([...grainsOfMetricSource(`"source": {
    "kind": "kakei-chousa",
  },
  "entities": [
    "prefecture",
  ],`)], ["capital-city"]);
});
