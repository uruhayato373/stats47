/**
 * stats-table-id-lint のテスト (vitest 基盤外のため node 直接実行)。
 * 実行: node .claude/scripts/lib/__tests__/stats-table-id-lint.test.mjs
 *
 * 2026-10-07 に critic の目視でしか見つからなかった取り違えを、決定的に止めることを固定する。
 * 逆に、統計名を書いていない ID や、隣の ID の名前・社会・人口統計体系の元の調査名では止めない
 * (公開済み 389 記事で誤検知 0 件を確かめた境界)。
 */
import assert from "node:assert";

import { lintStatsTableIds } from "../stats-table-id-lint.mjs";

let pass = 0;
let fail = 0;
function test(name, fn) {
  try {
    fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    fail++;
    console.error(`  ✗ ${name}\n    ${e.message}`);
  }
}

const META = {
  "0003445758": { statsDataId: "0003445758", statName: "賃金構造基本統計調査", title: "職種（特掲）DB" },
  "0003448237": { statsDataId: "0003448237", statName: "人口推計", title: "都道府県，年齢（5歳階級）" },
  "0003410379": { statsDataId: "0003410379", statName: "国勢調査", title: "男女別人口及び人口性比" },
  "0003456789": { statsDataId: "0003456789", statName: "社会生活基本調査", title: "行動の種類別総平均時間" },
  "0000010103": { statsDataId: "0000010103", statName: "社会・人口統計体系", title: "Ｃ　経済基盤" },
  "0000010212": { statsDataId: "0000010212", statName: "社会・人口統計体系", title: "Ｌ　家計" },
  "0003337392": { statsDataId: "0003337392", error: "統計表ID（statsDataId）=[0003337392]のデータは存在しません。" },
  "0000010101": { statsDataId: "0000010101", title: "Ａ　人口・世帯" }, // statName の無い古い控え
};
const deps = { readMeta: (id) => META[id] ?? null, statNames: ["人口推計", "国勢調査", "賃金構造基本統計調査"] };
const kinds = (md) => lintStatsTableIds(md, deps).hits.map((h) => `${h.kind}:${h.id}`);

test("賃金構造基本統計調査の表に「県民所得統計」と書いたら止める (実例)", () => {
  assert.deepStrictEqual(kinds('STATS_DATA_ID = "0003445758"  # 県民所得統計（例）'), ["mismatch:0003445758"]);
});

test("社会生活基本調査の表を「生産農業所得統計」の例に挙げたら止める (実例)", () => {
  assert.deepStrictEqual(
    kinds("- **生産農業所得統計 / 農業産出額 / 都道府県別**（statsDataId 例 `0003456789`）"),
    ["mismatch:0003456789"],
  );
});

test("正規表現の形に当たらない統計名 (人口推計) の取り違えも止める", () => {
  assert.deepStrictEqual(kinds("国勢調査なら `0003448237` を使います。"), ["mismatch:0003448237"]);
});

test("名前が直前の文にあるときも照らす", () => {
  assert.deepStrictEqual(
    kinds("総務省統計局「国勢調査」の都道府県別総人口です。e-Stat の ID で言うと `0003448237` です。"),
    ["mismatch:0003448237"],
  );
});

test("e-Stat に存在しない ID は止める", () => {
  assert.deepStrictEqual(kinds("将来推計人口は `0003337392` です。"), ["not-found:0003337392"]);
});

test("控えが無い・控えに統計名が無い ID は確かめるまで止める", () => {
  assert.deepStrictEqual(kinds("`0009999999` と `0000010101`"), ["unverified:0009999999", "unverified:0000010101"]);
});

test("正しい統計名なら通す (語尾の「調査」を省いた書き方も)", () => {
  assert.deepStrictEqual(kinds("賃金構造基本統計調査（0003445758）"), []);
  assert.deepStrictEqual(kinds("賃金構造基本統計の `0003445758`"), []);
  assert.deepStrictEqual(kinds("人口推計（年次）— `0003448237`。"), []);
});

test("統計名を書いていない ID は止めない", () => {
  assert.deepStrictEqual(kinds('STATS_DATA_ID = "0003445758"'), []);
});

test("一般語の「悉皆調査」は統計名として扱わない", () => {
  assert.deepStrictEqual(kinds("5 年に 1 度の悉皆調査なら `0003410379` です。"), []);
});

test("1 文に ID が 2 つあるとき、隣の ID の名前を拾わない", () => {
  assert.deepStrictEqual(
    kinds("賃金は [賃金構造基本統計調査](https://x/?sid=0003445758)、人口は [人口推計](https://x/?sid=0003448237) です。"),
    [],
  );
  assert.deepStrictEqual(
    kinds("賃金は 0003445758 の人口推計、人口は 0003448237 です。"),
    ["mismatch:0003445758"],
  );
});

test("社会・人口統計体系の表は元の調査名で呼んでも止めない", () => {
  assert.deepStrictEqual(
    kinds('<data-source label="県民所得は [e-Stat 県民経済計算](https://x/?sid=0000010103)、物価指数は [e-Stat 消費者物価地域差指数](https://x/?sid=0000010212)"></data-source>'),
    [],
  );
  assert.deepStrictEqual(kinds("[e-Stat 家計調査](https://x/?sid=0000010212)"), []);
});

test("同じ ID の同じ食い違いは blocker を 1 件にまとめる", () => {
  const r = lintStatsTableIds("県民所得統計 0003445758。\n\n県民所得統計 0003445758。", deps);
  assert.strictEqual(r.blockers.length, 1);
  assert.strictEqual(r.hits.length, 2);
});

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
