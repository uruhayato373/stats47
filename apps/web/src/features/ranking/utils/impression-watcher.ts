/**
 * impression 発火条件の純ロジック (ホーム注目ランキング home-featured-v1)。
 *
 * 条件は既存 AdImpressionTracker と同じ機械条件 (仕様 doc 28 §9.2):
 * - 50% 以上表示 (IntersectionObserver threshold 0.5 — 呼び元が observer に設定する)
 * - 1 秒連続表示で 1 回だけ発火
 * - 1 秒経過前に viewport 外へ出たら timer 解除
 * - cleanup() で observer 側の disconnect と合わせて timer を破棄
 *
 * DOM に依存しないため unit test は fake timer + handleIntersection 呼び出しで検証できる。
 */

export const IMPRESSION_DWELL_MS = 1000;

export interface ImpressionWatcher {
  /** IntersectionObserver callback から isIntersecting を渡す */
  handleIntersection(isIntersecting: boolean): void;
  /** unmount 時に必ず呼ぶ (pending timer を破棄。発火済みフラグは維持) */
  cleanup(): void;
  /** 既に発火済みか (テスト・呼び元の再 observe 判定用) */
  hasFired(): boolean;
}

export function createImpressionWatcher(
  fire: () => void,
  dwellMs: number = IMPRESSION_DWELL_MS,
): ImpressionWatcher {
  let fired = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const clear = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  return {
    handleIntersection(isIntersecting: boolean) {
      if (fired) return;
      if (isIntersecting) {
        if (timer !== null) return; // 既にカウント中 (連続 intersect 通知で timer を延長しない)
        timer = setTimeout(() => {
          timer = null;
          if (fired) return;
          fired = true;
          fire();
        }, dwellMs);
      } else {
        clear();
      }
    },
    cleanup() {
      clear();
    },
    hasFired() {
      return fired;
    },
  };
}
