/**
 * ranking キーリスト間の集合整合性テスト（★410 誤配信の再発防止）
 *
 * 背景 (2026-07-03 障害): marine-aquaculture-harvest 等 56 件が
 * GONE_RANKING_KEYS と KNOWN_RANKING_KEYS の両方に登録され、metric config も
 * isActive:true・R2 に実データありのまま、middleware の isGone 短絡で本番 410 を
 * 誤配信していた（births / marriages / ratio-65-plus 等の基礎統計を含む）。
 * 各リストは別々のスクリプト/棚卸しで独立更新されるため、集合としての整合を
 * 機械検証しない限り同じドリフトが再発する。本テストが CI (pr-quality-check) の
 * test ステップで恒久的に検証する。
 *
 * 不変条件:
 *   [A] GONE ∩ KNOWN = ∅        — 「配信中」と「削除済 410」は排他
 *   [B] GONE ∩ isActive:true = ∅ — 410 対象は config も非アクティブであること
 *   [C] INDEXABLE ⊆ KNOWN        — インデックス対象は必ず配信中
 *   [D] INDEXABLE ∩ GONE = ∅     — インデックス対象が 410 は矛盾
 *   [E] SITEMAP ∩ GONE           — shouldIncludeInSitemap が実行時に除外するため
 *                                   実害は無いが、汚染として warning を出す（生成
 *                                   スクリプトが GONE を除外しない既知の残余 5 件）
 *
 * 違反時の直し方:
 *   - ページを公開したい (データ・config が生きている) → GONE から削除
 *   - 本当に廃止したい → config を isActive:false にし、KNOWN を再生成
 *     (`apps/web/scripts/generate-known-ranking-keys.ts`) してから GONE に追加
 */
import { describe, expect, it } from "vitest";

import { listAllMetrics } from "@stats47/data-configs/registry";

import { GONE_RANKING_KEYS } from "@/config/gone-ranking-keys";
import { INDEXABLE_RANKING_KEYS } from "@/config/indexable-ranking-keys";
import { KNOWN_RANKING_KEYS } from "@/config/known-ranking-keys";
import { SITEMAP_RANKING_KEYS } from "@/config/sitemap-ranking-keys";

function intersection(a: ReadonlySet<string>, b: ReadonlySet<string>): string[] {
  return [...a].filter((k) => b.has(k)).sort();
}

describe("ranking キーリスト集合整合性", () => {
  it("[A] GONE ∩ KNOWN = ∅（410 対象キーが配信中リストに存在しない）", () => {
    const conflict = intersection(GONE_RANKING_KEYS, KNOWN_RANKING_KEYS);
    expect(
      conflict,
      `GONE と KNOWN の両方に登録された矛盾キー ${conflict.length} 件。` +
        `公開するなら GONE から削除、廃止するなら isActive:false + KNOWN 再生成。`,
    ).toEqual([]);
  });

  it("[B] GONE ∩ isActive:true = ∅（410 対象キーの config が active でない）", () => {
    const activeKeys = new Set(
      listAllMetrics()
        .filter((m) => m.isActive)
        .map((m) => m.key),
    );
    const conflict = intersection(GONE_RANKING_KEYS, activeKeys);
    expect(
      conflict,
      `GONE なのに metric config が isActive:true のキー ${conflict.length} 件。` +
        `2026-07-03 の 410 誤配信障害と同一シグネチャ。`,
    ).toEqual([]);
  });

  it("[C] INDEXABLE ⊆ KNOWN（インデックス対象は必ず配信中）", () => {
    const orphans = [...INDEXABLE_RANKING_KEYS]
      .filter((k) => !KNOWN_RANKING_KEYS.has(k))
      .sort();
    expect(orphans, `INDEXABLE だが KNOWN に無いキー ${orphans.length} 件`).toEqual([]);
  });

  it("[D] INDEXABLE ∩ GONE = ∅（インデックス対象が 410 でない）", () => {
    const conflict = intersection(INDEXABLE_RANKING_KEYS, GONE_RANKING_KEYS);
    expect(conflict, `INDEXABLE なのに GONE のキー ${conflict.length} 件`).toEqual([]);
  });

  it("[E] SITEMAP ∩ GONE は警告のみ（実行時 shouldIncludeInSitemap が除外）", () => {
    const polluted = intersection(SITEMAP_RANKING_KEYS, GONE_RANKING_KEYS);
    if (polluted.length > 0) {
      // 生成スクリプト (build-sitemap-ranking-keys.cjs) が GONE を除外しないため
      // 残余が出る。実害は無い（url-policy が実行時に除外）が、増加傾向なら
      // 生成スクリプト側に GONE フィルタを追加すること。
      console.warn(
        `[ranking-key-consistency] SITEMAP ∩ GONE = ${polluted.length} 件 (実害なし・情報): ` +
          polluted.slice(0, 10).join(", ") +
          (polluted.length > 10 ? " …" : ""),
      );
    }
    // ベースライン 5 件 (2026-07-03) から大幅増加したら生成スクリプトの退行を疑う
    expect(polluted.length).toBeLessThanOrEqual(10);
  });
});
