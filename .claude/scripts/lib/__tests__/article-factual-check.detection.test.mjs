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

import { buildGroundTruth, checkRankClaims, checkValueClaims } from "../article-factual-check.mjs";

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
