"use client";

import { useEffect, useState } from "react";

import { Button } from "@stats47/components/atoms/ui/button";

import { SurfaceCard } from "@/components/surface";

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
 * 見た目 (2026-10-28): 画面下端の全幅の帯をやめ、本文の右下に浮かぶ小さなカードにした。
 * 全幅の帯はサイドバーと地図の凡例・操作ボタンを覆っていた。固定表示でも覆う面積が小さいので、
 * 帯の高さ分の余白をページに足さない。z-index は地図 (Leaflet のペインと操作部品 400〜1000) より上にする。
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
    <SurfaceCard
      role="region"
      aria-label="Cookie の利用について"
      className="fixed right-4 bottom-[calc(1rem+var(--safe-area-bottom))] left-4 z-[1100] text-muted-foreground shadow-md sm:left-auto sm:w-full sm:max-w-sm"
    >
      <p className="leading-snug">
        当サイトでは、利用状況の分析のために Cookie を使用しています。
      </p>
      <div className="flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={handleDecline}>
          拒否
        </Button>
        <Button size="sm" onClick={handleAccept}>
          同意する
        </Button>
      </div>
    </SurfaceCard>
  );
}
