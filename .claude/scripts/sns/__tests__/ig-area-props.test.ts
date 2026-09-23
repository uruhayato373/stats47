import assert from "node:assert/strict";
import test from "node:test";

import {
  type Candidate,
  type DatabookTemplateLike,
  buildCoverHook,
  buildCoverTeaser,
  buildQualifiedLabel,
  buildScopeNote,
  buildSubtitleQualifier,
  classifyRank,
  computeMargin,
  createGroupCaps,
  createSelectionState,
  extractCuratedRankingKeys,
  extractYear,
  familyKeyOf,
  normalizePrefCode,
  selectCandidates,
  toAreaCarouselItem,
  validateGroup,
} from "../lib/ig-area-props.ts";

function candidate(overrides: Partial<Candidate>): Candidate {
  return {
    rankingKey: "sample-key",
    label: "サンプル指標",
    value: 100,
    unit: "円",
    rank: 1,
    year: 2024,
    source: "社会・人口統計体系",
    category: "economy",
    isKakei: false,
    margin: 1,
    ...overrides,
  };
}

test("extractCuratedRankingKeys は ranked-kpi-grid と gender-paired-kpi の rankingKey だけを集め、重複を排除する", () => {
  const template: DatabookTemplateLike = {
    sections: [
      {
        blocks: [
          { blockType: "ranked-kpi-grid", metrics: [{ rankingKey: "a" }, { rankingKey: "b" }] },
          { blockType: "gender-paired-kpi", pairs: [{ maleKey: "c-male", femaleKey: "c-female" }] },
          { blockType: "chart" }, // chart ブロックは対象外 (複数指標の可視化であり単一順位カードに使えない)
          { blockType: "symbol-card" },
        ],
      },
      {
        blocks: [{ blockType: "ranked-kpi-grid", metrics: [{ rankingKey: "a" }, { rankingKey: "d" }] }], // "a" は重複
      },
    ],
  };
  const keys = extractCuratedRankingKeys(template);
  assert.deepEqual(keys.sort(), ["a", "b", "c-female", "c-male", "d"]);
});

test("extractCuratedRankingKeys は未成年の身長・体重・死亡率・自殺率・生活保護を SNS 候補から外す", () => {
  const keys = extractCuratedRankingKeys({
    sections: [{ blocks: [{ blockType: "ranked-kpi-grid", metrics: [
      { rankingKey: "average-weight-high-school-second-grade-female" },
      { rankingKey: "avg-height-high-school-2nd-male" },
      { rankingKey: "crude-death-rate" },
      { rankingKey: "suicide-rate-per-100k" },
      { rankingKey: "households-on-public-assistance-per-1000" },
      { rankingKey: "owner-occupied-housing-ratio" },
    ] }] }],
  });
  assert.deepEqual(keys, ["owner-occupied-housing-ratio"]);
});

test("classifyRank はトップ10以内/下位10以内だけを分類し、中位は null", () => {
  assert.equal(classifyRank(1), "top");
  assert.equal(classifyRank(10), "top");
  assert.equal(classifyRank(11), null);
  assert.equal(classifyRank(37), null);
  assert.equal(classifyRank(38), "bottom");
  assert.equal(classifyRank(47), "bottom");
});

test("表示ラベルが重複する候補は落とす", () => {
  const state = createSelectionState();
  const caps = createGroupCaps();
  const tier = [
    candidate({ rankingKey: "wage-2019", label: "女性パートタイムの給与", source: "賃金構造基本統計調査", rank: 3 }),
    candidate({ rankingKey: "wage-2023", label: "女性パートタイムの給与", source: "賃金構造基本統計調査", rank: 5 }),
    candidate({ rankingKey: "other-metric", label: "別の指標", source: "社会・人口統計体系", category: "landweather", rank: 2 }),
  ];
  const picked = selectCandidates(tier, 5, "top", state, caps);
  assert.equal(picked.length, 2);
  assert.deepEqual(picked.map((c) => c.rankingKey).sort(), ["other-metric", "wage-2019"]);
});

test("同一家族 (nurse-annual-income / nurse-salary) は両グループ通じて1件しか選ばない", () => {
  assert.equal(familyKeyOf("nurse-annual-income"), familyKeyOf("nurse-salary"));
  const state = createSelectionState();
  const topCaps = createGroupCaps();
  const bottomCaps = createGroupCaps();
  const topPool = [candidate({ rankingKey: "nurse-annual-income", label: "看護師の平均年収", source: "賃金構造基本統計調査", category: "laborwage", rank: 2 })];
  const bottomPool = [candidate({ rankingKey: "nurse-salary", label: "看護師の所定内給与", source: "賃金構造基本統計調査", category: "laborwage", rank: 45 })];
  const topPicked = selectCandidates(topPool, 5, "top", state, topCaps);
  const bottomPicked = selectCandidates(bottomPool, 5, "bottom", state, bottomCaps);
  assert.equal(topPicked.length, 1);
  assert.equal(bottomPicked.length, 0, "同一家族はグループを跨いで1件まで");
});

