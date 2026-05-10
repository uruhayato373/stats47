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

// SSR は false（ハイドレーション一致）。クライアントは document.cookie を同期読み取り。
// React 18 は hydration mismatch を同期 re-render で解決するため、
// useEffect + setTimeout より早いタイミングでバナーが表示される。
function getInitialVisible(): boolean {
  if (typeof document === "undefined") return false;
  return !document.cookie.includes(`${CONSENT_COOKIE_NAME}=`);
}

/**
 * Cookie 同意バナー
 *
 * EXP-004b: document.cookie を初期 useState で同期読み取りし、setTimeout を排除。
 * layout.tsx は非 async のまま維持するため SSG ページの破壊なし。
 * gtag consent 同期は useEffect で行う（LCP に影響しない）。
 */
export function CookieConsentBanner() {
  const [visible, setVisible] = useState(getInitialVisible);

  useEffect(() => {
    // 既存ユーザー（cookie あり）の gtag consent 同期
    const cookieMatch = document.cookie.match(new RegExp(`${CONSENT_COOKIE_NAME}=([^;]+)`));
    const consent = cookieMatch?.[1];
    if (consent === "granted" || consent === "denied") {
      syncGtag(consent);
    }
  }, []);

  const handleAccept = () => {
    setConsentCookie("granted");
    localStorage.setItem(CONSENT_LS_KEY, "granted");
    syncGtag("granted");
    setVisible(false);
  };

  const handleDecline = () => {
    setConsentCookie("denied");
    localStorage.setItem(CONSENT_LS_KEY, "denied");
    syncGtag("denied");
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
