/**
 * ネイティブ枠 (NativeAffiliateRow) と縦長クリエイティブの分離契約。
 *
 * 背景 (2026-08-06): locationCode "sidebar-sticky" 登録のスカイスクレイパー (120x600) が、
 * それを読む描画コードが存在しない + banner 解決が locationCode を見ない (§1 の非対称) の
 * 合わせ技で本文の native 横並び枠に流入し、home に表示されていた。
 *
 * 規約 (affiliate-ads-standards.md §3):
 *   - 縦長 (height > width) は native / 本文枠に出さない — isLandscapeBanner で描画側除外
 *   - 縦長を出す枠は無い (受け皿だったホームの縦長バナーは 2026-10-30 に外した。広告同士の隣り合わせを無くすため)
 *   - 本文の横並びのバナー (NativeBannerTile) の可視要素はリンク付きバナー画像だけ
 * 2026-11-12: PR の列の部品 (NativeAffiliateRow) は使われなくなり削除した。横並びの 1 枚と列の幅の決まりは
 * 広告の段 (AdRow) が使うので、同じファイルに残した分をここで固定する。
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

describe("本文の横並びのバナー (NativeBannerTile) と列の幅の構造契約", () => {
  const src = readComponent("NativeAffiliateRow.tsx");

  it("client-safe row から server service を import しない", () => {
    expect(src).not.toMatch(/from ["']\.\.\/services["']/);
    expect(src).not.toMatch(/from ["'][^"']*services\//);
  });

  // PR 表記は広告の段 (AdRow) のセルの左上が持つ (2026-10-30 案 A)。バナーの側では見出し・商品名・導線を足さない
  it("見出し・商品名・もっと見る導線は表示しない", () => {
    expect(src).not.toContain("<PrLabel />");
    expect(src).not.toContain(">PR<");
    expect(src).not.toContain("<h3");
    expect(src).not.toContain("<p");
    expect(src).not.toContain("moreHref");
  });

  it("カード装飾や固定アスペクト枠を使わず、バナーの原寸比を保つ", () => {
    expect(src).not.toContain("<SurfaceCard");
    expect(src).not.toContain("getSurfaceCardClassName");
    expect(src).not.toContain("aspect-4/3");
    expect(src).not.toContain("rounded-md");
    expect(src).not.toContain("bg-muted");
    expect(src).not.toContain("group-hover");
    expect(src).toContain("width={b.width}");
    expect(src).toContain("height={b.height}");
  });

  // 2026-10-29 オーナー決定: バナーを原寸より縮めず、本文の幅に入る数だけ 1 行に並べる。
  // 旧: ブラウザの幅 768px 以上で一律 3 列にし、右レールのある本文 (810px) で 254px、768px の画面で 223px に縮んでいた
  it("バナーは原寸を上限にし、広げも縮めもしない (w-full で引き伸ばさない)", () => {
    expect(src).toContain('className="mx-auto block h-auto max-w-full"');
    // w-auto は width 属性を打ち消し、lazy の画像が読み込み前に 0×0 になる
    expect(src).not.toContain("w-auto");
    // 枠は原寸幅で固定する。w-fit にすると画像の max-w-full と循環して幅 0 で描かれる
    expect(src).toContain('className="mx-auto w-full max-w-75"');
    expect(src).not.toContain("w-fit");
    expect(src).not.toContain("h-auto w-full");
    expect(src).toContain("sizes={`${b.width}px`}");
  });

  it("列の数はブラウザの幅ではなく本文の幅 (コンテナ) で決める", () => {
    expect(src).not.toMatch(/\bmd:grid-cols-/);
    expect(src).not.toMatch(/\bmd:block/);
    // 境界 = 300px × 列 + 8px × (列 − 1)
    // 列は原寸 300px の幅で、まとめて中央に置く (2026-10-30 案 A)
    expect(src).toContain("@min-[608px]:grid-cols-[repeat(2,300px)] @min-[916px]:grid-cols-[repeat(3,300px)]");
    expect(src).toContain("@min-[1224px]:grid-cols-[repeat(4,300px)]");
  });

  it("1 行に入らない分は出さず、2 段目に半端な行を作らない", () => {
    expect(src).toContain('"hidden @min-[608px]:block"');
    expect(src).toContain('"hidden @min-[916px]:block"');
  });
});

describe("BannerAd の契約", () => {
  const src = readComponent("BannerAd.tsx");

  it("画像バナーの上に PR 表記を出す (全ての画像バナー枠の共通部品)", () => {
    expect(src).toContain("<PrLabel />");
    expect(src.indexOf("<PrLabel />")).toBeLessThan(src.indexOf("<TrackedAffiliateLink"));
  });
});
