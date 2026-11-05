/**
 * 問いの台帳の検査が守る意図:
 *   - 同じ事実を二か所に持たない (小さな問いの親・テーマ・答えの記事が使う指標は導出し、写しを書かせない)
 *   - 役割とページ種別を取り違えない (答え = 読み物、根拠 = データ)
 *   - 棚卸しの 4 分類が経路と読まれ方の両方で決まる
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  classifyCoverage,
  computeReach,
  indexPages,
  parentIdOf,
  parseCsv,
  pathOfUrl,
  sumTraffic,
  validateIssueGraph,
} from "../issue-graph-core.mjs";

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
