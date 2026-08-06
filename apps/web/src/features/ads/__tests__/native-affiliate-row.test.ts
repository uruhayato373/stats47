/**
 * ネイティブ枠 (NativeAffiliateRow) と縦長クリエイティブの分離契約。
 *
 * 背景 (2026-08-06): locationCode "sidebar-sticky" 登録のスカイスクレイパー (120x600) が、
 * それを読む描画コードが存在しない + banner 解決が locationCode を見ない (§1 の非対称) の
 * 合わせ技で本文の native 横並び枠に流入し、aspect-[4/3] + object-contain の枠で
 * 極細の縦帯に潰れて home に表示されていた。加えて (a) 呼び出し元 SectionHeader との
 * 二重見出し、(b) 「関連書籍・商品」等の実在庫に無い語、(c) PR 表記の欠落があった。
 *
 * 規約 (affiliate-ads-standards.md §3):
 *   - 縦長 (height > width) は native / 本文枠に出さない — isLandscapeBanner で描画側除外
 *   - 縦長の唯一の受け皿は SidebarStickyBannerAd ("sidebar-sticky" reader の唯一の消費者)
 *   - NativeAffiliateRow は外枠カード一括なし・「PR」ラベル付き 1 段見出し
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { isLandscapeBanner } from "../services/banner-geometry";

const COMPONENTS_DIR = resolve(import.meta.dirname, "../components");

function readComponent(name: string): string {
  return readFileSync(resolve(COMPONENTS_DIR, name), "utf8");
}

describe("isLandscapeBanner", () => {
  it("スカイスクレイパー (120x600 / 160x600) を縦長と判定する", () => {
    expect(isLandscapeBanner({ width: 120, height: 600 })).toBe(false);
    expect(isLandscapeBanner({ width: 160, height: 600 })).toBe(false);
  });

  it("横長・正方形は残す (300x250 / 320x100 / 300x300)", () => {
    expect(isLandscapeBanner({ width: 300, height: 250 })).toBe(true);
    expect(isLandscapeBanner({ width: 320, height: 100 })).toBe(true);
    // 300x300 (grandfathering 中の旧スクエア在庫) は 4:3 枠で許容範囲に収まるので除外しない
    expect(isLandscapeBanner({ width: 300, height: 300 })).toBe(true);
  });
});

describe("NativeAffiliateRow の構造契約", () => {
  const src = readComponent("NativeAffiliateRow.tsx");

  it("縦長を isLandscapeBanner で除外している", () => {
    // import の存在ではなく「適用」を見る (import だけ残してフィルタを外す退行を
    // 変異テストで実際に見逃したため。2026-08-06)
    expect(src).toContain(".filter(isLandscapeBanner)");
  });

  it("PR ラベルを表示する (景表法・他のアフィリ枠と統一)", () => {
    expect(src).toContain(">PR<");
  });

  it("外枠カードで 4 件を一括りにしない (SurfaceCard 直使用の禁止)", () => {
    // 個別カードは getSurfaceCardClassName (リンク自身がカードになる) を使う。
    // <SurfaceCard> での外枠一括が復活したらこの契約に違反する。
    expect(src).not.toContain("<SurfaceCard");
  });
});

describe("SidebarStickyBannerAd の契約", () => {
  const src = readComponent("SidebarStickyBannerAd.tsx");

  it('sidebar-sticky locationCode を読む (縦長の唯一の受け皿)', () => {
    expect(src).toContain('"sidebar-sticky"');
  });

  it("lg 未満では描画しない (サイドバー概念は lg+ のみ)", () => {
    expect(src).toContain("hidden lg:block");
  });

  it("sticky を付けない (home 構造テストが aside の lg:sticky 不在を assert)", () => {
    expect(src).not.toContain("lg:sticky");
  });

  it("計装済みコンポーネント (BannerAd) に描画を委譲する", () => {
    expect(src).toContain("<BannerAd");
  });
});
