import { describe, expect, it } from "vitest";

import {
  EXPECTED_SHAPE_ANOMALY,
  MAX_KNOWN_BROKEN,
  MAX_KNOWN_BROKEN_VALUE,
} from "../expected-shape-anomaly";
import { METRICS_REGISTRY } from "../registry";
import { VALUE_CHECKS } from "../shape-gate";

/**
 * allowlist を腐らせないためのラチェット。
 *
 * このファイルの主目的は**エントリを増やせなくすること**。新しい壊れ方を allowlist に
 * 足して緑にする逃げ道を塞ぐ (是正は config を直して行う)。
 */
describe("EXPECTED_SHAPE_ANOMALY の健全性", () => {
  it("★形状検査のエントリ数が上限を超えないこと (縮小専用ラチェット)", () => {
    // 是正して減らしたら MAX_KNOWN_BROKEN も下げる。増やす変更は原則しない。
    const shape = EXPECTED_SHAPE_ANOMALY.filter(
      (e) => e.disposition === "known-broken" && !VALUE_CHECKS.includes(e.check),
    );
    expect(shape.length).toBeLessThanOrEqual(MAX_KNOWN_BROKEN);
  });

  it("★値検査のエントリ数が上限を超えないこと (別枠のラチェット)", () => {
    // 形状側と枠を分ける。同じ枠だと「既存を是正して空いた枠に新しい壊れ方を入れる」が
    // できてしまい、ラチェットが意味を失う。
    const value = EXPECTED_SHAPE_ANOMALY.filter((e) => VALUE_CHECKS.includes(e.check));
    expect(value.length).toBeLessThanOrEqual(MAX_KNOWN_BROKEN_VALUE);
  });

  it("警告どまりの検査を allowlist に載せないこと (zero-heavy / negative-count)", () => {
    // warn は何も fail させないので許可の必要がない。載せると本当の欠陥が埋もれる
    // (area-coverage と同じ理由)。
    const warnOnly = EXPECTED_SHAPE_ANOMALY.filter(
      (e) => e.check === "zero-heavy" || e.check === "negative-count",
    );
    expect(warnOnly.map((e) => e.key)).toEqual([]);
  });

  it("全エントリが理由・追跡先・期限を持つこと", () => {
    for (const e of EXPECTED_SHAPE_ANOMALY) {
      expect(e.reason.length, `${e.key}/${e.check} の reason`).toBeGreaterThan(10);
      expect(e.issue.length, `${e.key}/${e.check} の issue`).toBeGreaterThan(0);
      expect(e.until, `${e.key}/${e.check} の until`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("observedSeverity が有限の数値であること (悪化検知が機能する前提)", () => {
    for (const e of EXPECTED_SHAPE_ANOMALY) {
      expect(Number.isFinite(e.observedSeverity), `${e.key}/${e.check}`).toBe(true);
      expect(e.observedSeverity).toBeGreaterThanOrEqual(0);
    }
  });

  it("実在する metric だけを指すこと (改名・削除で allowlist が幽霊化しない)", () => {
    const missing = EXPECTED_SHAPE_ANOMALY.filter((e) => !(e.key in METRICS_REGISTRY));
    expect(missing.map((e) => e.key)).toEqual([]);
  });

  it("(key, check, entity) が重複しないこと (先勝ちで後段が死ぬのを防ぐ)", () => {
    const seen = new Set<string>();
    const dup: string[] = [];
    for (const e of EXPECTED_SHAPE_ANOMALY) {
      const id = `${e.key}|${e.check}|${(e.entities ?? ["*"]).join("+")}`;
      if (seen.has(id)) dup.push(id);
      seen.add(id);
    }
    expect(dup).toEqual([]);
  });

  it("area-coverage を allowlist に載せないこと (縮小専用ラチェットで扱う)", () => {
    // 港湾・漁業のような正当な欠落まで allowlist に積むと、本当の欠損が埋もれる。
    // coverage は「以前 47 県あった年が減ったときだけ error」なので登録が要らない。
    const coverage = EXPECTED_SHAPE_ANOMALY.filter((e) => e.check === "area-coverage");
    expect(coverage.map((e) => e.key)).toEqual([]);
  });
});
