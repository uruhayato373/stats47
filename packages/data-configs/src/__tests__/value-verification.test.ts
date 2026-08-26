import { describe, expect, it } from "vitest";

import { PREFECTURE_COUNT, summarizeShape, type ShapeRow } from "../shape-gate";
import {
  THIN_SUSPICION_THRESHOLD,
  ZERO_SUSPICION_THRESHOLD,
  classifyValueSuspicion,
} from "../value-verification";
import type { VerifiedValueProfile } from "../verified-value-profiles";

/**
 * 「広く疑い、検証済みだけ通す」方式の判定テスト。
 *
 * ゲートの検証で最も大事なのは全 PASS が
 *   (a) 正しく通した (b) 何も見ていない
 * のどちらか区別できることなので、**4 状態 (clean / verified / unverified / profile-violated) を
 * すべて実際に発火させる**。profile を書けば緑になる、だけを確かめても意味がない。
 */

/** 47 県・値が全部違う健全な 1 年 */
function healthyRows(yearCode = "2023"): ShapeRow[] {
  return Array.from({ length: PREFECTURE_COUNT }, (_, i) => ({
    areaCode: `${String(i + 1).padStart(2, "0")}000`,
    yearCode,
    value: 100 + i,
  }));
}

/** 指定件数だけ 0、残りは相異なる正の値 */
function withZeros(zeros: number, yearCode = "2023"): ShapeRow[] {
  return healthyRows(yearCode).map((r, i) => (i < zeros ? { ...r, value: 0 } : r));
}

/** 先頭 n 県だけ負値 */
function withNegatives(n: number, yearCode = "2023"): ShapeRow[] {
  return healthyRows(yearCode).map((r, i) => (i < n ? { ...r, value: -1 - i } : r));
}

/** 県数を減らす */
function withRows(count: number, yearCode = "2023"): ShapeRow[] {
  return healthyRows(yearCode).slice(0, count);
}

const profile = (over: Partial<VerifiedValueProfile>): VerifiedValueProfile => ({
  key: "some-metric",
  evidence: "検証済みの根拠をここに書く (テスト用のダミー)",
  sourceUrl: "https://www.e-stat.go.jp/",
  verifiedAt: "2026-08-05",
  ...over,
});

const run = (rows: ShapeRow[], profiles: VerifiedValueProfile[] = []) =>
  classifyValueSuspicion("some-metric", summarizeShape(rows), profiles);

describe("classifyValueSuspicion — 疑いの検出", () => {
  it("健全なデータは clean (陰性対照)", () => {
    const r = run(healthyRows());
    expect(r.status).toBe("clean");
    expect(r.suspicions).toEqual([]);
  });

  it("ゼロ率が閾値以上なら zero-suspicion", () => {
    // 0.3 = 47 × 0.3 = 14.1 → 15 件で 0.319
    expect(run(withZeros(15)).suspicions).toContain("zero-suspicion");
    expect(run(withZeros(14)).suspicions).not.toContain("zero-suspicion"); // 0.298
  });

  it("県数が閾値未満なら thin-suspicion (境界は 40 ちょうどで切り替わる)", () => {
    expect(run(withRows(THIN_SUSPICION_THRESHOLD)).suspicions).not.toContain("thin-suspicion");
    expect(run(withRows(THIN_SUSPICION_THRESHOLD - 1)).suspicions).toContain("thin-suspicion");
  });

  it("★負値は unit を問わず疑う (shape-gate と違い COUNT_UNITS に限定しない)", () => {
    // shape-gate の negative-count は個数系 unit だけを見るので率系は素通りする。
    // ここは「正当と確認できていないもの」を全部拾うのが目的なので unit を見ない。
    expect(run(withNegatives(1)).suspicions).toEqual(["negative-suspicion"]);
  });

  it("複数の疑いを同時に出す", () => {
    const rows = withRows(30).map((r, i) => (i < 20 ? { ...r, value: 0 } : { ...r, value: -5 }));
    expect(run(rows).suspicions.sort()).toEqual([
      "negative-suspicion",
      "thin-suspicion",
      "zero-suspicion",
    ]);
  });

  it("行が 0 件なら管轄外 (expected-empty / shape-gate が扱う)", () => {
    expect(run([]).status).toBe("clean");
  });
});

