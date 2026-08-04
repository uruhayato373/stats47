/**
 * 手置き AdSense 枠のビューポート契約 — モバイルで描画しないこと。
 *
 * 背景 (2026-08-04・W31 実測): モバイルの手置き枠は RPM ¥8 (Auto ads は ¥114)、
 * viewability 28.6%、充足 25.7% で、週 ¥4 のために 2,037 リクエストと 495 の描画を
 * 消費していた。実ユーザー LCP は p75 2,476ms / 閾値 2,500ms でモバイルが最も苦しい。
 * 正典と実測表: features/ads/constants/manual-ad-policy.ts
 *
 * ここで固定するのは「モバイルで消えること」と「デスクトップで残ること」の両方。
 * 片側だけだと、全部消しても全部出しても緑になり、ゲートとして機能しない。
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MANUAL_AD_DESKTOP_ONLY_CLASS } from "../../../constants/manual-ad-policy";
import { FooterAdSlot } from "../FooterAdSlot";
import { InContentAdSlot } from "../InContentAdSlot";
import { RailAdSlot } from "../RailAdSlot";

const SLOT = { slotId: "1234567890", format: "article" } as const;

/** Tailwind の `hidden md:block` は「< 768px で display:none」を意味する。 */
function isDesktopOnly(el: Element | null): boolean {
  if (!el) return false;
  const cls = el.className;
  return cls.includes("hidden") && cls.includes("md:block");
}

/** 手置き枠のコンテナ (AdSenseAd の外側 div) を取り出す。 */
function outerContainer(container: HTMLElement): Element | null {
  return container.firstElementChild;
}

describe("手置き AdSense 枠のビューポート契約", () => {
  it("InContentAdSlot: モバイルで隠す (desktop-only クラスを持つ)", () => {
    const { container } = render(<InContentAdSlot slot={SLOT} />);
    expect(isDesktopOnly(outerContainer(container))).toBe(true);
  });

  it("FooterAdSlot: モバイルで隠す", () => {
    const { container } = render(<FooterAdSlot />);
    const outer = outerContainer(container);
    // 「slotId 未発行なら描画しない」仕様に逃がすと、枠が消えた日にこのテストが
    // 無言で通ってしまう。描画されたこと自体を先に固定する。
    expect(outer, "CONTENT_FOOTER が描画されていない (slotId 未発行?)").not.toBeNull();
    expect(isDesktopOnly(outer)).toBe(true);
  });

  it("className を渡しても desktop-only クラスが残る (上書きで無効化されない)", () => {
    const { container } = render(<InContentAdSlot slot={SLOT} className="mt-4" />);
    const outer = outerContainer(container);
    expect(isDesktopOnly(outer)).toBe(true);
    expect(outer?.className).toContain("mt-4");
  });

  it("RailAdSlot には付けない (rail 自体が xl 未満で非表示・二重指定しない)", () => {
    const { container } = render(<RailAdSlot slot={SLOT} />);
    expect(isDesktopOnly(outerContainer(container))).toBe(false);
  });

  it("境界は AdSenseAd の MOBILE_MEDIA_QUERY (max-width: 767px) と一致する", () => {
    // md = 768px。片方だけ動かすと「mobile 判定なのに枠は出ている」状態になる。
    expect(MANUAL_AD_DESKTOP_ONLY_CLASS).toBe("hidden md:block");
  });
});
