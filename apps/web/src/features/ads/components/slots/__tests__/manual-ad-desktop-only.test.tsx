/**
 * AdSense の全体スイッチで、手動枠の停止・再開とモバイル非表示の契約を固定する。
 *
 * - 停止中は手動枠・ラベル・予約高・script を一切残さない (2026-08-16 の停止判断)。
 * - 再開後 (2026-10-11〜) の手動枠はモバイルで描画しない (manual-ad-policy.ts の W31 実測)。
 * - 配置ごとに別の広告ユニットを使う。共用すると AdSense のユニット別レポートで枠の効果を分けられない。
 */
import { SITE } from "@stats47/types";
import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { adSlotBox } from "@/lib/ad-placements";
import { AdSenseAd, AdSenseScript } from "@/lib/google-adsense";
import * as slotConstants from "@/lib/google-adsense/constants";

import { MANUAL_AD_DESKTOP_ONLY_CLASS } from "../../../constants/manual-ad-policy";
import { FooterAdSlot } from "../FooterAdSlot";
import { InContentAdSlot } from "../InContentAdSlot";
import { RailAdSlot } from "../RailAdSlot";

const display = vi.hoisted(() => ({ adsense: false }));
vi.mock("@/lib/google-adsense/constants", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/google-adsense/constants")>();
  return {
    ...actual,
    get ADSENSE_DISPLAY_ENABLED() {
      return display.adsense;
    },
  };
});

const SLOT = { slotId: "1234567890", format: "article" } as const;

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("AdSense停止中の契約", () => {
  beforeEach(() => {
    display.adsense = false;
  });

  it("InContentAdSlotがラベル・予約高を含めて空になる", () => {
    const { container } = render(<InContentAdSlot slot={SLOT} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("FooterAdSlotが空になる", () => {
    const { container } = render(<FooterAdSlot />);
    expect(container).toBeEmptyDOMElement();
  });

  it("RailAdSlotがカードごと空になる", () => {
    const { container } = render(<RailAdSlot slot={SLOT} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("環境変数がtrueでもAdSense本体とscriptを生成しない", () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_ADSENSE_ENABLED", "true");

    const ad = render(<AdSenseAd format="article" slotId="1234567890" slotBox={adSlotBox("adsense-body")} />);
    const script = render(<AdSenseScript adFreePathPrefixes={[]} />);

    expect(ad.container).toBeEmptyDOMElement();
    expect(script.container).toBeEmptyDOMElement();
    expect(document.querySelector('script[src*="adsbygoogle.js"]')).toBeNull();
  });
});

describe("AdSense再開後の契約", () => {
  beforeEach(() => {
    display.adsense = true;
  });

  it("実際の全体スイッチは再開状態", async () => {
    const actual = await vi.importActual<typeof import("@/lib/google-adsense/constants")>(
      "@/lib/google-adsense/constants",
    );
    expect(actual.ADSENSE_DISPLAY_ENABLED).toBe(true);
  });

  it("記事内枠とフッター枠はdesktop-onlyのコンテナで包む", () => {
    expect(MANUAL_AD_DESKTOP_ONLY_CLASS).toBe("hidden md:block");
    for (const element of [<InContentAdSlot key="in" slot={SLOT} />, <FooterAdSlot key="footer" />]) {
      const { container, unmount } = render(element);
      const wrapper = container.firstElementChild;
      expect(wrapper?.classList.contains("hidden")).toBe(true);
      expect(wrapper?.classList.contains("md:block")).toBe(true);
      unmount();
    }
  });

  it("slotIdが空の枠は描画しない", () => {
    const { container } = render(<RailAdSlot slot={{ slotId: "", format: "rectangle" }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("広告タグはサイト識別子の新しいpublisher IDで出す", () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_ADSENSE_ENABLED", "true");

    const { container } = render(
      <AdSenseAd format="article" slotId={slotConstants.BLOG_ARTICLE_INLINE.slotId} lazyLoad={false} slotBox={adSlotBox("adsense-body")} />,
    );
    const ins = container.querySelector("ins.adsbygoogle");

    expect(SITE.adsenseClientId).toBe("ca-pub-9055416085403520");
    expect(ins?.getAttribute("data-ad-client")).toBe(SITE.adsenseClientId);
    expect(ins?.getAttribute("data-ad-slot")).toBe(slotConstants.BLOG_ARTICLE_INLINE.slotId);
  });

  it("広告タグは台帳の箱の幅 (300px) を持ち、0 幅に縮まない", () => {
    // 外枠は flex-col + items-center。幅を明示しない ins は 0 幅に縮み、AdSense が
    // 「No slot size for availableWidth=0」を投げて枠ごと消える (記事内広告で本番に出た)。
    // 2026-10-31 から AdSense は全て 300×250 (台帳の箱)。表示広告は固定サイズの広告コード、記事内広告は幅 300px
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_ADSENSE_ENABLED", "true");

    for (const format of ["article", "rectangle"] as const) {
      const { container, unmount } = render(
        <AdSenseAd format={format} slotId="1234567890" lazyLoad={false} slotBox={adSlotBox("adsense-body")} />,
      );
      const ins = container.querySelector<HTMLElement>("ins.adsbygoogle");
      expect(ins?.style.width, format).toBe("300px");
      if (format === "rectangle") {
        // 固定サイズの広告コード: 高さも固定し、幅に合わせて伸ばす指定 (data-ad-format) を付けない
        expect(ins?.style.height).toBe("250px");
        expect(ins?.hasAttribute("data-ad-format")).toBe(false);
      }
      unmount();
    }
  });

  it("配置ごとに別の広告ユニットを使う", () => {
    const slotIds = Object.values(slotConstants)
      .filter((value): value is slotConstants.AdSlotConfig =>
        typeof value === "object" && value !== null && "slotId" in value,
      )
      .map((slot) => slot.slotId);

    expect(slotIds.length).toBeGreaterThanOrEqual(10);
    expect(slotIds.every((id) => /^\d{10}$/.test(id))).toBe(true);
    // 一時的な例外 (2026-10-31): ページ末の 2 枠は関連コンテンツ型を固定の大きさにできないので、表示広告のユニットを
    // 借りている。専用の表示広告ユニットを作ったら外す (backlog ADSENSE-FIXED-UNITS-01)。例外を増やさない
    const BORROWED = new Set(["9435960671", "8298138821"]);
    const counts = new Map<string, number>();
    for (const id of slotIds) counts.set(id, (counts.get(id) ?? 0) + 1);
    const shared = [...counts].filter(([, n]) => n > 1).map(([id]) => id);
    expect(shared.every((id) => BORROWED.has(id) && counts.get(id) === 2), shared.join(",")).toBe(true);
  });
});
