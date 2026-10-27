"use client";

import { useEffect, useState } from "react";

import { Button } from "@stats47/components/atoms/ui/button";

const CONSENT_COOKIE_NAME = "stats47_consent";
const CONSENT_LS_KEY = "stats47_cookie_consent";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function setConsentCookie(value: string) {
  document.cookie = `${CONSENT_COOKIE_NAME}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

type GtagConsentParams = {
  analytics_storage?: "granted" | "denied";
  ad_storage?: "granted" | "denied";
};

function syncGtag(value: "granted" | "denied") {
  const params: GtagConsentParams =
    value === "granted"
      ? { analytics_storage: "granted", ad_storage: "granted" }
      : { analytics_storage: "denied", ad_storage: "denied" };
  window.gtag?.("consent", "update", params);
}

/**
 * Cookie 同意バナー
 *
 * 初期値は false（サーバーと一致させてハイドレーションミスマッチを防ぐ）。
 * マウント後に document.cookie を確認してバナー表示・gtag 同期を行う。
 *
 * useEffect 内の setState 連鎖を避けるため、表示判定は別 effect として
 * 分離 (react-hooks/set-state-in-effect 警告回避)。
 *
 * 見た目 (2026-10-28 2 巡目): 画面下端の 1 行の横帯。ルートレイアウトの SidebarInset の最後の子に置き、
 * `sticky bottom-0` で画面下端に留める。幅は SidebarInset と同じで、サイドバーを覆わない。
 * 流れの中に高さを持つので、ページの末尾 (フッター・地図とテーブルのタブ) はこの帯の上までスクロールでき、
 * 帯に隠れたままにならない (fixed の浮きカードは本文の上に重なり、その分の余白も無かった)。
 * 文は 1 行に収まる長さにし、390px でも「文 1 行 + ボタン 1 行」の 2 行で収める。
 * z-index は地図 (Leaflet のペインと操作部品 400〜1000) より上、ヘッダー (z-200) の重なりとは独立。
 */
export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const cookieMatch = document.cookie.match(new RegExp(`${CONSENT_COOKIE_NAME}=([^;]+)`));
    const consent = cookieMatch?.[1];
    if (consent === "granted" || consent === "denied") {
      syncGtag(consent);
      return;
    }
    // consent 未設定: 次フレームでバナー表示 (cascading render 回避)
    const timerId = window.setTimeout(() => setVisible(true), 0);
    return () => window.clearTimeout(timerId);
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
    <div
      role="region"
      aria-label="Cookie の利用について"
      data-slot="cookie-consent"
      className="sticky bottom-0 z-[1100] flex flex-wrap items-center justify-end gap-x-4 gap-y-1 border-t border-border bg-background px-4 py-2 pb-[calc(0.5rem+var(--safe-area-bottom))]"
    >
      <p className="min-w-0 flex-1 basis-72 text-xs text-pretty text-muted-foreground sm:text-sm">
        当サイトは利用状況の分析に Cookie を使用しています。
      </p>
      <div className="flex shrink-0 items-center gap-2">
        <Button variant="ghost" size="sm" onClick={handleDecline}>
          拒否
        </Button>
        <Button size="sm" onClick={handleAccept}>
          同意する
        </Button>
      </div>
    </div>
  );
}