test("同一 source は1グループ内で最大2件まで", () => {
  const state = createSelectionState();
  const caps = createGroupCaps();
  const pool = [
    candidate({ rankingKey: "a", label: "A", source: "家計調査", category: "economy", rank: 1 }),
    candidate({ rankingKey: "b", label: "B", source: "家計調査", category: "landweather", rank: 2 }),
    candidate({ rankingKey: "c", label: "C", source: "家計調査", category: "population", rank: 3 }),
    candidate({ rankingKey: "d", label: "D", source: "社会・人口統計体系", category: "socialsecurity", rank: 4 }),
  ];
  const picked = selectCandidates(pool, 4, "top", state, caps);
  const kakeiCount = picked.filter((c) => c.source === "家計調査").length;
  assert.equal(kakeiCount, 2);
  assert.equal(picked.length, 3);
  assert.ok(picked.some((c) => c.rankingKey === "d"));
});

test("同一カテゴリは1グループ内で最大1件まで", () => {
  const state = createSelectionState();
  const caps = createGroupCaps();
  const pool = [
    candidate({ rankingKey: "a", label: "A", source: "統計A", category: "economy", rank: 1 }),
    candidate({ rankingKey: "b", label: "B", source: "統計B", category: "economy", rank: 2 }),
    candidate({ rankingKey: "c", label: "C", source: "統計C", category: "landweather", rank: 3 }),
  ];
  const picked = selectCandidates(pool, 3, "top", state, caps);
  const economyCount = picked.filter((c) => c.category === "economy").length;
  assert.equal(economyCount, 1);
  assert.equal(picked.length, 2);
});

test("トップグループは順位が良い (数字が小さい) 順、下位グループは順位が悪い (数字が大きい) 順に並ぶ", () => {
  const state1 = createSelectionState();
  const topPool = [
    candidate({ rankingKey: "rank5", label: "5位", rank: 5, source: "s1", category: "c1" }),
    candidate({ rankingKey: "rank1", label: "1位", rank: 1, source: "s2", category: "c2" }),
    candidate({ rankingKey: "rank3", label: "3位", rank: 3, source: "s3", category: "c3" }),
  ];
  const topPicked = selectCandidates(topPool, 3, "top", state1, createGroupCaps());
  assert.deepEqual(topPicked.map((c) => c.rank), [1, 3, 5]);

  const state2 = createSelectionState();
  const bottomPool = [
    candidate({ rankingKey: "rank40", label: "40位", rank: 40, source: "s1", category: "c1" }),
    candidate({ rankingKey: "rank47", label: "47位", rank: 47, source: "s2", category: "c2" }),
    candidate({ rankingKey: "rank38", label: "38位", rank: 38, source: "s3", category: "c3" }),
  ];
  const bottomPicked = selectCandidates(bottomPool, 3, "bottom", state2, createGroupCaps());
  assert.deepEqual(bottomPicked.map((c) => c.rank), [47, 40, 38]);
});

test("同順位は margin (隣接順位との値差) が大きい方を優先する", () => {
  const state = createSelectionState();
  const caps = createGroupCaps();
  const pool = [
    candidate({ rankingKey: "close-call", label: "僅差", rank: 1, margin: 1.02, source: "s1", category: "c1" }),
    candidate({ rankingKey: "decisive", label: "圧勝", rank: 1, margin: 3.5, source: "s2", category: "c2" }),
  ];
  const picked = selectCandidates(pool, 1, "top", state, caps);
  assert.equal(picked.length, 1);
  assert.equal(picked[0].rankingKey, "decisive");
});

test("computeMargin は両方正の値なら比率、0/負を含むなら標準偏差正規化した差を返す", () => {
  const values = [
    { rank: 1, value: 42 },
    { rank: 2, value: 33 },
    { rank: 3, value: 20 },
  ];
  assert.ok(Math.abs(computeMargin(values, 1, "asc") - 42 / 33) < 1e-9);
  assert.ok(Math.abs(computeMargin(values, 3, "desc") - 33 / 20) < 1e-9);
  const withZero = [
    { rank: 46, value: 0 },
    { rank: 47, value: 100 },
    { rank: 45, value: 200 },
  ];
  const margin = computeMargin(withZero, 47, "desc");
  assert.ok(Number.isFinite(margin) && margin > 0);
  assert.equal(computeMargin(values, 1, "desc"), 0);
  assert.equal(computeMargin(values, 99, "asc"), 0);
});

