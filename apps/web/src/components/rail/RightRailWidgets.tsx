import { type ReactNode } from 'react';

import { RailAdSlot } from '@/features/ads';

import {
  ADSENSE_DISPLAY_ENABLED,
  RANKING_SIDEBAR_TOP,
} from '@/lib/google-adsense';

import { RailStack } from './RailStack';

interface RightRailWidgetsProps {
  /** 上部に挿入する追加 widget (関連ランキング・関連記事など) */
  topWidgets?: ReactNode;
  /** 中部に挿入する追加 widget */
  midWidgets?: ReactNode;
  /** 下部に挿入する追加 widget */
  bottomWidgets?: ReactNode;
  /** AdSense Rectangle を表示するか (default: true) */
  showTopAd?: boolean;
}

/**
 * 文脈付き右サイドバーの共通 widget セット。
 *
 * 配置順 (広告同士を隣り合わせにしない。2026-10-30):
 *   1. topWidgets
 *   2. AdSense Rectangle
 *   3. midWidgets / bottomWidgets (関連ランキング・関連記事など)
 *
 * 旧: 本文関連の widget の後に AdSense (上)・縦長の AdSense (下) を続けて置き、広告だけが続いていた。
 * 縦長の AdSense (RANKING_PAGE_SIDEBAR) は 2026-W42 に 80 表示・¥1 で、外した。
 * 固定の PR (showPromoBanner) は呼び出し元が 1 つも出していなかったので外した。
 *
 * 関連 widget が無いページを広告だけのために狭める用途では使わない。
 * 自然フロー（sticky/独立スクロールなし）。本文を主役にするため促進系を下げている。
 * 設計仕様: docs/01_技術設計/04_デザインシステム.md
 */
export async function RightRailWidgets({
  topWidgets,
  midWidgets,
  bottomWidgets,
  showTopAd = true,
}: RightRailWidgetsProps) {
  return (
    <RailStack>
      {/* 本文関連 widget（主役） */}
      {topWidgets}

      {/* AdSense（一時停止中は枠・余白とも生成しない）。上と下の本文関連 widget の間に置く */}
      {ADSENSE_DISPLAY_ENABLED && showTopAd && (
        <RailAdSlot slot={RANKING_SIDEBAR_TOP} />
      )}

      {midWidgets}
      {bottomWidgets}
    </RailStack>
  );
}
