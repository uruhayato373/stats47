/**
 * 書籍別キー表 (`book-ranking-keys.ts`) の不変量。
 *
 * ★とくに「既知の単位欠陥を持つ指標を書籍に載せない」を固定する。
 *   2026-08-12 に `MONEY-UNIT-SCALE-01` (賃金構造基本統計 0003445758 / 個人企業経済調査
 *   0003421679 は e-Stat の値が千円なのに config の unit が万円) の 3 件がキー表に入り、
 *   ブリーフに「バス運転者の平均年収 1位 神奈川県 5,017万円」と焼かれ、原稿 5 ファイルに
 *   その数値が書かれていた。サイト側は表示の一貫性で済むが、**書籍は出したら取り下げられない**。
 *   キー選定スクリプトに除外を実装したが、手で表を編集すれば通ってしまうのでここで固定する。
 */
import { describe, it, expect } from "vitest";
import { METRICS_REGISTRY } from "@stats47/data-configs";
import { BOOK_RANKING_KEYS, JAPAN_ZUE_KINDLE_COVERAGE } from "../book-ranking-keys";
import { KINDLE_BOOKS } from "../book-catalog";

/** 値のスケールと config の unit が食い違っている統計表 (audit:money-unit-scale が報告する)。 */
const DEFECTIVE_STATS_DATA_IDS = new Set(["0003445758", "0003421679"]);

function statsDataIdOf(key: string): string | undefined {
  const m = (METRICS_REGISTRY as Record<string, any>)[key];
  const sid = m?.source?.statsDataId ?? m?.source?.config?.statsDataId;
  return sid ? String(sid) : undefined;
}

describe("BOOK_RANKING_KEYS", () => {
  const entries = Object.entries(BOOK_RANKING_KEYS);

  it("★単位の欠陥が既知の指標を含まない", () => {
    const bad: string[] = [];
    for (const [bookId, keys] of entries) {
      for (const k of keys) {
        const sid = statsDataIdOf(k);
        if (sid && DEFECTIVE_STATS_DATA_IDS.has(sid)) bad.push(`${bookId}: ${k} (${sid})`);
      }
    }
    expect(bad).toEqual([]);
  });

  it("全キーが METRICS_REGISTRY に実在し isActive である", () => {
    const bad: string[] = [];
    for (const [bookId, keys] of entries) {
      for (const k of keys) {
        const m = (METRICS_REGISTRY as Record<string, any>)[k];
        if (!m) bad.push(`${bookId}: ${k} が registry に無い`);
        else if (m.isActive === false) bad.push(`${bookId}: ${k} が isActive:false`);
      }
    }
    expect(bad).toEqual([]);
  });

  it("書籍内でキーが重複しない", () => {
    for (const [bookId, keys] of entries) {
      expect(new Set(keys).size, `${bookId} に重複キー`).toBe(keys.length);
    }
  });

  it("★S3 の 8 冊が同じ本にならない (地域ごとにキーが分かれている)", () => {
    // 実測 (2026-08-12): 全 8 冊が同一 pack の先頭 24 件を使い、差分は 1 文だけだった。
    const s3 = entries.filter(([id]) => id.startsWith("K-S3-"));
    expect(s3.length).toBeGreaterThanOrEqual(2);
    let worst = 0;
    for (let i = 0; i < s3.length; i++) {
      for (let j = i + 1; j < s3.length; j++) {
        const a = new Set(s3[i][1]);
        const overlap = s3[j][1].filter((k) => a.has(k)).length;
        worst = Math.max(worst, overlap);
      }
    }
    // 30 キー中の重なり。全冊同一 (30) だった状態への回帰を止める。
    expect(worst).toBeLessThanOrEqual(15);
  });

  it("キー表を持つ書籍がカタログに実在する", () => {
    const known = new Set(KINDLE_BOOKS.map((b) => b.id));
    for (const [bookId] of entries) expect(known.has(bookId), `${bookId} がカタログに無い`).toBe(true);
  });

  it("★日本国勢図会の採択 metric は対象書籍に入り、除外 metric は入らない", () => {
    for (const [bookId, required] of Object.entries(JAPAN_ZUE_KINDLE_COVERAGE.included)) {
      const actual = new Set(BOOK_RANKING_KEYS[bookId] ?? []);
      for (const key of required) expect(actual.has(key), `${bookId}: ${key} が未反映`).toBe(true);
    }

    const all = new Set(Object.values(BOOK_RANKING_KEYS).flat());
    for (const key of Object.keys(JAPAN_ZUE_KINDLE_COVERAGE.excluded)) {
      expect(all.has(key), `${key} は除外対象`).toBe(false);
    }
  });
});
