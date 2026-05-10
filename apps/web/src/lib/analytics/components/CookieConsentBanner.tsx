"use client";

import { useEffect, useState } from "react";

import { Button } from "@stats47/components/atoms/ui/button";

const CONSENT_COOKIE_NAME = "stats47_consent";
const CONSENT_LS_KEY = "stats47_cookie_consent";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function setConsentCookie(value: string) {
  document.cookie = `${CONSENT_COOKIE_NAME}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

/**
 * Cookie 同意バナー（クライアントサイド）
 *
 * localStorage に consent が保存済みの場合は非表示。
 * 未設定の新規ユーザーにのみバナーを表示する。
 */
export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_LS_KEY);
    if (!stored) {
      const timer = setTimeout(() => setVisible(true), 0);
      return () => clearTimeout(timer);
    }

    // gtag consent 同期
    if (stored === "granted") {
      window.gtag?.("consent", "update", {
        ad_storage: "granted",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- gtag consent API types not available
      } as any);
    } else if (stored === "denied") {
      window.gtag?.("consent", "update", {
        analytics_storage: "denied",
        ad_storage: "denied",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- gtag consent API types not available
      } as any);
    }
  }, []);

  const handleAccept = () => {
    setConsentCookie("granted");
    localStorage.setItem(CONSENT_LS_KEY, "granted");
    window.gtag?.("consent", "update", {
      analytics_storage: "granted",
      ad_storage: "granted",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- gtag consent API types not available
    } as any);
    setVisible(false);
  };

  const handleDecline = () => {
    setConsentCookie("denied");
    localStorage.setItem(CONSENT_LS_KEY, "denied");
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
