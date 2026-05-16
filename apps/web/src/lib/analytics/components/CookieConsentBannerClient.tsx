"use client";

import { useEffect, useState } from "react";

import { Button } from "@stats47/components/atoms/ui/button";

const CONSENT_COOKIE_NAME = "stats47_consent";
const CONSENT_LS_KEY = "stats47_cookie_consent";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function setConsentCookie(value: string) {
  document.cookie = `${CONSENT_COOKIE_NAME}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

function syncGtag(value: "granted" | "denied") {
  if (value === "granted") {
    window.gtag?.("consent", "update", {
      analytics_storage: "granted",
      ad_storage: "granted",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- gtag consent API types not available
    } as any);
  } else {
    window.gtag?.("consent", "update", {
      analytics_storage: "denied",
      ad_storage: "denied",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- gtag consent API types not available
    } as any);
  }
}

/**
 * Cookie 同意バナー (Client)
 *
 * SSR 時は visibility:hidden で render し、LCP 計測対象から外す。
 * mount 後に visible に切替。Server Component (CookieConsentBanner) で
 * 既に同意済みユーザーには本コンポーネント自体が render されない設計。
 *
 * 設計理由: 2026-05-09 PSI 計測で主要 8 URL の LCP 要素がこのバナーの <p> となり、
 * elementRenderDelay 5,564-9,168ms(JS hydration 待ち)を発生させていた。
 * visibility:hidden は Lighthouse LCP candidate scoring から除外される。
 */
export function CookieConsentBannerClient() {
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // race condition 対策: server 判定後に client 側で cookie 取得済の可能性がある
    const cookieMatch = document.cookie.match(
      new RegExp(`${CONSENT_COOKIE_NAME}=([^;]+)`)
    );
    const consent = cookieMatch?.[1];
    if (consent === "granted" || consent === "denied") {
      syncGtag(consent);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- マウント時の初期化分岐
      setDismissed(true);
      return;
    }
    setMounted(true);
  }, []);

  const handleAccept = () => {
    setConsentCookie("granted");
    localStorage.setItem(CONSENT_LS_KEY, "granted");
    syncGtag("granted");
    setDismissed(true);
  };

  const handleDecline = () => {
    setConsentCookie("denied");
    localStorage.setItem(CONSENT_LS_KEY, "denied");
    syncGtag("denied");
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div
      style={{ visibility: mounted ? "visible" : "hidden" }}
      className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-background/95 backdrop-blur-sm border-t shadow-sm"
    >
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
