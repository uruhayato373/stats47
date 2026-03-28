"use client";

/**
 * Google AdSense広告コンポーネント
 *
 * 本番環境ではAdSense広告を表示し、開発環境ではプレースホルダーを表示します。
 * 遅延ロード（Intersection Observer）に対応しており、パフォーマンスへの影響を最小化します。
 */

import { useEffect, useRef, useState } from "react";

import { logger } from "@/lib/logger";

import { AdSlotProps } from "../types";

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
}: AdSlotProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(!lazyLoad);
  const [isAdBlocked, setIsAdBlocked] = useState(false);

  // 環境変数から設定を取得
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID;
  const isEnabled = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ENABLED === "true";

  // 遅延ロードの実装
  useEffect(() => {
    if (!isEnabled || !clientId || !lazyLoad || !adRef.current) return;

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
  }, [isEnabled, clientId, lazyLoad, rootMargin]);

  // AdSense広告の読み込み
  useEffect(() => {
    if (!isEnabled || !clientId || !isVisible || !adRef.current) return;

    // 広告コンテナの幅をチェック
    const containerWidth = adRef.current.offsetWidth;

    if (containerWidth === 0) {
      // 幅が0の場合は少し待ってから再試行
      const retryTimer = setTimeout(() => {
        if (adRef.current && adRef.current.offsetWidth > 0) {
          try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
          } catch (error) {
            logger.warn({ error }, "AdSense ad blocked");
            setIsAdBlocked(true);
          }
        }
      }, 100);
      return () => clearTimeout(retryTimer);
    }

    try {
      if (typeof window !== "undefined") {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (error) {
      logger.warn({ error }, "AdSense ad blocked");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- setting state in error handler callback
      setIsAdBlocked(true);
    }
  }, [isEnabled, clientId, isVisible, slotId]);

  // 開発環境またはAdSenseが無効な場合はプレースホルダーを表示
  if (!isEnabled) {
    return <AdSensePlaceholder format={format} className={className} />;
  }

  // クライアントIDが設定されていない場合はエラー
  if (!clientId) {
    logger.error({}, "NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID is not set");
    return null;
  }

  // AdBlockで広告がブロックされた場合は何も表示しない
  if (isAdBlocked) {
    return null;
  }

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
