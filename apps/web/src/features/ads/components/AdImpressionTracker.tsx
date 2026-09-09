"use client";

import { useEffect, useRef } from "react";

interface AdImpressionTrackerProps {
  category: string;
  label: string;
  position: string;
  /** 広告 1 件単位の識別子 (AffiliateAd.id)。案件別 CTR 計測用 (GA4 custom dimension ad_id) */
  adId?: string;
  /** A/B テスト用 (AFF-05・任意) */
  experimentId?: string;
  variantId?: string;
  creativeSize?: string;
  /**
   * ラッパー div に付けるクラス。grid/flex の子として挟む場合に、元の子要素が
   * 持っていたレイアウト指定 (h-full 等) を引き継がせて見た目を変えないために使う。
   */
  className?: string;
  children: React.ReactNode;
}

/**
 * Intersection Observer で広告のインプレッション（ビューポート表示）を GA4 に送信する。
 * 表示中のタブで 50% 以上が連続 1 秒表示された場合に、mount ごとに 1 回だけ発火する。
 *
 * ★ イベント名は `affiliate_impression`（2026-07-28 に `ad_impression` から改名）。
 *   旧名は **GA4 の AdSense 連携が自動生成するイベント名と同じ**で、直近 7 日の 3,346 件が
 *   全件 AdSense 由来（adSourceName で確認・残余ゼロ）だった。自前分と区別できず
 *   CTR の分母が存在しない状態だったため名前空間を分離した。
 *   正典: .claude/rules/analytics-event-standards.md
 *
 * ★ 送信できたときだけ「発火済み」にする。
 *   gtag は afterInteractive で遅延読み込みされるため、初期表示から画面内にある広告
 *   （サイドバー等）は交差から 1 秒後の時点で window.gtag が未定義のことがある。
 *   以前は firedRef をガードより先に立てていたため、そのケースで送信されないまま
 *   「発火済み」になり永久に失われていた。ガードの単純撤去は不可（例外になる）ので、
 *   未準備なら firedRef を立てずに短間隔でリトライする。
 */
/** gtag 未準備時のリトライ間隔と上限（合計 ~5 秒待つ。それでも来なければ諦める）。 */
const GTAG_RETRY_INTERVAL_MS = 500;
const GTAG_MAX_RETRIES = 10;
const VIEWABLE_RATIO = 0.5;
const VIEWABLE_DURATION_MS = 1000;
export function AdImpressionTracker({
  category,
  label,
  position,
  adId,
  experimentId,
  variantId,
  creativeSize,
  className,
  children,
}: AdImpressionTrackerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || firedRef.current) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let isHalfVisible = false;
    let isTracking = false;
    let isDisposed = false;

    const isViewable = () => isHalfVisible && document.visibilityState === "visible";
    const clearTimers = () => {
      if (timer !== null) clearTimeout(timer);
      if (retryTimer !== null) clearTimeout(retryTimer);
      timer = null;
      retryTimer = null;
      isTracking = false;
    };

    /**
     * gtag が使えれば送信して true。未準備なら **firedRef を立てずに** false を返す。
     * ここで firedRef を立てると、gtag 読み込み前に交差した広告が永久に欠測する。
     */
    const send = (): boolean => {
      if (typeof window === "undefined" || !window.gtag) return false;
      window.gtag("event", "affiliate_impression", {
        event_category: "affiliate",
        event_label: label,
        affiliate_category: category,
        // 広告意図軸 (10 vertical) の canonical dimension。category に vertical 値が流れる。
        affiliate_vertical: category,
        link_position: position,
        ...(adId ? { ad_id: adId } : {}),
        ...(experimentId ? { experiment_id: experimentId } : {}),
        ...(variantId ? { variant_id: variantId } : {}),
        ...(creativeSize ? { creative_size: creativeSize } : {}),
      });
      firedRef.current = true;
      return true;
    };

    const trySend = (attempt: number) => {
      if (isDisposed || firedRef.current || !isViewable()) return;
      if (send()) return;
      if (attempt >= GTAG_MAX_RETRIES) return; // 諦める (欠測は残るが無限リトライはしない)
      retryTimer = setTimeout(() => trySend(attempt + 1), GTAG_RETRY_INTERVAL_MS);
    };

    const updateVisibility = () => {
      if (!isViewable()) {
        clearTimers(); // 退出・50%未満・タブ非表示では、gtag 待機中でも継続時間を捨てる。
        return;
      }
      if (isDisposed || firedRef.current || isTracking) return;
      isTracking = true; // 同じ表示区間の再通知で timer/retry を多重起動しない。
      timer = setTimeout(() => trySend(0), VIEWABLE_DURATION_MS);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // threshold は通知の境界であり、isIntersecting 自体は 50% を保証しない。
          isHalfVisible = entry.isIntersecting && entry.intersectionRatio >= VIEWABLE_RATIO;
          updateVisibility();
        }
      },
      { threshold: VIEWABLE_RATIO }
    );

    observer.observe(el);
    document.addEventListener("visibilitychange", updateVisibility);

    return () => {
      isDisposed = true;
      observer.disconnect();
      document.removeEventListener("visibilitychange", updateVisibility);
      clearTimers();
    };
  }, [category, label, position, adId, experimentId, variantId, creativeSize]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