test("buildSubtitleQualifier は家計調査の県庁所在市前置きを剥がし、括弧を「・」へ平坦化し、長すぎれば丸める", () => {
  assert.equal(buildSubtitleQualifier(undefined, false), undefined);
  assert.equal(buildSubtitleQualifier("総数（人口10万人当たり）", false), "総数・人口10万人当たり");
  assert.equal(
    buildSubtitleQualifier("都道府県庁所在市の二人以上世帯の消費支出に占める食料費の割合", true),
    "二人以上世帯の消費支出に占める食料費の割合",
  );
  const long = buildSubtitleQualifier("あ".repeat(30), false);
  assert.ok(long && [...long].length <= 25);
  assert.ok(long?.endsWith("…"));
});

test("buildQualifiedLabel は qualifier があれば括弧で付与し、無ければ label のまま", () => {
  assert.equal(buildQualifiedLabel("外国人人口", "総数・人口10万人当たり"), "外国人人口（総数・人口10万人当たり）");
  assert.equal(buildQualifiedLabel("外国人人口", undefined), "外国人人口");
});

test("buildScopeNote は東京都区部を特別扱いし、他県は補足括弧を除いた市名を使う", () => {
  assert.equal(buildScopeNote("13", "東京 (新宿区)"), "東京都区部の値");
  assert.equal(buildScopeNote("46", "鹿児島市"), "県庁所在市（鹿児島市）の値");
});

test("subtitle は raw のまま候補に残り、toAreaCarouselItem がそのまま出力する", () => {
  const c = candidate({
    rankingKey: "foreign-resident-count-per-100k",
    label: "外国人人口（総数・人口10万人当たり）",
    subtitle: "総数（人口10万人当たり）",
    isKakei: false,
  });
  const item = toAreaCarouselItem(c, "県庁所在市（鹿児島市）の値");
  assert.equal(item.label, "外国人人口（総数・人口10万人当たり）");
  assert.equal(item.subtitle, "総数（人口10万人当たり）");
  assert.equal(item.scopeNote, undefined);

  const kakei = candidate({ rankingKey: "engel-coefficient", isKakei: true });
  const kakeiItem = toAreaCarouselItem(kakei, "県庁所在市（鹿児島市）の値");
  assert.equal(kakeiItem.scopeNote, "県庁所在市（鹿児島市）の値");
});

test("buildCoverHook / buildCoverTeaser は新しい文言と最良順位のテーサーを作る", () => {
  assert.equal(buildCoverHook("鹿児島県"), "鹿児島県、全国で何位？");
  const items = [
    toAreaCarouselItem(candidate({ rankingKey: "rank5", label: "5位項目", rank: 5 }), ""),
    toAreaCarouselItem(candidate({ rankingKey: "rank1", label: "1位項目", rank: 1 }), ""),
  ];
  const teaser = buildCoverTeaser(items);
  assert.equal(teaser?.rankingKey, "rank1");
  assert.equal(teaser?.rank, 1);
  assert.equal(buildCoverTeaser([]), undefined);
});

test("グループの件数が3件未満なら fail-closed のエラーを返す", () => {
  const items = [candidate({}), candidate({ rankingKey: "b" })].map((c) => toAreaCarouselItem(c, "県庁所在市（鹿児島市）の値"));
  const errors = validateGroup("全国トップクラス", items);
  assert.ok(errors.some((e) => e.includes("件数不足")));
  const enough = [
    candidate({ rankingKey: "a" }),
    candidate({ rankingKey: "b" }),
    candidate({ rankingKey: "c" }),
  ].map((c) => toAreaCarouselItem(c, "県庁所在市（鹿児島市）の値"));
  assert.deepEqual(validateGroup("全国トップクラス", enough), []);
});

test("source や year が欠けた項目は fail-closed のエラーを返す", () => {
  const missingSource = toAreaCarouselItem(candidate({ source: "" }), "県庁所在市（鹿児島市）の値");
  const missingYear = toAreaCarouselItem(candidate({ year: Number.NaN }), "県庁所在市（鹿児島市）の値");
  const ok = [missingSource, missingYear, toAreaCarouselItem(candidate({ rankingKey: "c" }), "県庁所在市（鹿児島市）の値")];
  const errors = validateGroup("全国トップクラス", ok);
  assert.ok(errors.some((e) => e.includes("source")));
  assert.ok(errors.some((e) => e.includes("year")));
});

test("extractYear は先頭4桁の年を読み、読めなければ例外", () => {
  assert.equal(extractYear("2020年度"), 2020);
  assert.equal(extractYear("2024年"), 2024);
  assert.throws(() => extractYear("不明"));
});

test("normalizePrefCode は2桁/5桁のどちらも受け付け、範囲外は例外", () => {
  assert.deepEqual(normalizePrefCode("46"), { pref2: "46", pref5: "46000" });
  assert.deepEqual(normalizePrefCode("46000"), { pref2: "46", pref5: "46000" });
  assert.throws(() => normalizePrefCode("99"));
  assert.throws(() => normalizePrefCode("abc"));
});
