import { describe, expect, it } from "vitest";

import { METRICS_REGISTRY } from "../registry";
import { VERIFIED_VALUE_PROFILES } from "../verified-value-profiles";

/**
 * 検証台帳が「見たふり」で埋まるのを防ぐ lint。
 *
 * この方式の最大のリスクは **agent が中身を見ずに一括承認すること**。緑の板と実際の検証が
 * 区別できなくなる。防御は 2 段構えで:
 *   1. 予測値 (zeroShareMax 等) を必須にする — 中身を見ないと数字が書けない (value-verification が照合)
 *   2. ここで根拠の形を強制する — 出典 URL・検証日・具体的な根拠文
 */
describe("VERIFIED_VALUE_PROFILES の健全性", () => {
  it("★予測を 1 つ以上持つこと (空 profile で疑いを黙らせられない)", () => {
    const empty = VERIFIED_VALUE_PROFILES.filter(
      (p) =>
        p.zeroShareMax === undefined &&
        p.rowCountMin === undefined &&
        p.negativesAllowed === undefined,
    );
    expect(empty.map((p) => p.key)).toEqual([]);
  });

  it("★根拠と出典と検証日を持つこと", () => {
    for (const p of VERIFIED_VALUE_PROFILES) {
      expect(p.evidence.length, `${p.key} の evidence が短すぎる`).toBeGreaterThanOrEqual(20);
      expect(p.sourceUrl, `${p.key} の sourceUrl`).toMatch(/^(https?:\/\/|packages\/|apps\/|docs\/)/);
      expect(p.verifiedAt, `${p.key} の verifiedAt`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("根拠が定型文でないこと (コピペで量産させない)", () => {
    // 同じ evidence が複数 key に使い回されていたら、中身を見ずに埋めた疑いが強い。
    // 同一調査の品目違い (家計調査の 15 品目等) は正当にありうるので、
    // 「まったく同一の文字列が 6 件以上」だけを弾く。
    const counts = new Map<string, string[]>();
    for (const p of VERIFIED_VALUE_PROFILES) {
      const list = counts.get(p.evidence) ?? [];
      list.push(p.key);
      counts.set(p.evidence, list);
    }
    const overused = [...counts.entries()].filter(([, keys]) => keys.length >= 6);
    expect(overused.map(([e, keys]) => `${keys.length}件: ${e.slice(0, 30)}`)).toEqual([]);
  });

  it("実在する metric だけを指すこと (改名・削除で幽霊化しない)", () => {
    const missing = VERIFIED_VALUE_PROFILES.filter((p) => !(p.key in METRICS_REGISTRY));
    expect(missing.map((p) => p.key)).toEqual([]);
  });

  it("key が重複しないこと (先勝ちで後段が死ぬのを防ぐ)", () => {
    const seen = new Set<string>();
    const dup: string[] = [];
    for (const p of VERIFIED_VALUE_PROFILES) {
      if (seen.has(p.key)) dup.push(p.key);
      seen.add(p.key);
    }
    expect(dup).toEqual([]);
  });

  it("zeroShareMax は 0-1 の範囲であること", () => {
    for (const p of VERIFIED_VALUE_PROFILES) {
      if (p.zeroShareMax === undefined) continue;
      expect(p.zeroShareMax, `${p.key}`).toBeGreaterThan(0);
      expect(p.zeroShareMax, `${p.key}`).toBeLessThanOrEqual(1);
    }
  });

  it("rowCountMin は 1-47 の整数であること", () => {
    for (const p of VERIFIED_VALUE_PROFILES) {
      if (p.rowCountMin === undefined) continue;
      expect(Number.isInteger(p.rowCountMin), `${p.key}`).toBe(true);
      expect(p.rowCountMin, `${p.key}`).toBeGreaterThan(0);
      expect(p.rowCountMin, `${p.key}`).toBeLessThanOrEqual(47);
    }
  });

  it("negativesAllowed を false で書かないこと (許可しないなら profile を書かない)", () => {
    // false は「負値があるが正当と認めない」= unverified と同じ意味なので、台帳に載せる意味がない。
    // 載っていると「検証済み」に見えて紛らわしい。
    const explicitFalse = VERIFIED_VALUE_PROFILES.filter((p) => p.negativesAllowed === false);
    expect(explicitFalse.map((p) => p.key)).toEqual([]);
  });
});
