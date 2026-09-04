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
 *   [E] KNOWN ⊆ active prefecture — 市区町村専用metricを県rankingへ混入させない
 *   [F] SITEMAP ⊆ KNOWN          — 履歴に残る非公開URLを再混入させない
 *   [G] SITEMAP ∩ GONE = ∅       — sitemap と 410 は排他
 *
 * 違反時の直し方:
 *   - ページを公開したい (データ・config が生きている) → GONE から削除
 *   - 本当に廃止したい → config を isActive:false にし、KNOWN を再生成
 *     (`apps/web/scripts/generate-known-ranking-keys.ts`) してから GONE に追加
 */
import { listAllMetrics } from "@stats47/data-configs/registry";
import { describe, expect, it } from "vitest";

import { GONE_RANKING_KEYS } from "@/config/gone-ranking-keys";
import { GONE_TAG_KEYS } from "@/config/gone-tag-keys";
import { INDEXABLE_RANKING_KEYS } from "@/config/indexable-ranking-keys";
import { KNOWN_RANKING_KEYS } from "@/config/known-ranking-keys";
import { KNOWN_TAG_KEYS } from "@/config/known-tag-keys";
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

  it("[E] KNOWN ⊆ active prefecture（市区町村専用metricを県rankingへ混入させない）", () => {
    const activePrefectureKeys = new Set(
      listAllMetrics()
        .filter((m) => m.isActive && m.entities.includes("prefecture"))
        .map((m) => m.key),
    );
    const invalid = [...KNOWN_RANKING_KEYS]
      .filter((key) => !activePrefectureKeys.has(key))
      .sort();
    expect(
      invalid,
      `KNOWN だが active prefecture metric ではないキー ${invalid.length} 件。` +
        `generate-known-ranking-keys.ts の対象判定を確認。`,
    ).toEqual([]);
  });

  it("[F] SITEMAP ⊆ KNOWN（現在配信しない履歴URLをsitemapへ戻さない）", () => {
    const invalid = [...SITEMAP_RANKING_KEYS]
      .filter((key) => !KNOWN_RANKING_KEYS.has(key))
      .sort();
    expect(invalid, `SITEMAP だが KNOWN ではないキー ${invalid.length} 件`).toEqual([]);
  });

  it("[G] SITEMAP ∩ GONE = ∅（sitemapと410は排他）", () => {
    const conflict = intersection(SITEMAP_RANKING_KEYS, GONE_RANKING_KEYS);
    expect(conflict, `SITEMAP なのにGONEのキー ${conflict.length} 件`).toEqual([]);
  });
});

describe("ranking slug redirect の整合性", () => {
  it("転送先が KNOWN かつ非 GONE、転送元と転送先が同一でない", async () => {
    const { RANKING_SLUG_REDIRECTS } = await import("@/config/ranking-redirects");
    const invalid = Object.entries(RANKING_SLUG_REDIRECTS).filter(
      ([source, destination]) =>
        source === destination || !KNOWN_RANKING_KEYS.has(destination) || GONE_RANKING_KEYS.has(destination),
    );

    expect(invalid).toEqual([]);
  });
});

describe("tag キーリスト集合整合性 (ranking と同型のドリフト防御)", () => {
  it("GONE_TAG ∩ KNOWN_TAG = ∅（410 対象タグが配信中リストに存在しない）", () => {
    const conflict = intersection(GONE_TAG_KEYS, KNOWN_TAG_KEYS);
    expect(
      conflict,
      `GONE_TAG と KNOWN_TAG の両方に登録された矛盾キー ${conflict.length} 件。` +
        `復活したタグは GONE_TAG_KEYS から削除すること。`,
    ).toEqual([]);
  });
});

describe("blog slug リスト集合整合性 (410/301/outbox の排他: G4-blog)", () => {
  it("[F] GONE ∩ REDIRECT 元 = ∅（410 と 301 は排他）", async () => {
    const { GONE_BLOG_SLUGS } = await import("@/config/gone-blog-slugs");
    const { BLOG_SLUG_REDIRECTS } = await import("@/config/blog-redirects");
    const conflict = [...GONE_BLOG_SLUGS].filter((s) => s in BLOG_SLUG_REDIRECTS);
    expect(
      conflict,
      `同じ slug が 410 (GONE_BLOG_SLUGS) と 301 (BLOG_SLUG_REDIRECTS) の両方に登録: ${conflict.join(", ")}`,
    ).toEqual([]);
  });

  it("[G] GONE ∩ REDIRECT 先 = ∅（301 の着地が 410 は矛盾）", async () => {
    const { GONE_BLOG_SLUGS } = await import("@/config/gone-blog-slugs");
    const { BLOG_SLUG_REDIRECTS } = await import("@/config/blog-redirects");
    const targets = new Set(Object.values(BLOG_SLUG_REDIRECTS));
    const conflict = [...GONE_BLOG_SLUGS].filter((s) => targets.has(s));
    expect(
      conflict,
      `301 リダイレクトの着地先が 410 対象: ${conflict.join(", ")}`,
    ).toEqual([]);
  });

  it("[H] GONE slug が docs/21 outbox に再出現しない（410 URL の再公開防止）", async () => {
    const { GONE_BLOG_SLUGS } = await import("@/config/gone-blog-slugs");
    const fs = await import("node:fs");
    const path = await import("node:path");
    // vitest の cwd は apps/web。outbox は publish 後に CI が自動削除する ephemeral のため不在は正常
    const outbox = path.resolve(process.cwd(), "../../docs/21_ブログ記事原稿");
    const drafts = fs.existsSync(outbox)
      ? fs
          .readdirSync(outbox, { withFileTypes: true })
          .filter((d) => d.isDirectory())
          .map((d) => d.name)
      : [];
    const conflict = drafts.filter((s) => GONE_BLOG_SLUGS.has(s));
    expect(
      conflict,
      `410 (GONE_BLOG_SLUGS) 対象の slug が outbox に存在 — 公開すると 410 と衝突: ${conflict.join(", ")}`,
    ).toEqual([]);
  });
});
