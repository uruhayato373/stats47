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
      // 未回答：デフォルト denied で初期化
      window.gtag?.("consent", "default", {
        analytics_storage: "denied",
        ad_storage: "denied",
      } as any);
      setVisible(true);
    } else if (stored === "granted") {
      window.gtag?.("consent", "update", {
        analytics_storage: "granted",
        ad_storage: "granted",
      } as any);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, "granted");
    window.gtag?.("consent", "update", {
      analytics_storage: "granted",
      ad_storage: "granted",
    } as any);
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(CONSENT_KEY, "denied");
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
