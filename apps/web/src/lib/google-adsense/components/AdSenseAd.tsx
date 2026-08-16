"use client";

/**
 * Google AdSense広告コンポーネント
 *
 * 本番環境ではAdSense広告を表示し、開発環境ではプレースホルダーを表示します。
 * 遅延ロード（Intersection Observer）に対応しており、パフォーマンスへの影響を最小化します。
 */

import { useEffect, useRef, useState } from "react";

import { logger } from "@/lib/logger";

import { ADSENSE_DISPLAY_ENABLED } from "../constants";
import { AdSlotProps } from "../types";

import {
  AD_CONTAINER_CLASS,
  getAdReservedMinHeight,
  getResponsiveAdFormat,
} from "./ad-frame";
import { AdSensePlaceholder } from "./AdSensePlaceholder";

/**
 * lazy-load 発火閾値のデバイス別デフォルト（ADSENSE-LAZYLOAD-02, 2026-07-12）
 *
 * ADSENSE-LAZYLOAD-01 (2026-07-03) で全デバイス一律 600px に前倒ししたが、モバイルでは
 * 「読み込んだが画面に来ない」imp を量産し、viewability が W26 57.3% → W27 39.1% に半減した
 * （`snapshots/2026-W27/devices.csv`、モバイル imp 337→724 に倍増したのに収益は ¥27→¥29）。
 * モバイルは 250px に戻し、viewable-CPM を回復させる。desktop は 600px を維持する。
 */
const DESKTOP_ROOT_MARGIN_PX = 600;
const MOBILE_ROOT_MARGIN_PX = 250;
const MOBILE_MEDIA_QUERY = "(max-width: 767px)";

/**
 * AdSense広告コンポーネント
 */
export function AdSenseAd({
  format,
  slotId,
  className = "",
  showLabel = true,
  lazyLoad = true,
  rootMargin,
}: AdSlotProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(!lazyLoad);
  const [isAdBlocked, setIsAdBlocked] = useState(false);

  // 環境変数から設定を取得
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID;
  const isEnabled =
    ADSENSE_DISPLAY_ENABLED &&
    process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ENABLED === "true";

  // 遅延ロードの実装
  useEffect(() => {
    if (!isEnabled || !clientId || !lazyLoad || !adRef.current) return;

    // rootMargin の明示指定が無ければデバイス別デフォルトを採用する。
    // モバイルの先読みしすぎ（読み込んだが画面に来ない = viewability 低下）を防ぐ。
    const isMobile =
      typeof window !== "undefined" &&
      window.matchMedia(MOBILE_MEDIA_QUERY).matches;
    const effectiveRootMargin =
      rootMargin ?? (isMobile ? MOBILE_ROOT_MARGIN_PX : DESKTOP_ROOT_MARGIN_PX);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: `${effectiveRootMargin}px`,
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

  // 全体停止中はプレースホルダーや予約高も含めて何も表示しない。
  if (!ADSENSE_DISPLAY_ENABLED) {
    return null;
  }

  // 全体表示を再開した状態で、環境変数が無効ならプレースホルダーを表示する。
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

  const isArticleFormat = format === "article";
  const isMultiplexFormat = format === "multiplex";
  // 予約高は ad-frame.ts が単一ソース（プレースホルダーと共有する）。
  const reservedMinHeight = getAdReservedMinHeight(format);

  return (
    <div
      ref={adRef}
      className={`${AD_CONTAINER_CLASS} ${className}`}
      style={reservedMinHeight > 0 ? { minHeight: `${reservedMinHeight}px` } : undefined}
    >
      {showLabel && (
        <div className="text-xs text-muted-foreground text-center mb-1">
          広告
        </div>
      )}
      {isVisible ? (
        isArticleFormat ? (
          // 記事内広告（fluid / in-article）: Google 推奨の属性構成
          <ins
            className="adsbygoogle"
            style={{ display: "block", textAlign: "center" }}
            data-ad-layout="in-article"
            data-ad-format="fluid"
            data-ad-client={clientId}
            data-ad-slot={slotId}
          />
        ) : isMultiplexFormat ? (
          // Multiplex（関連コンテンツ型グリッド）: Google 推奨の autorelaxed 構成
          <ins
            className="adsbygoogle"
            style={{
              display: "block",
              width: "100%",
              minHeight: `${reservedMinHeight}px`,
            }}
            data-ad-format="autorelaxed"
            data-ad-client={clientId}
            data-ad-slot={slotId}
          />
        ) : (
          <ins
            className="adsbygoogle"
            style={{
              display: "block",
              width: "100%",
              minHeight: `${reservedMinHeight}px`,
            }}
            data-ad-client={clientId}
            data-ad-slot={slotId}
            data-ad-format={getResponsiveAdFormat(format)}
            data-full-width-responsive="true"
          />
        )
      ) : (
        // 遅延ロード中のスペース確保（CLSの防止）
        <div
          style={{ width: "100%", minHeight: `${reservedMinHeight}px` }}
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
