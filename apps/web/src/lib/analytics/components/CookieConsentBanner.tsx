"use client";

import { useEffect, useState } from "react";

import { Button } from "@stats47/components/atoms/ui/button";

const CONSENT_KEY = "stats47_cookie_consent";

/**
 * Cookie 同意バナー
 *
 * 初回訪問時に表示し、同意/拒否を localStorage に保存。
 * GA4 の consent mode を連携して制御する。
 */
export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) {
      // 未回答: GoogleAnalytics.tsx 側で analytics_storage=granted がデフォルト適用済。
      // バナーは表示するが消極的 opt-out として運用（Issue #37）。
      // eslint-disable-next-line react-hooks/set-state-in-effect -- show banner
      setVisible(true);
    } else if (stored === "granted") {
      // 広告領域も同意済の場合のみ ad_storage を granted へ
      window.gtag?.("consent", "update", {
        ad_storage: "granted",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- gtag consent API types not available
      } as any);
    } else if (stored === "denied") {
      // ユーザー明示拒否: analytics / ad 両方 denied に降格
      window.gtag?.("consent", "update", {
        analytics_storage: "denied",
        ad_storage: "denied",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- gtag consent API types not available
      } as any);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, "granted");
    window.gtag?.("consent", "update", {
      analytics_storage: "granted",
      ad_storage: "granted",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- gtag consent API types not available
    } as any);
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(CONSENT_KEY, "denied");
    // 拒否時は明示的に analytics / ad 両方を denied に降格（Issue #37 残課題）
    window.gtag?.("consent", "update", {
      analytics_storage: "denied",
      ad_storage: "denied",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- gtag consent API types not available
    } as any);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-background/95 backdrop-blur-sm border-t shadow-sm">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
        <p>
          当サイトでは、利用状況の分析のために Cookie を使用しています。
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDecline}
            className="text-xs h-7"
          >
            拒否
          </Button>
          <Button
            size="sm"
            onClick={handleAccept}
            className="text-xs h-7"
          >
            同意する
          </Button>
        </div>
      </div>
    </div>
  );
}
