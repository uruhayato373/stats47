/**
 * ネイティブ枠 (NativeAffiliateRow) と縦長クリエイティブの分離契約。
 *
 * 背景 (2026-08-06): locationCode "sidebar-sticky" 登録のスカイスクレイパー (120x600) が、
 * それを読む描画コードが存在しない + banner 解決が locationCode を見ない (§1 の非対称) の
 * 合わせ技で本文の native 横並び枠に流入し、home に表示されていた。
 *
 * 規約 (affiliate-ads-standards.md §3):
 *   - 縦長 (height > width) は native / 本文枠に出さない — isLandscapeBanner で描画側除外
 *   - 縦長の唯一の受け皿は SidebarStickyBannerAd ("sidebar-sticky" reader の唯一の消費者)
 *   - NativeAffiliateRow の可視要素はリンク付きバナー画像だけ
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { isLandscapeBanner } from "../utils";

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

  it("client-safe row から server service を import しない", () => {
    expect(src).not.toMatch(/from ["']\.\.\/services["']/);
    expect(src).not.toMatch(/from ["'][^"']*services\//);
    expect(src).toMatch(/from ["']\.\.\/utils["']/);
  });

  it("縦長を isLandscapeBanner で除外している", () => {
    // import の存在ではなく「適用」を見る (import だけ残してフィルタを外す退行を
    // 変異テストで実際に見逃したため。2026-08-06)
    expect(src).toContain(".filter(isLandscapeBanner)");
  });

  it("PR・見出し・商品名・もっと見る導線を表示しない", () => {
    expect(src).not.toContain(">PR<");
    expect(src).not.toContain("<h3");
    expect(src).not.toContain("<p");
    expect(src).not.toContain("moreHref");
  });

  it("カード装飾や固定アスペクト枠を使わず、バナーの原寸比を保つ", () => {
    expect(src).not.toContain("<SurfaceCard");
    expect(src).not.toContain("getSurfaceCardClassName");
    expect(src).not.toContain("aspect-[4/3]");
    expect(src).not.toContain("rounded-md");
    expect(src).not.toContain("bg-muted");
    expect(src).not.toContain("group-hover");
    expect(src).toContain("width={b.width}");
    expect(src).toContain("height={b.height}");
    expect(src).toContain('className="block h-auto w-full"');
  });

  it("読了位置用three-upはdesktop 3列・mobile 最優先1件に制限する", () => {
    expect(src).toContain('variant?: "standard" | "three-up"');
    expect(src).toContain('variant === "three-up" ? 3 : 4');
    expect(src).toContain('"grid grid-cols-1 items-start gap-2 md:grid-cols-3"');
    expect(src).toContain('index > 0 ? "hidden md:block" : undefined');
    expect(src).toContain('"(max-width: 767px) 100vw, 33vw"');
  });

  it("three-upの在庫が1〜2件でも左寄せの空き列を作らない", () => {
    expect(src).toContain("getThreeUpGridClassName(visible.length)");
    expect(src).toContain('"mx-auto grid max-w-xs grid-cols-1 items-start gap-2"');
    expect(src).toContain(
      '"mx-auto grid max-w-2xl grid-cols-1 items-start gap-2 md:grid-cols-2"',
    );
  });

  it("既存一覧面のstandardはmobile 2列・desktop 4列を維持する", () => {
    expect(src).toContain('variant = "standard"');
    expect(src).toContain('"grid grid-cols-2 items-start gap-2 md:grid-cols-4"');
    expect(src).toContain('"(max-width: 767px) 50vw, 25vw"');
  });
});

describe("SidebarStickyBannerAd の契約", () => {
  const src = readComponent("SidebarStickyBannerAd.tsx");

  it("可視要素にPR見出しを足さず、バナー画像だけを表示する", () => {
    expect(src).toContain("<BannerAd");
    expect(src).not.toContain(">PR<");
  });

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
