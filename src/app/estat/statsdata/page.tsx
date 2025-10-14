/**
 * @fileoverview e-STAT API統計データページのサーバーコンポーネント
 *
 * このページはサーバーサイドで必要な初期データを取得し、
 * クライアント側のEstatAPIStatsDataPageコンポーネントをレンダリングします。
 *
 * @module EstatDataPage
 */

import { EstatAPIStatsDataPage } from "@/components/estat-api/statsdata";

/**
 * e-STAT API統計データページのサーバーコンポーネント
 *
 * @returns {JSX.Element} レンダリングされたページコンポーネント
 */
export default function EstatDataPage() {
  // サーバーサイドで必要な初期データを取得する場合はここで実装
  // 例: デフォルトの統計表ID、カテゴリ情報等

  return <EstatAPIStatsDataPage />;
}
