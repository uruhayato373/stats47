/**
 * @fileoverview e-STAT API統計データページのサーバーコンポーネント
 *
 * このページはサーバーサイドで初期表示用のデータを取得し、
 * クライアント側のEstatAPIStatsDataPageコンポーネントをレンダリングします。
 *
 * @module EstatDataPage
 */

import { EstatAPIStatsDataPage } from "@/components/estat-api/stats-data";
import { estatAPI } from "@/lib/estat-api";

/**
 * e-STAT API統計データページのサーバーコンポーネント
 *
 * 初期表示用として statsDataId=0000010101, cdCat01=A1101 のデータを取得します。
 *
 * @returns {Promise<React.ReactElement>} レンダリングされたページコンポーネント
 */
export default async function Page(): Promise<React.ReactElement> {
  // 初期表示用のデータを取得
  let initialData = null;

  try {
    initialData = await estatAPI.getStatsData({
      statsDataId: "0000010101",
      cdCat01: "A1101",
      metaGetFlg: "Y",
      cntGetFlg: "N",
      explanationGetFlg: "N",
      annotationGetFlg: "N",
      replaceSpChars: "0",
    });
  } catch (error) {
    console.error("初期データ取得エラー:", error);
    // エラーが発生してもページは表示する（initialData = null）
  }

  return <EstatAPIStatsDataPage initialData={initialData} />;
}