describe("classifyValueSuspicion — プロファイル突合", () => {
  it("profile が無ければ unverified", () => {
    const r = run(withZeros(40));
    expect(r.status).toBe("unverified");
    expect(r.reasons[0]).toContain("未登録");
  });

  it("予測の範囲内なら verified", () => {
    const r = run(withZeros(40), [profile({ zeroShareMax: 0.9 })]);
    expect(r.status).toBe("verified");
    expect(r.reasons).toEqual([]);
  });

  it("★予測を超えたら profile-violated (再オープン)", () => {
    // 検証時 0.85 で登録 → データが 0.894 に悪化 → 自動で再検証対象に戻る
    const r = run(withZeros(42), [profile({ zeroShareMax: 0.85 })]);
    expect(r.status).toBe("profile-violated");
    expect(r.reasons[0]).toContain("予測");
  });

  it("★別の疑いを cover していない profile では緑にならない", () => {
    // ゼロ率だけ検証済みなのに、県数が減った = 未検証の疑いが増えた
    const rows = withRows(30).map((r, i) => (i < 20 ? { ...r, value: 0 } : r));
    const r = run(rows, [profile({ zeroShareMax: 0.9 })]);
    expect(r.status).toBe("unverified");
    expect(r.reasons.join()).toContain("rowCountMin");
  });

  it("ゼロ率の疑いを cover しない profile では緑にならない", () => {
    const r = run(withZeros(20), [profile({ rowCountMin: 40 })]);
    expect(r.status).toBe("unverified");
    expect(r.reasons).toEqual(["zeroShareMax 未記載なのにゼロ率が高い"]);
  });

  it("負値は negativesAllowed:true でだけ通る", () => {
    expect(run(withNegatives(3), [profile({ negativesAllowed: true })]).status).toBe("verified");
    expect(run(withNegatives(3), [profile({ negativesAllowed: false })]).status).toBe("unverified");
    expect(run(withNegatives(3), [profile({ zeroShareMax: 0.9 })]).status).toBe("unverified");
  });

  it("行数が下限を下回ったら profile-violated", () => {
    expect(run(withRows(39), [profile({ rowCountMin: 39 })]).status).toBe("verified");
    expect(run(withRows(34), [profile({ rowCountMin: 39 })]).status).toBe("profile-violated");
  });

  it("違反と未 cover が同時なら違反を優先して報告する (検証が古くなった証拠)", () => {
    const rows = withRows(30).map((r, i) => (i < 25 ? { ...r, value: 0 } : r));
    // zeroShareMax は超過 / rowCountMin は未記載
    const r = run(rows, [profile({ zeroShareMax: 0.5 })]);
    expect(r.status).toBe("profile-violated");
  });

  it("他の key の profile は効かない", () => {
    const r = run(withZeros(40), [profile({ key: "other-metric", zeroShareMax: 0.9 })]);
    expect(r.status).toBe("unverified");
  });

  it("疑いが無ければ profile が無くても clean (全件に profile を要求しない)", () => {
    expect(run(healthyRows()).status).toBe("clean");
  });
});

describe("観測値の報告", () => {
  it("キュー出力に使う観測値を返す", () => {
    const r = run(withZeros(20));
    expect(r.observed).toMatchObject({
      latestYearCode: "2023",
      rowCount: 47,
      negativeCount: 0,
    });
    expect(r.observed.zeroShare).toBeCloseTo(20 / 47, 3);
  });

  it("複数年あれば最新年だけを見る", () => {
    const rows = [...withZeros(40, "2019"), ...healthyRows("2023")];
    const r = run(rows);
    expect(r.observed.latestYearCode).toBe("2023");
    expect(r.status).toBe("clean");
  });

  it("閾値定数が想定値であること (変更したらテストも見直す)", () => {
    expect(ZERO_SUSPICION_THRESHOLD).toBe(0.3);
    expect(THIN_SUSPICION_THRESHOLD).toBe(40);
  });
});
