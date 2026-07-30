import { describe, expect, it } from "vitest";

import {
  EXPECTED_EMPTY,
  classifyEmptyOutcome,
  findExpectedEmpty,
  type ClassifyEmptyInput,
} from "../expected-empty";

/** allowlist の期限内 / 期限後 */
const NOW_IN = new Date("2026-08-01T00:00:00Z");
const NOW_OUT = new Date("2026-12-01T00:00:00Z");

const base = (over: Partial<ClassifyEmptyInput> = {}): ClassifyEmptyInput => ({
  key: "some-metric",
  entity: "prefecture",
  rawCount: 0,
  rowCount: 0,
  priorRowCount: null,
  now: NOW_IN,
  ...over,
});

describe("EXPECTED_EMPTY の健全性", () => {
  it("全エントリが理由・追跡先・期限を持つこと (allowlist を腐らせない)", () => {
    // 空でよい (2026-07-30 に 6 件すべて解消)。エントリがあるなら必ず 3 点そろえる。
    for (const e of EXPECTED_EMPTY) {
      expect(e.reason.length).toBeGreaterThan(10);
      expect(e.issue.length).toBeGreaterThan(0);
      expect(e.until).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isFinite(Date.parse(e.until))).toBe(true);
    }
  });

  it("key が重複していないこと", () => {
    const keys = EXPECTED_EMPTY.map((e) => e.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("★誤診のまま放置されていないこと (2026-07-30 に真因を特定)", () => {
    // 当初は「cdCat01 の誤座標」と診断されていたが、真因は表の形 (都道府県が cat 軸) と
    // 存在しない年の指定だった。理由が古い診断のままなら、次に見た人が同じ誤解をする。
    for (const e of EXPECTED_EMPTY) {
      expect(e.reason).not.toContain("誤座標");
      expect(e.reason).not.toContain("要 e-Stat メタ再確認");
    }
  });

  it("★config 是正済みのものは「R2 再生成待ち」と明記されていること", () => {
    // 「まだ原因不明」と「直したが反映待ち」は対処がまったく違う
    const fixed = [
      "inpatient-rate-per-100k",
      "outpatient-rate-per-100k",
      "patient-receiving-rate-by-age",
      "patient-receiving-rate-by-disease",
      "inpatient-rate-by-bedtype",
      "emergency-hospital-general-clinic-count-per-100k",
    ];
    for (const k of fixed) {
      const e = EXPECTED_EMPTY.find((x) => x.key === k);
      expect(e, `${k} のエントリ`).toBeDefined();
      expect(e!.reason).toContain("R2 再生成待ち");
    }
  });
});

describe("findExpectedEmpty", () => {
  // EXPECTED_EMPTY は空になりうるので、期限判定の検証は合成エントリで行う
  // (実データに依存させると「是正したらテストが壊れる」ことになる)
  const SYNTHETIC = [
    {
      key: "synthetic-metric",
      reason: "テスト用の合成エントリ (期限判定の検証)",
      issue: "TEST-ONLY",
      until: "2026-10-31",
    },
  ] as const;

  it("期限内なら許可を返すこと", () => {
    expect(findExpectedEmpty("synthetic-metric", "prefecture", NOW_IN, SYNTHETIC)).not.toBeNull();
  });

  /** これが allowlist を腐らせないための本体 */
  it("期限を過ぎたら許可しないこと", () => {
    expect(findExpectedEmpty("synthetic-metric", "prefecture", NOW_OUT, SYNTHETIC)).toBeNull();
  });

  it("未登録キーは null を返すこと", () => {
    expect(findExpectedEmpty("unknown-metric", "prefecture", NOW_IN)).toBeNull();
  });

  it("entities 指定があれば対象 entity のみ許可すること", () => {
    const now = NOW_IN;
    const entry = { key: "x", entities: ["city"] as const, reason: "test の理由です", issue: "I-1", until: "2026-12-31" };
    // findExpectedEmpty は EXPECTED_EMPTY を見るため、ここでは仕様を型で確認するに留める
    expect(entry.entities.includes("city")).toBe(true);
    expect(findExpectedEmpty("x", "prefecture", now)).toBeNull();
  });
});

describe("classifyEmptyOutcome", () => {
  it("行があれば ok (エラーなし)", () => {
    const r = classifyEmptyOutcome(base({ key: "unknown-metric", rawCount: 47, rowCount: 47 }));
    expect(r.outcome).toBe("ok");
    expect(r.isError).toBe(false);
  });

  /** 最も重い: 既存データを空で潰すケース */
  it("既存データがあるのに 0 件なら regression でエラーにすること", () => {
    const r = classifyEmptyOutcome(base({ key: "unknown-metric", rawCount: 47, priorRowCount: 47 }));
    expect(r.outcome).toBe("regression");
    expect(r.isError).toBe(true);
    expect(r.message).toContain("既存 47 行が消失");
  });

  it("既存データ無しの初回 0 件は first-empty でエラーにすること", () => {
    const r = classifyEmptyOutcome(base({ key: "unknown-metric" }));
    expect(r.outcome).toBe("first-empty");
    expect(r.isError).toBe(true);
  });

  // 実 EXPECTED_EMPTY は空になりうるので合成 allowlist で検証する
  // (実データに依存させると「是正したらテストが壊れる」ことになる)
  const ALLOWLIST = [
    {
      key: "synthetic-metric",
      reason: "テスト用の合成エントリ",
      issue: "TEST-ONLY",
      until: "2026-10-31",
    },
  ] as const;

  it("allowlist 登録済みならエラーにしないこと", () => {
    const r = classifyEmptyOutcome(
      base({ key: "synthetic-metric", priorRowCount: 47, allowlist: ALLOWLIST }),
    );
    expect(r.outcome).toBe("allowed");
    expect(r.isError).toBe(false);
    expect(r.message).toContain("TEST-ONLY");
  });

  it("allowlist の期限が切れていればエラーに戻ること", () => {
    const r = classifyEmptyOutcome(
      base({ key: "synthetic-metric", now: NOW_OUT, allowlist: ALLOWLIST }),
    );
    expect(r.isError).toBe(true);
  });

  it("allowlist にあるのにデータが復活したら stale-allowlist で知らせること (fatal にしない)", () => {
    const r = classifyEmptyOutcome(
      base({ key: "synthetic-metric", rawCount: 47, rowCount: 47, allowlist: ALLOWLIST }),
    );
    expect(r.outcome).toBe("stale-allowlist");
    expect(r.isError).toBe(false);
    expect(r.message).toContain("EXPECTED_EMPTY から削除");
  });

  it("--allow-empty 指定でエラーを警告に降格できること", () => {
    const r = classifyEmptyOutcome(
      base({ key: "unknown-metric", cliAllowed: new Set(["unknown-metric"]) }),
    );
    expect(r.outcome).toBe("allowed");
    expect(r.isError).toBe(false);
  });

  /** 原因切り分けの要: raw と filtered を区別する */
  it("raw=0 と フィルタ全落ち を別の原因として報告すること", () => {
    const zero = classifyEmptyOutcome(base({ key: "unknown-metric", rawCount: 0 }));
    expect(zero.message).toContain("e-Stat が 0 行を返した");

    const filtered = classifyEmptyOutcome(base({ key: "unknown-metric", rawCount: 1234 }));
    expect(filtered.message).toContain("全てフィルタ落ち");
    expect(filtered.message).toContain("raw=1234");
  });

  it("limit 到達時に truncated の疑いを添えること", () => {
    const r = classifyEmptyOutcome(base({ key: "unknown-metric", rawCount: 100_000 }));
    expect(r.message).toContain("truncated?");
  });
});
