/**
 * value 照合の **検出力** テスト (mutation testing)。
 * 実行: node --test .claude/scripts/lib/__tests__/article-factual-check.detection.test.mjs
 *
 * ★既存の value.test.mjs は全ケースが「警告 0 件 = 正」を固定しており、
 *   **誤りを検出できるか**を一度も測っていなかった。その結果、検出力ゼロの状態が
 *   `blog-data-schema.md` に「value 系 0%」と記録されたまま 2 ヶ月放置された。
 *   ここでは誤値を注入して**必ず発火すること**を固定する。
 *
 * 2026-08-12 の実測 (修正前 → 修正後): 誤り 4 件中 1 件検出 → 5 件中 5 件検出・誤検出 0。
 * 根因は 4 欠陥の複合:
 *   ①県名アンカーの消費 (「1人」を先に食って本命の数値が抽出されない)
 *   ②派生スキップの誤爆 (指標名に含まれる「当たり」で per-capita 系が全滅)
 *   ③閾値 3 倍 (1.9 倍の誤りが無言で通る)
 *   ④flat 配列の item.label 未索引 (label 空 → 未知指標として全 skip)
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import { buildGroundTruth, checkInverseRankClaims, checkRankClaims, checkValueClaims } from "../article-factual-check.mjs";

/** flat 配列 (blog-data-schema §1 の統一 schema) で ground truth を作る。 */
function withGroundTruth(rows, fn, sourceMeta = null) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "fc-detect-"));
  const dataDir = path.join(dir, "data");
  fs.mkdirSync(dataDir);
  fs.writeFileSync(path.join(dataDir, "probe.json"), JSON.stringify(rows));
  if (sourceMeta) fs.writeFileSync(path.join(dataDir, "probe.source.json"), JSON.stringify(sourceMeta));
  try {
    return fn(buildGroundTruth(dataDir));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/** 千円単位で持つ per-capita 指標 (今回の事故の実データ形)。 */
const INCOME_ROWS = [
  { areaName: "東京都", rank: 1, value: 5204, label: "1人当たり県民所得", unit: "千円" },
  { areaName: "愛知県", rank: 2, value: 3418, label: "1人当たり県民所得", unit: "千円" },
  { areaName: "沖縄県", rank: 47, value: 2179, label: "1人当たり県民所得", unit: "千円" },
];

describe("誤値は必ず検出する", () => {
  const cases = [
    { name: "2 倍の誤り (円表記)", body: "東京都の1人当たり県民所得は10,408,000円です。" },
    { name: "1.9 倍の誤り — 旧実装は 3 倍未満で素通りした", body: "東京都の1人当たり県民所得は9,999,000円です。" },
    { name: "千円表記の誤り", body: "東京都の1人当たり県民所得は9,999千円です。" },
    { name: "指標名を伴わない誤り", body: "沖縄県は9,999千円でした。" },
    { name: "別の県の誤り", body: "愛知県の1人当たり県民所得は5,000千円です。" },
  ];
  for (const c of cases) {
    it(`★${c.name}`, () => {
      withGroundTruth(INCOME_ROWS, (gt) => {
        const w = checkValueClaims(c.body, gt);
        assert.ok(w.length > 0, `警告が出ていない: ${c.body}`);
      });
    });
  }
});

describe("正しい値では警告を出さない (誤検出を出すゲートは無効化される)", () => {
  const cases = [
    { name: "円表記で正しい", body: "東京都の1人当たり県民所得は5,204,000円です。" },
    { name: "千円表記で正しい", body: "東京都の1人当たり県民所得は5,204千円です。" },
    { name: "丸めた表記 (±5% 以内)", body: "東京都の1人当たり県民所得は5,200千円です。" },
    { name: "県名のみで単位付き値が正しい", body: "沖縄県は2,179千円でした。" },
    { name: "別の県も正しい", body: "愛知県の1人当たり県民所得は3,418千円です。" },
  ];
  for (const c of cases) {
    it(c.name, () => {
      withGroundTruth(INCOME_ROWS, (gt) => {
        const w = checkValueClaims(c.body, gt);
        assert.equal(w.length, 0, `誤検出: ${w.join(" | ")}`);
      });
    });
  }
});

describe("単位換算 (千円 ↔ 円)", () => {
  it("★SSOT が千円・本文が円でも正しく突き合わせる", () => {
    withGroundTruth(INCOME_ROWS, (gt) => {
      assert.equal(checkValueClaims("東京都の1人当たり県民所得は5,204,000円です。", gt).length, 0);
      assert.ok(checkValueClaims("東京都の1人当たり県民所得は5,204円です。", gt).length > 0,
        "千円を円と取り違えた値 (1000 倍小さい) を検出できていない");
    });
  });
});

describe("派生値は従来どおり対象外 (その場の計算は data の絶対値と一致しない)", () => {
  it("差額・格差の表現は skip", () => {
    withGroundTruth(INCOME_ROWS, (gt) => {
      const w = checkValueClaims("東京都と沖縄県の差額は3,025千円です。", gt);
      assert.equal(w.length, 0, `派生値を誤検出: ${w.join(" | ")}`);
    });
  });

  it("★ただし指標名の一部の「当たり」は派生扱いしない (これが検出力ゼロの主因だった)", () => {
    withGroundTruth(INCOME_ROWS, (gt) => {
      const w = checkValueClaims("東京都の1人当たり県民所得は9,999千円です。", gt);
      assert.ok(w.length > 0, "指標名に含まれる「当たり」で skip されている");
    });
  });
});

describe("ground truth の索引", () => {
  it("★flat 配列の item.label を索引する (空だと全 claim が未知指標 skip になる)", () => {
    withGroundTruth(INCOME_ROWS, (gt) => {
      const labels = Object.values(gt).flat().map((f) => f.label);
      assert.ok(labels.every((l) => l === "1人当たり県民所得"), `label が索引されていない: ${JSON.stringify(labels)}`);
    });
  });

  it("item.unit を索引する", () => {
    withGroundTruth(INCOME_ROWS, (gt) => {
      assert.ok(Object.values(gt).flat().every((f) => f.unit === "千円"));
    });
  });
});

/**
 * 分母つき指標 (人口10万対 / 1人当たり) と実数の取り違え。
 *
 * ★分母の情報は unit ではなく **label** が持つ (metric config の subtitle と同じ設計)。
 *   素の includes 照合だと「人口10万人あたり公害苦情受理件数」に本文の
 *   「公害苦情受理件数」が含まれてしまい、実数と人口当たりを同一視して比較していた。
 */
const PER100K_ROWS = [
  { areaName: "大阪府", rank: 1, value: 41.3, label: "人口10万人あたり公害苦情受理件数", unit: "件" },
  { areaName: "東京都", rank: 2, value: 38.1, label: "人口10万人あたり公害苦情受理件数", unit: "件" },
];

describe("分母つき指標", () => {
  it("★本文が実数を語るとき、人口当たりの data と比較しない (誤検出の主因だった)", () => {
    withGroundTruth(PER100K_ROWS, (gt) => {
      const w = checkValueClaims("大阪府の公害苦情受理件数は12,811件でした。", gt);
      assert.equal(w.length, 0, `実数と人口当たりを比較している: ${w.join(" | ")}`);
    });
  });

  it("本文も人口当たりで語れば従来どおり照合する (正しい値)", () => {
    withGroundTruth(PER100K_ROWS, (gt) => {
      const w = checkValueClaims("大阪府の人口10万人あたり公害苦情受理件数は41.3件です。", gt);
      assert.equal(w.length, 0, `正しい値を誤検出: ${w.join(" | ")}`);
    });
  });

  it("★本文も人口当たりで語り、値が誤っていれば検出する (検出力を落としていない)", () => {
    withGroundTruth(PER100K_ROWS, (gt) => {
      const w = checkValueClaims("大阪府の人口10万人あたり公害苦情受理件数は999件です。", gt);
      assert.ok(w.length > 0, "分母つき同士の誤りを見逃している");
    });
  });

  it("1人当たり系でも同じ扱い", () => {
    withGroundTruth(INCOME_ROWS, (gt) => {
      // data は「1人当たり県民所得」。本文が実数の県民所得総額を語っても比較しない。
      const w = checkValueClaims("東京都の県民所得は72,000,000円です。", gt);
      assert.equal(w.length, 0, `実数と1人当たりを比較している: ${w.join(" | ")}`);
    });
  });
});

// FACTUAL-CHECK-CROSS-METRIC-RANK-01: 別の指標・別の年・別の地名の数値を主指標の data と照合しない (2026-10-08 の 3 例)
const BONITO_ROWS = [
  { areaName: "静岡県", rank: 1, value: 60000, label: "カツオ漁獲量", unit: "t" },
  { areaName: "福島県", rank: 12, value: 3000, label: "カツオ漁獲量", unit: "t" },
  { areaName: "北海道", rank: 20, value: 100, label: "カツオ漁獲量", unit: "t" },
];

describe("別指標・別年・別地名の数値を主指標と照合しない", () => {
  it("★同じ文に data に無い指標名 (購入数量) があれば、その順位を漁獲量と照合しない", () => {
    withGroundTruth(BONITO_ROWS, (gt) => {
      const r = checkRankClaims("カツオの購入数量では、福島県が3位に入る。", gt);
      assert.equal(r.length, 0, `別指標の順位を照合している: ${r.join(" | ")}`);
    });
  });

  it("★主指標の順位の誤りは従来どおり検出する", () => {
    withGroundTruth(BONITO_ROWS, (gt) => {
      assert.ok(checkRankClaims("カツオ漁獲量では、福島県が3位に入る。", gt).length > 0, "指標名つきの誤りを見逃している");
      assert.ok(checkRankClaims("福島県は3位である。", gt).length > 0, "指標名なしの誤りを見逃している");
    });
  });

  it("★data と違う年の順位は照合せず、data の年の順位の誤りは検出する", () => {
    withGroundTruth(
      BONITO_ROWS,
      (gt) => {
        assert.equal(checkRankClaims("北海道のスケトウダラ 1972 年は 2 位だった。", gt).length, 0, "別の年の順位を照合している");
        assert.ok(checkRankClaims("北海道は2023年に2位だった。", gt).length > 0, "data の年の誤りを見逃している");
      },
      { kind: "ranking", rankingKey: "bonito-catch", year: "2023", label: "カツオ漁獲量", unit: "t" },
    );
  });

  it("★値は直前の地名と組にする (宮崎市の値と宇都宮市の値を取り違えない)", () => {
    const rows = [
      { areaName: "宮崎県", rank: 1, value: 3517, label: "冷凍ギョーザ支出額", unit: "円" },
      { areaName: "栃木県", rank: 2, value: 2801, label: "冷凍ギョーザ支出額", unit: "円" },
    ];
    withGroundTruth(rows, (gt) => {
      const w = checkValueClaims("1位は宮崎市の3,517円、宇都宮市の2,801円が続く。", gt);
      assert.equal(w.length, 0, `別の地名の値を組にしている: ${w.join(" | ")}`);
      assert.ok(checkValueClaims("宮崎県は9,999円だった。", gt).length > 0, "値の誤りを見逃している");
    });
  });
});

// BLOG-TUTORIAL-GATE-GAPS-01: ±5% では「4,970戸 → 4,790戸」の書き誤りが一致扱いだった
describe("本文が書いた精度で照合する", () => {
  const FARM_ROWS = [{ areaName: "北海道", rank: 1, value: 4970, label: "乳用牛飼養戸数", unit: "戸" }];

  it("★言い切った桁が違えば 5% 未満の差でも検出する", () => {
    withGroundTruth(FARM_ROWS, (gt) => {
      assert.ok(checkValueClaims("北海道の乳用牛飼養戸数は4,790戸です。", gt).length > 0, "3.6% の書き誤りを見逃している");
    });
  });

  it("丸めた書き方 (5,000戸・約4,900戸) と正しい値は止めない", () => {
    withGroundTruth(FARM_ROWS, (gt) => {
      for (const body of ["北海道の乳用牛飼養戸数は4,970戸です。", "北海道は5,000戸で1位です。", "北海道は約4,900戸で1位です。"]) {
        assert.equal(checkValueClaims(body, gt).length, 0, `誤検出: ${body}`);
      }
    });
  });

  it("許容幅は最後の 0 でない桁の半分 × 桁の接頭辞", async () => {
    const { claimTolerance } = await import("../article-factual-check.mjs");
    assert.equal(claimTolerance("4,790"), 5);
    assert.equal(claimTolerance("5,000"), 500);
    assert.equal(claimTolerance("3.8"), 0.05);
    assert.equal(claimTolerance("468万"), 5000);
    assert.equal(claimTolerance("4万5,897"), 0.5);
  });
});

// FACTUAL-CHECK-CROSS-METRIC-RANK-01 (2026-11-02): 52 市・複数年平均の都市ランキングと、差・増減・平均順位を
// 県の単年値・県順位として照合しない。県庁所在市の単年値 (県別ランキング) と 52 市の 3 年平均は別の系列。
function withFiles(files, fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "fc-series-"));
  const dataDir = path.join(dir, "data");
  fs.mkdirSync(dataDir);
  for (const [name, json] of Object.entries(files)) fs.writeFileSync(path.join(dataDir, name), JSON.stringify(json));
  try {
    return fn(buildGroundTruth(dataDir));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const PREF_2025 = {
  title: "パン消費支出額",
  label: "パン消費支出額",
  unit: "円",
  year: "2025",
  data: [
    { rank: 1, areaName: "埼玉県", pref: "埼玉県", value: 42199, areaCode: "11000" },
    { rank: 2, areaName: "京都府", pref: "京都府", value: 41846, areaCode: "26000" },
    { rank: 3, areaName: "兵庫県", pref: "兵庫県", value: 41671, areaCode: "28000" },
  ],
};
const CITY_AVG = {
  title: "パンの支出額 (2023〜2025年平均)",
  unit: "円",
  years: ["2023", "2024", "2025"],
  label: "パン",
  data: [
    { rank: 1, areaCode: "28003", areaName: "神戸市", value: 41967, isCapital: true, byYear: { 2023: 41183, 2024: 43047, 2025: 41671 }, unit: "円" },
    { rank: 2, areaCode: "27004", areaName: "堺市", value: 39416, isCapital: false, byYear: { 2023: 36633, 2024: 42954, 2025: 38660 }, unit: "円" },
    { rank: 3, areaCode: "26003", areaName: "京都市", value: 39347, isCapital: true, byYear: { 2023: 38654, 2024: 37542, 2025: 41846 }, unit: "円" },
  ],
};
const CITY_FILES = {
  "bread-prefecture-rankings.json": PREF_2025,
  "bread-prefecture-rankings.source.json": { label: "パン消費支出額", unit: "円", year: "2025" },
  "bread-city-ranking.json": CITY_AVG,
  "bread-city-ranking.source.json": { label: "パンの支出額 (2023〜2025年平均)", unit: "円", year: "2023-2025" },
};

describe("52 市・複数年平均の都市ランキングを県の単年値と取り違えない", () => {
  it("★①市の 3 年平均順位 (京都市 3 位) を県庁所在市の県順位 (京都府 2 位) と照合しない", () => {
    withFiles(CITY_FILES, (gt) => {
      assert.equal(checkRankClaims("52市の3年平均では、京都市が3位に入る。", gt).length, 0);
      assert.equal(checkRankClaims("京都市は52市の3年平均で3位です。", gt).length, 0);
      assert.equal(checkInverseRankClaims("3年平均で3位の京都市は堺市に迫る。", gt).length, 0);
    });
  });

  it("★①市の 3 年平均の値 (京都市 39,347 円) と年ごとの値を県庁所在市の 2025 年値と照合しない", () => {
    withFiles(CITY_FILES, (gt) => {
      assert.equal(checkValueClaims("京都市は52市の3年平均で39,347円です。", gt).length, 0);
      assert.equal(checkValueClaims("京都市の2023年は38,654円でした。", gt).length, 0);
    });
  });

  it("★本物の取り違えは検出する (県単位の順位・市の平均値・市の順位の誤り)", () => {
    withFiles(CITY_FILES, (gt) => {
      assert.ok(checkRankClaims("京都府は3位に入る。", gt).length > 0, "県単位の順位に平均の順位が混ざっている");
      assert.ok(checkRankClaims("京都市は52市の3年平均で9位です。", gt).length > 0, "市の順位の誤りを見逃している");
      assert.ok(checkValueClaims("京都市は9,999円でした。", gt).length > 0, "市の平均値の誤りを見逃している");
      assert.ok(checkValueClaims("京都府の2025年は9,999円でした。", gt).length > 0, "県の単年値の誤りを見逃している");
    });
  });

  it("★④平均を語る値は、平均の系列が data に無ければ単年値と照合しない", () => {
    withFiles({ "bread-prefecture-rankings.json": PREF_2025 }, (gt) => {
      assert.equal(checkValueClaims("京都府の5年平均は39,000円でした。", gt).length, 0);
    });
  });
});

describe("差・増減・振れ幅の数値を値として照合しない", () => {
  const body = [
    "京都市は、2位の堺市と69円差、4位の大阪市と149円差です。",
    "4位の京都府とは2,415円離れています。",
    "京都府は前年から4,304円増えており、京都府の2025年までの振れ幅は1,864円です。",
    "京都府と埼玉県の差は353円です。",
    "京都府は3つの年の差が560円の範囲に収まります。",
  ].join("\n");

  it("★②差・離れ・増える・振れ幅の直前直後にある数値は値の照合から外す", () => {
    withFiles(CITY_FILES, (gt) => {
      const w = checkValueClaims(body, gt);
      assert.equal(w.length, 0, `差を値として照合している: ${w.join(" | ")}`);
    });
  });

  it("差の語が無い誤った値は従来どおり検出する", () => {
    withFiles(CITY_FILES, (gt) => {
      assert.ok(checkValueClaims("京都府は1,864円でした。", gt).length > 0);
    });
  });
});

describe("平均順位を県の順位として照合しない", () => {
  it("★③「平均4.8位」の小数と平均順位は順位の照合から外す", () => {
    withFiles(CITY_FILES, (gt) => {
      assert.equal(checkRankClaims("京都府の8年間の平均順位は平均4.8位だった。", gt).length, 0);
      assert.equal(checkRankClaims("京都府は8年の順位が平均5位だった。", gt).length, 0);
      assert.equal(checkInverseRankClaims("平均4.8位の京都府は安定している。", gt).length, 0);
    });
  });
});

// BLOG-TUTORIAL-GATE-GAPS-01 (2026-11-14): 手順解説記事 (cc-estat 連載・教員年収) で writer と critic が報告した
// 誤検知 (範囲の順位) と検出漏れ (割合の値・指標を名指しした順位) の固定。
describe("範囲を語る順位を、1 つの県の順位と取り違えない (④)", () => {
  const RANGE_FILES = {
    "salary.json": {
      label: "平均年収",
      unit: "万円",
      year: "2023",
      data: [
        { rank: 1, areaName: "愛知県", pref: "愛知県", value: 885.9 },
        { rank: 3, areaName: "秋田県", pref: "秋田県", value: 796.1 },
        { rank: 46, areaName: "青森県", pref: "青森県", value: 330.1 },
        { rank: 47, areaName: "愛媛県", pref: "愛媛県", value: 315.7 },
      ],
    },
    "salary.source.json": { label: "平均年収", unit: "万円", year: "2023" },
  };

  it("★「秋田県の3位から青森県の46位まで」は INVERSE_RANK_MISMATCH にしない", () => {
    withFiles(RANGE_FILES, (gt) => {
      assert.deepEqual(checkInverseRankClaims("秋田県の3位から青森県の46位まで、順に並べました。", gt), []);
      assert.deepEqual(checkRankClaims("秋田県の3位から青森県の46位まで、順に並べました。", gt), []);
    });
  });

  it("★「N位から<県名>」の形でも、順位を県に結ばない", () => {
    withFiles(RANGE_FILES, (gt) => {
      assert.deepEqual(checkInverseRankClaims("下位の47位から愛知県の1位まで、年収は順に上がります。", gt), []);
    });
  });

  it("★本物の取り違え (3位は秋田県なのに青森県と書く) は従来どおり検出する", () => {
    withFiles(RANGE_FILES, (gt) => {
      assert.equal(checkInverseRankClaims("3位の青森県は低めでした。", gt).length, 1);
    });
  });
});

describe("割合 (％) の値と、指標を名指しした順位の取り違えを検出する (⑦)", () => {
  // 教員年収の記事 (school-teacher-annual-income) の形: 年収の順位と、同じ県の「統計に映る割合」の順位が別の指標として並ぶ
  const SHARE_FILES = {
    "income.json": {
      label: "小中学校教員の平均年収",
      unit: "万円",
      year: "2023",
      data: [
        { rank: 1, areaName: "愛知県", pref: "愛知県", value: 885.9 },
        { rank: 3, areaName: "北海道", pref: "北海道", value: 796.1 },
        { rank: 44, areaName: "愛媛県", pref: "愛媛県", value: 315.7 },
      ],
    },
    "income.source.json": { label: "小中学校教員の平均年収", unit: "万円", year: "2023" },
    "coverage.json": {
      label: "統計に映る小中学校教員の割合",
      unit: "％",
      year: "2023",
      data: [
        { rank: 5, areaName: "愛知県", pref: "愛知県", value: 1.8 },
        { rank: 42, areaName: "北海道", pref: "北海道", value: 0.77 },
        { rank: 41, areaName: "愛媛県", pref: "愛媛県", value: 0.81 },
      ],
    },
    "coverage.source.json": { label: "統計に映る小中学校教員の割合", unit: "％", year: "2023" },
  };

  it("★全角の「％」で持つ data と半角の「%」で書いた本文を同じ単位として照合する", () => {
    withFiles(SHARE_FILES, (gt) => {
      assert.equal(checkValueClaims("愛媛県は3.8%で、推計60人です。", gt).length, 1);
      assert.equal(checkValueClaims("愛媛県は3.8％で、推計60人です。", gt).length, 1);
    });
  });

  it("正しい割合 (丸め方も含む) は止めない", () => {
    withFiles(SHARE_FILES, (gt) => {
      assert.deepEqual(checkValueClaims("愛媛県は0.8%で、愛知県は1.8%です。", gt), []);
      assert.deepEqual(checkValueClaims("北海道は0.77％でした。", gt), []);
    });
  });

  it("★「年収42位の北海道」は、割合の順位 (42位) に一致していても年収の順位と照合して止める", () => {
    withFiles(SHARE_FILES, (gt) => {
      assert.equal(checkInverseRankClaims("年収42位の北海道は0.8%でした。", gt).length, 1);
      // 順位が前に出る書き方は、県名 → 指標名 → 順位の順でも同じ。指標名が「割合」のように
      // 既知の指標名として照合できる語なら、年収の順位 (3 位) を割合の順位と取り違えない
      assert.equal(checkRankClaims("北海道の割合は3位でした。", gt).length, 1);
    });
  });

  it("指標を名指しした順位が、その指標の順位と合っていれば止めない", () => {
    withFiles(SHARE_FILES, (gt) => {
      assert.deepEqual(checkInverseRankClaims("年収3位の北海道は0.8%でした。", gt), []);
      assert.deepEqual(checkInverseRankClaims("割合42位の北海道は年収が高めです。", gt), []);
      assert.deepEqual(checkRankClaims("北海道の割合は42位でした。", gt), []);
    });
  });

  it("指標の語が無い順位は、どの指標の順位とも照合する (従来どおり)", () => {
    withFiles(SHARE_FILES, (gt) => {
      assert.deepEqual(checkInverseRankClaims("3位の北海道は高めです。", gt), []);
      assert.deepEqual(checkInverseRankClaims("42位の北海道は低めです。", gt), []);
    });
  });
});

// ============================================================================
// 県名の直後の派生値と県の組の合計 (BLOG-TUTORIAL-GATE-GAPS-01 ⑤ / MANUFACTURING-ZONE-CHART-LINEAGE-01 ③)
// ============================================================================

describe("県名の直後でも、その県単独の値ではない数値 (差・目減り額・県の組の合計) は照合しない", () => {
  // real-disposable-income-reversal の実データの形 (勤労者世帯の可処分所得と、物価で割り戻した値)
  const INCOME_FILES = {
    "disposable.json": {
      label: "可処分所得",
      unit: "円",
      year: "2024",
      data: [
        { rank: 1, areaName: "東京都", pref: "東京都", value: 637958 },
        { rank: 3, areaName: "埼玉県", pref: "埼玉県", value: 620576 },
      ],
    },
    "disposable.source.json": { label: "可処分所得", unit: "円", year: "2024" },
    "real.json": {
      label: "物価で割り戻した可処分所得",
      unit: "円",
      year: "2024",
      data: [
        { rank: 1, areaName: "埼玉県", pref: "埼玉県", value: 618720 },
        { rank: 2, areaName: "東京都", pref: "東京都", value: 613421 },
      ],
    },
    "real.source.json": { label: "物価で割り戻した可処分所得", unit: "円", year: "2024" },
  };
  const OPERANDS = "東京都は637,958円が613,421円になり、埼玉県は620,576円が618,720円になります。";

  const derived = [
    ["「しか」を挟んで増減を語る", "埼玉県は1,856円しか目減りしません。"],
    ["「の目減り」", "埼玉県は1,856円の目減りで済みます。"],
    ["「多く残る」", "東京都より埼玉県が22,681円多く残ります。"],
    ["「多くなる」", "埼玉県は東京都より22,681円多くなります。"],
    ["述語を共有する並列の前の項", "東京都は24,537円、埼玉県は1,856円目減りします。"],
    ["「開き」", "埼玉県では目減りが小さく、東京都との開きは22,681円です。"],
    ["同じ段落の 2 つの数値の差 (語が無くても)", `${OPERANDS}東京都24,537円に対して埼玉県1,856円です。`],
  ];
  for (const [name, body] of derived) {
    it(`★${name}: ${body.slice(-28)}`, () => {
      withFiles(INCOME_FILES, (gt) => assert.deepEqual(checkValueClaims(body, gt), []));
    });
  }

  it("県の値として書いた誤りは従来どおり検出する (mutation)", () => {
    withFiles(INCOME_FILES, (gt) => {
      assert.equal(checkValueClaims("埼玉県は1,856円です。", gt).length, 1);
      // 差に 1 円でも合わなければ派生値と見なさない
      assert.equal(checkValueClaims(`${OPERANDS}埼玉県は1,857円です。`, gt).length, 1);
      assert.equal(checkValueClaims("埼玉県の可処分所得は1,240,000円です。", gt).length, 1);
    });
  });

  it("正しい県の値は止めない", () => {
    withFiles(INCOME_FILES, (gt) => assert.deepEqual(checkValueClaims(OPERANDS, gt), []));
  });

  // manufacturing-aichi-dominance の実データの形 (製造品出荷額等・百万円)
  const SHIPMENT_FILES = {
    "shipment.json": {
      label: "製造品出荷額等",
      unit: "百万円",
      year: "2023",
      data: [
        { rank: 1, areaName: "愛知県", pref: "愛知県", value: 58021789 },
        { rank: 4, areaName: "兵庫県", pref: "兵庫県", value: 18461711 },
        { rank: 6, areaName: "埼玉県", pref: "埼玉県", value: 15329652 },
        { rank: 9, areaName: "三重県", pref: "三重県", value: 12311360 },
      ],
    },
    "shipment.source.json": { label: "製造品出荷額等", unit: "百万円", year: "2023" },
  };
  const groups = [
    "中京工業地帯（岐阜・愛知・三重）が77.1兆円でダントツ1位です。",
    "京浜を東京・神奈川・埼玉の3都県とする区分では42.4兆円になります。",
    "中京を愛知・三重の2県、阪神を大阪・兵庫の2府県に絞ると、中京は70.3兆円です。",
  ];
  for (const body of groups) {
    it(`★県の組の合計: ${body.slice(0, 26)}`, () => {
      withFiles(SHIPMENT_FILES, (gt) => assert.deepEqual(checkValueClaims(body, gt), []));
    });
  }

  it("1 県の値として書いた誤りは従来どおり検出する (mutation)", () => {
    withFiles(SHIPMENT_FILES, (gt) => {
      assert.equal(checkValueClaims("三重県は77.1兆円です。", gt).length, 1);
      assert.equal(checkValueClaims("埼玉県は42.4兆円です。", gt).length, 1);
      assert.deepEqual(checkValueClaims("愛知県は58.0兆円、三重県は12.3兆円です。", gt), []);
    });
  });
});
