/** AdSense全体停止中に、手動枠・ラベル・予約高を残さないことを固定する。 */
import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ADSENSE_DISPLAY_ENABLED,
  AdSenseAd,
  AdSenseScript,
} from "@/lib/google-adsense";

import { MANUAL_AD_DESKTOP_ONLY_CLASS } from "../../../constants/manual-ad-policy";
import { FooterAdSlot } from "../FooterAdSlot";
import { InContentAdSlot } from "../InContentAdSlot";
import { RailAdSlot } from "../RailAdSlot";

const SLOT = { slotId: "1234567890", format: "article" } as const;

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("AdSense全体停止契約", () => {
  it("全体スイッチが停止状態", () => {
    expect(ADSENSE_DISPLAY_ENABLED).toBe(false);
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
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID", "ca-pub-test");

    const ad = render(<AdSenseAd format="article" slotId="1234567890" />);
    const script = render(<AdSenseScript />);

    expect(ad.container).toBeEmptyDOMElement();
    expect(script.container).toBeEmptyDOMElement();
    expect(document.querySelector('script[src*="adsbygoogle.js"]')).toBeNull();
  });

  it("再開時の手動枠はdesktop-only契約を維持する", () => {
    expect(MANUAL_AD_DESKTOP_ONLY_CLASS).toBe("hidden md:block");
  });
});
