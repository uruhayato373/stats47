"use client";

/**
 * Google AdSense広告コンポーネント
 *
 * 本番環境ではAdSense広告を表示し、開発環境ではプレースホルダーを表示します。
 * 遅延ロード（Intersection Observer）に対応しており、パフォーマンスへの影響を最小化します。
 */

import { useEffect, useRef, useState } from "react";

import { logger } from "@/lib/logger";

import { AD_SIZES, AdSlotProps } from "../types";

import { AdSensePlaceholder } from "./AdSensePlaceholder";

/**
 * AdSense広告コンポーネント
 */
export function AdSenseAd({
  format,
  slotId,
  className = "",
  showLabel = true,
  lazyLoad = true,
  rootMargin = 100,
  fullWidthResponsive,
}: AdSlotProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(!lazyLoad);
  const [isAdBlocked, setIsAdBlocked] = useState(false);

  // 環境変数から設定を取得
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID;
  const isEnabled = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ENABLED === "true";

  console.log("[AdSenseAd] Config:", {
    NODE_ENV: process.env.NODE_ENV,
    ENABLED_VAR: process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ENABLED,
    isEnabled,
    clientId: clientId ? "Set" : "Not Set"
  });

  // 開発環境またはAdSenseが無効な場合はプレースホルダーを表示
  if (!isEnabled) {
    return <AdSensePlaceholder format={format} className={className} />;
  }

  // クライアントIDが設定されていない場合はエラー
  if (!clientId) {
    logger.error({}, "NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID is not set");
    return null;
  }

  // 遅延ロードの実装
  useEffect(() => {
    if (!lazyLoad || !adRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: `${rootMargin}px`,
      }
    );

    observer.observe(adRef.current);

    return () => {
      observer.disconnect();
    };
  }, [lazyLoad, rootMargin]);

  // AdSense広告の読み込み
  useEffect(() => {
    if (!isVisible || !adRef.current) return;

    // 広告コンテナの幅をチェック
    const containerWidth = adRef.current.offsetWidth;
    console.log("[AdSenseAd] Container width:", containerWidth, "slotId:", slotId);

    if (containerWidth === 0) {
      console.warn("[AdSenseAd] Container width is 0, delaying ad push");
      // 幅が0の場合は少し待ってから再試行
      const retryTimer = setTimeout(() => {
        if (adRef.current && adRef.current.offsetWidth > 0) {
          try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            console.log("[AdSenseAd] Ad pushed after retry, slotId:", slotId);
          } catch (error) {
            console.error("[AdSenseAd] Ad blocked or error (retry):", error);
            logger.warn({ error }, "AdSense ad blocked");
            setIsAdBlocked(true);
          }
        }
      }, 100);
      return () => clearTimeout(retryTimer);
    }

    try {
      // AdSense広告スクリプトの読み込みとプッシュ
      if (typeof window !== "undefined") {
        console.log("[AdSenseAd] Attempting to push ad, window.adsbygoogle:", window.adsbygoogle ? "Available" : "Not Available");

        // window.adsbygooleが存在しない場合でも配列として初期化して.push()を実行
        // これはAdSenseの公式コードと同じパターン
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        console.log("[AdSenseAd] Ad pushed to queue, slotId:", slotId);
      }
    } catch (error) {
      // AdBlockなどで広告がブロックされた場合
      console.error("[AdSenseAd] Ad blocked or error:", error);
      logger.warn({ error }, "AdSense ad blocked");
      setIsAdBlocked(true);
    }
  }, [isVisible, slotId]);

  // AdBlockで広告がブロックされた場合は何も表示しない
  if (isAdBlocked) {
    return null;
  }

  const size = AD_SIZES[format];
  const isFlexible = format === "infeed" || format === "article";

  // デバッグ: ins要素の状態を確認
  useEffect(() => {
    if (!isVisible || !adRef.current) return;

    let isMounted = true;

    const checkAdStatus = () => {
      if (!isMounted || !adRef.current) return;

      const insElement = adRef.current.querySelector('ins.adsbygoogle');
      if (insElement) {
        const dataAdStatus = insElement.getAttribute('data-ad-status');
        console.log("[AdSenseAd] Ad status:", {
          slotId,
          dataAdStatus,
          innerHTML: insElement.innerHTML ? "Has content" : "Empty",
        });
      }
    };

    // 3秒後に広告の状態を確認
    const timer = setTimeout(checkAdStatus, 3000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isVisible, slotId]);

  return (
    <div
      ref={adRef}
      className={`ad-container w-full flex justify-center ${className}`}
    >
      {showLabel && (
        <div className="text-xs text-muted-foreground text-center mb-1">
          広告
        </div>
      )}
      {isVisible ? (
        <ins
          className="adsbygoogle"
          style={{
            display: "block",
            width: "100%",
          }}
          data-ad-client={clientId}
          data-ad-slot={slotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      ) : (
        // 遅延ロード中のスペース確保（CLSの防止）
        <div
          style={{ width: "100%", minHeight: "100px" }}
          className="bg-gray-100"
        />
      )}
    </div>
  );
}

/**
 * グローバルな型定義の拡張
 */
declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}
