import assert from "node:assert/strict";
import test from "node:test";

import {
  type DuelCandidate,
  type CompareDuelItem,
  buildCompareCaption,
  buildCompareScopeNote,
  buildCoverQuestion,
  classifyWinner,
  computeDuelMargin,
  selectDuelCandidates,
  tallyWins,
  toDuelItem,
  validateDuelItems,
  MAX_DUEL_ITEMS,
  MIN_DUEL_ITEMS,
} from "../lib/ig-compare-props.ts";

function candidate(overrides: Partial<DuelCandidate>): DuelCandidate {
  return {
    rankingKey: "sample-key",
    rawLabel: "サンプル指標",
    unit: "円",
    year: 2024,
    source: "社会・人口統計体系",
    category: "economy",
    isKakei: false,
    a: { value: 100, rank: 1 },
    b: { value: 50, rank: 30 },
    ...overrides,
  };
}

test("computeDuelMargin は大きい方÷小さい方を返す (両方正の値)", () => {
  assert.equal(computeDuelMargin(100, 50), 2);
  assert.equal(computeDuelMargin(50, 100), 2);
});

test("computeDuelMargin は0以下を含む場合 1 を返す (除外はしない)", () => {
  assert.equal(computeDuelMargin(0, 50), 1);
  assert.equal(computeDuelMargin(-10, 50), 1);
});

test("classifyWinner は数値の大小だけで勝者を決める", () => {
  assert.equal(classifyWinner(100, 50), "a");
  assert.equal(classifyWinner(50, 100), "b");
  assert.equal(classifyWinner(50, 50), "tie");
});

test("selectDuelCandidates は margin 降順で並べ、重複ラベル/同一家族/出典・カテゴリ上限を除く", () => {
  const candidates: DuelCandidate[] = [
    candidate({ rankingKey: "a-consumption-expenditure", rawLabel: "指標A", a: { value: 300, rank: 1 }, b: { value: 100, rank: 20 } }), // margin 3
    candidate({ rankingKey: "b-key", rawLabel: "指標B", source: "別の出典", category: "population", a: { value: 200, rank: 1 }, b: { value: 100, rank: 10 } }), // margin 2
    candidate({ rankingKey: "a-annual-income", rawLabel: "指標A収入版", a: { value: 150, rank: 1 }, b: { value: 100, rank: 10 } }), // 同一 family (a-) → 除外されるはず
    candidate({ rankingKey: "c-key", rawLabel: "指標C", source: "社会・人口統計体系", category: "economy", a: { value: 120, rank: 1 }, b: { value: 100, rank: 10 } }), // 同一 source/category (economy) 上限超過で除外
  ];
  const picked = selectDuelCandidates(candidates, 2);
  assert.deepEqual(
    picked.map((c) => c.rankingKey),
    ["a-consumption-expenditure", "b-key"],
  );
});

test("buildCoverQuestion は両地域名を含む中立な問いかけを作る", () => {
  const q = buildCoverQuestion("東京都", "大阪府");
  assert.match(q, /東京都/);
  assert.match(q, /大阪府/);
});

test("buildCompareScopeNote は東京都を都区部として表記し、両地域の市名を併記する", () => {
  const note = buildCompareScopeNote("13", "東京 (新宿区)", "27", "大阪市");
  assert.equal(note, "県庁所在市（都区部・大阪市）の値");
});

test("toDuelItem は subtitle 修飾語付きラベル・winner・scopeNote (kakei のみ) を確定する", () => {
  const c = candidate({ subtitle: "二人以上世帯", isKakei: true, a: { value: 100, rank: 1 }, b: { value: 50, rank: 20 } });
  const item = toDuelItem(c, 0, "県庁所在市（都区部・大阪市）の値");
  assert.equal(item.winner, "a");
  assert.equal(item.scopeNote, "県庁所在市（都区部・大阪市）の値");
  assert.match(item.label, /サンプル指標/);
});

test("toDuelItem は isKakei=false のとき scopeNote を持たない", () => {
  const c = candidate({ isKakei: false });
  const item = toDuelItem(c, 0, "県庁所在市（都区部・大阪市）の値");
  assert.equal(item.scopeNote, undefined);
});

function duelItem(overrides: Partial<CompareDuelItem>): CompareDuelItem {
  return {
    rankingKey: "k",
    label: "指標",
    unit: "円",
    year: 2024,
    source: "出典",
    precision: 0,
    a: { value: 100, rank: 1 },
    b: { value: 50, rank: 20 },
    winner: "a",
    ...overrides,
  };
}

test("tallyWins は勝敗数を集計する", () => {
  const items = [
    duelItem({ winner: "a" }),
    duelItem({ winner: "a" }),
    duelItem({ winner: "b" }),
    duelItem({ winner: "tie" }),
  ];
  assert.deepEqual(tallyWins(items), { aWins: 2, bWins: 1, ties: 1 });
});

test("validateDuelItems は件数が5〜7件の範囲外なら fail-closed のエラーを返す", () => {
  const four = [1, 2, 3, 4].map((n) => duelItem({ rankingKey: `k${n}` }));
  const errors = validateDuelItems(four);
  assert.ok(errors.some((e) => e.includes("対決件数")));

  const five = [1, 2, 3, 4, 5].map((n) => duelItem({ rankingKey: `k${n}` }));
  assert.deepEqual(validateDuelItems(five), []);

  const eight = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => duelItem({ rankingKey: `k${n}` }));
  assert.ok(validateDuelItems(eight).length > 0);

  assert.equal(MIN_DUEL_ITEMS, 5);
  assert.equal(MAX_DUEL_ITEMS, 7);
});

test("validateDuelItems は source/year 欠落・非数値を検出する", () => {
  const items = [
    duelItem({ rankingKey: "k1", source: "" }),
    duelItem({ rankingKey: "k2", year: 0 }),
    duelItem({ rankingKey: "k3", a: { value: Number.NaN, rank: 1 } }),
    duelItem({ rankingKey: "k4" }),
    duelItem({ rankingKey: "k5" }),
  ];
  const errors = validateDuelItems(items);
  assert.ok(errors.some((e) => e.includes("k1")));
  assert.ok(errors.some((e) => e.includes("k2")));
  assert.ok(errors.some((e) => e.includes("k3")));
});

test("buildCompareCaption は8〜13個のハッシュタグ・保存/プロフィール導線・URLを含み2200字以内", () => {
  const items = [1, 2, 3, 4, 5].map((n) => duelItem({ rankingKey: `k${n}`, label: `指標${n}` }));
  const caption = buildCompareCaption({
    areaAName: "東京都",
    areaBName: "大阪府",
    items,
    summary: tallyWins(items),
  });
  assert.ok(caption.length <= 2200, `caption length=${caption.length}`);
  const hashtagCount = (caption.match(/#[^\s#]+/g) ?? []).length;
  assert.ok(hashtagCount >= 8 && hashtagCount <= 13, `hashtagCount=${hashtagCount}`);
  assert.match(caption, /保存/);
  assert.match(caption, /プロフィール/);
});
